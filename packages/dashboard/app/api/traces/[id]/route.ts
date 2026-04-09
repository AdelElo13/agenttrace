import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { NextResponse } from 'next/server';

const TRACES_DIR = join(process.cwd(), '.traces');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const file = join(TRACES_DIR, `${id}.json`);

  if (!existsSync(file)) {
    return NextResponse.json({ error: 'Trace not found' }, { status: 404 });
  }

  const raw = readFileSync(file, 'utf-8');
  return NextResponse.json(JSON.parse(raw));
}
