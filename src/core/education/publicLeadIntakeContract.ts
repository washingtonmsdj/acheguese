// Browser-side contract for public Education lead intake.
// The Edge runtime cannot import application source, so security tests ratchet
// the Turnstile action and anti-abuse requirements against the broker.
export const EDUCATION_PUBLIC_LEAD_INTAKE_CLIENT_CONTRACT = {
  minimumFillMs: 3_000,
  turnstileAction: "education-lead",
  turnstileRequired: true,
} as const;
