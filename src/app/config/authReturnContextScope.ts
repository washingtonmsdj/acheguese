import {
  getAuthReturnContext,
  type AuthReturnContext,
} from "@/core/auth/utils/authReturnContext";

import { isPlatformCapabilityEnabled } from "./lifecycleRegistry";
import { isLaunchSurfaceEnabled } from "./launchScope";

const GENERIC_RETURN_CONTEXT: AuthReturnContext = {
  label: "onde parou",
  kind: "generic",
};

export function getLaunchSafeAuthReturnContext(path: string): AuthReturnContext {
  const context = getAuthReturnContext(path);

  switch (context.kind) {
    case "business":
      return isLaunchSurfaceEnabled("business") ? context : GENERIC_RETURN_CONTEXT;
    case "conversation":
      return isLaunchSurfaceEnabled("messaging") ? context : GENERIC_RETURN_CONTEXT;
    case "account":
      return isPlatformCapabilityEnabled("account") ? context : GENERIC_RETURN_CONTEXT;
    case "community":
      return isLaunchSurfaceEnabled("community") ? context : GENERIC_RETURN_CONTEXT;
    case "generic":
    default:
      return context;
  }
}
