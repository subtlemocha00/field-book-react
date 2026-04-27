import { useEffect, useState } from 'react';
import type { HealthResponse } from '@field-book/contracts';
import { Phase3Panel } from './Phase3Panel';

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; response: HealthResponse }
  | { kind: 'error'; message: string };

export function App(): JSX.Element {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/health', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as HealthResponse;
        setHealth({ kind: 'ok', response: body });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'unknown error';
        setHealth({ kind: 'error', message });
      });
    return () => {
      controller.abort();
    };
  }, []);

  return (
    <main>
      <h1>Field Book App</h1>
      <dl>
        <dt>API status</dt>
        <dd>{renderStatus(health)}</dd>
        <dt>API phase</dt>
        <dd>{renderPhase(health)}</dd>
      </dl>
      <Phase3Panel />
    </main>
  );
}

function renderStatus(state: HealthState): string {
  switch (state.kind) {
    case 'loading':
      return 'checking…';
    case 'ok':
      return state.response.status;
    case 'error':
      return `error: ${state.message}`;
  }
}

function renderPhase(state: HealthState): string {
  switch (state.kind) {
    case 'loading':
      return '…';
    case 'ok':
      return String(state.response.phase);
    case 'error':
      return '—';
  }
}
