import type { HealthResponse, MetaResponse } from '@field-book/contracts';

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

const PHASE = 2;
const SERVICE_NAME = 'field-book-api';
const SERVICE_VERSION = '0.0.0';
const BUILD_ID = 'phase-2-dev';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      const body: HealthResponse = { status: 'ok', phase: PHASE };
      return jsonResponse(body);
    }

    if (request.method === 'GET' && url.pathname === '/meta') {
      const body: MetaResponse = {
        name: SERVICE_NAME,
        version: SERVICE_VERSION,
        build: BUILD_ID,
        phase: PHASE,
        timestamp: new Date().toISOString(),
      };
      return jsonResponse(body);
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  },
} satisfies ExportedHandler;
