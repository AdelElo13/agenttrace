'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Insight, InsightSeverity, Recommendation } from '@agenttrace/core';

interface InsightsPanelProps {
  insights: readonly Insight[];
  traceId: string;
}

export function InsightsPanel({ insights, traceId }: InsightsPanelProps) {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  // Load persisted applied state
  useEffect(() => {
    fetch('/api/applied')
      .then(r => r.json())
      .then((entries: Array<{ insightId: string; traceId: string }>) => {
        const ids = new Set(
          entries.filter(e => e.traceId === traceId).map(e => e.insightId),
        );
        setAppliedIds(ids);
      })
      .catch(() => {});
  }, [traceId]);

  const toggleApplied = useCallback(async (insightId: string, insight: Insight) => {
    const isApplied = appliedIds.has(insightId);
    // Optimistic update
    setAppliedIds(prev => {
      const next = new Set(prev);
      if (isApplied) next.delete(insightId);
      else next.add(insightId);
      return next;
    });
    // Persist
    await fetch('/api/applied', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        insightId,
        traceId,
        category: insight.category,
        projectedWeeklySavings: insight.recommendation.projectedWeeklySavings,
      }),
    }).catch(() => {});
  }, [appliedIds, traceId]);

  const sorted = [...insights].sort((a, b) => {
    const order: Record<InsightSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const totalSavings = sorted.reduce((s, i) => s + i.recommendation.projectedWeeklySavings, 0);

  return (
    <div className="space-y-4">
      {/* Savings summary */}
      <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-emerald-400">Projected Weekly Savings</h3>
            <div className="mt-1 text-3xl font-bold tabular-nums text-emerald-300">
              ~${totalSavings.toFixed(2)}<span className="text-lg text-emerald-500">/week</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              If all {sorted.length} recommendations are applied (based on ~5 similar sessions/week)
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-zinc-400">{sorted.length} recommendations</div>
            <div className="mt-1 text-xs text-zinc-500">
              {sorted.filter(i => i.recommendation.effort === 'trivial').length} trivial,{' '}
              {sorted.filter(i => i.recommendation.effort === 'easy').length} easy,{' '}
              {sorted.filter(i => i.recommendation.effort === 'moderate').length} moderate
            </div>
          </div>
        </div>
      </div>

      {/* Insight cards */}
      {sorted.map(insight => (
        <InsightCard
          key={insight.id}
          insight={insight}
          applied={appliedIds.has(insight.id)}
          onToggleApplied={() => toggleApplied(insight.id, insight)}
        />
      ))}
    </div>
  );
}

function InsightCard({ insight, applied, onToggleApplied }: {
  insight: Insight;
  applied: boolean;
  onToggleApplied: () => void;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const style = severityStyle(insight.severity);
  const confidencePct = Math.round(insight.confidence * 100);
  const rec = insight.recommendation;

  return (
    <div className={`rounded-xl border p-5 transition-opacity ${style.border} ${style.bg} ${applied ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{style.icon}</span>
          <h4 className="font-semibold">{insight.title}</h4>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceBadge confidence={insight.confidence} />
          <span className="text-sm font-medium tabular-nums text-red-400">
            -${insight.cost.toFixed(2)}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}>
            {insight.severity}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-zinc-300">{insight.description}</p>

      {/* Recommendation card */}
      <div className="mt-3 rounded-lg border border-emerald-800/30 bg-emerald-950/20 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-400">RECOMMENDATION</span>
              <EffortBadge effort={rec.effort} />
              <TypeBadge type={rec.type} />
            </div>
            <p className="mt-1.5 text-sm text-zinc-200">{rec.action}</p>
          </div>
          <div className="ml-4 shrink-0 text-right">
            <div className="text-lg font-bold tabular-nums text-emerald-300">
              ~${rec.projectedWeeklySavings.toFixed(2)}
            </div>
            <div className="text-xs text-emerald-500/70">per week</div>
          </div>
        </div>

        {/* Apply button */}
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={onToggleApplied}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              applied
                ? 'bg-emerald-800 text-emerald-200'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {applied ? 'Applied' : 'Mark as applied'}
          </button>
          {applied && (
            <span className="text-xs text-zinc-500">
              Tracking savings over next 7 days...
            </span>
          )}
        </div>
      </div>

      {/* Evidence drill-down */}
      <div className="mt-3">
        <button
          onClick={() => setShowEvidence(!showEvidence)}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <span>{showEvidence ? '\u25BC' : '\u25B6'}</span>
          Evidence ({insight.evidence.length} observations, {insight.affectedDecisions.length} decisions)
        </button>

        {showEvidence && (
          <div className="mt-2 space-y-2">
            {/* Evidence list */}
            <div className="rounded-lg bg-zinc-950/50 p-3">
              <div className="text-xs font-medium text-zinc-400">Observations</div>
              <ul className="mt-1.5 space-y-1">
                {insight.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                    <span className="mt-0.5 text-zinc-600">&bull;</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>

            {/* Cost math */}
            <div className="rounded-lg bg-zinc-950/50 p-3">
              <div className="text-xs font-medium text-zinc-400">Cost Math</div>
              <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-zinc-500">Waste identified</div>
                  <div className="font-medium tabular-nums text-red-400">${insight.cost.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-zinc-500">Confidence</div>
                  <div className="font-medium tabular-nums">{confidencePct}%</div>
                </div>
                <div>
                  <div className="text-zinc-500">Adjusted waste</div>
                  <div className="font-medium tabular-nums text-amber-400">
                    ${(insight.cost * insight.confidence).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Affected decisions */}
            <div className="rounded-lg bg-zinc-950/50 p-3">
              <div className="text-xs font-medium text-zinc-400">Affected Decisions</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {insight.affectedDecisions.map(id => (
                  <span key={id} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400 font-mono">
                    {id}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? 'bg-emerald-500' : confidence >= 0.6 ? 'bg-amber-500' : 'bg-zinc-600';
  const textColor = confidence >= 0.8 ? 'text-emerald-400' : confidence >= 0.6 ? 'text-amber-400' : 'text-zinc-500';

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-10 overflow-hidden rounded-full bg-zinc-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs tabular-nums ${textColor}`}>{pct}%</span>
    </div>
  );
}

function EffortBadge({ effort }: { effort: string }) {
  const styles: Record<string, string> = {
    trivial: 'bg-emerald-900/50 text-emerald-300',
    easy: 'bg-blue-900/50 text-blue-300',
    moderate: 'bg-amber-900/50 text-amber-300',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs ${styles[effort] ?? 'bg-zinc-800 text-zinc-400'}`}>
      {effort}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    config: 'text-purple-400',
    prompt: 'text-cyan-400',
    workflow: 'text-amber-400',
    tool_choice: 'text-pink-400',
  };
  return (
    <span className={`text-xs ${styles[type] ?? 'text-zinc-400'}`}>
      {type}
    </span>
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
