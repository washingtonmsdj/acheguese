import { VERTICAL_KEYS, type VerticalKey } from "@/core/verticals/config";

import { isProductModuleEnabled } from "./lifecycleRegistry";

export function getActiveBusinessVerticalKeys(): VerticalKey[] {
  return VERTICAL_KEYS.filter((vertical) => isProductModuleEnabled(vertical));
}
