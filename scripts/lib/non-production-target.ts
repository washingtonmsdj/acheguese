import {
  assertAuthorizedNonProductionTarget as assertAuthorizedNonProductionTargetImpl,
  NON_PRODUCTION_REMOTE_CONFIRMATION as confirmation,
} from "./non-production-target.mjs";

export const NON_PRODUCTION_REMOTE_CONFIRMATION: string = confirmation;

export interface AuthorizedNonProductionTarget {
  projectRef: string;
  target: "development" | "staging";
  url: string;
}

export function assertAuthorizedNonProductionTarget(input: {
  supabaseUrl?: string;
  env?: NodeJS.ProcessEnv;
}): AuthorizedNonProductionTarget {
  return assertAuthorizedNonProductionTargetImpl(input);
}
