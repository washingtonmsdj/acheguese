const REMOTE_VALIDATION_PATTERNS = [
  /cannot find project ref/i,
  /have you run supabase link/i,
  /not linked/i,
  /access token/i,
  /not logged in/i,
  /authentication required/i,
  /failed to connect/i,
  /timed out/i,
  /\b(?:ECONN|ENOTFOUND|ETIMEDOUT)\b/i,
];

export function classifySupabaseCliFailure(output) {
  return REMOTE_VALIDATION_PATTERNS.some((pattern) => pattern.test(output))
    ? 'REMOTE_VALIDATION_REQUIRED'
    : 'LOCAL_FAILURE';
}
