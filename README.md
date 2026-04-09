# AgentTrace

**See where your tokens go.**

Decision-level observability and cost attribution for AI agents. Not another LLM call logger — AgentTrace shows you *which agent decisions were worth the money*.

```
Your agents spent $8.14. Here's what was worth it.

  Effective spend:  $4.72 (58%)
  Identified waste: $3.42 (42%)

  Recommendations:
  [WARNING] Research Agent read 12 irrelevant files (-$0.89, 85% confidence)
  > Action: Add "focus on src/auth/" to agent prompt. Effort: trivial. Saves ~$4.45/week.

  [WARNING] Docs Agent fetched 4 redundant pages (-$0.67, 75% confidence)  
  > Action: Use Context7 for targeted doc lookup. Effort: trivial. Saves ~$3.35/week.
```

## Quick Start

```bash
# Install
npm install -g @agenttrace/sdk

# Auto-trace every Claude Code session (one command, done)
agenttrace init

# Or parse a session manually
agenttrace parse session.jsonl --project my-app > trace.json

# Generate a shareable Markdown report
agenttrace report trace.json > report.md
```

## What It Does

| Feature | Description |
|---------|-------------|
| **Decision Tree** | Visualize agent reasoning paths, not just API calls |
| **Cost Attribution** | Per-decision and per-agent cost breakdown |
| **Waste Detection** | Identifies dead-end exploration, retry loops, redundant work |
| **Confidence Scores** | Every finding has a confidence score + evidence trail |
| **Actionable Recommendations** | Specific actions with effort level and projected weekly savings |
| **Before/After Tracking** | Mark recommendations as applied, measure real savings over time |
| **Zero-Code Integration** | Claude Code hook auto-traces every session |

## How It Works

```
agenttrace init
    |
    v
Claude Code session runs
    |
    v
Stop hook auto-generates trace + report
    |
    v
Dashboard shows: cost, waste, recommendations
    |
    v
You apply a recommendation
    |
    v
Next sessions show: waste decreased by X%
Your fixes are working.
```

## Dashboard

Run the dashboard locally:

```bash
git clone https://github.com/AdelElo13/agenttrace
cd agenttrace
npm install
npm run build
npm run dev
```

Open `http://localhost:3000` to see:

- **Overview** — Total cost, effective vs waste breakdown, per-agent cost bars
- **Decision Tree** — Interactive expandable tree with outcome badges and waste highlighting
- **Insights** — Recommendation cards with projected savings, evidence drill-down, and "mark as applied"
- **History** — Session list with realized savings tracker (causal before/after comparison)

## Architecture

```
packages/
  core/       @agenttrace/core — Data model, waste analyzer, pricing DB
  sdk/        @agenttrace/sdk  — Tracer SDK, Claude Code parser, CLI
  dashboard/  Next.js 16 dashboard with Tailwind CSS
```

### Core Concepts

**Decision Tree** — Every agent session is a tree of decisions. Each node has:
- Type: `tool_call` | `delegation` | `reasoning` | `exploration` | `generation`
- Outcome: `success` | `failure` | `partial` | `redundant` | `dead_end`
- Cost: token usage * model pricing
- Waste score: 0.0 - 1.0 with confidence

**Insights** — Pattern detection finds:
- Retry loops (same tool failing 3+ times)
- Dead-end exploration (reading files that aren't relevant)
- Redundant work (multiple agents doing the same thing)
- Expensive failed delegations (sub-agents that cost $2+ and failed)

**Recommendations** — Every insight includes:
- Specific action to take
- Type: `config` | `prompt` | `workflow` | `tool_choice`
- Effort: `trivial` | `easy` | `moderate`
- Projected weekly savings

## SDK Usage

Instrument your own agent code:

```typescript
import { Tracer } from '@agenttrace/sdk';

const tracer = new Tracer({
  project: 'my-app',
  model: 'claude-sonnet-4-6',
});

const span = tracer.startSpan('Research auth patterns', {
  type: 'exploration',
  tool: 'Grep',
});

// ... do work ...

span.end({
  outcome: 'success',
  tokens: { input: 5000, output: 200, cacheRead: 0, cacheWrite: 0 },
});

const trace = tracer.finish();
// trace.wasteTotal, trace.insights, trace.recommendations
```

## Model Pricing

Built-in pricing for:
- **Anthropic**: Claude Opus 4.6, Sonnet 4.6, Haiku 4.5
- **OpenAI**: GPT-5.3, GPT-5.3-Codex, o3
- **Google**: Gemini 2.5 Pro, Gemini 2.5 Flash

## Why Not LangSmith / Langfuse / Helicone?

Those tools trace **LLM calls** (prompt in, completion out).

AgentTrace traces **agent decisions** — *why* an agent chose tool X over tool Y, where tokens were wasted on dead-end exploration, and which sub-agent delegation was worth the money.

| | LLM Tracers | AgentTrace |
|--|-------------|------------|
| Traces | API calls | Agent decisions |
| Shows | What happened | What was worth it |
| Insight | Latency, tokens | Waste, ROI, actionable fixes |
| Integration | SDK wrapper | Zero-code hook |

## Development

```bash
npm install          # Install all dependencies
npm run build        # Build all packages
npm run dev          # Start dashboard dev server
npx vitest run       # Run parser golden tests (16 tests)
```

## License

MIT

## Built With

Developed through a 10-round Claude + Codex adversarial sparring session. Score: 9.4/10.
