import { describe, it, expect } from 'vitest';
import {
  SURVEY_VALUE_MAX,
  SURVEY_VALUE_MIN,
  hasAtMostOneSightValue,
  isValidSurveyNumber,
} from './validation';

describe('isValidSurveyNumber', () => {
  it('accepts finite numbers within range inclusive', () => {
    expect(isValidSurveyNumber(0)).toBe(true);
    expect(isValidSurveyNumber(SURVEY_VALUE_MIN)).toBe(true);
    expect(isValidSurveyNumber(SURVEY_VALUE_MAX)).toBe(true);
    expect(isValidSurveyNumber(123.456)).toBe(true);
  });

  it('rejects out-of-range numbers', () => {
    expect(isValidSurveyNumber(SURVEY_VALUE_MIN - 1)).toBe(false);
    expect(isValidSurveyNumber(SURVEY_VALUE_MAX + 1)).toBe(false);
  });

  it('rejects null, undefined, NaN, and infinity', () => {
    expect(isValidSurveyNumber(null)).toBe(false);
    expect(isValidSurveyNumber(undefined)).toBe(false);
    expect(isValidSurveyNumber(Number.NaN)).toBe(false);
    expect(isValidSurveyNumber(Number.POSITIVE_INFINITY)).toBe(false);
    expect(isValidSurveyNumber(Number.NEGATIVE_INFINITY)).toBe(false);
  });
});

describe('hasAtMostOneSightValue', () => {
  it('accepts empty shot', () => {
    expect(
      hasAtMostOneSightValue({
        backsight: null,
        intermediate_sight: null,
        foresight: null,
      }),
    ).toBe(true);
  });

  it('accepts a single populated sight', () => {
    expect(
      hasAtMostOneSightValue({
        backsight: 1.0,
        intermediate_sight: null,
        foresight: null,
      }),
    ).toBe(true);
    expect(
      hasAtMostOneSightValue({
        backsight: null,
        intermediate_sight: 2.0,
        foresight: null,
      }),
    ).toBe(true);
    expect(
      hasAtMostOneSightValue({
        backsight: null,
        intermediate_sight: null,
        foresight: 3.0,
      }),
    ).toBe(true);
  });

  it('rejects multiple populated sights per Domain Rules 7.5', () => {
    expect(
      hasAtMostOneSightValue({
        backsight: 1,
        intermediate_sight: 2,
        foresight: null,
      }),
    ).toBe(false);
    expect(
      hasAtMostOneSightValue({
        backsight: 1,
        intermediate_sight: null,
        foresight: 3,
      }),
    ).toBe(false);
    expect(
      hasAtMostOneSightValue({
        backsight: 1,
        intermediate_sight: 2,
        foresight: 3,
      }),
    ).toBe(false);
  });
});
