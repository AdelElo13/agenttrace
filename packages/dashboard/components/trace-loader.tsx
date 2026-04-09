'use client';

import { useState, useCallback } from 'react';
import type { Trace } from '@agenttrace/core';
import { DEMO_TRACE } from '@/lib/demo-trace';
import { TraceView } from './trace-view';
import { TraceHistory } from './trace-history';

type Mode = 'current' | 'history';

export function TraceLoader() {
  const [trace, setTrace] = useState<Trace>(DEMO_TRACE);
  const [mode, setMode] = useState<Mode>('current');
  const [traces, setTraces] = useState<Trace[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFromFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as Trace;
      if (parsed.rootDecision && parsed.id) {
        setTrace(parsed);
        setTraces(prev => {
          const exists = prev.some(t => t.id === parsed.id);
          return exists ? prev : [parsed, ...prev];
        });
      }
    } catch {
      // Try as JSONL — future enhancement
    }
  }, []);

  const loadFromDirectory = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/traces');
      if (resp.ok) {
        const list = await resp.json();
        // Load full traces
        const loaded: Trace[] = [];
        for (const item of list.slice(0, 20)) {
          try {
            const r = await fetch(`/api/traces/${item.id}`);
            if (r.ok) loaded.push(await r.json());
          } catch { /* skip */ }
        }
        setTraces(loaded);
      }
    } catch { /* API not available */ }
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      {/* Source selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-zinc-900 p-1">
          <button
            onClick={() => setMode('current')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'current' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Current Trace
          </button>
          <button
            onClick={() => { setMode('history'); loadFromDirectory(); }}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              mode === 'history' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            History
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700">
            Load trace JSON
            <input type="file" accept=".json" onChange={loadFromFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* Content */}
      {mode === 'current' && <TraceView trace={trace} />}
      {mode === 'history' && (
        <TraceHistory
          traces={traces}
          loading={loading}
          onSelect={(t) => { setTrace(t); setMode('current'); }}
        />
      )}
    </div>
  );
}
