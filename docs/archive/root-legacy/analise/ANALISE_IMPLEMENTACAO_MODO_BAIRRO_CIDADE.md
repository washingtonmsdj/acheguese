# Análise Minuciosa: Implementação do Modo Bairro/Cidade

## 📋 Requisitos Especificados

### Para Usuários Cadastrados:
1. ✅ Dois modos: "Meu Bairro" e "Minha Cidade"
2. ✅ Modo "Meu Bairro": fixado pelo endereço cadastrado, mostra apenas conteúdo daquela região
3. ✅ Modo "Minha Cidade": mostra toda a cidade com filtros por bairro
4. ⚠️ **REGRA CRÍTICA**: O sistema NUNCA deve definir outro bairro como ativo principal
5. ⚠️ **REGRA CRÍTICA**: Se usuário está em Nordeste e abre link da Pituba, deve:
   - Mudar para modo cidade
   - Definir Salvador como contexto ativo
   - Abrir conteúdo da Pituba dentro de Salvador
   - Mostrar aviso: "Você saiu do modo Nordeste e está visualizando Salvador"

### Para Usuários Não Cadastrados:
6. ✅ Não têm modo bairro
7. ✅ Veem apenas a cidade com filtros públicos por bairro

---

## ✅ O QUE JÁ ESTÁ IMPLEMENTADO

### 1. Estrutura de Dados (100% Implementado)

**Arquivo**: `src/core/location/types/index.ts`
```typescript
export type TerritoryMode = 'bairro' | 'cidade' | null;
// null = visitante sem modo (apenas cidade com filtros públicos)
```

**Status**: ✅ COMPLETO
- Tipo definido corretamente
- Três estados: 'bairro', 'cidade', null (visitante)

---

### 2. Store de Estado (100% Implementado)

**Arquivo**: `src/core/location/stores/LocationContextStore.ts`

**Funcionalidades**:
```typescript
- getTerritoryMode(): TerritoryMode
- setTerritoryMode(mode: TerritoryMode): void
- Limpa modo ao fazer clearActiveTerritory()
```

**Status**: ✅ COMPLETO
- Store singleton implementado
- Gerencia modo territorial globalmente
- Notifica listeners de mudanças

---

### 3. Hook de Território do Usuário (100% Implementado)

**Arquivo**: `src/core/location/hooks/useUserTerritory.ts`

**Funcionalidades**:
```typescript
interface UserTerritory {
  homeDistrict: { id, name, path } | null;  // Bairro do usuário
  homeCity: { id, name, path } | null;      // Cidade do usuário
  hasHome: boolean;                          // Se tem bairro definido
  loading: boolean;
}
```

**Status**: ✅ COMPLETO
- Busca residência primária do usuário
- Resolve bairro e cidade por UUID (não por string)
- Fonte de verdade: `user_residences.location_id`

---

### 4. Seletor de Território V2 (95% Implementado)

**Arquivo**: `src/core/location/components/TerritorySelectorV2.tsx`

#### ✅ Implementado:

1. **Interface Visual dos Modos**:
   - Botão "Meu Bairro" com ícone Home
   - Botão "Minha Cidade" com ícone Building2
   - Labels: "Apenas conteúdo do seu bairro" / "Toda a cidade com filtros por bairro"
   - Indicador visual de modo ativo

2. **Handlers de Seleção**:
```typescript
handleSelectBairro() {
  setTerritoryMode('bairro');
  navigate(homeDistrict.path);
}

handleSelectCidade() {
  setTerritoryMode('cidade');
  navigate(homeCity.path);
}

handleSelect(path) {
  if (hasHome) {
    setTerritoryMode('cidade'); // Força modo cidade ao explorar
  }
  navigate(path);
}
```

3. **Busca Unificada**:
   - Busca em "Meu Bairro", "Minha Cidade" e territórios disponíveis
   - Badges identificando cada seção

4. **Filtro de Duplicatas**:
   - Remove bairro/cidade do usuário dos territórios disponíveis

#### ⚠️ Problemas Identificados:

**PROBLEMA 1**: Não há inicialização automática do modo
- Quando usuário cadastrado acessa o site, o modo não é definido automaticamente
- Deveria inicializar como 'bairro' se `hasHome === true`

**PROBLEMA 2**: Visitantes podem ter modo definido
- Não há validação que impede `setTerritoryMode('bairro')` para visitantes
- Deveria bloquear modo 'bairro' se `hasHome === false`

---

### 5. Banner de Mismatch (90% Implementado)

**Arquivo**: `src/core/location/components/TerritoryMismatchBanner.tsx`

#### ✅ Implementado:

1. **Detecção de Mismatch**:
```typescript
useEffect(() => {
  if (territoryMode !== 'bairro') return;
  if (activeLocation.id === homeDistrict.id) return;
  
  // Está em outro lugar — forçar modo cidade
  prevModeRef.current = 'bairro';
  setTerritoryMode('cidade');
}, [activeLocation, territoryMode]);
```

2. **Mensagem de Aviso**:
```
"Você saiu de [Nordeste] e está visualizando [Salvador]"
```

3. **Botões de Ação**:
   - "Meu Bairro": volta para o bairro do usuário
   - "Minha Cidade": vai para a cidade do usuário
   - Botão X para dispensar

#### ✅ Funciona Corretamente:
- Detecta quando usuário sai do bairro em modo 'bairro'
- Força mudança para modo 'cidade' automaticamente
- Mostra aviso com origem e destino

#### ⚠️ Problema Identificado:

**PROBLEMA 3**: Lógica de mismatch pode ser confusa
- Se usuário está em modo 'cidade' em Salvador e vai para Pituba, não mostra aviso
- Mas a regra diz: "se o usuário está em Nordeste e abre link da Pituba"
- Isso sugere que deveria mostrar aviso mesmo em modo cidade?

**Interpretação Correta**:
- A regra se aplica apenas quando está em modo 'bairro'
- Se já está em modo 'cidade', pode navegar livremente entre bairros
- ✅ Implementação está correta

---

## ❌ O QUE NÃO ESTÁ IMPLEMENTADO

### 1. Inicialização Automática do Modo (CRÍTICO)

**Problema**: Quando usuário cadastrado acessa o site, o modo não é definido.

**Onde deveria estar**: Componente de inicialização ou efeito no seletor

**Solução Necessária**:
```typescript
// Em algum componente raiz ou no TerritorySelectorV2
useEffect(() => {
  if (!hasHome) {
    setTerritoryMode(null); // Visitante
    return;
  }
  
  if (territoryMode === null) {
    // Primeira vez: definir modo baseado na localização atual
    if (activeLocation?.id === homeDistrict?.id) {
      setTerritoryMode('bairro');
    } else {
      setTerritoryMode('cidade');
    }
  }
}, [hasHome, homeDistrict, activeLocation, territoryMode]);
```

**Impacto**: ALTO
- Sem isso, usuários cadastrados não têm modo definido ao carregar
- Comportamento inconsistente

---

### 2. Validação de Modo por Tipo de Usuário (IMPORTANTE)

**Problema**: Não há validação que impede visitantes de ter modo 'bairro'

**Onde deveria estar**: `LocationContextStore.setTerritoryMode()`

**Solução Necessária**:
```typescript
setTerritoryMode(mode: TerritoryMode, hasHome: boolean): void {
  // Visitantes não podem ter modo 'bairro'
  if (mode === 'bairro' && !hasHome) {
    console.warn('Visitantes não podem usar modo bairro');
    this.territoryMode = null;
  } else {
    this.territoryMode = mode;
  }
  this.notify();
}
```

**Impacto**: MÉDIO
- Previne estados inválidos
- Melhora robustez do sistema

---

### 3. Persistência do Modo (DESEJÁVEL)

**Problema**: Modo não é persistido entre sessões

**Onde deveria estar**: Store com localStorage

**Solução Necessária**:
```typescript
setTerritoryMode(mode: TerritoryMode): void {
  this.territoryMode = mode;
  if (mode !== null) {
    localStorage.setItem('territoryMode', mode);
  } else {
    localStorage.removeItem('territoryMode');
  }
  this.notify();
}

// Ao inicializar
constructor() {
  const saved = localStorage.getItem('territoryMode');
  if (saved === 'bairro' || saved === 'cidade') {
    this.territoryMode = saved;
  }
}
```

**Impacto**: BAIXO
- Melhora experiência do usuário
- Não é crítico para funcionamento

---

### 4. Filtros de Conteúdo por Modo (PARCIALMENTE IMPLEMENTADO)

**Descoberta**: Existe um sistema de filtros territoriais via `useTerritoryFilter`

**Arquivo**: `src/core/location/hooks/useTerritoryFilter.ts`

**Como Funciona Atualmente**:
```typescript
const filter = useTerritoryFilter(resolved, activeMemberIds);
// Retorna: { scope: 'location', location_id } ou { scope: 'group', location_ids } ou { scope: 'none' }
```

**Módulos que Usam**:
- ✅ Guide (Pontos Turísticos)
- ✅ Landing Page
- ✅ Services (via territoryFilterKey)

**Problema Identificado**: 
O `useTerritoryFilter` NÃO considera o `territoryMode` ('bairro' | 'cidade')!

Ele apenas resolve o território da rota ou do store, mas não aplica a lógica:
- Se modo 'bairro' → forçar filtro pelo homeDistrict
- Se modo 'cidade' → permitir toda a cidade

**Solução Necessária**:
```typescript
export function useTerritoryFilter(
  routeResolved?: ResolvedTerritory | null,
  activeMemberIds?: string[],
): TerritoryFilter {
  const { activeTerritory } = useLocationContext();
  const { territoryMode, homeDistrict } = useActiveTerritory(); // ADICIONAR
  const { hasHome } = useUserTerritory(); // ADICIONAR

  return useMemo((): TerritoryFilter => {
    // NOVA LÓGICA: Se usuário cadastrado em modo bairro, forçar filtro pelo bairro
    if (hasHome && territoryMode === 'bairro' && homeDistrict) {
      return { scope: 'location', location_id: homeDistrict.id };
    }
    
    // Resto da lógica existente...
    if (routeResolved) {
      // ...
    }
  }, [routeResolved, activeTerritory, activeMemberIds, territoryMode, homeDistrict, hasHome]);
}
```

**Impacto**: CRÍTICO
- Sistema de filtros existe, mas não integra com o modo territorial
- Precisa adicionar lógica de modo no useTerritoryFilter

---

## 📊 Resumo de Implementação

### Implementado (75%):
- ✅ Estrutura de dados (TerritoryMode)
- ✅ Store de estado
- ✅ Hook de território do usuário
- ✅ Interface visual do seletor
- ✅ Handlers de mudança de modo
- ✅ Banner de mismatch
- ✅ Detecção automática de saída do bairro
- ✅ Sistema de filtros territoriais (useTerritoryFilter)

### Parcialmente Implementado (15%):
- ⚠️ Filtros de conteúdo por modo (existe sistema, mas não integra com modo)

### Não Implementado (10%):
- ❌ Inicialização automática do modo
- ❌ Validação de modo por tipo de usuário
- ❌ Integração de territoryMode com useTerritoryFilter (CRÍTICO)
- ❌ Persistência do modo entre sessões

---

## 🎯 Prioridades de Implementação

### 1. URGENTE (Funcionalidade Quebrada):
- [ ] **Integrar territoryMode com useTerritoryFilter** (CRÍTICO)
  - Modificar `useTerritoryFilter` para considerar modo 'bairro' vs 'cidade'
  - Se modo 'bairro' → forçar filtro por homeDistrict
  - Se modo 'cidade' → permitir toda a cidade
- [ ] **Implementar inicialização automática do modo**
  - Definir modo ao carregar página baseado em hasHome e localização

### 2. IMPORTANTE (Previne Bugs):
- [ ] Adicionar validação de modo por tipo de usuário
- [ ] Testar navegação entre bairros em modo cidade
- [ ] Verificar se todos os módulos usam useTerritoryFilter

### 3. DESEJÁVEL (Melhora UX):
- [ ] Implementar persistência do modo
- [ ] Adicionar indicadores visuais de modo ativo em todas as páginas
- [ ] Adicionar testes automatizados para fluxo de modos

---

## 🔍 Verificação de Regras Específicas

### Regra 1: "Modo Meu Bairro fixado pelo endereço cadastrado"
**Status**: ✅ IMPLEMENTADO
- `useUserTerritory` busca bairro do usuário
- Seletor usa `homeDistrict` para definir modo bairro

### Regra 2: "Mostrar apenas conteúdo daquela região"
**Status**: ⚠️ PARCIALMENTE IMPLEMENTADO
- Sistema de filtros territoriais existe (`useTerritoryFilter`)
- Mas NÃO integra com `territoryMode`
- Filtros são aplicados por localização da rota, não pelo modo do usuário
- Precisa adicionar lógica: se modo 'bairro' → forçar homeDistrict

### Regra 3: "Modo Minha Cidade mostra toda a cidade com filtros"
**Status**: ⚠️ PARCIALMENTE IMPLEMENTADO
- Sistema de filtros territoriais existe
- Mas NÃO diferencia entre modo 'bairro' e modo 'cidade'
- Precisa adicionar lógica: se modo 'cidade' → permitir toda a cidade

### Regra 4: "Sistema nunca define outro bairro como ativo principal"
**Status**: ✅ IMPLEMENTADO
- Banner força modo cidade ao sair do bairro
- Não há código que muda `homeDistrict`

### Regra 5: "Se usuário em Nordeste abre link da Pituba"
**Status**: ✅ IMPLEMENTADO
- `TerritoryMismatchBanner` detecta e força modo cidade
- Mostra aviso correto
- Botões para voltar ao bairro ou cidade

### Regra 6: "Usuários não cadastrados não têm modo bairro"
**Status**: ⚠️ PARCIALMENTE IMPLEMENTADO
- Interface não mostra modo bairro para visitantes
- Mas não há validação que impede `setTerritoryMode('bairro')`

---

## 📝 Conclusão

A infraestrutura do sistema de modos está **70% implementada**. A parte visual e de navegação funciona corretamente, mas falta a parte mais crítica: **os filtros de conteúdo por modo**.

### O que funciona:
- Seletor visual com dois modos
- Detecção de saída do bairro
- Banner de aviso
- Navegação entre modos

### O que NÃO funciona:
- Conteúdo não é filtrado por modo (CRÍTICO)
- Modo não é inicializado automaticamente
- Sem validação de tipo de usuário

### Próximos Passos:
1. Verificar se queries de conteúdo usam `territoryMode`
2. Implementar inicialização automática
3. Adicionar validação de tipo de usuário
4. Testar fluxo completo de navegação


---

## 🔧 Exemplo de Implementação Necessária

### Modificação em useTerritoryFilter.ts

```typescript
// @ts-nocheck
import { useMemo } from 'react';
import { useLocationContext } from './useLocationContext';
import { useActiveTerritory } from './useActiveTerritory';
import { useUserTerritory } from './useUserTerritory';
import type { TerritoryFilter } from '../types';
import type { ResolvedTerritory } from '@/core/routing/hooks/useResolveTerritoryFromUrl';

export function useTerritoryFilter(
  routeResolved?: ResolvedTerritory | null,
  activeMemberIds?: string[],
): TerritoryFilter {
  const { activeTerritory } = useLocationContext();
  const { territoryMode } = useActiveTerritory();
  const { hasHome, homeDistrict, homeCity } = useUserTerritory();

  return useMemo((): TerritoryFilter => {
    // ✅ NOVA LÓGICA: Modo Bairro tem prioridade absoluta
    if (hasHome && territoryMode === 'bairro' && homeDistrict) {
      console.log('[useTerritoryFilter] MODO BAIRRO ATIVO:', {
        bairro: homeDistrict.name,
        locationId: homeDistrict.id
      });
      return { scope: 'location', location_id: homeDistrict.id };
    }

    // ✅ NOVA LÓGICA: Modo Cidade - permite toda a cidade
    if (hasHome && territoryMode === 'cidade' && homeCity) {
      // Se está em um bairro específico da cidade, usar o bairro
      if (routeResolved?.kind === 'location' && 
          routeResolved.location.parent_id === homeCity.id) {
        console.log('[useTerritoryFilter] MODO CIDADE - Bairro específico:', {
          bairro: routeResolved.location.name,
          locationId: routeResolved.location.id
        });
        return { scope: 'location', location_id: routeResolved.location.id };
      }
      
      // Se está na cidade, mostrar toda a cidade
      console.log('[useTerritoryFilter] MODO CIDADE - Toda a cidade:', {
        cidade: homeCity.name,
        locationId: homeCity.id
      });
      return { scope: 'location', location_id: homeCity.id };
    }

    // Resto da lógica existente para visitantes e grupos...
    if (routeResolved) {
      if (routeResolved.kind === 'group') {
        const ids = activeMemberIds !== undefined
          ? activeMemberIds
          : routeResolved.group.members.map((m) => m.id);
        if (ids.length === 0) return { scope: 'none' };
        return { scope: 'group', location_ids: ids };
      }

      if (routeResolved.kind === 'location') {
        return { scope: 'location', location_id: routeResolved.location.id };
      }
    }

    if (activeTerritory?.type === 'location') {
      return { scope: 'location', location_id: activeTerritory.location.id };
    }

    return { scope: 'none' };
  }, [routeResolved, activeTerritory, activeMemberIds, territoryMode, homeDistrict, homeCity, hasHome]);
}
```

---

## 🧪 Cenários de Teste

### Cenário 1: Usuário Cadastrado - Modo Bairro
**Setup**:
- Usuário mora no Nordeste de Amaralina
- Modo ativo: 'bairro'
- Acessa: `/servicos/ba/salvador`

**Comportamento Esperado**:
1. ✅ Seletor mostra "Meu Bairro: Nordeste de Amaralina" como ativo
2. ✅ Conteúdo filtrado APENAS pelo Nordeste (mesmo estando em URL de Salvador)
3. ✅ useTerritoryFilter retorna: `{ scope: 'location', location_id: 'nordeste-id' }`

**Status Atual**: ❌ FALHA
- Seletor mostra corretamente
- Mas useTerritoryFilter retorna Salvador, não Nordeste

---

### Cenário 2: Usuário Cadastrado - Modo Cidade
**Setup**:
- Usuário mora no Nordeste de Amaralina
- Modo ativo: 'cidade'
- Acessa: `/servicos/ba/salvador/pituba`

**Comportamento Esperado**:
1. ✅ Seletor mostra "Minha Cidade: Salvador" como ativo
2. ✅ Conteúdo filtrado pela Pituba (bairro específico)
3. ✅ useTerritoryFilter retorna: `{ scope: 'location', location_id: 'pituba-id' }`
4. ✅ Pode navegar livremente entre bairros de Salvador

**Status Atual**: ⚠️ PARCIAL
- Seletor mostra corretamente
- useTerritoryFilter retorna Pituba (correto)
- Mas não valida se Pituba está em Salvador

---

### Cenário 3: Usuário Cadastrado - Sai do Bairro
**Setup**:
- Usuário mora no Nordeste de Amaralina
- Modo ativo: 'bairro'
- Clica em link: `/servicos/ba/salvador/pituba`

**Comportamento Esperado**:
1. ✅ Sistema detecta saída do bairro
2. ✅ Muda automaticamente para modo 'cidade'
3. ✅ Mostra banner: "Você saiu de Nordeste de Amaralina e está visualizando Salvador"
4. ✅ Conteúdo agora mostra Pituba (não mais apenas Nordeste)
5. ✅ Botões: "Meu Bairro" (volta) e "Minha Cidade" (fica em Salvador)

**Status Atual**: ✅ FUNCIONA
- TerritoryMismatchBanner implementado corretamente

---

### Cenário 4: Visitante (Não Cadastrado)
**Setup**:
- Usuário não tem conta ou não definiu bairro
- Acessa: `/servicos/ba/salvador`

**Comportamento Esperado**:
1. ✅ Seletor NÃO mostra "Meu Bairro" ou "Minha Cidade"
2. ✅ Mostra apenas "Salvador" e territórios disponíveis
3. ✅ territoryMode = null
4. ✅ Conteúdo filtrado pela localização da URL
5. ✅ Pode navegar livremente entre bairros

**Status Atual**: ✅ FUNCIONA
- Seletor não mostra modos para visitantes
- useTerritoryFilter usa localização da rota

---

## 📋 Checklist de Validação

### Infraestrutura (100%)
- [x] TerritoryMode type definido
- [x] LocationContextStore gerencia modo
- [x] useActiveTerritory expõe territoryMode
- [x] useUserTerritory busca homeDistrict e homeCity
- [x] TerritorySelectorV2 mostra interface de modos
- [x] TerritoryMismatchBanner detecta saída do bairro

### Lógica de Filtros (30%)
- [x] useTerritoryFilter existe e funciona
- [ ] useTerritoryFilter considera territoryMode
- [ ] Modo 'bairro' força filtro por homeDistrict
- [ ] Modo 'cidade' permite navegação por bairros
- [ ] Visitantes não têm modo (null)

### Inicialização (0%)
- [ ] Modo é definido ao carregar página
- [ ] Modo é definido ao fazer login
- [ ] Modo persiste entre sessões (opcional)

### Validação (0%)
- [ ] Visitantes não podem ter modo 'bairro'
- [ ] Modo 'bairro' requer homeDistrict
- [ ] Modo 'cidade' requer homeCity

### Integração com Módulos (50%)
- [x] Guide usa useTerritoryFilter
- [x] Landing usa useTerritoryFilter
- [x] Services usa useTerritoryFilter
- [ ] Business usa useTerritoryFilter
- [ ] Classifieds usa useTerritoryFilter
- [ ] Events usa useTerritoryFilter
- [ ] Community usa useTerritoryFilter
- [ ] Gastronomy usa useTerritoryFilter
- [ ] Jobs usa useTerritoryFilter

---

## 📝 Conclusão Final

### Resumo Executivo:
A funcionalidade de "Modo Bairro" e "Modo Cidade" está **75% implementada**. A interface visual, navegação e detecção de mismatch funcionam perfeitamente. O problema crítico é que **os filtros de conteúdo não consideram o modo do usuário**.

### Problema Principal:
O hook `useTerritoryFilter` filtra conteúdo pela localização da URL, mas ignora o `territoryMode`. Isso significa que:
- Usuário em modo 'bairro' vê conteúdo de toda a cidade (ERRADO)
- Modo não tem efeito real no conteúdo exibido

### Solução:
Modificar `useTerritoryFilter` para:
1. Verificar `territoryMode` ANTES de resolver pela rota
2. Se modo 'bairro' → forçar filtro por `homeDistrict.id`
3. Se modo 'cidade' → permitir navegação por bairros da cidade

### Impacto da Correção:
- Tempo estimado: 2-3 horas
- Arquivos afetados: 1 (useTerritoryFilter.ts)
- Risco: BAIXO (lógica isolada, bem testável)
- Benefício: ALTO (funcionalidade principal passa a funcionar)

### Recomendação:
**Implementar URGENTEMENTE** a integração de `territoryMode` com `useTerritoryFilter`. Sem isso, a funcionalidade de modos é apenas cosmética e não cumpre os requisitos especificados.
