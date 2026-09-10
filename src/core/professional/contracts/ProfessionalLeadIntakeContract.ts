// Browser-side contract for the Professional public lead intake surface.
// The Edge runtime cannot import application source; G39 security tests ratchet
// this Turnstile action against the server-side broker constant.
export const PROFESSIONAL_LEAD_INTAKE_CLIENT_CONTRACT = {
  minimumFillMs: 3_000,
  turnstileAction: "professional-lead",
  turnstileRequired: true,
} as const;
