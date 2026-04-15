# 🔍 Comandos Úteis para Debug do Sistema Territorial

## 📋 Console do Navegador

### Ver Estado Atual do Store

```javascript
// Importar store (cole no console)
import { locationContextStore } from '@/core/location/stores/LocationContextStore';

// Ver território ativo
locationContextStore.getActiveTerritory();
// Retorna: { type: 'location', location: { id, name, geographic_path, ... } }

// Ver modo territorial
locationContextStore.getTerritoryMode();
// Retorna: 'bairro' | 'cidade' | null

// Ver localização ativa
locationContextStore.getActiveLocation();
// Retorna: { id, name, type, geographic_path, ... }
```

### Verificar Dados do Usuário

```javascript
// Ver bairro e cidade do usuário
import { useUserTerritory } from '@/core/location';

// Em um componente React:
const { homeDistrict, homeCity, hasHome } = useUserTerritory();
console.log('Bairro:', homeDistrict);
console.log('Cidade:', homeCity);
console.log('Tem casa?', hasHome);
```

### Forçar Mudança de Modo (Debug)

```javascript
// Importar store
import { locationContextStore } from '@/core/location/stores/LocationContextStore';

// Forçar modo bairro
locationContextStore.setTerritoryMode('bairro');

// Forçar modo cidade
locationContextStore.setTerritoryMode('cidade');

// Forçar modo visitante
locationContextStore.setTerritoryMode(null);

// Verificar mudança
locationContextStore.getTerritoryMode();
```

---

## 🔎 Buscar Hardcoded no Código

### Buscar URLs Hardcoded

```bash
# Buscar /ba/salvador hardcoded
grep -r "/ba/salvador" src/ --exclude-dir=node_modules

# Buscar /br/ba/salvador hardcoded
grep -r "/br/ba/salvador" src/ --exclude-dir=node_modules

# Buscar imports de LAUNCH_URLS
grep -r "LAUNCH_URLS" src/ --exclude-dir=node_modules

# Buscar useFriendlyModuleUrls
grep -r "useFriendlyModuleUrls" src/ --exclude-dir=node_modules
```

### Verificar Uso de Hooks

```bash
# Verificar uso de useTerritoryFilter
grep -r "useTerritoryFilter" src/ --exclude-dir=node_modules

# Verificar uso de useActiveTerritory
grep -r "useActiveTerritory" src/ --exclude-dir=node_modules

# Verificar uso de useUserTerritory
grep -r "useUserTerritory" src/ --exclude-dir=node_modules
```

---

## 🧪 Testes Manuais Rápidos

### Teste 1: Verificar Modo Inicial

```javascript
// 1. Abrir console
// 2. Fazer login
// 3. Executar:
import { locationContextStore } from '@/core/location/stores/LocationContextStore';
console.log('Modo:', locationContextStore.getTerritoryMode());
// Deve retornar: 'bairro' ou 'cidade' (nunca null para usuário logado)
```

### Teste 2: Verificar Filtros

```javascript
// 1. Abrir console em uma página de conteúdo (ex: /empresas/ba/salvador)
// 2. Procurar nos logs:
// [useTerritoryFilter] MODO BAIRRO ATIVO: { bairro: "...", locationId: "..." }
// ou
// [useTerritoryFilter] MODO CIDADE - Toda a cidade: { cidade: "...", locationId: "..." }
```

### Teste 3: Verificar Sincronização

```javascript
// 1. Abrir seletor
// 2. Clicar em "Meu Bairro"
// 3. Verificar no console:
import { locationContextStore } from '@/core/location/stores/LocationContextStore';
console.log('Modo após clicar:', locationContextStore.getTerritoryMode());
// Deve retornar: 'bairro'

// 4. Clicar em "Minha Cidade"
// 5. Verificar novamente:
console.log('Modo após clicar:', locationContextStore.getTerritoryMode());
// Deve retornar: 'cidade'
```

---

## 🐛 Problemas Comuns e Soluções

### Problema 1: Modo não inicializa

**Sintoma**: `territoryMode` fica `null` mesmo para usuário logado

**Debug**:
```javascript
// Verificar se TerritoryModeInitializer está renderizado
// Procurar no console por:
// [TerritoryModeInit] Usuário no próprio bairro, definindo modo bairro
// ou
// [TerritoryModeInit] Usuário fora do bairro, definindo modo cidade

// Se não aparecer, verificar:
// 1. TerritoryModeInitializer está em App.tsx?
// 2. useUserTerritory retorna hasHome === true?
```

**Solução**:
```javascript
// Verificar dados do usuário:
import { useUserTerritory } from '@/core/location';
const { hasHome, homeDistrict, loading } = useUserTerritory();
console.log('hasHome:', hasHome);
console.log('homeDistrict:', homeDistrict);
console.log('loading:', loading);

// Se hasHome === false, usuário não tem bairro cadastrado
// Se loading === true, aguardar carregamento
```

---

### Problema 2: Filtros não funcionam

**Sintoma**: Conteúdo não é filtrado pelo modo do usuário

**Debug**:
```javascript
// Verificar logs do useTerritoryFilter no console
// Deve aparecer:
// [useTerritoryFilter] MODO BAIRRO ATIVO: ...
// ou
// [useTerritoryFilter] MODO CIDADE: ...

// Se não aparecer, verificar:
// 1. Página usa useTerritoryFilter?
// 2. territoryMode está definido?
```

**Solução**:
```javascript
// Em qualquer página, adicionar temporariamente:
import { useTerritoryFilter } from '@/core/location';
import { useActiveTerritory } from '@/core/location';

const filter = useTerritoryFilter();
const { territoryMode } = useActiveTerritory();

console.log('Modo:', territoryMode);
console.log('Filtro:', filter);

// Verificar se filter.scope !== 'none'
// Verificar se filter.location_id está correto
```

---

### Problema 3: Seletor e Sidebar dessincronizados

**Sintoma**: Seletor mostra um modo, mas sidebar mostra outro

**Debug**:
```javascript
// Verificar se ambos usam o mesmo store:
import { locationContextStore } from '@/core/location/stores/LocationContextStore';

// No seletor:
console.log('Modo no seletor:', locationContextStore.getTerritoryMode());

// Na sidebar:
console.log('Modo na sidebar:', locationContextStore.getTerritoryMode());

// Devem retornar o mesmo valor
```

**Solução**:
- Ambos devem usar `useActiveTerritory()` do mesmo store
- Verificar se não há múltiplas instâncias do store

---

### Problema 4: Banner não aparece

**Sintoma**: Usuário sai do bairro mas banner não aparece

**Debug**:
```javascript
// Verificar se TerritoryMismatchBanner está renderizado
// Procurar no console por erros

// Verificar condições:
import { useUserTerritory } from '@/core/location';
import { useActiveTerritory } from '@/core/location';

const { homeDistrict, hasHome } = useUserTerritory();
const { activeLocation, territoryMode } = useActiveTerritory();

console.log('hasHome:', hasHome);
console.log('homeDistrict:', homeDistrict);
console.log('activeLocation:', activeLocation);
console.log('territoryMode:', territoryMode);

// Banner só aparece se:
// - hasHome === true
// - homeDistrict !== null
// - activeLocation.id !== homeDistrict.id
// - territoryMode === 'cidade' (após mudança automática)
```

---

## 📊 Monitoramento de Performance

### Ver Quantas Vezes o Modo é Inicializado

```javascript
// Adicionar temporariamente em useTerritoryModeInitializer.ts:
console.count('[TerritoryModeInit] Hook executado');

// Deve aparecer apenas 1 vez por sessão
// Se aparecer múltiplas vezes, há problema de re-renderização
```

### Ver Quantas Vezes o Filtro é Recalculado

```javascript
// Adicionar temporariamente em useTerritoryFilter.ts:
console.count('[useTerritoryFilter] Hook executado');

// Deve aparecer poucas vezes (apenas quando dependências mudam)
// Se aparecer muitas vezes, há problema de memoização
```

---

## 🔧 Ferramentas de Debug

### React DevTools

1. Instalar extensão React DevTools
2. Abrir aba "Components"
3. Procurar por:
   - `TerritoryModeInitializer`
   - `TerritorySelectorV2`
   - `AppSidebar`
4. Verificar props e state

### Redux DevTools (para Store)

```javascript
// Adicionar temporariamente em LocationContextStore.ts:
private notify(): void {
  console.log('[Store] Estado atualizado:', {
    activeTerritory: this.activeTerritory,
    territoryMode: this.territoryMode,
  });
  this.listeners.forEach((fn) => fn());
}

// Ver no console cada mudança de estado
```

---

## 📝 Checklist de Debug

Quando algo não funciona, seguir esta ordem:

1. [ ] Verificar se `TerritoryModeInitializer` está em `App.tsx`
2. [ ] Verificar se `territoryMode` está definido no store
3. [ ] Verificar se `activeLocation` está definido no store
4. [ ] Verificar se `useUserTerritory` retorna dados corretos
5. [ ] Verificar se `useTerritoryFilter` considera o modo
6. [ ] Verificar logs no console
7. [ ] Verificar se não há erros no console
8. [ ] Verificar se componentes usam hooks corretos
9. [ ] Verificar se não há hardcoded de URLs
10. [ ] Verificar se store é singleton (única instância)

---

## 🎯 Comandos Úteis de Desenvolvimento

### Limpar Cache do Navegador

```javascript
// Limpar localStorage
localStorage.clear();

// Limpar sessionStorage
sessionStorage.clear();

// Recarregar página
location.reload();
```

### Resetar Estado do Store

```javascript
import { locationContextStore } from '@/core/location/stores/LocationContextStore';

// Limpar tudo
locationContextStore.clearActiveTerritory();

// Verificar
console.log('Território:', locationContextStore.getActiveTerritory());
console.log('Modo:', locationContextStore.getTerritoryMode());
// Ambos devem retornar null
```

---

## 📚 Referências Rápidas

- **Store**: `src/core/location/stores/LocationContextStore.ts`
- **Inicializador**: `src/core/location/hooks/useTerritoryModeInitializer.ts`
- **Filtros**: `src/core/location/hooks/useTerritoryFilter.ts`
- **Seletor**: `src/core/location/components/TerritorySelectorV2.tsx`
- **Sidebar**: `src/app/components/navigation/AppSidebar.tsx`
- **URLs**: `src/core/routing/hooks/useFriendlyModuleUrls.ts`
