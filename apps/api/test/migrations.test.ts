import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('migrations', () => {
  it('creates projects, daily_reports, and notes tables', async () => {
    const rows = await env.DB.prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name IN ('projects','daily_reports','notes')
       ORDER BY name`,
    ).all<{ name: string }>();
    const names = rows.results.map((r) => r.name);
    expect(names).toEqual(['daily_reports', 'notes', 'projects']);
  });

  it('creates expected indexes', async () => {
    const rows = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'index' ORDER BY name`,
    ).all<{ name: string }>();
    const names = rows.results.map((r) => r.name);
    expect(names).toContain('idx_projects_status');
    expect(names).toContain('idx_projects_deleted_at');
    expect(names).toContain('idx_daily_reports_project_id');
    expect(names).toContain('uq_daily_reports_project_date');
    expect(names).toContain('idx_notes_daily_report_id');
    expect(names).toContain('idx_notes_report_order');
  });

  it('projects table columns include revision and deleted_at', async () => {
    const rows = await env.DB.prepare(`PRAGMA table_info(projects)`).all<{
      name: string;
      notnull: number;
    }>();
    const names = rows.results.map((r) => r.name);
    expect(names).toContain('revision');
    expect(names).toContain('deleted_at');
    expect(names).toContain('created_at');
    expect(names).toContain('updated_at');
  });
});
