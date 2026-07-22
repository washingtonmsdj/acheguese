/**
 * TerritorySelectorPage (canonical alias)
 *
 * Etapa de padronização (Sprint TERRITORY.2): re-export do AchegueSeHomePage
 * como TerritorySelectorPage. Esta página NÃO é uma Home — é responsável por
 * detectar localização, escolher cidade e escolher território.
 *
 * Mantido apenas como alias para permitir migração incremental dos imports.
 * Ver NAVIGATION-MAPPING.md.
 */
export { default } from "./AchegueSeHomePage";
