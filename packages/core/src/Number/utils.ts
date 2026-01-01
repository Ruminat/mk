/**
 * @example
 * stringToNumberOrUndefined('42') → 42
 * stringToNumberOrUndefined('abc') → undefined
 */
export function stringToNumberOrUndefined(str: string): number | undefined {
  const trimmed = str.trim();
  if (!trimmed) return undefined;

  const asNumber = Number(trimmed);
  if (!Number.isFinite(asNumber)) return undefined;

  return asNumber;
}
