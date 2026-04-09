#!/usr/bin/env node

/**
 * AgentTrace CLI
 *
 * Parse Claude Code session logs and output AgentTrace JSON.
 *
 * Usage:
 *   agenttrace parse <session-jsonl> [--project <name>]
 *   agenttrace parse --stdin [--project <name>]
 *
 * Output: Trace JSON to stdout (pipe to file or dashboard)
 */

import { readFileSync } from 'node:fs';
import { parseClaudeCodeSession } from './parsers/claude-code.js';

const args = process.argv.slice(2);
const command = args[0];

if (command === 'parse') {
  const projectIdx = args.indexOf('--project');
  const project = projectIdx >= 0 ? args[projectIdx + 1] : undefined;
  const useStdin = args.includes('--stdin');

  let input: string;

  if (useStdin) {
    input = readFileSync('/dev/stdin', 'utf-8');
  } else {
    const file = args[1];
    if (!file) {
      process.stderr.write('Usage: agenttrace parse <file.jsonl> [--project <name>]\n');
      process.exit(1);
    }
    input = readFileSync(file, 'utf-8');
  }

  const lines = input.split('\n');
  const trace = parseClaudeCodeSession(lines, { project });

  // Pretty-print summary to stderr, JSON to stdout
  process.stderr.write(`\n  AgentTrace Analysis\n`);
  process.stderr.write(`  ${'='.repeat(40)}\n`);
  process.stderr.write(`  Session:    ${trace.sessionId}\n`);
  process.stderr.write(`  Model:      ${trace.model}\n`);
  process.stderr.write(`  Decisions:  ${trace.decisionCount}\n`);
  process.stderr.write(`  Agents:     ${trace.agentCount}\n`);
  process.stderr.write(`  Total cost: $${trace.cost.total.toFixed(4)}\n`);
  process.stderr.write(`  Waste:      $${trace.wasteTotal.toFixed(4)} (${(trace.wastePercentage * 100).toFixed(1)}%)\n`);
  process.stderr.write(`  Insights:   ${trace.insights.length}\n`);

  if (trace.insights.length > 0) {
    process.stderr.write(`\n  Top Insights:\n`);
    for (const insight of trace.insights.slice(0, 5)) {
      const conf = `${Math.round(insight.confidence * 100)}%`;
      process.stderr.write(`  [${insight.severity.toUpperCase()}] ${insight.title} (-$${insight.cost.toFixed(2)}, ${conf} confidence)\n`);
    }
  }

  process.stderr.write(`\n`);

  // JSON to stdout for piping
  process.stdout.write(JSON.stringify(trace, null, 2));
  process.stdout.write('\n');
} else {
  process.stderr.write('AgentTrace CLI v0.1.0\n\n');
  process.stderr.write('Commands:\n');
  process.stderr.write('  parse <file.jsonl>   Parse a Claude Code session log\n');
  process.stderr.write('  parse --stdin        Parse from stdin\n');
  process.stderr.write('\nOptions:\n');
  process.stderr.write('  --project <name>     Project name for the trace\n');
  process.exit(0);
}
