import { describe, it, expect } from 'vitest';
import { INITIAL_REVISION, isValidRevision, nextRevision } from './revision';

describe('nextRevision', () => {
  it('increments from the initial revision', () => {
    expect(nextRevision(INITIAL_REVISION)).toBe(INITIAL_REVISION + 1);
  });

  it('monotonically increments', () => {
    let r = INITIAL_REVISION;
    for (let i = 0; i < 5; i++) r = nextRevision(r);
    expect(r).toBe(INITIAL_REVISION + 5);
  });

  it('rejects non-integer or below-initial values', () => {
    expect(() => nextRevision(0)).toThrow(RangeError);
    expect(() => nextRevision(-1)).toThrow(RangeError);
    expect(() => nextRevision(1.5)).toThrow(RangeError);
  });
});

describe('isValidRevision', () => {
  it('accepts integers at or above the initial revision', () => {
    expect(isValidRevision(1)).toBe(true);
    expect(isValidRevision(42)).toBe(true);
  });

  it('rejects other values', () => {
    expect(isValidRevision(0)).toBe(false);
    expect(isValidRevision(-1)).toBe(false);
    expect(isValidRevision(1.1)).toBe(false);
    expect(isValidRevision('1')).toBe(false);
    expect(isValidRevision(null)).toBe(false);
  });
});
