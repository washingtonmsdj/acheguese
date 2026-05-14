/**
 * AI ↔ Comunidade — barril público.
 * Hooks que qualquer módulo de comunidade pode importar sem violar boundaries
 * (não acessam Supabase direto e não importam outros @/modules/*).
 */
export {
  useCommunityComposerAssist,
  type CommunityComposerSuggestion,
  type CommunityPostKind,
  type CommunitySeverity,
  type UseCommunityComposerAssist,
} from "./useCommunityComposerAssist";
