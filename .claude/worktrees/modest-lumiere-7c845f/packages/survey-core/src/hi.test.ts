import { describe, it, expect } from 'vitest';
import { computeElevation, computeHI } from './hi';

describe('computeHI', () => {
  it('returns reference_elevation + backsight when inputs are valid and no override', () => {
    const result = computeHI({
      reference_elevation: 100,
      backsight: 1.5,
      is_manual_hi_override: false,
      manual_hi_value: null,
    });
    expect(result).toBe(101.5);
  });

  it('returns null when reference_elevation is missing', () => {
    expect(
      computeHI({
        reference_elevation: null,
        backsight: 1.0,
        is_manual_hi_override: false,
        manual_hi_value: null,
      }),
    ).toBeNull();
  });

  it('returns null when backsight is missing', () => {
    expect(
      computeHI({
        reference_elevation: 100,
        backsight: null,
        is_manual_hi_override: false,
        manual_hi_value: null,
      }),
    ).toBeNull();
  });

  it('honors manual override when valid (Domain Rules 8.2)', () => {
    const result = computeHI({
      reference_elevation: 100,
      backsight: 1,
      is_manual_hi_override: true,
      manual_hi_value: 999,
    });
    expect(result).toBe(999);
  });

  it('returns null when manual override is enabled but value is invalid', () => {
    expect(
      computeHI({
        reference_elevation: 100,
        backsight: 1,
        is_manual_hi_override: true,
        manual_hi_value: null,
      }),
    ).toBeNull();
  });

  it('is deterministic for identical inputs', () => {
    const input = {
      reference_elevation: 100,
      backsight: 1.5,
      is_manual_hi_override: false,
      manual_hi_value: null,
    };
    expect(computeHI(input)).toBe(computeHI(input));
  });
});

describe('computeElevation', () => {
  it('returns HI - intermediate_sight when intermediate is the only sight', () => {
    expect(
      computeElevation({
        hi: 101.5,
        intermediate_sight: 2.0,
        foresight: null,
        is_manual_elevation_override: false,
        manual_elevation_value: null,
      }),
    ).toBeCloseTo(99.5);
  });

  it('returns HI - foresight when foresight is the only sight', () => {
    expect(
      computeElevation({
        hi: 101.5,
        intermediate_sight: null,
        foresight: 2.5,
        is_manual_elevation_override: false,
        manual_elevation_value: null,
      }),
    ).toBeCloseTo(99.0);
  });

  it('returns null when HI is missing', () => {
    expect(
      computeElevation({
        hi: null,
        intermediate_sight: 2,
        foresight: null,
        is_manual_elevation_override: false,
        manual_elevation_value: null,
      }),
    ).toBeNull();
  });

  it('returns null when both IS and FS are populated (Domain Rules 7.5)', () => {
    expect(
      computeElevation({
        hi: 100,
        intermediate_sight: 1,
        foresight: 2,
        is_manual_elevation_override: false,
        manual_elevation_value: null,
      }),
    ).toBeNull();
  });

  it('returns null when no sight is populated', () => {
    expect(
      computeElevation({
        hi: 100,
        intermediate_sight: null,
        foresight: null,
        is_manual_elevation_override: false,
        manual_elevation_value: null,
      }),
    ).toBeNull();
  });

  it('honors manual override when valid (Domain Rules 8.2)', () => {
    expect(
      computeElevation({
        hi: 100,
        intermediate_sight: null,
        foresight: 1,
        is_manual_elevation_override: true,
        manual_elevation_value: 50,
      }),
    ).toBe(50);
  });

  it('returns null when manual override is enabled but value is invalid', () => {
    expect(
      computeElevation({
        hi: 100,
        intermediate_sight: null,
        foresight: 1,
        is_manual_elevation_override: true,
        manual_elevation_value: null,
      }),
    ).toBeNull();
  });

  it('is deterministic for identical inputs (Domain Rules 9.5)', () => {
    const input = {
      hi: 101.5,
      intermediate_sight: 2.0,
      foresight: null,
      is_manual_elevation_override: false,
      manual_elevation_value: null,
    };
    expect(computeElevation(input)).toBe(computeElevation(input));
  });
});
