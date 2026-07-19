export const NON_PRODUCTION_REMOTE_CONFIRMATION: string;

export interface AuthorizedNonProductionTarget {
  projectRef: string;
  target: "development" | "staging";
  url: string;
}

export function assertAuthorizedNonProductionTarget(input?: {
  supabaseUrl?: string;
  env?: NodeJS.ProcessEnv;
}): AuthorizedNonProductionTarget;
