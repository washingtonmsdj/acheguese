/**
 * Legacy compatibility entrypoint.
 *
 * Keep this file to satisfy stale HMR/module graphs that still resolve
 * `/src/core/profiles/contexts/multiProfileContext.ts` on Windows.
 * Canonical runtime module is `multi-profile-runtime-context.tsx`.
 */

export {
  MultiProfileProvider,
  ModuleContextSync,
  useMultiProfileContext,
} from "./multi-profile-runtime-context";

export { MultiProfileContext } from "./multiProfileContext.shared";
export type { MultiProfileContextValue } from "./multiProfileContext.shared";
