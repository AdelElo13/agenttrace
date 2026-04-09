'use client';

import type { Trace, AgentSummary } from 'agenttrace-core';

interface AgentBreakdownProps {
  trace: Trace;
}

export function AgentBreakdown({ trace }: AgentBreakdownProps) {
  const sorted = [...trace.agents].sort((a, b) => b.cost.total - a.cost.total);
  const maxCost = sorted[0]?.cost.total ?? 1;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="text-sm font-medium text-zinc-400">Agent Breakdown</h3>

      <div className="mt-4 space-y-4">
        {sorted.map(agent => (
          <AgentRow key={agent.id} agent={agent} maxCost={maxCost} />
        ))}
      </div>
    </div>
  );
}

function AgentRow({ agent, maxCost }: { agent: AgentSummary; maxCost: number }) {
  const barWidth = (agent.cost.total / maxCost) * 100;
  const wasteWidth = (agent.wasteTotal / maxCost) * 100;
  const effectiveWidth = barWidth - wasteWidth;

  const wasteLevel =
    agent.wastePercentage > 0.5 ? 'text-red-400' :
    agent.wastePercentage > 0.2 ? 'text-amber-400' :
    'text-emerald-400';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            agent.parentId ? 'bg-blue-400' : 'bg-emerald-400'
          }`} />
          <span className="text-sm font-medium">{agent.name}</span>
          <span className="text-xs text-zinc-600">
            {agent.decisionCount} decisions
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm tabular-nums">
          <span className="font-semibold">${agent.cost.total.toFixed(2)}</span>
          {agent.wasteTotal > 0 && (
            <span className={`text-xs ${wasteLevel}`}>
              {(agent.wastePercentage * 100).toFixed(0)}% waste
            </span>
          )}
        </div>
      </div>

      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="flex h-full">
          <div
            className="bg-emerald-500/60 transition-all"
            style={{ width: `${effectiveWidth}%` }}
          />
          {wasteWidth > 0 && (
            <div
              className="bg-red-500/50 transition-all"
              style={{ width: `${wasteWidth}%` }}
            />
          )}
        </div>
      </div>

      {/* Top waste decisions */}
      {agent.topWasteDecisions.length > 0 && (
        <div className="mt-2 space-y-1">
          {agent.topWasteDecisions.slice(0, 2).map(d => (
            <div key={d.decisionId} className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="text-red-400/60">$</span>
              <span className="text-red-400/80">{d.cost.toFixed(3)}</span>
              <span className="truncate">{d.description}</span>
              {d.wasteReason && (
                <span className="ml-auto shrink-0 text-zinc-600">
                  {d.wasteReason}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
