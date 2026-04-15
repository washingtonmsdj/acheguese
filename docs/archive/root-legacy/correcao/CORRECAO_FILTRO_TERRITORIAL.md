# 🎯 Correção: Filtro Territorial em Classificados

## ❌ Problema Identificado

A página `ClassificadosLandingPage.tsx` **NÃO estava respeitando o filtro territorial** devido a um fallback incorreto para dados mock.

### Código Problemático

```typescript
// ❌ ERRADO - Ignora filtro territorial
const classificados = classificadosFromDB.length > 0 
  ? classificadosFromDB 
  : MOCK_CLASSIFIEDS;
```

**Por que isso é um problema?**

1. Quando o banco retorna vazio (sem anúncios na localização), usa dados MOCK
2. Dados MOCK não têm `location_id` e não respeitam território
3. Usuário vê anúncios de outras regiões, quebrando a experiência territorial

---

## ✅ Solução Implementada

### 1. Removido Fallback para Mock

```typescript
// ✅ CORRETO - Respeita filtro territorial
const classificados = classificadosFromDB;
```

Agora a página **sempre** usa dados do banco, respeitando o filtro territorial aplicado pelo `useClassificados`.

---

### 2. Adicionado Indicador de Território

```typescript
// Indicador de território ativo
const hasTerritory = filter.scope !== 'none';
const territoryName = useMemo(() => {
  if (!resolved) return null;
  if (resolved.kind === 'location') return resolved.location.name;
  if (resolved.kind === 'group') return resolved.group.name;
  return null;
}, [resolved]);
```

---

### 3. Banner Contextual

**Quando há território ativo:**
```
📍 Exibindo anúncios de [Nome do Bairro/Grupo]
```

**Quando não há território:**
```
✨ Anuncie grátis! Venda seus produtos para milhares de pessoas na sua região.
```

---

### 4. Estado Vazio Melhorado

**Quando não há anúncios na localização:**

```
📍 Nenhum anúncio em [Nome do Território]

Ainda não há classificados publicados nesta região. 
Seja o primeiro a anunciar!

[Criar Primeiro Anúncio] [Ver todas as categorias]
```

**Quando não há anúncios na categoria:**

```
🏷️ Nenhum anúncio encontrado nesta categoria.

[Ver todas as categorias]
```

---

## 🔍 Como o Filtro Territorial Funciona

### Fluxo Completo

```
1. ClassificadosLandingPage
   ↓ passa resolved + activeMemberIds
   
2. useClassificados
   ↓ chama useTerritoryFilter(resolved, activeMemberIds)
   
3. useTerritoryFilter
   ↓ retorna TerritoryFilter { scope, location_id/location_ids }
   
4. classifiedService.getAllClassifieds(filter)
   ↓ aplica filtro territorial na query
   
5. Supabase Query
   ↓ .eq('location_id', id) OU .in('location_id', ids)
   
6. Retorna apenas anúncios da localização
```

---

### Tipos de Filtro

#### 1. Location (Bairro/Cidade)
```typescript
filter = {
  scope: 'location',
  location_id: 'uuid-do-bairro'
}
```

**Query aplicada:**
```sql
-- Busca location + descendentes hierárquicos
SELECT * FROM classifieds 
WHERE location_id IN (
  SELECT id FROM rpc_get_location_descendants_ids('uuid-do-bairro')
)
```

#### 2. Group (Grupo de Bairros)
```typescript
filter = {
  scope: 'group',
  location_ids: ['uuid-1', 'uuid-2', 'uuid-3']
}
```

**Query aplicada:**
```sql
SELECT * FROM classifieds 
WHERE location_id IN ('uuid-1', 'uuid-2', 'uuid-3')
```

#### 3. None (Sem Filtro)
```typescript
filter = {
  scope: 'none'
}
```

**Query aplicada:**
```sql
SELECT * FROM classifieds
-- Sem filtro territorial
```

---

## 🎯 Benefícios da Correção

### 1. ✅ Respeita Território
- Usuários veem apenas anúncios da sua região
- Experiência localizada e relevante

### 2. ✅ Transparência
- Banner indica qual território está ativo
- Estado vazio explica por que não há anúncios

### 3. ✅ Incentiva Criação
- CTA para criar primeiro anúncio da região
- Gamificação: "Seja o primeiro!"

### 4. ✅ Consistência
- Mesmo comportamento em toda a plataforma
- Segue SSOT de location

---

## 🧪 Como Testar

### Teste 1: Com Território Ativo

1. Acesse `/bairro/pituba/classificados`
2. ✅ Banner deve mostrar: "Exibindo anúncios de Pituba"
3. ✅ Deve mostrar apenas anúncios de Pituba
4. ✅ Se vazio, mostrar: "Nenhum anúncio em Pituba"

### Teste 2: Sem Território

1. Acesse `/classificados` (rota global)
2. ✅ Banner deve mostrar: "Anuncie grátis!"
3. ✅ Deve mostrar todos os anúncios (sem filtro)

### Teste 3: Grupo de Bairros

1. Acesse `/grupo/zona-norte/classificados`
2. ✅ Banner deve mostrar: "Exibindo anúncios de Zona Norte"
3. ✅ Deve mostrar anúncios de todos os bairros do grupo
4. ✅ Respeita rollout (apenas membros ativos)

### Teste 4: Filtro de Categoria

1. Selecione categoria "Móveis"
2. ✅ Deve filtrar apenas móveis DA LOCALIZAÇÃO ATIVA
3. ✅ Não deve mostrar móveis de outras regiões

---

## 📊 Comparação Antes/Depois

### Antes ❌

| Cenário | Comportamento | Problema |
|---------|---------------|----------|
| Pituba sem anúncios | Mostra dados MOCK | Anúncios de outras regiões |
| Barra com anúncios | Mostra anúncios da Barra | ✅ OK |
| Filtro categoria | Filtra categoria | ❌ Ignora território nos mocks |

### Depois ✅

| Cenário | Comportamento | Resultado |
|---------|---------------|-----------|
| Pituba sem anúncios | Mostra estado vazio | ✅ Transparente e correto |
| Barra com anúncios | Mostra anúncios da Barra | ✅ OK |
| Filtro categoria | Filtra categoria + território | ✅ Sempre territorial |

---

## 🔧 Arquivos Modificados

1. ✅ `src/modules/classifieds/pages/ClassificadosLandingPage.tsx`
   - Removido fallback para MOCK_CLASSIFIEDS
   - Adicionado indicadores de território
   - Melhorado estado vazio
   - Banner contextual

---

## 📝 Notas Importantes

### Dados Mock

Os dados mock (`MOCK_CLASSIFIEDS`) **NÃO devem ser usados como fallback** em páginas territoriais porque:

1. Não têm `location_id` válido
2. Quebram a experiência territorial
3. Confundem o usuário

**Uso correto de mocks:**
- ✅ Desenvolvimento/testes isolados
- ✅ Storybook
- ✅ Testes unitários
- ❌ Fallback em produção

### Hierarquia Territorial

O filtro territorial é **hierárquico**:

```
Salvador (cidade)
  ├─ Pituba (bairro)
  │   ├─ Pituba Norte (sub-bairro)
  │   └─ Pituba Sul (sub-bairro)
  └─ Barra (bairro)
```

Ao filtrar por "Pituba", inclui:
- ✅ Anúncios de Pituba
- ✅ Anúncios de Pituba Norte
- ✅ Anúncios de Pituba Sul

---

## ✅ Conclusão

A página agora **respeita fielmente o filtro territorial**, proporcionando uma experiência localizada e consistente para os usuários.

**Status:** ✅ CORRIGIDO E TESTADO
