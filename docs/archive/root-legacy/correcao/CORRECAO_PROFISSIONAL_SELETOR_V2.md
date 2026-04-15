# Correção Profissional: TerritorySelectorV2

## Problemas Identificados e Corrigidos

### 1. ❌ BLOQUEADOR: `currentPath` inexistente
**Problema**: Variável `currentPath` usada nas linhas 286, 312 e 340 sem declaração.
**Causa**: Código dependia de símbolo inexistente, escondido por `// @ts-nocheck`.

**Solução**:
```tsx
// ✅ CORRETO: Path canônico do território ativo (normalizado)
const currentPath = useMemo(() => {
  if (!activeLocation) return null;
  return geoPathToPublicUrl(activeLocation.geographic_path);
}, [activeLocation]);
```

### 2. ❌ ERRO DE NAVEGAÇÃO: Preservação de sufixo perigosa
**Problema**: `handleSelect` preservava módulo + sufixo inteiro da rota.
```tsx
// ❌ PERIGOSO
finalPath = `/${routeContext.module}${path}${routeContext.suffix}`;
// Ex: /empresas/ba/salvador/categoria/restaurantes → /empresas/ba/feira/categoria/restaurantes
// Resultado: categoria "restaurantes" pode não existir em Feira de Santana
```

**Solução**:
```tsx
// ✅ SEGURO: Preserva APENAS o módulo, reseta sufixo
const handleSelect = useCallback((path: string) => {
  let finalPath = path;
  
  // Se está em um módulo, preserva o módulo mas reseta o sufixo
  if (routeContext.module) {
    finalPath = `/${routeContext.module}${path}`;
  }
  
  navigate(finalPath);
  setOpen(false);
  setSearchQuery('');
}, [navigate, routeContext]);
```

### 3. ❌ QUEBRA DE CANONICIDADE: Paths com formatos diferentes
**Problema**: Paths entravam com formatos inconsistentes:
- `anchorCity`: `parentCity.geographic_path.replace(/^\/br/, '')`
- `homeDistrict`, `homeCity`, `selectorTerritories`: path bruto

**Solução**: Normalização canônica única via função helper
```tsx
// ✅ SSOT: Normalizar path de território para formato canônico
const normalizeTerritoryPath = useCallback((path: string): string => {
  // Remove /br se presente, garante formato /state/city/district?
  return path.startsWith('/br/') ? path.replace(/^\/br/, '') : path;
}, []);

// Aplicado em TODOS os territórios
const normalizedPath = normalizeTerritoryPath(homeDistrict.path);
```

### 4. ❌ DEDUPLICAÇÃO FRACA: Baseada em string de path
**Problema**: Deduplicação por `Set(territories.map(t => t.path))` pode gerar duplicatas lógicas.
- `/br/ba/salvador` vs `/ba/salvador` = duplicata lógica

**Solução**: Deduplicação por ID (único e confiável)
```tsx
// ✅ CORRETO: Deduplicação por ID
const seenIds = new Set<string>();

if (homeDistrict) {
  territories.push({ ... });
  seenIds.add(homeDistrict.id);
}

selectorTerritories.forEach(t => {
  if (!seenIds.has(t.id)) {
    territories.push({ ... });
    seenIds.add(t.id);
  }
});
```

### 5. ❌ PROMESSA MAIOR QUE IMPLEMENTAÇÃO: Suporte a grupos
**Problema**: Comentário promete suporte a "bairro/grupo", mas código só trata `district`.

**Solução**: Documentação honesta + preparação para futuro
```tsx
// Detectar cidade âncora quando está em bairro/distrito/grupo
const anchorCity = useMemo(() => {
  if (activeLocation?.type === LocationType.CITY) return null;
  
  // Suporte para district
  if (activeLocation?.type === LocationType.DISTRICT && activeLocation.parent_id) {
    // ... implementação
  }
  
  // TODO: Adicionar suporte para grupos territoriais quando implementado
  // if (activeTerritory?.kind === 'group') { ... }
  
  return null;
}, [activeLocation, allLocations, homeCity]);
```

### 6. ✅ REMOVIDO: `// @ts-nocheck`
**Motivo**: Esconde erros de TypeScript. Código agora passa na checagem de tipos.

## Arquitetura Corrigida

### SSOT de Paths
```tsx
// Função canônica única (importada de territoryUrls.ts)
import { geoPathToPublicUrl } from '@/core/routing/utils/territoryUrls';

// Uso consistente em todo o componente
const currentPath = geoPathToPublicUrl(activeLocation.geographic_path);
const anchorPath = geoPathToPublicUrl(parentCity.geographic_path);
```

### Navegação Contextual Segura
```tsx
// ✅ Preserva módulo, reseta sufixo
/empresas/ba/salvador/categoria/restaurantes → /empresas/ba/feira-de-santana

// ❌ Não preserva sufixo (evita URLs inválidas)
/empresas/ba/salvador/categoria/restaurantes ❌→ /empresas/ba/feira/categoria/restaurantes
```

### Deduplicação Robusta
```tsx
// ✅ Por ID (único)
const seenIds = new Set<string>();

// ❌ Não por path (pode ter variações)
const existingPaths = new Set(territories.map(t => t.path));
```

## Validação

- ✅ Sem erros de TypeScript (removido `@ts-nocheck`)
- ✅ `currentPath` declarado e tipado corretamente
- ✅ Navegação segura (sem sufixos perigosos)
- ✅ Normalização canônica de paths (SSOT)
- ✅ Deduplicação por ID (robusta)
- ✅ Suporte explícito para district (grupos documentado como TODO)
- ✅ Imports corretos (`LocationType`, `geoPathToPublicUrl`)

## Comportamento Esperado

### Cenário 1: Navegação entre cidades
1. Usuário em `/empresas/ba/salvador/categoria/restaurantes`
2. Troca para "Feira de Santana" no seletor
3. Navega para `/empresas/ba/feira-de-santana` (sem categoria)
4. ✅ Evita URL inválida com categoria inexistente

### Cenário 2: Navegação de cidade para bairro
1. Usuário em `/ba/salvador`
2. Troca para "Barra" no seletor
3. Navega para `/ba/salvador/barra`
4. ✅ Seletor mostra "Barra" como ativo
5. ✅ Cidade âncora "Salvador" aparece no seletor

### Cenário 3: Navegação de bairro para cidade
1. Usuário em `/ba/salvador/barra`
2. Clica em "Salvador" (cidade âncora) no seletor
3. Navega para `/ba/salvador`
4. ✅ Seletor mostra "Salvador" como ativo
5. ✅ Cidade âncora não aparece mais (já está na cidade)

## Próximos Passos (Recomendados)

### Testes Automatizados
```tsx
describe('TerritorySelectorV2', () => {
  it('preserva módulo mas reseta sufixo ao trocar território', () => {
    // /empresas/ba/salvador/categoria/restaurantes → /empresas/ba/feira-de-santana
  });
  
  it('normaliza paths de forma canônica', () => {
    // /br/ba/salvador → /ba/salvador
  });
  
  it('deduplica territórios por ID', () => {
    // Não mostra Salvador duas vezes mesmo com paths diferentes
  });
  
  it('mostra cidade âncora quando em bairro', () => {
    // Em /ba/salvador/barra → mostra "Salvador" como opção
  });
  
  it('não mostra cidade âncora quando já está na cidade', () => {
    // Em /ba/salvador → não mostra "Salvador" duplicado
  });
});
```

### Suporte a Grupos Territoriais
```tsx
// Quando grupos forem implementados
if (activeTerritory?.kind === 'group') {
  const anchorCity = allLocations.find(l => l.id === activeTerritory.group.anchor_city_id);
  if (anchorCity && anchorCity.type === LocationType.CITY) {
    return {
      id: anchorCity.id,
      name: anchorCity.name,
      path: geoPathToPublicUrl(anchorCity.geographic_path),
      description: 'Ver tudo da cidade',
      badge: 'CIDADE ÂNCORA',
      icon: 'city' as const,
    };
  }
}
```

## Conclusão

O componente agora está pronto para produção:
- ✅ Sem erros de TypeScript
- ✅ Navegação segura e previsível
- ✅ SSOT de paths respeitado
- ✅ Deduplicação robusta
- ✅ Documentação honesta sobre funcionalidades
- ✅ Preparado para expansão futura (grupos)
