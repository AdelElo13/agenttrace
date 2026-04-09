'use client';

import type { Insight, InsightSeverity } from '@agenttrace/core';

interface InsightsPanelProps {
  insights: readonly Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const sorted = [...insights].sort((a, b) => {
    const order: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  return (
    <div className="space-y-4">
      {sorted.map(insight => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const style = severityStyle(insight.severity);
  const confidencePct = Math.round(insight.confidence * 100);
  const confidenceColor =
    insight.confidence >= 0.8 ? 'text-emerald-400' :
    insight.confidence >= 0.6 ? 'text-amber-400' :
    'text-zinc-500';

  return (
    <div className={`rounded-xl border p-5 ${style.border} ${style.bg}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <h4 className="font-semibold">{insight.title}</h4>
        </div>
        <div className="flex items-center gap-3">
          {/* Confidence indicator */}
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full ${
                  insight.confidence >= 0.8 ? 'bg-emerald-500' :
                  insight.confidence >= 0.6 ? 'bg-amber-500' :
                  'bg-zinc-600'
                }`}
                style={{ width: `${confidencePct}%` }}
              />
            </div>
            <span className={`text-xs tabular-nums ${confidenceColor}`}>
              {confidencePct}%
            </span>
          </div>
          <span className="text-sm font-medium tabular-nums text-red-400">
            -${insight.cost.toFixed(2)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
            {insight.severity}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-zinc-300">{insight.description}</p>

      {/* Evidence */}
      {insight.evidence.length > 0 && (
        <div className="mt-3 rounded-lg bg-zinc-950/50 p-3">
          <div className="text-xs font-medium text-zinc-400">Evidence</div>
          <ul className="mt-1 space-y-1">
            {insight.evidence.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                <span className="mt-0.5 text-zinc-600">&bull;</span>
                {e}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3 rounded-lg bg-emerald-950/30 p-3">
        <div className="text-xs font-medium text-emerald-400">Suggestion</div>
        <p className="mt-1 text-sm text-zinc-300">{insight.suggestion}</p>
      </div>

      <div className="mt-3 text-xs text-zinc-500">
        Affects {insight.affectedDecisions.length} decision{insight.affectedDecisions.length !== 1 ? 's' : ''}
        {' \u2022 '}
        {insight.category.replace(/_/g, ' ')}
      </div>
    </div>
  );
}

function severityStyle(severity: InsightSeverity) {
  const styles = {
    critical: {
      border: 'border-red-800',
      bg: 'bg-red-950/30',
      badge: 'bg-red-900 text-red-300',
      icon: '\u{1F6A8}',
    },
    warning: {
      border: 'border-amber-800/50',
      bg: 'bg-amber-950/20',
      badge: 'bg-amber-900 text-amber-300',
      icon: '\u26A0\uFE0F',
    },
    info: {
      border: 'border-blue-800/30',
      bg: 'bg-blue-950/10',
      badge: 'bg-blue-900 text-blue-300',
      icon: '\u{1F4A1}',
    },
  };
  return styles[severity];
}
