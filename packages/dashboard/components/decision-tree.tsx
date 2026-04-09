'use client';

import { useState } from 'react';
import type { Decision, DecisionType, DecisionOutcome } from '@agenttrace/core';

interface DecisionTreeProps {
  decision: Decision;
}

export function DecisionTree({ decision }: DecisionTreeProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">Decision Tree</h3>
      <div className="space-y-0.5">
        <DecisionNode decision={decision} depth={0} />
      </div>
    </div>
  );
}

function DecisionNode({ decision, depth }: { decision: Decision; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = decision.children.length > 0;
  const icon = typeIcon(decision.type);
  const outcomeColor = outcomeStyle(decision.outcome);
  const isWaste = decision.wasteScore > 0.5;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className={`group flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800/50 ${
          isWaste ? 'bg-red-950/20' : ''
        }`}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand/collapse */}
        <span className="mt-0.5 w-4 shrink-0 text-xs text-zinc-600">
          {hasChildren ? (expanded ? '\u25BC' : '\u25B6') : '\u2022'}
        </span>

        {/* Type icon */}
        <span className="mt-0.5 shrink-0 text-sm" title={decision.type}>
          {icon}
        </span>

        {/* Description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm">{decision.description}</span>
            {decision.tool && (
              <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400">
                {decision.tool}
              </span>
            )}
          </div>

          {/* Waste reason */}
          {decision.wasteReason && (
            <div className="mt-0.5 text-xs text-red-400/70">
              {decision.wasteReason}
            </div>
          )}
        </div>

        {/* Cost & outcome */}
        <div className="flex shrink-0 items-center gap-3">
          {decision.cost.total > 0 && (
            <span className={`text-xs tabular-nums ${isWaste ? 'text-red-400' : 'text-zinc-500'}`}>
              ${decision.cost.total.toFixed(3)}
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 text-xs ${outcomeColor}`}>
            {decision.outcome}
          </span>
        </div>
      </button>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {decision.children.map(child => (
            <DecisionNode key={child.id} decision={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function typeIcon(type: DecisionType): string {
  const icons: Record<DecisionType, string> = {
    tool_call: '\u2699\uFE0F',
    delegation: '\u{1F916}',
    reasoning: '\u{1F9E0}',
    exploration: '\u{1F50D}',
    generation: '\u270D\uFE0F',
  };
  return icons[type];
}

function outcomeStyle(outcome: DecisionOutcome): string {
  const styles: Record<DecisionOutcome, string> = {
    success: 'bg-emerald-950 text-emerald-400',
    partial: 'bg-amber-950 text-amber-400',
    failure: 'bg-red-950 text-red-400',
    redundant: 'bg-orange-950 text-orange-400',
    dead_end: 'bg-red-950/50 text-red-400/70',
  };
  return styles[outcome];
}
