/**
 * Retry Utilities with Exponential Backoff
 * Centralized retry logic to replace scattered implementations
 */

import { RETRY_CONSTANTS } from "../config";
const RETRY_CONFIG = RETRY_CONSTANTS;
import { Result, Ok, Err } from "./result";

export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<Result<T, Error>> {
  const {
    maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS,
    baseDelayMs = RETRY_CONFIG.BASE_DELAY_MS,
    onRetry,
  } = options;

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return Ok(result);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delayMs = calculateBackoffDelay(attempt, baseDelayMs);
        
        if (onRetry) {
          onRetry(attempt, lastError);
        }

        await sleep(delayMs);
      }
    }
  }

  return Err(lastError);
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * attempt;
}

/**
 * Sleep for a specified duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a synchronous function
 */
export function retrySyncWithBackoff<T>(
  fn: () => T,
  options: RetryOptions = {}
): Result<T, Error> {
  const {
    maxAttempts = RETRY_CONFIG.MAX_ATTEMPTS,
    onRetry,
  } = options;

  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = fn();
      return Ok(result);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts && onRetry) {
        onRetry(attempt, lastError);
      }
    }
  }

  return Err(lastError);
}
