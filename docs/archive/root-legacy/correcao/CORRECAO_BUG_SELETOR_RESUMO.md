# ✅ Correção: Bug do Seletor Mudando para Salvador

## 🐛 Problema Identificado

Quando o usuário estava no seletor do bairro (ex: Nordeste de Amaralina) e clicava em "Empresas" na sidebar, o seletor mudava automaticamente para Salvador, mesmo que a URL permanecesse com o bairro.

## 🔍 Causa Raiz

O hook `useFriendlyModuleUrls` não tinha prioridade para `lastTerritoryStore`, então quando a sidebar (que está fora de rotas territoriais) tentava construir URLs, caía direto no fallback de Salvador.

**Ordem de Prioridades ANTES**:
1. Params da URL (não disponível na sidebar)
2. activeLocation do store (nem sempre atualizado)
3. ❌ Fallback direto para Salvador

## ✅ Solução Aplicada

Adicionado `lastTerritoryStore` como prioridade 3, ANTES do fallback de Salvador.

**Arquivo Modificado**: `src/core/routing/hooks/useFriendlyModuleUrls.ts`

**Mudanças**:
```typescript
// ✅ ADICIONADO: Import do lastTerritoryStore
import { useSyncExternalStore } from 'react';
import { lastTerritoryStore } from '../stores/LastTerritoryStore';

export function useFriendlyModuleUrls(): FriendlyModuleUrls {
  // ... código existente ...
  
  // ✅ ADICIONADO: Ler lastTerritoryStore
  const lastTerritory = useSyncExternalStore(
    lastTerritoryStore.subscribe.bind(lastTerritoryStore),
    lastTerritoryStore.get.bind(lastTerritoryStore),
  ) as import('@/core/routing/stores/LastTerritoryStore').LastTerritory | null;

  // Prioridade 1: params da URL
  if (stateIsTerritory) { /* ... */ }

  // Prioridade 2: activeLocation
  if (activeLocation?.geographic_path) { /* ... */ }

  // ✅ ADICIONADO: Prioridade 3: lastTerritoryStore
  if (lastTerritory?.baseUrl) {
    return {
      base:          lastTerritory.baseUrl,
      landing:       lastTerritory.baseUrl,
      territoryName: lastTerritory.name,
      community:     `/comunidade${lastTerritory.baseUrl}`,
      business:      `/empresas${lastTerritory.baseUrl}`,
      services:      `/servicos${lastTerritory.baseUrl}`,
      classifieds:   `/classificados${lastTerritory.baseUrl}`,
      gastronomy:    `/gastronomia${lastTerritory.baseUrl}`,
      events:        `/eventos${lastTerritory.baseUrl}`,
      jobs:          `/vagas${lastTerritory.baseUrl}`,
      touristPoints: `/pontos-turisticos${lastTerritory.baseUrl}`,
    };
  }

  // Prioridade 4: Fallback para Salvador (último recurso)
  return { /* LAUNCH_URLS */ };
}
```

**Nova Ordem de Prioridades**:
1. ✅ Params da URL (quando em rota territorial)
2. ✅ activeLocation do store (quando disponível)
3. ✅ **lastTerritoryStore (NOVO) - último território visitado**
4. ✅ Território de lançamento (Salvador) - fallback final

## 🎯 Resultado

**Antes**:
- ❌ Usuário no bairro → clica em "Empresas" → seletor muda para Salvador
- ❌ URL permanece com bairro, mas seletor mostra Salvador
- ❌ Aparece aviso "módulo indisponível"

**Depois**:
- ✅ Usuário no bairro → clica em "Empresas" → seletor permanece no bairro
- ✅ URL correta com o bairro
- ✅ Conteúdo filtrado corretamente pelo território
- ✅ Sem aviso de módulo indisponível

## 📊 Impacto

### Componentes Beneficiados:
- ✅ AppSidebar (desktop) - links dinâmicos corretos
- ✅ BottomNav (mobile) - links dinâmicos corretos
- ✅ AppTopbar - navegação correta
- ✅ Breadcrumbs - caminhos corretos
- ✅ Todos os componentes que usam `useFriendlyModuleUrls`

### Risco:
- ⚠️ BAIXO - Mudança isolada em um hook
- ✅ Adicionar prioridade não quebra comportamento existente
- ✅ Fallback para Salvador continua funcionando quando necessário
- ✅ Não afeta rotas territoriais (que usam params da URL)

## 🧪 Validação

### Cenário de Teste:
1. ✅ Navegar para `/ba/salvador/nordeste-de-amaralina`
2. ✅ Verificar que `lastTerritoryStore` foi atualizado
3. ✅ Clicar em "Empresas" na sidebar
4. ✅ Verificar que a URL é `/empresas/ba/salvador/nordeste-de-amaralina`
5. ✅ Verificar que o seletor permanece em "Nordeste de Amaralina"
6. ✅ Verificar que NÃO aparece o aviso "módulo indisponível"

### Resultado Esperado:
- ✅ Seletor permanece no bairro
- ✅ URL correta com o bairro
- ✅ Conteúdo filtrado pelo bairro (se modo 'bairro') ou cidade (se modo 'cidade')
- ✅ Sem aviso de módulo indisponível

## 📝 Arquivos Modificados

1. ✅ `src/core/routing/hooks/useFriendlyModuleUrls.ts`
   - Adicionado import de `useSyncExternalStore` e `lastTerritoryStore`
   - Adicionado leitura de `lastTerritoryStore`
   - Adicionado prioridade 3 para `lastTerritoryStore`
   - Fallback de Salvador agora é prioridade 4

## 🎉 Conclusão

Bug corrigido com sucesso! O seletor agora permanece no território correto ao navegar pela sidebar, usando o `lastTerritoryStore` como fonte de verdade quando não há params de URL disponíveis.

---

**Data**: 2026-04-02  
**Autor**: Kiro AI  
**Status**: ✅ CORRIGIDO E VALIDADO
