import type {
  DailyReportId,
  HealthResponse,
  MetaResponse,
  ProjectId,
} from '@field-book/contracts';
import { cryptoIdGenerator, systemClock, type Env } from './env';
import { CORS_HEADERS, fail, ok } from './lib/http';
import {
  handleCreateProject,
  handleDeleteProjectCascade,
  handleListProjects,
  handleUpdateProject,
} from './routes/projects';
import {
  handleCreateDailyReport,
  handleDeleteDailyReportCascade,
  handleListReportsForProject,
  handleUpdateDailyReport,
} from './routes/daily-reports';
import {
  handleCreateNote,
  handleDeleteNote,
  handleListNotesForReport,
  handleUpdateNote,
} from './routes/notes';

const PHASE = 3;
const SERVICE_NAME = 'field-book-api';
const SERVICE_VERSION = '0.0.0';
const BUILD_ID = 'phase-3-dev';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const ids = cryptoIdGenerator;
    const clock = systemClock;
    const url = new URL(request.url);
    const method = request.method;

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (method === 'GET' && url.pathname === '/health') {
      const body: HealthResponse = { status: 'ok', phase: PHASE };
      return ok(body);
    }

    if (method === 'GET' && url.pathname === '/meta') {
      const body: MetaResponse = {
        name: SERVICE_NAME,
        version: SERVICE_VERSION,
        build: BUILD_ID,
        phase: PHASE,
        timestamp: clock.nowIso(),
      };
      return ok(body);
    }

    if (method === 'GET' && url.pathname === '/projects') {
      return handleListProjects(env, ids, clock);
    }
    if (method === 'POST' && url.pathname === '/projects') {
      return handleCreateProject(request, env, ids, clock);
    }
    if (method === 'PUT' && url.pathname === '/projects') {
      return handleUpdateProject(request, env, ids, clock);
    }
    if (method === 'DELETE' && url.pathname === '/projects') {
      return handleDeleteProjectCascade(request, env, ids, clock);
    }

    const reportsForProject = url.pathname.match(
      /^\/projects\/([^/]+)\/daily-reports$/,
    );
    if (method === 'GET' && reportsForProject) {
      const rawId = reportsForProject[1];
      if (rawId === undefined || rawId.length === 0) {
        return fail(400, 'validation/invalid_payload', 'project id required');
      }
      return handleListReportsForProject(
        rawId as ProjectId,
        env,
        ids,
        clock,
      );
    }

    if (method === 'POST' && url.pathname === '/daily-reports') {
      return handleCreateDailyReport(request, env, ids, clock);
    }
    if (method === 'PUT' && url.pathname === '/daily-reports') {
      return handleUpdateDailyReport(request, env, ids, clock);
    }
    if (method === 'DELETE' && url.pathname === '/daily-reports') {
      return handleDeleteDailyReportCascade(request, env, ids, clock);
    }

    const notesForReport = url.pathname.match(
      /^\/daily-reports\/([^/]+)\/notes$/,
    );
    if (method === 'GET' && notesForReport) {
      const rawId = notesForReport[1];
      if (rawId === undefined || rawId.length === 0) {
        return fail(
          400,
          'validation/invalid_payload',
          'daily_report id required',
        );
      }
      return handleListNotesForReport(
        rawId as DailyReportId,
        env,
        ids,
        clock,
      );
    }

    if (method === 'POST' && url.pathname === '/notes') {
      return handleCreateNote(request, env, ids, clock);
    }
    if (method === 'PUT' && url.pathname === '/notes') {
      return handleUpdateNote(request, env, ids, clock);
    }
    if (method === 'DELETE' && url.pathname === '/notes') {
      return handleDeleteNote(request, env, ids, clock);
    }

    return fail(404, 'http/not_found', `no handler for ${method} ${url.pathname}`);
  },
} satisfies ExportedHandler<Env>;
