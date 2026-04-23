import { useEffect, useState } from 'react';
import type { HealthResponse } from '@field-book/contracts';

type HealthState =
  | { kind: 'loading' }
  | { kind: 'ok'; status: HealthResponse['status'] }
  | { kind: 'error'; message: string };

export function App(): JSX.Element {
  const [health, setHealth] = useState<HealthState>({ kind: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch('/health', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as HealthResponse;
        setHealth({ kind: 'ok', status: body.status });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : 'unknown error';
        setHealth({ kind: 'error', message });
      });
    return () => controller.abort();
  }, []);

  return (
    <main>
      <h1>Field Book App</h1>
      <p>API status: {renderHealth(health)}</p>
    </main>
  );
}

function renderHealth(state: HealthState): string {
  switch (state.kind) {
    case 'loading':
      return 'checking…';
    case 'ok':
      return state.status;
    case 'error':
      return `error: ${state.message}`;
  }
}
