// Functional Spec 7.4: acceptable value range is -10000 to +10000 inclusive.
export const SURVEY_VALUE_MIN = -10000;
export const SURVEY_VALUE_MAX = 10000;

export function isValidSurveyNumber(
  value: number | null | undefined,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= SURVEY_VALUE_MIN &&
    value <= SURVEY_VALUE_MAX
  );
}

export interface ShotSightValues {
  readonly backsight: number | null;
  readonly intermediate_sight: number | null;
  readonly foresight: number | null;
}

/**
 * Domain Rules 7.5: a single shot must contain at most one of backsight,
 * intermediate_sight, or foresight. Null values do not count as populated.
 */
export function hasAtMostOneSightValue(inputs: ShotSightValues): boolean {
  let populated = 0;
  if (inputs.backsight !== null) populated++;
  if (inputs.intermediate_sight !== null) populated++;
  if (inputs.foresight !== null) populated++;
  return populated <= 1;
}
