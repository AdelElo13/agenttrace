'use client';

import type { Trace } from '@agenttrace/core';

interface CostSummaryProps {
  trace: Trace;
}

export function CostSummary({ trace }: CostSummaryProps) {
  const effective = trace.cost.total - trace.wasteTotal;
  const effectivePct = trace.cost.total > 0 ? (effective / trace.cost.total) * 100 : 100;
  const wastePct = trace.wastePercentage * 100;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="text-sm font-medium text-zinc-400">Cost Attribution</h3>

      {/* Cost bar */}
      <div className="mt-4">
        <div className="flex items-end justify-between">
          <span className="text-4xl font-bold tabular-nums">${trace.cost.total.toFixed(2)}</span>
          <span className="text-sm text-zinc-500">
            {(trace.tokens.input + trace.tokens.output).toLocaleString()} tokens
          </span>
        </div>

        <div className="mt-3 h-4 overflow-hidden rounded-full bg-zinc-800">
          <div className="flex h-full">
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${effectivePct}%` }}
              title={`Effective: $${effective.toFixed(2)}`}
            />
            <div
              className="bg-red-500/70 transition-all"
              style={{ width: `${wastePct}%` }}
              title={`Waste: $${trace.wasteTotal.toFixed(2)}`}
            />
          </div>
        </div>

        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Effective ${effective.toFixed(2)} ({effectivePct.toFixed(0)}%)
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500/70" />
            Waste ${trace.wasteTotal.toFixed(2)} ({wastePct.toFixed(0)}%)
          </div>
        </div>
      </div>

      {/* Token breakdown */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <Stat label="Input tokens" value={trace.tokens.input.toLocaleString()} />
        <Stat label="Output tokens" value={trace.tokens.output.toLocaleString()} />
        <Stat label="Cache read" value={trace.tokens.cacheRead.toLocaleString()} />
        <Stat label="Decisions" value={trace.decisionCount.toString()} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}
