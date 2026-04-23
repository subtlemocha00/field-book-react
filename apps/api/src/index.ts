import type { HealthResponse } from '@field-book/contracts';

const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      const body: HealthResponse = { status: 'ok' };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          ...CORS_HEADERS,
        },
      });
    }

    return new Response('Not Found', { status: 404, headers: CORS_HEADERS });
  },
} satisfies ExportedHandler;
