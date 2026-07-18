export interface TimeoutOptions {
  message: string;
  timeoutMs: number;
}

export async function withTimeout<T>(
  operation: Promise<T>,
  { message, timeoutMs }: TimeoutOptions,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
