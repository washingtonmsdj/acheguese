import {
  PLATFORM_CAPABILITY_REGISTRY,
  type PlatformCapabilityKey,
} from "./platformCapabilityRegistry";
import {
  PRODUCT_MODULE_REGISTRY,
  type ProductModuleKey,
} from "./productModuleRegistry";

type LifecycleNode =
  | `product:${ProductModuleKey}`
  | `capability:${PlatformCapabilityKey}`;

function productNode(module: ProductModuleKey): LifecycleNode {
  return `product:${module}`;
}

function capabilityNode(capability: PlatformCapabilityKey): LifecycleNode {
  return `capability:${capability}`;
}

function isProductEnabled(
  module: ProductModuleKey,
  visiting: ReadonlySet<LifecycleNode>,
): boolean {
  const node = productNode(module);
  if (visiting.has(node)) return false;

  const config = PRODUCT_MODULE_REGISTRY[module];
  if (config.status !== "active") return false;

  const next = new Set(visiting);
  next.add(node);

  if (
    !(config.dependsOnProductModules ?? []).every((dependency) =>
      isProductEnabled(dependency, next),
    )
  ) {
    return false;
  }

  return (config.dependsOnCapabilities ?? []).every((dependency) =>
    isCapabilityEnabled(dependency, next),
  );
}

function isCapabilityEnabled(
  capability: PlatformCapabilityKey,
  visiting: ReadonlySet<LifecycleNode>,
): boolean {
  const node = capabilityNode(capability);
  if (visiting.has(node)) return false;

  const config = PLATFORM_CAPABILITY_REGISTRY[capability];
  if (config.status !== "active") return false;

  const next = new Set(visiting);
  next.add(node);

  if (
    !(config.dependsOnCapabilities ?? []).every((dependency) =>
      isCapabilityEnabled(dependency, next),
    )
  ) {
    return false;
  }

  return (config.dependsOnProductModules ?? []).every((dependency) =>
    isProductEnabled(dependency, next),
  );
}

export function isProductModuleEnabled(module: ProductModuleKey): boolean {
  return isProductEnabled(module, new Set());
}

export function isPlatformCapabilityEnabled(
  capability: PlatformCapabilityKey,
): boolean {
  return isCapabilityEnabled(capability, new Set());
}

export function getActiveProductModules(): ProductModuleKey[] {
  return (Object.keys(PRODUCT_MODULE_REGISTRY) as ProductModuleKey[]).filter(
    isProductModuleEnabled,
  );
}

export function getActivePlatformCapabilities(): PlatformCapabilityKey[] {
  return (
    Object.keys(PLATFORM_CAPABILITY_REGISTRY) as PlatformCapabilityKey[]
  ).filter(isPlatformCapabilityEnabled);
}
