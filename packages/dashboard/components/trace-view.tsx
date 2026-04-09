'use client';

import { useState } from 'react';
import type { Trace } from 'agenttrace-core';
import { CostSummary } from './cost-summary';
import { AgentBreakdown } from './agent-breakdown';
import { DecisionTree } from './decision-tree';
import { InsightsPanel } from './insights-panel';

interface TraceViewProps {
  trace: Trace;
}

type Tab = 'overview' | 'decisions' | 'insights';

export function TraceView({ trace }: TraceViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'decisions', label: 'Decision Tree', count: trace.decisionCount },
    { id: 'insights', label: 'Insights', count: trace.insights.length },
  ];

  return (
    <div className="space-y-6">
      {/* Session header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{trace.rootDecision.description}</h2>
          <div className="mt-1 flex items-center gap-4 text-sm text-zinc-400">
            <span>{trace.project}</span>
            <span className="text-zinc-600">|</span>
            <span>{trace.model}</span>
            <span className="text-zinc-600">|</span>
            <span>{formatDuration(trace.endedAt - trace.startedAt)}</span>
            <span className="text-zinc-600">|</span>
            <span>{trace.agentCount} agents</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold tabular-nums">
            ${trace.cost.total.toFixed(2)}
          </div>
          <div className="mt-0.5 text-sm">
            <span className="text-red-400">${trace.wasteTotal.toFixed(2)} waste</span>
            <span className="text-zinc-500"> ({(trace.wastePercentage * 100).toFixed(0)}%)</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.id ? 'bg-zinc-700' : 'bg-zinc-800'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CostSummary trace={trace} />
          <AgentBreakdown trace={trace} />
        </div>
      )}
      {activeTab === 'decisions' && <DecisionTree decision={trace.rootDecision} />}
      {activeTab === 'insights' && <InsightsPanel insights={trace.insights} traceId={trace.id} />}
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}
