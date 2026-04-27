import type {
  ApiErrorEnvelope,
  ApiSuccessEnvelope,
} from '@field-book/contracts';

export const CORS_HEADERS: Record<string, string> = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

function headers(): Record<string, string> {
  return { 'content-type': 'application/json', ...CORS_HEADERS };
}

export function ok<T>(data: T, status = 200): Response {
  const body: ApiSuccessEnvelope<T> = { ok: true, data };
  return new Response(JSON.stringify(body), { status, headers: headers() });
}

export function fail(
  status: number,
  code: string,
  message: string,
): Response {
  const body: ApiErrorEnvelope = { ok: false, error: { code, message } };
  return new Response(JSON.stringify(body), { status, headers: headers() });
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  const raw = await request.text();
  if (raw.length === 0) {
    throw new SyntaxError('request body is empty');
  }
  return JSON.parse(raw) as T;
}
