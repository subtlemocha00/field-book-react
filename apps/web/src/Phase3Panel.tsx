import { useCallback, useState } from 'react';
import type {
  ApiResponse,
  CreateProjectRequest,
  Project,
  ProjectStatus,
} from '@field-book/contracts';

type PanelState =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'success'; project: Project }
  | { kind: 'error'; code: string; message: string };

const DEFAULT_STATUS: ProjectStatus = 'active';

export function Phase3Panel(): JSX.Element {
  const [name, setName] = useState('Demo Project');
  const [state, setState] = useState<PanelState>({ kind: 'idle' });

  const submit = useCallback(async () => {
    setState({ kind: 'pending' });
    const body: CreateProjectRequest = {
      name,
      code: null,
      description: null,
      location_text: null,
      status: DEFAULT_STATUS,
      start_date: null,
      end_date: null,
    };
    try {
      const res = await fetch('/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const envelope = (await res.json()) as ApiResponse<Project>;
      if (envelope.ok) {
        setState({ kind: 'success', project: envelope.data });
      } else {
        setState({
          kind: 'error',
          code: envelope.error.code,
          message: envelope.error.message,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'network error';
      setState({ kind: 'error', code: 'network/unreachable', message });
    }
  }, [name]);

  return (
    <section aria-label="Phase 3 project creation">
      <h2>Phase 3 Verification</h2>
      <label>
        Project name&nbsp;
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </label>
      <button type="button" onClick={() => void submit()}>
        Create project
      </button>
      <output>{renderResult(state)}</output>
    </section>
  );
}

function renderResult(state: PanelState): string {
  switch (state.kind) {
    case 'idle':
      return 'waiting for input';
    case 'pending':
      return 'submitting…';
    case 'success':
      return `created ${state.project.id} (revision ${String(
        state.project.revision,
      )})`;
    case 'error':
      return `error ${state.code}: ${state.message}`;
  }
}
