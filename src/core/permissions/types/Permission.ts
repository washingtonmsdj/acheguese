/**
 * Permission interface - defines what actions can be performed on resources
 * Part of the canonical permissions system used across all modules
 */
export interface Permission {
  id: string;
  resource: string; // 'post', 'business', 'ride'
  action: string; // 'create', 'read', 'update', 'delete'
  scope: "own" | "any";
}
