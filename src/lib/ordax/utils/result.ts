/**
 * Result Type for Standardized Error Handling
 * Replaces inconsistent error patterns (throw, return null, return { error })
 */

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

export const Ok = <T>(data: T): Result<T, never> => ({
  success: true,
  data,
});

export const Err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

/**
 * Unwrap a Result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw (result as { error: E }).error;
}

/**
 * Unwrap a Result, returning a default value if it's an error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Map a Result's success value
 */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return Ok(fn(result.data)) as Result<U, E>;
  }
  return result as unknown as Result<U, E>;
}

/**
 * Chain Result operations (flatMap)
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result as unknown as Result<U, E>;
}

/**
 * Convert a throwing function to a Result
 */
export function tryCatch<T>(fn: () => T): Result<T, Error> {
  try {
    return Ok(fn());
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Convert an async throwing function to a Result
 */
export async function tryCatchAsync<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return Ok(data);
  } catch (error) {
    return Err(error instanceof Error ? error : new Error(String(error)));
  }
}
