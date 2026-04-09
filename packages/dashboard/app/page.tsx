import { TraceView } from '@/components/trace-view';
import { DEMO_TRACE } from '@/lib/demo-trace';

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-mono text-sm font-bold">
              AT
            </div>
            <h1 className="text-lg font-semibold tracking-tight">AgentTrace</h1>
            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
              v0.1.0
            </span>
          </div>
          <p className="text-sm text-zinc-500">See where your tokens go</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <TraceView trace={DEMO_TRACE} />
      </div>
    </main>
  );
}
