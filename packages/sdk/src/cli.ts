#!/usr/bin/env node

/**
 * AgentTrace CLI
 *
 * Commands:
 *   agenttrace init           Auto-install Claude Code hook + verify
 *   agenttrace parse <file>   Parse a session log into a trace
 *   agenttrace report <file>  Generate a Markdown cost report
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { parseClaudeCodeSession } from './parsers/claude-code.js';
import type { Trace, Insight } from '@agenttrace/core';

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'init':
    runInit();
    break;
  case 'parse':
    runParse();
    break;
  case 'report':
    runReport();
    break;
  default:
    printHelp();
}

// ── Init Command ──────────────────────────────────────────────

function runInit() {
  const home = homedir();
  const settingsPath = join(home, '.claude', 'settings.json');
  const hookDir = join(home, '.claude', 'hooks');
  const hookScript = join(hookDir, 'agenttrace-stop.sh');
  const tracesDir = join(home, '.agenttrace', 'traces');
  const reportsDir = join(home, '.agenttrace', 'reports');

  process.stderr.write('\n  AgentTrace Setup\n');
  process.stderr.write('  ========================================\n\n');

  // Step 1: Create directories
  for (const dir of [hookDir, tracesDir, reportsDir]) {
    mkdirSync(dir, { recursive: true });
  }
  process.stderr.write('  [1/4] Created ~/.agenttrace directories\n');

  // Step 2: Write the Stop hook script
  const cliPath = process.argv[1] ?? 'npx agenttrace';
  const hookContent = `#!/bin/bash
# AgentTrace — auto-generate cost report after each Claude Code session
# Installed by: agenttrace init

TRACES_DIR="$HOME/.agenttrace/traces"
REPORTS_DIR="$HOME/.agenttrace/reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Parse session from stdin (Claude Code pipes session data to Stop hooks)
TRACE_FILE="$TRACES_DIR/trace-$TIMESTAMP.json"
REPORT_FILE="$REPORTS_DIR/report-$TIMESTAMP.md"

# Generate trace and report
cat /dev/stdin | node "${cliPath}" parse --stdin --project "$(basename $(pwd))" > "$TRACE_FILE" 2>/dev/null
node "${cliPath}" report "$TRACE_FILE" > "$REPORT_FILE" 2>/dev/null

# Show summary in terminal
if [ -f "$REPORT_FILE" ]; then
  echo ""
  head -20 "$REPORT_FILE"
  echo ""
  echo "  Full report: $REPORT_FILE"
  echo "  Trace data:  $TRACE_FILE"
fi
`;

  writeFileSync(hookScript, hookContent, { mode: 0o755 });
  process.stderr.write('  [2/4] Created Stop hook script\n');

  // Step 3: Register hook in Claude Code settings
  let settings: Record<string, unknown> = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    } catch {
      // If settings corrupt, start fresh
    }
  }

  // Ensure hooks array exists
  const hooks = (settings.hooks ?? []) as Array<Record<string, unknown>>;

  // Check if our hook already exists
  const existing = hooks.find(
    (h) => h.type === 'command' && typeof h.command === 'string' && h.command.includes('agenttrace'),
  );

  if (!existing) {
    hooks.push({
      type: 'command',
      event: 'Stop',
      command: hookScript,
      timeout: 10000,
    });
    settings.hooks = hooks;

    // Write settings back
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    process.stderr.write('  [3/4] Registered Stop hook in Claude Code settings\n');
  } else {
    process.stderr.write('  [3/4] Stop hook already registered (skipped)\n');
  }

  // Step 4: Verify
  process.stderr.write('  [4/4] Verifying installation...\n');

  const checks = [
    { name: 'Hook script', ok: existsSync(hookScript) },
    { name: 'Traces dir', ok: existsSync(tracesDir) },
    { name: 'Reports dir', ok: existsSync(reportsDir) },
    { name: 'Settings hook', ok: (() => {
      try {
        const s = JSON.parse(readFileSync(settingsPath, 'utf-8'));
        return Array.isArray(s.hooks) && s.hooks.some(
          (h: Record<string, unknown>) => typeof h.command === 'string' && h.command.includes('agenttrace'),
        );
      } catch { return false; }
    })() },
  ];

  const allOk = checks.every((c) => c.ok);

  process.stderr.write('\n');
  for (const check of checks) {
    process.stderr.write(`  ${check.ok ? 'OK' : 'FAIL'}  ${check.name}\n`);
  }

  process.stderr.write('\n');
  if (allOk) {
    process.stderr.write('  AgentTrace is installed. Every Claude Code session will now\n');
    process.stderr.write('  generate a cost report automatically.\n\n');
    process.stderr.write('  Reports saved to: ~/.agenttrace/reports/\n');
    process.stderr.write('  Trace data saved to: ~/.agenttrace/traces/\n\n');
    process.stderr.write('  Start a Claude Code session and close it to see your first report.\n\n');
  } else {
    process.stderr.write('  Some checks failed. Please review the output above.\n\n');
    process.exit(1);
  }
}

// ── Parse Command ─────────────────────────────────────────────

function runParse() {
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

  // Summary to stderr
  process.stderr.write(`\n  AgentTrace Analysis\n`);
  process.stderr.write(`  ${'='.repeat(40)}\n`);
  process.stderr.write(`  Session:    ${trace.sessionId}\n`);
  process.stderr.write(`  Model:      ${trace.model}\n`);
  process.stderr.write(`  Decisions:  ${trace.decisionCount}\n`);
  process.stderr.write(`  Agents:     ${trace.agentCount}\n`);
  process.stderr.write(`  Total cost: $${trace.cost.total.toFixed(4)}\n`);
  process.stderr.write(`  Waste:      $${trace.wasteTotal.toFixed(4)} (${(trace.wastePercentage * 100).toFixed(1)}%)\n`);
  process.stderr.write(`  Insights:   ${trace.insights.length}\n\n`);

  // JSON to stdout
  process.stdout.write(JSON.stringify(trace, null, 2));
  process.stdout.write('\n');
}

// ── Report Command ────────────────────────────────────────────

function runReport() {
  const file = args[1];
  if (!file) {
    process.stderr.write('Usage: agenttrace report <trace.json>\n');
    process.exit(1);
  }

  const raw = readFileSync(file, 'utf-8');
  const trace = JSON.parse(raw) as Trace;

  process.stdout.write(generateMarkdownReport(trace));
}

function generateMarkdownReport(trace: Trace): string {
  const lines: string[] = [];
  const effective = trace.cost.total - trace.wasteTotal;
  const wastePct = (trace.wastePercentage * 100).toFixed(0);
  const duration = formatDuration(trace.endedAt - trace.startedAt);

  lines.push(`## AgentTrace Cost Report`);
  lines.push(``);
  lines.push(`> Your agents spent **$${trace.cost.total.toFixed(2)}**. Here's what was worth it.`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total cost | $${trace.cost.total.toFixed(2)} |`);
  lines.push(`| Effective spend | $${effective.toFixed(2)} (${(100 - Number(wastePct)).toFixed(0)}%) |`);
  lines.push(`| Identified waste | $${trace.wasteTotal.toFixed(2)} (${wastePct}%) |`);
  lines.push(`| Duration | ${duration} |`);
  lines.push(`| Decisions | ${trace.decisionCount} |`);
  lines.push(`| Agents | ${trace.agentCount} |`);
  lines.push(`| Model | ${trace.model} |`);
  lines.push(``);

  // Agent breakdown
  if (trace.agents.length > 0) {
    lines.push(`### Agent Breakdown`);
    lines.push(``);
    lines.push(`| Agent | Cost | Waste | Top Issue |`);
    lines.push(`|-------|------|-------|-----------|`);
    for (const agent of trace.agents) {
      const topIssue = agent.topWasteDecisions[0];
      const issueText = topIssue
        ? `${topIssue.description} ($${topIssue.cost.toFixed(3)})`
        : '-';
      lines.push(
        `| ${agent.name} | $${agent.cost.total.toFixed(2)} | ${(agent.wastePercentage * 100).toFixed(0)}% | ${issueText} |`,
      );
    }
    lines.push(``);
  }

  // Insights as recommendations
  if (trace.insights.length > 0) {
    lines.push(`### Recommendations`);
    lines.push(``);
    for (const insight of trace.insights) {
      const conf = Math.round(insight.confidence * 100);
      const icon = insight.severity === 'critical' ? '!!!' : insight.severity === 'warning' ? '!!' : '!';
      lines.push(`**${icon} ${insight.title}** (-$${insight.cost.toFixed(2)}, ${conf}% confidence)`);
      lines.push(``);
      lines.push(`${insight.description}`);
      lines.push(``);
      if (insight.evidence.length > 0) {
        lines.push(`Evidence:`);
        for (const e of insight.evidence) {
          lines.push(`- ${e}`);
        }
        lines.push(``);
      }
      lines.push(`> **Action:** ${insight.suggestion}`);
      lines.push(``);
      // Projected savings
      const weeklySavings = (insight.cost * 5).toFixed(2);
      lines.push(`> Projected weekly savings if applied: ~$${weeklySavings}`);
      lines.push(``);
    }
  }

  lines.push(`---`);
  lines.push(`*Generated by [AgentTrace](https://agenttrace.dev) v0.1.0*`);
  lines.push(``);

  return lines.join('\n');
}

// ── Help ──────────────────────────────────────────────────────

function printHelp() {
  process.stderr.write(`AgentTrace v0.1.0 — See where your tokens go

Commands:
  init                 Install Claude Code hook (auto-trace every session)
  parse <file.jsonl>   Parse a Claude Code session log
  report <trace.json>  Generate a Markdown cost report

Options:
  --project <name>     Project name for the trace
  --stdin              Read input from stdin

Examples:
  agenttrace init
  agenttrace parse session.jsonl --project my-app > trace.json
  agenttrace report trace.json > report.md
`);
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}
