export interface Env {
  readonly DB: D1Database;
}

export interface Clock {
  nowIso(): string;
}

export interface IdGenerator {
  next(): string;
}

export const systemClock: Clock = {
  nowIso() {
    return new Date().toISOString();
  },
};

export const cryptoIdGenerator: IdGenerator = {
  next() {
    return crypto.randomUUID();
  },
};
