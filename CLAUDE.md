# Project: AgentTrace

## Context
- What this builds: Decision-level observability and cost attribution for AI agents ("Sentry for AI Agents")
- Stack: TypeScript, Next.js 16, Tailwind CSS, npm workspaces
- Platform: Web (dashboard) + CLI + npm SDK
- Phase: MVP

## Architecture
```
packages/
  core/     — Data model (Trace, Decision tree), pricing DB, waste analyzer
  sdk/      — Instrumentation SDK (Tracer, Span), Claude Code parser, CLI
  dashboard/ — Next.js dashboard (cost summary, agent breakdown, decision tree, insights)
```

## Key concepts
- **Decision tree**: Not LLM call logs. Each node is an agent DECISION with outcome + cost + waste score.
- **Waste scoring**: Outcome-based heuristics with confidence scores (0-1). dead_end=1.0, redundant=0.9, failure=0.7.
- **Pattern detection**: Retry loops, dead-end exploration, redundant cross-agent work, expensive failed delegations.
- **Cost attribution**: Per-decision and per-agent, not per-LLM-call.

## Commands
```bash
npm run build          # Build all packages
npm run dev            # Start dashboard dev server
npm run lint           # Type-check core + sdk

# CLI
node packages/sdk/dist/cli.js parse <session.jsonl> --project myapp
```

## Working style
- Always start in Plan Mode. No code before the plan is approved.
- When in doubt: ask, never assume.
- Verify your own work before calling it done.

## What I do NOT want
- No temporary fixes that mask larger problems.
- No changes outside the scope of the task.
- No new dependencies without discussion.

## Known pitfalls
- Claude Code JSONL format is undocumented — parser may need updates as format changes
- Waste scoring is heuristic-based with confidence scores — not yet ML-calibrated
- Dashboard filesystem storage only works locally (needs Vercel Blob for deployment)
