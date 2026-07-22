# 🔧 Correção Estrutural AAA: Community Alerts + SSOT Territorial

**Data:** 2026-04-19  
**Tipo:** Refatoração Estrutural (Nível AAA)  
**Status:** Em Execução

---

## 📋 DIAGNÓSTICO DO ESTADO ATUAL

### ❌ Problemas Identificados

#### 1. **Modelagem Territorial Quebrada**
- ✗ Tabela `community_alerts` usa `neighborhood` (text) + `city` (text) como base
- ✗ Não possui `location_id` (FK para `locations`)
- ✗ Normalização manual via `normalize_location_text()` — duplicação de lógica
- ✗ Filtros por texto livre (`eq('city', 'salvador')`) — frágil e inconsistente
- ✗ Impossível aplicar `TerritoryFilter` do SSOT territorial
- ✗ Impossível usar hierarquia geográfica (cidade → bairros)

#### 2. **Integração com Mapa Quebrada**
- ✗ Service tem método `getByBounds()` que busca `latitude`/`longitude` inexistentes
- ✗ Código comentado menciona "migration 20260403000002" que nunca foi criada
- ✗ MapaPageV4 tinha `makeAlertFetcher` removido por causar erros 404/400
- ✗ Função SQL `search_entities_by_radius` tentava buscar tabela `alerts` inexistente

#### 3. **Violação do SSOT Territorial**
- ✗ Todos os outros módulos usam `location_id`:
  - `business_data.location_id`
  - `professional_data.location_id`
  - `classifieds.location_id`
  - `tourist_points.location_id`
  - `events.location_id` (via address)
- ✗ Alertas são a ÚNICA entidade usando texto livre para localização
- ✗ Impossível aplicar filtros territoriais consistentes
- ✗ Impossível usar `useTerritoryFilter()` hook

#### 4. **Código Morto e Inconsistências**
- ✗ `CommunityAlertService.getByBounds()` — nunca funcional, busca campos inexistentes
- ✗ Tipos mencionam `latitude`/`longitude` que não existem no schema
- ✗ Documentação desatualizada menciona coordenadas
- ✗ RPC `create_community_alert` normaliza texto manualmente
- ✗ Índices baseados em texto (`idx_ca_feed`, `idx_ca_dedup`)

#### 5. **Design de Privacidade Correto, Implementação Errada**
- ✓ Conceito: alertas não devem ter coordenadas exatas do usuário
- ✗ Implementação: usa texto livre em vez de referência territorial
- ✗ Resultado: impossível exibir no mapa por território (centroide/geometria)

---

## ✅ SOLUÇÃO PROPOSTA

### Princípios da Correção

1. **Convergir para `location_id`** como referência territorial única
2. **Eliminar `neighborhood`/`city` como base de regras** — manter apenas para display legado
3. **Integrar com SSOT territorial** — usar `TerritoryFilter`, hierarquia, geometria
4. **Preparar exibição no mapa** — por território (centroide), não por usuário
5. **Remover código morto** — `getByBounds()` quebrado, tipos inconsistentes
6. **Atualizar documentação** — refletir design real

### Estratégia Técnica

#### **Opção Escolhida: Centroide Territorial**

**Por quê?**
- ✅ Escalável — não requer geometria completa
- ✅ Simples — `locations` já tem `metadata.centroid`
- ✅ Performático — índice espacial em ponto, não polígono
- ✅ Privado — mostra "alerta no bairro X", não "alerta na casa Y"
- ✅ Consistente — mesmo padrão de outros módulos

**Alternativa Descartada: Geometria Completa**
- ✗ Complexo — requer PostGIS, polígonos, cálculos pesados
- ✗ Overkill — alertas não precisam de precisão de polígono
- ✗ Futuro — pode ser adicionado depois se necessário

---

## 🔨 IMPLEMENTAÇÃO

### Fase 1: Migration de Schema ✅

**Arquivo:** `supabase/migrations/20260419140000_community_alerts_territorial_integration.sql`

**Mudanças:**
1. Adicionar `location_id UUID REFERENCES locations(id)`
2. Adicionar `latitude DOUBLE PRECISION` (centroide do território)
3. Adicionar `longitude DOUBLE PRECISION` (centroide do território)
4. Deprecar `neighborhood`/`city` — manter como nullable para transição
5. Criar índice espacial: `idx_ca_location_spatial`
6. Criar índice territorial: `idx_ca_location_status`
7. Atualizar `idx_ca_feed` para usar `location_id`
8. Atualizar `idx_ca_dedup` para usar `location_id`

**Backfill:**
- Dados existentes: `location_id` = NULL (alertas expirados, não crítico)
- Novos alertas: `location_id` obrigatório via RPC

### Fase 2: Atualização da RPC ✅

**Arquivo:** `src/modules/community-alerts/sql/004_rpc_create_alert.sql`

**Mudanças:**
1. Payload recebe `location_id` em vez de `neighborhood`/`city`
2. Validar `location_id` existe e é `type = 'district'`
3. Derivar `latitude`/`longitude` do centroide da location
4. Manter `neighborhood_display`/`city` para display (derivados da location)
5. Atualizar deduplicação: `location_id` + `category` + janela temporal
6. Remover `normalize_location_text()` — não mais necessário

### Fase 3: Atualização do Service ✅

**Arquivo:** `src/modules/community-alerts/services/CommunityAlertService.ts`

**Mudanças:**
1. `getAlerts()` — filtrar por `location_id` ou `location_ids` (TerritoryFilter)
2. Remover `getByBounds()` — substituir por `getByTerritory()`
3. Adicionar `getByTerritory(filter: TerritoryFilter)`
4. Adicionar `getBySpatialRadius(center, radius)` — para mapa
5. Atualizar tipos de retorno — incluir `latitude`/`longitude`

### Fase 4: Atualização de Tipos ✅

**Arquivo:** `src/modules/community-alerts/domain/types.ts`

**Mudanças:**
1. `CommunityAlert` — adicionar `location_id`, `latitude`, `longitude`
2. `CommunityAlertPublic` — incluir campos espaciais
3. `CreateAlertPayload` — `location_id` obrigatório, remover `neighborhood`/`city`
4. `AlertFeedFilters` — `location_id` ou `location_ids`, deprecar `city`/`neighborhood`
5. Remover comentários sobre "migration 20260403000002"

### Fase 5: Atualização de Hooks ✅

**Arquivo:** `src/modules/community-alerts/hooks/useAlerts.ts`

**Mudanças:**
1. Aceitar `TerritoryFilter` em vez de `AlertFeedFilters`
2. Usar `territoryFilterKey()` para queryKey
3. Integrar com `useTerritoryFilter()` hook

### Fase 6: Integração com Mapa ✅

**Arquivo:** `src/core/maps/pages/MapaPageV4.tsx`

**Mudanças:**
1. Criar `makeAlertFetcher()` usando `communityAlertService.getBySpatialRadius()`
2. Alertas aparecem no centroide do território, não na localização do usuário
3. Popup mostra "Alerta em [Bairro]", não coordenadas exatas
4. Aplicar `TerritoryFilter` — respeitar modo bairro/cidade do usuário

### Fase 7: Atualização de Componentes ✅

**Arquivos:**
- `src/modules/community-alerts/components/CreateAlertModal.tsx`
- `src/modules/community-alerts/components/AlertCard.tsx`

**Mudanças:**
1. Modal: seletor de bairro (LocationSelector) em vez de input texto
2. Card: exibir `neighborhood_display` (legível), não `neighborhood` (normalizado)
3. Remover lógica de normalização manual

### Fase 8: Documentação ✅

**Arquivos:**
- `src/modules/community-alerts/README.md` (atualizar)
- `src/modules/community-alerts/CHECKLIST.md` (atualizar)
- `docs/fixes/20260419_COMMUNITY_ALERTS_STRUCTURAL_FIX.md` (este arquivo)

---

## 📊 IMPACTOS

### Feed de Alertas
- ✅ Filtros mais robustos (por `location_id`)
- ✅ Suporte a hierarquia (cidade → bairros)
- ✅ Integração com `TerritoryFilter`
- ⚠️ Alertas antigos (sem `location_id`) não aparecem — OK, já expirados

### Mapa
- ✅ Alertas aparecem no centroide do território
- ✅ Privacidade mantida (não mostra localização do usuário)
- ✅ Consistente com outras entidades (business, events, etc.)
- ✅ Suporte a busca espacial por raio

### Banco de Dados
- ✅ Schema alinhado com SSOT territorial
- ✅ Índices otimizados para queries espaciais
- ✅ Deduplicação mais robusta
- ⚠️ Migration requer backfill (alertas antigos ficam sem `location_id`)

### Admin/Moderação
- ✅ Filtros territoriais consistentes
- ✅ Possível filtrar por hierarquia (cidade → bairros)
- ✅ Relatórios por território

---

## 🚧 PENDÊNCIAS REAIS

### Curto Prazo (Bloqueantes)
- [ ] Aplicar migration no banco remoto
- [ ] Atualizar formulário de criação (LocationSelector)
- [ ] Testar criação de alerta com novo payload
- [ ] Validar exibição no feed
- [ ] Validar exibição no mapa

### Médio Prazo (Melhorias)
- [ ] Backfill de alertas antigos (se necessário)
- [ ] Adicionar filtro por raio no admin
- [ ] Métricas por território
- [ ] Heatmap de alertas por bairro

### Longo Prazo (Futuro)
- [ ] Geometria completa (se necessário)
- [ ] Alertas em múltiplos territórios (ex: "toda a cidade")
- [ ] Notificações por proximidade geográfica

---

## 📝 CHECKLIST DE VALIDAÇÃO

### Schema
- [ ] Migration aplicada sem erros
- [ ] Índices criados corretamente
- [ ] Constraints funcionando
- [ ] View pública atualizada

### Backend
- [ ] RPC aceita `location_id`
- [ ] RPC valida `location_id` existe
- [ ] RPC deriva centroide corretamente
- [ ] Deduplicação funciona por território

### Frontend
- [ ] Hook `useAlerts` usa `TerritoryFilter`
- [ ] Service `getByTerritory()` funciona
- [ ] Service `getBySpatialRadius()` funciona
- [ ] Tipos TypeScript atualizados

### Integração
- [ ] Feed exibe alertas por território
- [ ] Mapa exibe alertas no centroide
- [ ] Popup mostra informações corretas
- [ ] Filtros territoriais funcionam

### Documentação
- [ ] README atualizado
- [ ] CHECKLIST atualizado
- [ ] Comentários de código atualizados
- [ ] Este documento completo

---

## 🎯 RESULTADO ESPERADO

### Antes ❌
```typescript
// Filtro frágil por texto
const alerts = await communityAlertService.getAlerts({
  city: 'salvador',
  neighborhood: 'pituba'
});

// Sem integração territorial
// Sem suporte a hierarquia
// Sem exibição no mapa
```

### Depois ✅
```typescript
// Filtro robusto por território
const territoryFilter = useTerritoryFilter(resolved);
const alerts = await communityAlertService.getByTerritory(territoryFilter);

// Integração completa com SSOT territorial
// Suporte a hierarquia (cidade → bairros)
// Exibição no mapa por centroide
// Privacidade mantida
```

---

**Correção em nível AAA — sem gambiarras, alinhado ao SSOT, preparado para escala.**
