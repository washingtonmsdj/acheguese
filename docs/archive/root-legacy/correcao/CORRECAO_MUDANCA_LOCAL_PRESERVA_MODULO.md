# Correção: Mudança de Local Preserva Módulo Atual

## Problema Identificado

Quando o usuário estava em uma página de módulo específico (ex: `/classificados/ba/salvador`) e mudava de local usando o `TerritorySelectorV2`, o sistema navegava para o novo local mas perdia o contexto do módulo, redirecionando para a página inicial do território (ex: `/ba/feira-de-santana` ao invés de `/classificados/ba/feira-de-santana`).

## Causa Raiz

O método `handleSelect` no `TerritorySelectorV2` navegava diretamente para o path territorial sem verificar se o usuário estava em um módulo específico.

```typescript
// ❌ ANTES - Perdia o módulo
const handleSelect = useCallback((path: string) => {
  navigate(path); // Ex: navega para /ba/feira-de-santana
  setOpen(false);
  // ...
}, [navigate]);
```

## Solução Implementada

### 1. Detecção do Módulo Atual

Adicionado `useLocation` para detectar o módulo atual na URL:

```typescript
import { useNavigate, useLocation } from 'react-router-dom';
import { isReservedSlug } from '@/core/routing/reservedSlugs';

const location = useLocation();

// Detectar módulo atual
const currentModule = useMemo(() => {
  const pathParts = location.pathname.split('/').filter(Boolean);
  // Se o primeiro segmento é um módulo reservado, preservar
  if (pathParts.length > 0 && isReservedSlug(pathParts[0])) {
    return pathParts[0]; // Ex: "classificados", "empresas", "servicos"
  }
  return null;
}, [location.pathname]);
```

### 2. Preservação do Módulo na Navegação

Modificado `handleSelect` para preservar o módulo:

```typescript
// ✅ DEPOIS - Preserva o módulo
const handleSelect = useCallback((path: string) => {
  let finalPath = path;
  if (currentModule) {
    // Se estamos em /classificados/ba/salvador
    // e mudamos para /ba/feira-de-santana
    // navega para /classificados/ba/feira-de-santana
    finalPath = `/${currentModule}${path}`;
  }
  
  navigate(finalPath);
  setOpen(false);
  setSearchQuery('');
  setNav({ level: 'home', selectedRegion: null, selectedState: null, selectedCityId: null });
}, [navigate, currentModule]);
```

## Módulos Suportados

A solução funciona para todos os módulos reservados definidos em `src/core/routing/reservedSlugs.ts`:

- `classificados` - Classificados
- `empresas` - Empresas
- `servicos` - Serviços
- `eventos` - Eventos
- `comunidade` - Comunidade
- `mobilidade` - Mobilidade
- E outros...

## Comportamento

### Antes da Correção
1. Usuário está em `/classificados/ba/salvador`
2. Abre o seletor de território
3. Seleciona "Feira de Santana"
4. ❌ Sistema navega para `/ba/feira-de-santana` (página inicial)

### Depois da Correção
1. Usuário está em `/classificados/ba/salvador`
2. Abre o seletor de território
3. Seleciona "Feira de Santana"
4. ✅ Sistema navega para `/classificados/ba/feira-de-santana` (mantém no módulo)

### Páginas Não-Modulares
1. Usuário está em `/ba/salvador` (página inicial territorial)
2. Abre o seletor de território
3. Seleciona "Feira de Santana"
4. ✅ Sistema navega para `/ba/feira-de-santana` (comportamento normal)

## Arquivos Modificados

- `src/core/location/components/TerritorySelectorV2.tsx`
  - Adicionado import de `useLocation` e `isReservedSlug`
  - Adicionado `currentModule` useMemo
  - Modificado `handleSelect` para preservar módulo

## Testes Recomendados

1. ✅ Mudar local em `/classificados/ba/salvador` → deve ir para `/classificados/[novo-local]`
2. ✅ Mudar local em `/empresas/ba/salvador` → deve ir para `/empresas/[novo-local]`
3. ✅ Mudar local em `/servicos/ba/salvador` → deve ir para `/servicos/[novo-local]`
4. ✅ Mudar local em `/ba/salvador` (página inicial) → deve ir para `/[novo-local]`
5. ✅ Mudar local em `/perfil` (página global) → deve ir para `/[novo-local]`

## SSOT Compliance

✅ Solução segue princípios SSOT:
- Usa `isReservedSlug` do SSOT de routing
- Usa `useLocation` do React Router (fonte de verdade da URL)
- Não duplica lógica de detecção de módulos
- Não usa gambiarras ou hardcoded values
- Mantém comportamento consistente em toda aplicação
