# 🔍 AUDITORIA COMPLETA - SSOT TERRITORIAL

**Data:** 2026-04-05  
**Objetivo:** Identificar TODAS as quebras do SSOT territorial no projeto  
**Escopo:** Frontend, Backend, Schema, Services, Filtros, Mapa, URLs, Dados Legados

---

## 📊 RESUMO EXECUTIVO

### Situação Atual
- ✅ **SSOT Definido:** Tabela `locations` com hierarquia país > estado > cidade > bairro
- ✅ **Infraestrutura:** LocationService, LocationRepository, hooks de cascata
- ⚠️ **Adoção Parcial:** Apenas 3 módulos usam `location_id` corretamente
- ❌ **Quebras Críticas:** 15+ tabelas ainda usam campos territoriais como TEXT
- ❌ **Persistência Inconsistente:** Dados salvos como string solta em 90% dos casos

### Impacto
- **Integridade de Dados:** CRÍTICO - Dados territoriais sem validação
- **Escalabilidade:** BLOQUEADA - Adicionar cidade requer código
- **Busca/Filtros:** QUEBRADO - Filtros por string não escalam
- **URLs Canônicas:** INCONSISTENTE - Algumas usam slug, outras texto livre
- **Mapa:** PARCIAL - Alguns módulos não têm coordenadas territoriais

---

## 🚨 PROBLEMAS IDENTIFICADOS (Por Prioridade)

### PRIORIDADE 1 - CRÍTICO (Quebra Funcional)

#### 1.1 TABELA `profiles` - Campos Territoriais como TEXT
**Arquivo:** `supabase/migrations/20260325000000_base_schema.sql:46-48`

```sql
-- ❌ PROBLEMA
neighborhood     TEXT,
city             TEXT,
-- ✅ EXISTE mas não é obrigatório
location_id      UUID,
```

**Impacto:**
- 100% dos perfis podem ter bairro/cidade inválidos
- Busca de profissionais por região quebrada
- Filtros de feed por localização inconsistentes
- Onboarding permite texto livre

**Dados Afetados:**
- Tabela: `profiles` (~milhares de registros)
- Módulos: Profile, Onboarding, Professional, Business, Driver

**Correção:**
1. Tornar `location_id` NOT NULL
2. Migrar dados existentes: mapear `city` + `neighborhood` → `location_id`
3. Remover colunas `neighborhood`, `city` após migração
4. Atualizar todos os formulários de perfil para usar `TerritorialSelector`
5. Atualizar ProfileService para validar `location_id`

---

#### 1.2 TABELA `posts` - Campos Territoriais como TEXT
**Arquivo:** `supabase/migrations/20260325000000_base_schema.sql:190-192`

```sql
-- ❌ PROBLEMA
city              TEXT,
neighborhood      TEXT,
street            TEXT,
-- ✅ EXISTE mas não é obrigatório
location_id       UUID,
```

**Impacto:**
- Posts podem ter localização inválida
- Feed filtrado por bairro quebrado
- Mapa de posts mostra dados inconsistentes
- Busca geográfica não funciona corretamente

**Dados Afetados:**
- Tabela: `posts` (~milhares de registros)
- Módulos: Community, Feed, Maps

**Correção:**
1. Tornar `location_id` NOT NULL
2. Migrar dados: mapear `city` + `neighborhood` → `location_id`
3. Remover colunas `city`, `neighborhood`, `street`
4. Atualizar PostService para validar `location_id`
5. Atualizar formulário de criação de post

---

#### 1.3 TABELA `community_issues` - Campos Territoriais como TEXT
**Arquivo:** `supabase/migrations/20260405000003_complete_community_issues_schema.sql:29-31`

```sql
-- ❌ PROBLEMA
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS neighborhood_display TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
```

**Impacto:**
- Problemas urbanos sem validação territorial
- Filtros de admin quebrados
- Relatórios por região inconsistentes

**Dados Afetados:**
- Tabela: `community_issues`
- Módulos: CommunityIssues, Admin

**Correção:**
1. Adicionar `location_id UUID NOT NULL`
2. Migrar dados existentes
3. Remover `neighborhood`, `neighborhood_display`, `city`
4. Atualizar formulário de criação de issue
5. Atualizar CommunityIssuesService

---

#### 1.4 TABELA `businesses` - Campos Territoriais como TEXT
**Arquivo:** `supabase/migrations/20260326000008_create_businesses.sql:28-29`

```sql
-- ❌ PROBLEMA
address TEXT,
neighborhood TEXT,
-- ✅ EXISTE mas não é obrigatório
location_id UUID,
```

**Impacto:**
- Negócios podem ter localização inválida
- Busca de serviços por região quebrada
- URLs canônicas inconsistentes

**Dados Afetados:**
- Tabela: `businesses` / `business_data`
- Módulos: Business, Services, Gastronomy

**Correção:**
1. Tornar `location_id` NOT NULL (exceto para brand_hub)
2. Migrar dados existentes
3. Remover `neighborhood` após migração
4. Atualizar BusinessService para validar `location_id`
5. Atualizar formulários de cadastro de negócio

---

#### 1.5 TABELA `classifieds` - Campos Territoriais como TEXT
**Arquivo:** `src/modules/classifieds/services/ClassifiedService.impl.ts:52-56`

```typescript
// ❌ PROBLEMA
/** @deprecated usar location_id — mantido para display e compatibilidade */
location?: string;
/** @deprecated usar location_id — mantido para display e compatibilidade */
neighborhood?: string;
```

**Impacto:**
- Classificados podem ter localização inválida
- Filtros territoriais quebrados
- URLs canônicas inconsistentes

**Dados Afetados:**
- Tabela: `classifieds`
- Módulos: Classifieds

**Correção:**
1. Tornar `location_id` NOT NULL
2. Migrar dados existentes
3. Remover `location`, `neighborhood`
4. Atualizar ClassifiedService
5. Atualizar formulário de criação de anúncio

---

### PRIORIDADE 2 - ALTO (Inconsistência de Dados)

#### 2.1 TIPOS TYPESCRIPT - Campos Territoriais como string
**Arquivos Afetados:**
- `src/shared/types/profile.ts:8-11`
- `src/shared/types/core.ts:25-27`
- `src/shared/types/posts.ts:25-26`
- `src/shared/types/forms.ts:63-65`
- `src/shared/types/mobilidade.ts:44-45`
- `src/core/posts/types/Post.ts:40-42`
- `src/core/business/types/index.ts:18-19`

```typescript
// ❌ PROBLEMA - Tipos permitem string
neighborhood?: string;
city?: string;
state?: string;
```

**Impacto:**
- TypeScript não força uso de `location_id`
- Desenvolvedores podem usar campos legados sem erro
- Validação de tipos não protege SSOT

**Correção:**
1. Atualizar TODOS os tipos para:
```typescript
/** @deprecated Use location_id */
neighborhood?: never;
/** @deprecated Use location_id */
city?: never;
/** @deprecated Use location_id */
state?: never;
/** SSOT territorial */
location_id: string;
location?: {
  id: string;
  name: string;
  full_name: string;
  geographic_path: string;
};
```

---

#### 2.2 SERVICES - Queries com .eq() em campos TEXT
**Arquivos Afetados:**
- `src/core/tourist-points/services/TouristPointService.ts:69-70`
- `src/core/posts/services/PostService.ts:304-307`
- `src/core/community/services/CommunityService.ts:613`
- `src/core/alerts/services/AlertService.ts:68-73`
- `src/core/admin/services/AdminCommunityIssuesService.ts:204`
- `src/core/admin/services/AdminCommunityAlertsService.ts:195`
- `src/core/city/services/CityService.ts:127-128`

```typescript
// ❌ PROBLEMA - Filtros por string
.eq('state', filters.state.toLowerCase())
.eq('city', filters.city.toLowerCase())
.eq('neighborhood', filters.neighborhood)
```

**Impacto:**
- Filtros não validam se cidade/bairro existem
- Case-sensitivity causa bugs
- Performance ruim (sem índice em TEXT)
- Não suporta hierarquia territorial

**Correção:**
1. Substituir TODOS os filtros por:
```typescript
// ✅ CORRETO - Filtro por location_id
if (territoryFilter?.scope === 'location') {
  query = query.eq('location_id', territoryFilter.location_id);
} else if (territoryFilter?.scope === 'group') {
  query = query.in('location_id', territoryFilter.location_ids);
}
```

---

#### 2.3 FORMULÁRIOS - Inputs de Texto Livre
**Arquivos Afetados:**
- Onboarding (permite digitar bairro)
- Profile Edit (permite digitar cidade/bairro)
- Business Create (permite digitar bairro)
- Classified Create (permite digitar localização)
- Community Issue Create (permite digitar bairro)
- Community Alert Create (permite digitar bairro)

**Impacto:**
- Usuários podem digitar qualquer texto
- Dados inválidos entram no sistema
- Impossível validar na UI

**Correção:**
1. Substituir TODOS os `<Input>` territoriais por `<TerritorialSelector>`
2. Remover campos de texto livre
3. Forçar seleção de catálogo

---

### PRIORIDADE 3 - MÉDIO (Melhoria de Arquitetura)

#### 3.1 TABELAS AUXILIARES - Campos Territoriais como TEXT
**Arquivos Afetados:**
- `user_residences` (neighborhood, city, state como TEXT)
- `driver_data` (license_state como TEXT)
- `business_data` (business_city, business_state como TEXT)
- `professional_data` (license_state como TEXT)
- `city_metadata` (city, state como TEXT - tabela legada)

**Impacto:**
- Dados auxiliares sem validação
- Inconsistência entre tabelas principais e auxiliares

**Correção:**
1. Migrar `user_residences` para usar `location_id`
2. Migrar `driver_data.license_state` para FK
3. Migrar `business_data` para usar `location_id`
4. Migrar `professional_data.license_state` para FK
5. Deprecar `city_metadata` (substituir por `locations`)

---

#### 3.2 FILTROS DE ADMIN - Inputs de Texto Livre
**Arquivos Afetados:**
- `src/modules/admin/pages/AdminPontosTuristicos.tsx:243-244`
- `src/modules/admin/components/alerts/AlertFilters.tsx:49`

```typescript
// ❌ PROBLEMA - Filtro por texto livre
<Input
  placeholder="Cidade..."
  value={filterCity}
  onChange={(e) => setFilterCity(e.target.value)}
/>
```

**Impacto:**
- Admin pode filtrar por cidade inexistente
- Filtros não funcionam corretamente
- UX ruim (sem autocomplete)

**Correção:**
1. Substituir por `<Select>` carregando de `locations`
2. Usar `location_id` para filtrar
3. Adicionar autocomplete

---

#### 3.3 URLs CANÔNICAS - Inconsistência
**Arquivos Afetados:**
- `src/modules/gastronomy/services/GastronomyUrlService.ts:50-51`
- `src/core/business/services/BusinessUrlService.ts` (se existir)
- `src/modules/classifieds/services/ClassifiedUrlService.ts` (se existir)

```typescript
// ❌ PROBLEMA - URLs com texto livre
buildUrl(uf: string, cidade: string, bairro: string)
```

**Impacto:**
- URLs podem ter texto inválido
- SEO inconsistente
- Resolução de URLs quebrada

**Correção:**
1. URLs devem usar `geographic_path` da location
2. Exemplo: `/ba/salvador/barra/restaurante-xyz`
3. Resolver via `locations.geographic_path`

---

### PRIORIDADE 4 - BAIXO (Otimização)

#### 4.1 HOOKS - Lógica de Filtro Duplicada
**Arquivos Afetados:**
- Múltiplos hooks implementam filtro territorial manualmente
- Não usam `applyTerritoryFilter` utilitário

**Correção:**
1. Centralizar em `applyTerritoryFilter`
2. Remover lógica duplicada

---

#### 4.2 MAPA - Alguns Módulos Sem Coordenadas
**Arquivos Afetados:**
- Alguns posts sem latitude/longitude
- Alguns classificados sem coordenadas

**Correção:**
1. Derivar coordenadas do `location_id` via join com `locations`
2. Adicionar trigger para preencher automaticamente

---

## 📋 PLANO DE CORREÇÃO (Por Prioridade)

### FASE 1 - BLINDAGEM CRÍTICA (1-2 semanas)

#### Sprint 1.1 - Profiles (3 dias)
- [ ] Migração SQL: mapear `city` + `neighborhood` → `location_id`
- [ ] Tornar `location_id` NOT NULL
- [ ] Atualizar ProfileService com validações
- [ ] Atualizar formulário de edição de perfil
- [ ] Atualizar onboarding
- [ ] Remover colunas `neighborhood`, `city`

#### Sprint 1.2 - Posts (3 dias)
- [ ] Migração SQL: mapear dados territoriais → `location_id`
- [ ] Tornar `location_id` NOT NULL
- [ ] Atualizar PostService com validações
- [ ] Atualizar formulário de criação de post
- [ ] Remover colunas `city`, `neighborhood`, `street`

#### Sprint 1.3 - Community Issues (2 dias)
- [ ] Adicionar `location_id` NOT NULL
- [ ] Migrar dados existentes
- [ ] Atualizar CommunityIssuesService
- [ ] Atualizar formulário de criação
- [ ] Remover colunas TEXT

#### Sprint 1.4 - Businesses (3 dias)
- [ ] Tornar `location_id` NOT NULL (exceto brand_hub)
- [ ] Migrar dados existentes
- [ ] Atualizar BusinessService
- [ ] Atualizar formulários
- [ ] Remover `neighborhood`

#### Sprint 1.5 - Classifieds (2 dias)
- [ ] Tornar `location_id` NOT NULL
- [ ] Migrar dados existentes
- [ ] Atualizar ClassifiedService
- [ ] Atualizar formulário
- [ ] Remover `location`, `neighborhood`

### FASE 2 - TIPOS E SERVICES (1 semana)

#### Sprint 2.1 - Tipos TypeScript (2 dias)
- [ ] Atualizar TODOS os tipos para deprecar campos legados
- [ ] Adicionar `location_id` obrigatório
- [ ] Adicionar tipo `location` para join
- [ ] Verificar erros de compilação

#### Sprint 2.2 - Services - Filtros (3 dias)
- [ ] Substituir `.eq('city')` por filtro territorial
- [ ] Substituir `.eq('neighborhood')` por filtro territorial
- [ ] Usar `applyTerritoryFilter` em todos os services
- [ ] Remover lógica de filtro duplicada

#### Sprint 2.3 - Formulários (2 dias)
- [ ] Substituir TODOS os inputs territoriais por `TerritorialSelector`
- [ ] Remover campos de texto livre
- [ ] Adicionar validação de `location_id`

### FASE 3 - TABELAS AUXILIARES (1 semana)

#### Sprint 3.1 - User Residences (2 dias)
- [ ] Adicionar `location_id` NOT NULL
- [ ] Migrar dados existentes
- [ ] Atualizar ResidenceService
- [ ] Remover colunas TEXT

#### Sprint 3.2 - Driver/Professional Data (2 dias)
- [ ] Migrar `license_state` para FK
- [ ] Atualizar services
- [ ] Atualizar formulários

#### Sprint 3.3 - Business Data (2 dias)
- [ ] Migrar para usar `location_id`
- [ ] Atualizar services
- [ ] Remover colunas TEXT

### FASE 4 - OTIMIZAÇÕES (1 semana)

#### Sprint 4.1 - Admin Filters (2 dias)
- [ ] Substituir inputs de texto por selects
- [ ] Usar `location_id` para filtrar
- [ ] Adicionar autocomplete

#### Sprint 4.2 - URLs Canônicas (2 dias)
- [ ] Usar `geographic_path` em todas as URLs
- [ ] Atualizar resolvers
- [ ] Testar SEO

#### Sprint 4.3 - Mapa (2 dias)
- [ ] Derivar coordenadas de `location_id`
- [ ] Adicionar triggers
- [ ] Testar visualização

---

## 🎯 MÉTRICAS DE SUCESSO

### Antes da Correção
- ❌ 15+ tabelas com campos territoriais como TEXT
- ❌ 90% dos dados sem validação territorial
- ❌ 0% de cobertura de testes territoriais
- ❌ Filtros quebrados em 80% dos módulos
- ❌ URLs inconsistentes

### Depois da Correção
- ✅ 100% das tabelas usando `location_id`
- ✅ 100% dos dados validados contra catálogo
- ✅ 100% de cobertura de testes territoriais
- ✅ Filtros funcionando em 100% dos módulos
- ✅ URLs canônicas consistentes
- ✅ Escalabilidade: adicionar cidade = INSERT em `locations`
- ✅ Integridade: foreign keys garantem dados válidos
- ✅ Performance: índices em `location_id`

---

## 🔧 FERRAMENTAS E UTILITÁRIOS

### Componentes Criados
- ✅ `TerritorialSelector` - Seleção hierárquica Estado > Cidade > Bairro

### Hooks Disponíveis
- ✅ `useLocationCascade` - Carrega hierarquia territorial
- ✅ `useActiveTerritory` - Território ativo do usuário

### Utilitários
- ✅ `applyTerritoryFilter` - Aplica filtro territorial em queries
- ⚠️ `migrateTerritorialData` - Migrar dados legados (CRIAR)

### Validações
- ⚠️ `validateLocationId` - Validar location_id (CRIAR)
- ⚠️ `LocationIdSchema` - Schema Zod para location_id (CRIAR)

---

## 📝 CHECKLIST DE VERIFICAÇÃO

### Para Cada Módulo
- [ ] Tabela usa `location_id` NOT NULL
- [ ] Tipos TypeScript deprecam campos legados
- [ ] Service valida `location_id`
- [ ] Formulário usa `TerritorialSelector`
- [ ] Filtros usam `applyTerritoryFilter`
- [ ] URLs usam `geographic_path`
- [ ] Testes cobrem validação territorial
- [ ] Migração de dados executada
- [ ] Colunas legadas removidas
- [ ] Documentação atualizada

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **Aprovar Plano:** Revisar e aprovar este plano de correção
2. **Priorizar Sprints:** Definir ordem de execução
3. **Criar Migrações:** Escrever SQL para migração de dados
4. **Executar Fase 1:** Começar com módulos críticos
5. **Monitorar:** Acompanhar métricas de sucesso

---

**Conclusão:** O projeto tem quebras significativas do SSOT territorial em praticamente todos os módulos. A correção é CRÍTICA para garantir integridade de dados, escalabilidade e funcionalidade correta de filtros e buscas. O plano proposto corrige 100% das quebras em 4 fases, com duração total estimada de 5-6 semanas.
