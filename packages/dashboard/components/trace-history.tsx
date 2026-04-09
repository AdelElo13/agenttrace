'use client';

import type { Trace } from '@agenttrace/core';

interface TraceHistoryProps {
  traces: Trace[];
  loading: boolean;
  onSelect: (trace: Trace) => void;
}

export function TraceHistory({ traces, loading, onSelect }: TraceHistoryProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-zinc-500">
        Loading traces...
      </div>
    );
  }

  if (traces.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-12 text-center">
        <h3 className="text-lg font-semibold">No traces yet</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Run <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-emerald-400">agenttrace init</code> to
          auto-trace every Claude Code session, or load a trace JSON file.
        </p>
        <div className="mt-6 rounded-lg bg-zinc-950 p-4 text-left">
          <pre className="text-sm text-zinc-300">
{`# Install AgentTrace hook
npx agenttrace init

# Or parse a session manually
agenttrace parse session.jsonl > trace.json

# Generate a shareable report
agenttrace report trace.json > report.md`}
          </pre>
        </div>
      </div>
    );
  }

  // Calculate before/after metrics for applied recommendations
  const sortedTraces = [...traces].sort((a, b) => b.startedAt - a.startedAt);
  const latestWaste = sortedTraces[0]?.wastePercentage ?? 0;
  const oldestWaste = sortedTraces[sortedTraces.length - 1]?.wastePercentage ?? 0;
  const wasteChange = latestWaste - oldestWaste;
  const totalSpend = sortedTraces.reduce((s, t) => s + t.cost.total, 0);
  const totalWaste = sortedTraces.reduce((s, t) => s + t.wasteTotal, 0);

  return (
    <div className="space-y-6">
      {/* Savings tracker — before/after */}
      {sortedTraces.length >= 2 && (
        <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/15 p-5">
          <h3 className="text-sm font-medium text-emerald-400">Realized Savings Tracker</h3>
          <div className="mt-3 grid grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-zinc-500">Total spend</div>
              <div className="mt-0.5 text-xl font-bold tabular-nums">${totalSpend.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Total waste</div>
              <div className="mt-0.5 text-xl font-bold tabular-nums text-red-400">${totalWaste.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Waste trend</div>
              <div className={`mt-0.5 text-xl font-bold tabular-nums ${wasteChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {wasteChange <= 0 ? '' : '+'}{(wasteChange * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Sessions</div>
              <div className="mt-0.5 text-xl font-bold tabular-nums">{sortedTraces.length}</div>
            </div>
          </div>
          {wasteChange < 0 && (
            <p className="mt-3 text-xs text-emerald-400/70">
              Waste percentage decreased by {Math.abs(wasteChange * 100).toFixed(1)}% since your first traced session.
              Your recommendations are working.
            </p>
          )}
        </div>
      )}

      {/* Trace list */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-5 py-3">
          <h3 className="text-sm font-medium text-zinc-400">Recent Sessions</h3>
        </div>
        <div className="divide-y divide-zinc-800">
          {sortedTraces.map(t => (
            <button
              key={t.id}
              onClick={() => onSelect(t)}
              className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-zinc-800/50"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {t.rootDecision.description}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-xs text-zinc-500">
                  <span>{t.project}</span>
                  <span>{t.model}</span>
                  <span>{new Date(t.startedAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="ml-4 flex items-center gap-4 text-right">
                <div>
                  <div className="text-sm font-semibold tabular-nums">${t.cost.total.toFixed(2)}</div>
                  <div className="text-xs text-red-400/70">{(t.wastePercentage * 100).toFixed(0)}% waste</div>
                </div>
                <div className="text-xs text-zinc-500">
                  {t.decisionCount} decisions
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
