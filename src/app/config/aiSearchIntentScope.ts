import {
  AI_EXECUTABLE_INTENT_TYPES,
  type AIExecutableIntentType,
} from "@/core/ai/domain/types";
import {
  isPlatformCapabilityEnabled,
  isProductModuleEnabled,
} from "./lifecycleRegistry";
import type { ProductModuleKey } from "./productModuleRegistry";

const INTENT_PRODUCT_MODULE: Record<
  AIExecutableIntentType,
  ProductModuleKey
> = {
  business_search: "business",
  service_search: "services",
};

export function getActiveAISearchIntentTypes(): AIExecutableIntentType[] {
  if (!isPlatformCapabilityEnabled("search")) return [];

  return AI_EXECUTABLE_INTENT_TYPES.filter((intentType) =>
    isProductModuleEnabled(INTENT_PRODUCT_MODULE[intentType]),
  );
}
