import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

const DATA_DIR = join(process.cwd(), '.traces');
const APPLIED_FILE = join(DATA_DIR, '_applied.json');

interface AppliedEntry {
  insightId: string;
  traceId: string;
  appliedAt: number;
  category: string;
  projectedWeeklySavings: number;
}

function loadApplied(): AppliedEntry[] {
  if (!existsSync(APPLIED_FILE)) return [];
  try {
    return JSON.parse(readFileSync(APPLIED_FILE, 'utf-8'));
  } catch { return []; }
}

function saveApplied(entries: AppliedEntry[]) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(APPLIED_FILE, JSON.stringify(entries, null, 2));
}

export async function GET() {
  return NextResponse.json(loadApplied());
}

export async function POST(request: Request) {
  const entry = (await request.json()) as AppliedEntry;

  if (!entry.insightId || !entry.traceId) {
    return NextResponse.json({ error: 'insightId and traceId required' }, { status: 400 });
  }

  const entries = loadApplied();
  const existing = entries.findIndex(
    e => e.insightId === entry.insightId && e.traceId === entry.traceId,
  );

  if (existing >= 0) {
    entries.splice(existing, 1);
    saveApplied(entries);
    return NextResponse.json({ action: 'removed' });
  }

  entries.push({
    insightId: entry.insightId,
    traceId: entry.traceId,
    appliedAt: Date.now(),
    category: entry.category ?? '',
    projectedWeeklySavings: entry.projectedWeeklySavings ?? 0,
  });
  saveApplied(entries);
  return NextResponse.json({ action: 'added' });
}
