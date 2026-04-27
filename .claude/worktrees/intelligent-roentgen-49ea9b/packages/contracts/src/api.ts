import type { UtcTimestamp } from './system';

export type Phase = 1 | 2 | 3 | 4 | 5;

export interface HealthResponse {
  readonly status: 'ok';
  readonly phase: Phase;
}

export interface MetaResponse {
  readonly name: string;
  readonly version: string;
  readonly build: string;
  readonly phase: Phase;
  readonly timestamp: UtcTimestamp;
}

export interface ApiErrorDetail {
  readonly code: string;
  readonly message: string;
}

export interface ApiSuccessEnvelope<T> {
  readonly ok: true;
  readonly data: T;
}

export interface ApiErrorEnvelope {
  readonly ok: false;
  readonly error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
