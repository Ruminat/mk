/**
 * @category Random
 */
export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * @category Random
 */
export function randomFrom<T>(array: T[]): T {
  // Index is always in range for a non-empty array; the `!` keeps the `T` return
  // type under `noUncheckedIndexedAccess` (which strict consumers enable).
  return array[getRandomInt(0, array.length - 1)]!;
}
