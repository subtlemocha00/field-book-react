import { SELF, env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ApiResponse,
  HealthResponse,
  MetaResponse,
  Project,
} from '@field-book/contracts';
import {
  ValidationErrorCode,
} from '@field-book/contracts';
import { resetDb } from './helpers';

async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  return (await res.json()) as ApiResponse<T>;
}

describe('routes', () => {
  beforeEach(async () => {
    await resetDb(env.DB);
  });

  it('GET /health returns phase 4', async () => {
    const res = await SELF.fetch('http://localhost/health');
    expect(res.status).toBe(200);
    const body = await parseJson<HealthResponse>(res);
    expect(body.ok).toBe(true);
    if (body.ok) {
      expect(body.data.status).toBe('ok');
      expect(body.data.phase).toBe(4);
    }
  });

  it('GET /meta returns service metadata', async () => {
    const res = await SELF.fetch('http://localhost/meta');
    expect(res.status).toBe(200);
    const body = await parseJson<MetaResponse>(res);
    expect(body.ok).toBe(true);
    if (body.ok) {
      expect(body.data.phase).toBe(4);
      expect(body.data.name).toBe('field-book-api');
    }
  });

  it('POST /projects rejects invalid payload BEFORE persistence', async () => {
    const res = await SELF.fetch('http://localhost/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '',
        code: null,
        description: null,
        location_text: null,
        status: 'active',
        start_date: null,
        end_date: null,
      }),
    });
    expect(res.status).toBe(422);
    const body = await parseJson<Project>(res);
    expect(body.ok).toBe(false);
    if (!body.ok) {
      expect(body.error.code).toBe(ValidationErrorCode.ProjectInvalid);
    }
    const count = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM projects',
    ).first<{ c: number }>();
    expect(count?.c).toBe(0);
  });

  it('POST /projects returns created entity with revision 1', async () => {
    const res = await SELF.fetch('http://localhost/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Via Route',
        code: null,
        description: null,
        location_text: null,
        status: 'active',
        start_date: null,
        end_date: null,
      }),
    });
    expect(res.status).toBe(201);
    const body = await parseJson<Project>(res);
    expect(body.ok).toBe(true);
    if (body.ok) {
      expect(body.data.revision).toBe(1);
      expect(body.data.name).toBe('Via Route');
    }
  });

  it('POST /daily-reports rejects malformed date via domain validation', async () => {
    const projectRes = await SELF.fetch('http://localhost/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Proj',
        code: null,
        description: null,
        location_text: null,
        status: 'active',
        start_date: null,
        end_date: null,
      }),
    });
    const projectBody = await parseJson<Project>(projectRes);
    expect(projectBody.ok).toBe(true);
    if (!projectBody.ok) return;

    const res = await SELF.fetch('http://localhost/daily-reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        project_id: projectBody.data.id,
        report_date: '24-04-2026',
        weather_summary: null,
        general_summary: null,
        created_by_user_id: 'u1',
      }),
    });
    expect(res.status).toBe(422);
    const body = await parseJson<unknown>(res);
    expect(body.ok).toBe(false);
    if (!body.ok) {
      expect(body.error.code).toBe(ValidationErrorCode.DailyReportInvalid);
    }
    const count = await env.DB.prepare(
      'SELECT COUNT(*) AS c FROM daily_reports',
    ).first<{ c: number }>();
    expect(count?.c).toBe(0);
  });

  it('unknown route returns 404 envelope', async () => {
    const res = await SELF.fetch('http://localhost/does-not-exist');
    expect(res.status).toBe(404);
  });
});
