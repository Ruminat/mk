/**
 * Returns true if the value is not empty.
 * @example
 * notEmpty(42) === true
 * notEmpty(0) === true
 * notEmpty(undefined) === false
 * notEmpty(null) === false
 * notEmpty(NaN) === false
 */
export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined && !Number.isNaN(value);
}

/**
 * Returns true if the value is empty.
 * @example
 * isEmpty(42) === false
 * isEmpty(0) === false
 * isEmpty(undefined) === true
 * isEmpty(null) === true
 * isEmpty(NaN) === true
 */
export function isEmpty<TValue>(value: TValue | null | undefined): value is undefined | null {
  return !notEmpty(value);
}
