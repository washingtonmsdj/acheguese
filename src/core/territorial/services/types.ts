/**
 * Territorial Types - SSOT v2.0
 * 
 * Tipos compartilhados para gestão territorial
 */

/**
 * Flags de visibilidade de território
 */
export type VisibilityFlag = 'is_selector_active' | 'is_landing_enabled' | 'is_navigable';

/**
 * Nó da árvore territorial
 */
export interface TerritoryNode {
  id: string;
  name: string;
  slug: string;
  type: 'country' | 'state' | 'city' | 'district' | 'group';
  parent_id: string | null;
  geographic_path?: string;
  status: string;
  is_selector_active: boolean;
  is_landing_enabled: boolean;
  is_navigable: boolean;
  children?: TerritoryNode[];
  member_count?: number;
  anchor_city_name?: string;
  member_ids?: string[];
  metadata?: Record<string, any>;
}

/**
 * Dados da árvore territorial completa
 */
export interface TerritoryTreeData {
  locations: TerritoryNode[];
  groups: TerritoryNode[];
  groupMembers: Map<string, string[]>;
}
