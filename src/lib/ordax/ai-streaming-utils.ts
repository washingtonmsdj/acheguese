/**
 * AI Streaming Utilities
 * Helper functions for retry, timeout, reconnect, etc
 */

import { RETRY, TIMEOUT, RECONNECT } from "./ai-streaming-constants";

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number): number {
  const delay = RETRY.INITIAL_DELAY_MS * Math.pow(RETRY.BACKOFF_MULTIPLIER, attempt);
  return Math.min(delay, RETRY.MAX_DELAY_MS);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return false; // User cancelled, don't retry
  }
  
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true; // Network error, retry
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("econnrefused") ||
      message.includes("enotfound")
    );
  }
  
  return false;
}

/**
 * Check if HTTP status is retryable
 */
export function isRetryableStatus(status: number): boolean {
  // Retry on server errors (5xx) and rate limiting (429)
  return status >= 500 || status === 429 || status === 408;
}

/**
 * Create timeout promise
 */
export function createTimeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message));
    }, ms);
  });
}

/**
 * Race promise with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    createTimeout(timeoutMs, timeoutMessage),
  ]);
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    onRetry?: (attempt: number, error: unknown) => void;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? RETRY.MAX_ATTEMPTS;
  const shouldRetry = options.shouldRetry ?? isRetryableError;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if not retryable or last attempt
      if (!shouldRetry(error) || attempt === maxAttempts - 1) {
        throw error;
      }
      
      // Calculate delay and notify
      const delay = calculateBackoffDelay(attempt);
      options.onRetry?.(attempt + 1, error);
      
      // Wait before retry
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Metrics tracker
 */
export class MetricsTracker {
  private startTime: number = 0;
  private endTime: number = 0;
  private bytesReceived: number = 0;
  private chunksReceived: number = 0;
  
  start(): void {
    this.startTime = performance.now();
    this.bytesReceived = 0;
    this.chunksReceived = 0;
  }
  
  trackChunk(chunk: string): void {
    this.chunksReceived++;
    this.bytesReceived += new Blob([chunk]).size;
  }
  
  end(): void {
    this.endTime = performance.now();
  }
  
  getMetrics() {
    const duration = this.endTime - this.startTime;
    return {
      durationMs: Math.round(duration),
      bytesReceived: this.bytesReceived,
      chunksReceived: this.chunksReceived,
      bytesPerSecond: duration > 0 ? Math.round((this.bytesReceived / duration) * 1000) : 0,
      chunksPerSecond: duration > 0 ? Math.round((this.chunksReceived / duration) * 1000) : 0,
    };
  }
  
  log(prefix: string = "[Metrics]"): void {
    const metrics = this.getMetrics();
    console.log(`${prefix}`, {
      duration: `${metrics.durationMs}ms`,
      bytes: `${metrics.bytesReceived} bytes`,
      chunks: metrics.chunksReceived,
      throughput: `${metrics.bytesPerSecond} bytes/s`,
    });
  }
}

/**
 * Request queue for serializing requests
 */
export class RequestQueue<T> {
  private queue: Array<() => Promise<T>> = [];
  private processing = false;
  private maxSize: number;
  
  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }
  
  async enqueue(fn: () => Promise<T>): Promise<T> {
    if (this.queue.length >= this.maxSize) {
      throw new Error(`Queue is full (max ${this.maxSize})`);
    }
    
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
          return result;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      
      this.processQueue();
    });
  }
  
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const fn = this.queue.shift();
      if (fn) {
        try {
          await fn();
        } catch (error) {
          // Error already handled in enqueue
        }
      }
    }
    
    this.processing = false;
  }
  
  clear(): void {
    this.queue = [];
  }
  
  size(): number {
    return this.queue.length;
  }
}

/**
 * Progress tracker
 */
export class ProgressTracker {
  private total: number = 0;
  private current: number = 0;
  private onProgress?: (progress: number) => void;
  
  constructor(onProgress?: (progress: number) => void) {
    this.onProgress = onProgress;
  }
  
  setTotal(total: number): void {
    this.total = Math.max(0, total);
    this.notifyProgress();
  }
  
  increment(amount: number = 1): void {
    this.current = Math.min(this.total, this.current + amount);
    this.notifyProgress();
  }
  
  reset(): void {
    this.current = 0;
    this.total = 0;
  }
  
  getProgress(): number {
    if (this.total === 0) return 0;
    return Math.min(100, Math.round((this.current / this.total) * 100));
  }
  
  private notifyProgress(): void {
    this.onProgress?.(this.getProgress());
  }
}
