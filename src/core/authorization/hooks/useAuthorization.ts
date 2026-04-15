/**
 * useAuthorization — checagens imperativas (event handlers, mutations)
 *
 * Uso: dentro de handlers, não em render direto.
 * Ownership resolvido internamente pelo AuthorizationEngine.
 *
 * const { canPerform } = useAuthorization();
 * const handlePost = async () => {
 *   if (await canPerform('createPost')) { ... }
 * };
 */

import { useCallback } from "react";
import { useSessionContext } from "@/core/session";
import { AuthorizationEngine } from "../services/AuthorizationEngine";
import type { Action, ActionContext, TargetEntity } from "../types";

export function useAuthorization() {
  const { activeProfile } = useSessionContext();

  const canPerform = useCallback(
    (
      action: Action,
      context: ActionContext = {},
      targetEntity?: TargetEntity,
    ): Promise<boolean> => {
      if (!activeProfile?.id) return Promise.resolve(false);
      return AuthorizationEngine.canProfilePerformAction(
        activeProfile.id,
        action,
        context,
        targetEntity,
      );
    },
    [activeProfile?.id],
  );

  return { canPerform };
}
