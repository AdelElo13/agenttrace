import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';
import type { Trace } from 'agenttrace-core';

const TRACES_DIR = join(process.cwd(), '.traces');

function ensureDir() {
  mkdirSync(TRACES_DIR, { recursive: true });
}

export async function POST(request: Request) {
  const trace = (await request.json()) as Trace;

  if (!trace.id || !trace.rootDecision) {
    return NextResponse.json({ error: 'Invalid trace format' }, { status: 400 });
  }

  ensureDir();
  const filename = `${trace.id}.json`;
  writeFileSync(join(TRACES_DIR, filename), JSON.stringify(trace, null, 2));

  return NextResponse.json({ stored: filename, id: trace.id });
}

export async function GET() {
  ensureDir();
  const files = readdirSync(TRACES_DIR).filter(f => f.endsWith('.json'));

  const traces: Array<{
    id: string;
    project: string;
    model: string;
    cost: number;
    waste: number;
    decisions: number;
    agents: number;
    date: string;
  }> = [];

  for (const file of files) {
    try {
      const raw = readFileSync(join(TRACES_DIR, file), 'utf-8');
      const trace = JSON.parse(raw) as Trace;
      traces.push({
        id: trace.id,
        project: trace.project,
        model: trace.model,
        cost: trace.cost.total,
        waste: trace.wasteTotal,
        decisions: trace.decisionCount,
        agents: trace.agentCount,
        date: new Date(trace.startedAt).toISOString(),
      });
    } catch {
      // skip corrupt files
    }
  }

  return NextResponse.json(traces);
}
