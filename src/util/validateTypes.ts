/**
 * Checks if the value is a boolean or a Boolean object.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean' || value instanceof Boolean;
}
