/**
 * TerritoryModeInitializer
 * 
 * Componente que inicializa o modo territorial automaticamente.
 * Deve ser renderizado uma vez no nível raiz da aplicação (App.tsx).
 * 
 * Responsabilidades:
 * - Define o modo territorial inicial ('bairro' | 'cidade' | null)
 * - Detecta mudanças de território e ajusta o modo automaticamente
 * - Força mudança para modo cidade quando usuário sai do bairro
 * 
 * Uso: Renderizar em App.tsx dentro de SessionProvider e MultiProfileProvider
 */

import { useTerritoryModeInitializer } from '../hooks/useTerritoryModeInitializer';

export function TerritoryModeInitializer() {
  useTerritoryModeInitializer();
  return null;
}
