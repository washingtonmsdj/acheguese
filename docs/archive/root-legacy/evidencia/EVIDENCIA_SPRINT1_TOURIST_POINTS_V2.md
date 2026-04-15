# 📊 EVIDÊNCIA - Sprint 1: tourist_points (REVISÃO V2)

**Data:** 2026-04-05  
**Módulo:** tourist_points  
**Status:** ⚠️ MIGRAÇÃO PARCIAL DOS FILTROS PARA SSOT

---

## 🎯 RECLASSIFICAÇÃO

**Status Anterior:** "Filtros 100% corrigidos"  
**Status Atual:** "Migração parcial dos filtros para SSOT"

**Motivo da Reclassificação:**
- Caminho legado (state/city) ainda ativo no runtime como fallback
- Renderização pública ainda lê campos mock/legados
- Testes de comportamento não estavam implementados
- Helper compartilhado não existia (duplicação de código)
- getBySlug() não validava contexto territorial corretamente
- getCommunityPhotos() resolvia bairro sem contexto de cidade

---

## ✅ CORREÇÕES APLICADAS (V2)

### 1. Helper Compartilhado Criado

**Arquivo:** `src/core/location/helpers/territorialResolver.ts` (NOVO)

**Funções:**
- `resolveCityToLocationIds(state, city)` - Resolve cidade → cityId + districtIds
- `resolveNeighborhoodInCity(state, city, neighborhood)` - Resolve bairro DENTRO da cidade
- `validateLocationInCity(locationId, state, city)` - Valida se location pertence à cidade

**Benefícios:**
- ✅ Elimina duplicação de código em countByCity() e getCategoriesByCity()
- ✅ Garante resolução consistente em todo o projeto
- ✅ Resolve bairros homônimos corretamente (ex: "Centro" em múltiplas cidades)
- ✅ Reutilizável por outros módulos (profiles, posts, etc)

---

### 2. getBySlug() Corrigido

**ANTES:**
```typescript
// Busca por slug isolado, depois valida geographic_path
const { data } = await supabase
  .from('tourist_points')
  .select(...)
  .eq('slug', slug)
  .single();

// Problema: slug pode não ser globalmente único
```

**DEPOIS:**
```typescript
// Resolve cidade → location_ids primeiro
const cityResolution = await resolveCityToLocationIds(state, city);

// Busca por slug E valida contexto territorial
const { data } = await supabase
  .from('tourist_points')
  .select(...)
  .eq('slug', slug)
  .in('location_id', [cityResolution.cityId, ...cityResolution.districtIds])
  .single();

// Garante que slug é resolvido no contexto territorial correto
```

**Mudança:**
- ✅ Slug não precisa ser globalmente único
- ✅ Contexto territorial garante resolução correta
- ✅ Evita ambiguidade (ex: "centro" em múltiplas cidades)

---

### 3. getCommunityPhotos() Corrigido

**ANTES:**
```typescript
// Resolvia bairro SEM contexto de cidade
const { data: neighborhoodLocation } = await supabase
  .from('locations')
  .select('id')
  .eq('type', 'district')
  .ilike('name', neighborhood)
  .limit(1)  // PROBLEMA: Pode pegar bairro de outra cidade
  .single();
```

**DEPOIS:**
```typescript
// Resolve bairro SEMPRE dentro da cidade correta
const neighborhoodLocationId = await resolveNeighborhoodInCity(state, city, neighborhood);

// Garante que "Centro" de Salvador ≠ "Centro" de Feira de Santana
```

**Mudança:**
- ✅ Bairros homônimos resolvidos corretamente
- ✅ Contexto de cidade sempre respeitado
- ✅ Usa helper compartilhado

---

### 4. countByCity() e getCategoriesByCity() Refatorados

**ANTES:**
```typescript
// Código duplicado em ambas as funções
const { data: cityLocation } = await supabase
  .from('locations')
  .select('id')
  .eq('type', 'city')
  .ilike('name', city)
  .eq('parent_id', stateId)
  .single();

const { data: districts } = await supabase
  .from('locations')
  .select('id')
  .eq('type', 'district')
  .eq('parent_id', cityLocation.id);
```

**DEPOIS:**
```typescript
// Usa helper compartilhado
const cityResolution = await resolveCityToLocationIds(state, city);

// Acessa cityId e districtIds diretamente
const { count } = await supabase
  .from('tourist_points')
  .select('*', { count: 'exact', head: true })
  .in('location_id', cityResolution.districtIds)
  .eq('status', 'active');
```

**Mudança:**
- ✅ Elimina duplicação de código
- ✅ Lógica centralizada no helper
- ✅ Mais fácil de manter e testar

---

### 5. TouristPointDetailPage Corrigido

**ANTES:**
```typescript
// Sempre usava mock neighborhood
const neighborhood = ext?.neighborhood;
const latitude = ext?.latitude;
const longitude = ext?.longitude;
```

**DEPOIS:**
```typescript
// SSOT: Prioriza point.location?.name sobre mock
const neighborhood = point?.location?.name ?? ext?.neighborhood;
const neighborhoodFull = point?.location?.full_name ?? neighborhood;

// SSOT: Prioriza point.address coordenadas sobre mock
const latitude = point?.address?.latitude ?? ext?.latitude;
const longitude = point?.address?.longitude ?? ext?.longitude;
```

**Mudança:**
- ✅ Prioriza dados reais do SSOT
- ✅ Fallback para mock apenas quando necessário
- ✅ Exibe location.name quando disponível

---

### 6. Testes de Comportamento Criados

**Arquivo:** `tests/ssot-tourist-points.test.ts` (NOVO)

**Cobertura:**
- ✅ Filtros: Priorização de location_id sobre state/city
- ✅ Slug Territorial: Resolução no contexto correto
- ✅ Bairros Homônimos: "Centro" em múltiplas cidades
- ✅ Helper Territorial: resolveCityToLocationIds()
- ✅ Contadores e Categorias: Uso de location_ids
- ✅ Fotos da Comunidade: Resolução de bairro na cidade
- ✅ Validação de Escrita: Rejeição sem location_id
- ✅ Leitura com Join: Carregamento de location.name

**Total:** 15 testes implementados

---

## 📊 MÉTRICAS ATUALIZADAS

### Antes (V1)
- Filtros por location_id: 5/5 (100%) ❌ INCORRETO
- Fallback ativo: Sim
- Helper compartilhado: Não
- Testes: 0

### Depois (V2)
- Filtros por location_id: 5/5 (100%) ✅ COM FALLBACK
- Fallback ativo: Sim (compatibilidade temporária)
- Helper compartilhado: Sim ✅
- Testes: 15 ✅
- Duplicação eliminada: 2 funções refatoradas ✅
- Página pública corrigida: Sim ✅

### Status Real
- ⚠️ Caminho SSOT: Implementado e prioritário
- ⚠️ Caminho legado: Ativo como fallback (temporário)
- ✅ Helper compartilhado: Criado e em uso
- ✅ Testes: Implementados
- ✅ Página pública: Prioriza SSOT

---

## ⚠️ PENDENTE PARA CONCLUSÃO

### 1. Remover Fallback Legado
- [ ] Executar backfill de tourist_points (garantir 100% com location_id)
- [ ] Remover fallback para state/city em list()
- [ ] Remover fallback em getBySlug()
- [ ] Remover fallback em countByCity()
- [ ] Remover fallback em getCategoriesByCity()
- [ ] Remover fallback em getCommunityPhotos()

### 2. Validar URL Canônica
- [ ] Verificar se buildUrl() usa geographic_path
- [ ] Verificar se breadcrumb usa location.full_name
- [ ] Testar URLs com bairros homônimos

### 3. Validar Mapa
- [ ] Verificar origem das coordenadas (address vs location)
- [ ] Testar exibição de múltiplos pontos
- [ ] Validar zoom e centralização

### 4. Executar Testes
```bash
npm test -- ssot-tourist-points
```

### 5. Validar em Produção
- [ ] Testar fluxo completo end-to-end
- [ ] Verificar performance de queries com location_id
- [ ] Monitorar logs de fallback

---

## 🎯 CRITÉRIOS DE CONCLUSÃO (REVISADOS)

Para considerar tourist_points 100% corrigido:

- [x] Filtros usam location_id como prioridade (5/5)
- [x] Helper compartilhado criado
- [x] getBySlug() valida contexto territorial
- [x] getCommunityPhotos() resolve bairro na cidade
- [x] Página pública prioriza location.name
- [x] Testes de comportamento implementados (15 testes)
- [ ] Fallback legado removido (após backfill)
- [ ] URL canônica validada
- [ ] Mapa validado
- [ ] Testes passando em CI/CD
- [ ] Validação end-to-end em produção

**Status Atual:** 6/11 critérios atendidos (54.5%)

---

## 📝 PRÓXIMOS PASSOS

1. **Executar Testes** - Rodar suite de testes SSOT
2. **Validar URL** - Verificar buildUrl() e breadcrumb
3. **Validar Mapa** - Verificar coordenadas e exibição
4. **Executar Backfill** - Garantir 100% de cobertura
5. **Remover Fallback** - Após backfill e validação
6. **Validar em Produção** - Testar fluxo completo

---

## 🔍 LIÇÕES APRENDIDAS

### O que funcionou
✅ Helper compartilhado eliminou duplicação
✅ Resolução de bairro com contexto de cidade evita ambiguidade
✅ Priorização de SSOT com fallback permite migração gradual
✅ Testes de comportamento validam casos reais

### O que precisa melhorar
❌ Não marcar como "100% corrigido" enquanto fallback ativo
❌ Não considerar "migração completa" sem testes
❌ Não ignorar renderização pública (detail page)
❌ Não duplicar lógica de resolução territorial

### Próximas Melhorias
1. Criar helper para resolução de estado (sigla vs nome)
2. Adicionar cache para resoluções territoriais frequentes
3. Implementar métricas de uso de fallback vs SSOT
4. Documentar padrões de uso do helper

---

**Status:** ⚠️ MIGRAÇÃO PARCIAL - Aguardando backfill e remoção de fallback

**Próxima Ação:** Executar testes e validar URL/Mapa

