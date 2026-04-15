import type { Permission } from "./Permission";

/**
 * Role interface - groups permissions together
 * Part of the canonical permissions system used across all modules
 */
export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}
