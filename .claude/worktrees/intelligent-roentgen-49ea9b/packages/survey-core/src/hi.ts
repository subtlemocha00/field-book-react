import { isValidSurveyNumber } from './validation';

export interface HICalcInput {
  readonly reference_elevation: number | null;
  readonly backsight: number | null;
  readonly is_manual_hi_override: boolean;
  readonly manual_hi_value: number | null;
}

export interface ElevationCalcInput {
  readonly hi: number | null;
  readonly intermediate_sight: number | null;
  readonly foresight: number | null;
  readonly is_manual_elevation_override: boolean;
  readonly manual_elevation_value: number | null;
}

/**
 * Domain Rules 7.3, 8.2, 9.4: height_of_instrument = reference_elevation +
 * backsight when no manual override is set and both inputs are valid. Manual
 * override returns the user-set value when valid, null otherwise. Missing or
 * invalid upstream inputs yield null (no silent fabrication).
 */
export function computeHI(input: HICalcInput): number | null {
  if (input.is_manual_hi_override) {
    return isValidSurveyNumber(input.manual_hi_value)
      ? input.manual_hi_value
      : null;
  }
  if (!isValidSurveyNumber(input.reference_elevation)) return null;
  if (!isValidSurveyNumber(input.backsight)) return null;
  return input.reference_elevation + input.backsight;
}

/**
 * Domain Rules 7.4, 7.5, 8.2, 9.4: elevation = HI - (intermediate_sight or
 * foresight) when no manual override is set. If both IS and FS are populated
 * the shot is invalid per 7.5 and the result is unresolved. Manual override
 * returns the user-set value when valid, null otherwise.
 */
export function computeElevation(input: ElevationCalcInput): number | null {
  if (input.is_manual_elevation_override) {
    return isValidSurveyNumber(input.manual_elevation_value)
      ? input.manual_elevation_value
      : null;
  }
  if (!isValidSurveyNumber(input.hi)) return null;
  const hasIS = isValidSurveyNumber(input.intermediate_sight);
  const hasFS = isValidSurveyNumber(input.foresight);
  if (hasIS && hasFS) return null;
  if (hasIS) return input.hi - (input.intermediate_sight as number);
  if (hasFS) return input.hi - (input.foresight as number);
  return null;
}
