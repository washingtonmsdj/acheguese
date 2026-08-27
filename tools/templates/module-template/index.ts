/**
 * ============================================
 * MÓDULO [NOME] (SSOT)
 * ============================================
 * 
 * CONTRATO ARQUITETURAL:
 * 
 * 1. ÚNICO PONTO DE ACESSO
 *    - use[Nome] é o ÚNICO hook permitido
 *    - [nome]Service é o ÚNICO service permitido
 *    - Nenhum acesso direto ao Supabase é permitido
 * 
 * 2. PROIBIÇÕES ABSOLUTAS
 *    ❌ Acessar tabela '[tabela]' diretamente via supabase.from()
 *    ❌ Criar hooks alternativos de [nome]
 *    ❌ Criar services alternativos de [nome]
 *    ❌ Duplicar lógica de [nome]
 *    ❌ Criar channels Realtime fora do hook oficial
 * 
 * 3. REGRAS DE USO
 *    ✅ Sempre importar de '@/modules/[nome]'
 *    ✅ Usar [nome]Service para operações
 *    ✅ Usar helpers para casos específicos
 *    ✅ Usar tipos centralizados
 * 
 * 4. EVOLUÇÃO
 *    - Novos tipos: adicionar em [nome].types.ts
 *    - Novos helpers: adicionar em [nome].helpers.ts
 *    - Novos componentes: adicionar em components/
 *    - Nunca criar alternativas ao sistema existente
 * 
 * ============================================
 */

// ============================================
// HOOK OFICIAL (ÚNICO PERMITIDO)
// ============================================
export { use[Nome] } from './hooks/use[Nome]';

// ============================================
// SERVICE OFICIAL (ÚNICO PERMITIDO)
// ============================================
export { [nome]Service } from './services/[nome].service';

// ============================================
// TIPOS CENTRALIZADOS
// ============================================
export {
  [Nome]Type,
  type [Nome],
  type [Nome]Filters,
  type Create[Nome]Params,
  type Update[Nome]Params,
} from './types/[nome].types';

// ============================================
// HELPERS OFICIAIS (se existirem)
// ============================================
// export {
//   helper1,
//   helper2,
// } from './helpers/[nome].helpers';

// ============================================
// COMPONENTES PÚBLICOS (se existirem)
// ============================================
// export { ComponentName } from './components/ComponentName';

// ============================================
// NOTA IMPORTANTE
// ============================================
// 
// Este módulo é SSOT (Single Source of Truth).
// Qualquer tentativa de criar sistemas paralelos
// ou acessar diretamente o banco de dados deve
// ser bloqueada em code review.
// 
// Para adicionar funcionalidades:
// 1. Discutir com o time
// 2. Adicionar no módulo existente
// 3. Manter o contrato arquitetural
// 
// ============================================
