# HN Launch Post

## Title (max 80 chars)
Show HN: AgentTrace – See where your AI agent tokens go (decision-level cost attribution)

## URL
https://github.com/AdelElo13/agenttrace

## Text (for Show HN)

I built AgentTrace because I was spending $200+/month on Claude Code and had zero visibility into where the money went.

Existing tools (LangSmith, Langfuse, Helicone) trace LLM calls — prompt in, completion out. But when your agent spawns 3 sub-agents that read 40 files, search 5 URLs, and retry tests 3 times, you need to know: which of those decisions were actually worth the money?

AgentTrace traces agent *decisions*, not API calls. It builds a decision tree showing what each agent chose to do, what it cost, and whether it contributed to the outcome.

Key features:
- `agenttrace init` — one command installs a Claude Code hook. Every session auto-generates a cost report.
- Decision tree visualization with outcome badges (success/failure/dead_end/redundant)
- Waste detection with confidence scores and evidence trails
- Actionable recommendations with projected weekly savings
- "Mark as applied" → tracks before/after waste to prove ROI

Example output: a $1.97 session with 4 agents showed 42% waste — a research agent read 6 irrelevant files ($0.19), a docs agent fetched 4 redundant pages ($0.23), and an implementation agent failed tests twice due to missing env vars ($0.15). Each finding comes with a specific fix and effort estimate.

Built as a 10-round adversarial sparring session between Claude and Codex (GPT-5.3). The AIs designed the product together, challenged each other's assumptions, and iterated until both scored it 9.4/10.

Stack: TypeScript, Next.js 16, npm workspaces. MIT licensed. Runs locally, no cloud required.

Roadmap: Codex/Cursor parsers, cloud dashboard for teams, budget alerts.

GitHub: https://github.com/AdelElo13/agenttrace
