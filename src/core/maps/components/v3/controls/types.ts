/**
 * Tipos para o sistema de controles do mapa
 * 
 * Define a configuração e comportamento dos controles que podem ser
 * adicionados ao MapLibreAdapter de forma declarativa.
 */

export type ControlPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export type SearchType = 'geocoding' | 'entity-filter' | 'both';

export interface SearchControlConfig {
  type: SearchType;
  position?: ControlPosition;
  placeholder?: string;
  onSearch?: (query: string) => void;
  entityFilter?: <T>(entities: T[], query: string) => T[];
  debounceMs?: number;
}

export interface LocationControlConfig {
  enabled: boolean;
  position?: ControlPosition;
  showAccuracy?: boolean;
  showStatusIndicator?: boolean;
  autoFlyTo?: boolean;
  flyToZoom?: number;
}

export interface LayerControlConfig {
  enabled: boolean;
  position?: ControlPosition;
  layers: string[];
  layout?: 'horizontal' | 'vertical';
  /** Callback quando visibilidade de uma camada muda */
  onLayerToggle?: (key: string, visible: boolean) => void;
  /** Estado externo de visibilidade (controlado) */
  visibleLayers?: Record<string, boolean>;
}

export interface TerritoryControlConfig {
  enabled: boolean;
  position?: ControlPosition;
  showSelector?: boolean;
  showIndicator?: boolean;
  compact?: boolean;
}

export interface NeighborhoodsControlConfig {
  enabled: boolean;
  position?: ControlPosition;
}

export interface ControlStyleConfig {
  variant?: 'default' | 'blur' | 'solid';
  shadow?: boolean;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export interface MapControlsConfig {
  search?: SearchControlConfig;
  location?: LocationControlConfig;
  layers?: LayerControlConfig;
  territory?: TerritoryControlConfig;
  style?: ControlStyleConfig;
}

export interface UserLocationMarkerConfig {
  enabled: boolean;
  label?: string;
  autoAdd?: boolean;
}
