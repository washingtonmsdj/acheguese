# ETAPA 1 - RELATÓRIO DE DIAGNÓSTICO TÉCNICO INICIAL

**Data**: 04/04/2026  
**Objetivo**: Evolução do Mapa - Transformação em Ferramenta Territorial Inteligente  
**Status**: 🔍 DIAGNÓSTICO COMPLETO

---

## 📊 RESUMO EXECUTIVO

### Situação Geral

O projeto possui uma **arquitetura sólida e bem estruturada** com separação clara de responsabilidades. A base territorial (SSOT) está implementada e funcional. No entanto, **faltam capacidades geoespaciais avançadas** necessárias para transformar o mapa em uma ferramenta territorial inteligente.

**Pontos Fortes**:
- ✅ Arquitetura SSOT bem definida (Database → Services → Hooks → Components)
- ✅ PostGIS habilitado com funções básicas de resolução territorial
- ✅ Sistema territorial robusto (locations, territorial_groups, module_rollouts)
- ✅ Separação clara entre domínio (core) e UI (modules)
- ✅ Sem acesso direto ao Supabase em hooks ou componentes
- ✅ Provider abstraction para mapas (MapLibre)

**Lacunas Críticas**:
- ❌ Nenhuma busca por distância implementada
- ❌ Nenhum sistema de cobertura geográfica (service areas) funcional
- ❌ Nenhum serviço de geocoding/reverse geocoding centralizado
- ❌ Nenhum clustering de marcadores no mapa
- ❌ Coordenadas geográficas espalhadas em múltiplas tabelas sem padrão único
- ❌ Falta de índices espaciais em tabelas críticas

---

## 1. ESTADO ATUAL - ESTRUTURA DE DADOS GEOGRÁFICOS

### 1.1 Tabelas com Coordenadas Geográficas

#### ✅ Tabelas com Suporte PostGIS

| Tabela | Campos Geográficos | Índice Espacial | Status |
|--------|-------------------|-----------------|--------|
| `locations` | `boundary GEOMETRY(POLYGON, 4326)` | ✅ `idx_locations_boundary_gist` | Funcional |
| `addresses` | `point GEOMETRY(POINT, 4326)`, `latitude`, `longitude` | ✅ `idx_addresses_point_gist` | Funcional |
| `driver_data` | `current_location GEOMETRY(POINT, 4326)` | ✅ `idx_driver_location` | Funcional |

#### ⚠️ Tabelas com Coordenadas Simples (Sem PostGIS)

| Tabela | Campos | Índice Espacial | Problema |
|--------|--------|-----------------|----------|
| `business_data` | `latitude`, `longitude` (legado) | ❌ | Sem índice espacial, sem busca por distância |
| `professional_data` | `metadata.location.latitude/longitude` (legado) | ❌ | Dados em JSONB, sem índice espacial |
| `classifieds` | `latitude`, `longitude` | ❌ | Sem índice espacial, sem busca por distância |
| `events` | `latitude`, `longitude`, `coordinate_source` | ⚠️ `idx_events_coordinates` (B-tree) | Índice não espacial |
| `community_alerts` | `latitude`, `longitude`, `coordinate_source` | ⚠️ `idx_community_alerts_coordinates` (B-tree) | Índice não espacial |
| `tourist_points` | `latitude`, `longitude` (legado) | ❌ | Sem índice espacial |
| `gastronomy_places` | `latitude`, `longitude` | ❌ | Sem índice espacial |

### 1.2 Análise de Coordenadas

**Padrão Atual**:
- Coordenadas armazenadas como `DECIMAL(10, 7)` ou `NUMERIC`
- Sem tipo geográfico unificado
- Sem sincronização automática com geometria PostGIS
- Índices B-tree comuns (não espaciais) ou ausentes

**Problema**:
- Impossível fazer busca eficiente por distância
- Impossível usar funções PostGIS (ST_Distance, ST_DWithin)
- Performance ruim em queries espaciais
- Sem suporte a raio de busca

### 1.3 Funções PostGIS Existentes

```sql
-- ✅ Implementadas
resolve_point_to_location(lat, lng, type)
resolve_point_to_location_with_fallback(lat, lng, type)
sync_address_point() -- trigger automático

-- ❌ Faltando
ST_DWithin para busca por raio
ST_Distance para ordenação por proximidade
Funções de clustering espacial
Funções de área de cobertura
```

---

## 2. SISTEMA TERRITORIAL ATUAL

### 2.1 Hierarquia Territorial (SSOT)

**Estrutura**:
```
locations (SSOT territorial)
├── country (Brasil)
│   └── state (Bahia)
│       └── city (Salvador)
│           └── district (Pituba, Barra, etc)
```

**Campos Principais**:
- `id` (UUID)
- `parent_id` (hierarquia)
- `type` (country, state, city, district)
- `slug` (identificador único)
- `geographic_path` (ex: `/br/ba/salvador/pituba`)
- `boundary` (GEOMETRY POLYGON) - polígono territorial
- `metadata` (JSONB) - inclui `canonical_lat/lng` para centroide

**Status**: ✅ Funcional e bem estruturado

### 2.2 Grupos Territoriais

**Tabela**: `territorial_groups`

**Propósito**: Agrupar bairros funcionalmente (ex: "Orla de Salvador", "Zona Turística")

**Relacionamento**: `territorial_group_members` (N:N com locations)

**Status**: ✅ Implementado e funcional

### 2.3 Rollout de Módulos

**Tabela**: `module_rollouts`

**Propósito**: Controlar quais módulos estão ativos em cada território

**Status**: ✅ Implementado e funcional

### 2.4 Filtro Territorial

**Hook**: `useTerritoryFilter`

**Lógica**:
- Modo 'bairro': filtra pelo bairro do usuário
- Modo 'cidade': permite navegação por bairros da cidade
- Contexto de rota: grupos ou visitantes

**Status**: ✅ Funcional, mas **não integrado com busca por distância**

---

## 3. SERVIÇOS E CAMADAS (SSOT)

### 3.1 Services Existentes

#### ✅ Core Services Bem Estruturados

| Service | Responsabilidade | Status |
|---------|-----------------|--------|
| `LocationService` | CRUD de locations, hierarquia territorial | ✅ Completo |
| `TerritorialGroupService` | Gerenciamento de grupos territoriais | ✅ Completo |
| `GeospatialService` | Resolução ponto→território, boundaries | ⚠️ Básico |
| `MapEntityProjectionService` | Transformação entidade→MapMarker | ✅ Completo |
| `MapViewportService` | Cálculos espaciais, viewports | ✅ Completo |
| `NeighborhoodBoundaryService` | Polígonos customizados de bairros | ✅ Completo |

#### ❌ Services Faltando (CRÍTICO)

| Service Necessário | Responsabilidade | Prioridade |
|-------------------|-----------------|------------|
| `SpatialSearchService` | Busca por distância, raio, proximidade | 🔴 CRÍTICA |
| `CoverageService` | Área de cobertura de entidades | 🔴 CRÍTICA |
| `GeocodingService` | Geocoding/reverse geocoding centralizado | 🔴 CRÍTICA |
| `ClusteringService` | Clustering de marcadores no mapa | 🟡 ALTA |

### 3.2 Padrão SSOT Atual

**Fluxo Correto**:
```
Database (Supabase)
    ↓
Repository (IRepository)
    ↓
Service (Business Logic)
    ↓
Hook (React Query)
    ↓
Component (UI)
```

**Verificação**:
- ✅ Nenhum acesso direto ao Supabase em hooks
- ✅ Nenhum acesso direto ao Supabase em componentes
- ✅ Separação clara de responsabilidades
- ✅ Repositories implementam interfaces

**Problema**:
- ⚠️ Alguns services usam `as any` para contornar tipos
- ⚠️ `SessionService` tem `@ts-nocheck`
- ⚠️ Existe `untyped-client.ts` exportando `supabase as any`

---

## 4. MAPA ATUAL

### 4.1 Componentes de Mapa

**Arquitetura**:
```
MapLibreAdapter (v3)
├── Provider Abstraction
├── Viewport Management
├── Marker Rendering
└── Territory Polygons
```

**Status**: ✅ Bem estruturado, provider-agnostic

### 4.2 Renderização de Marcadores

**Implementação Atual**:
- Marcadores renderizados via `maplibregl.Marker`
- Diffing por ID para performance
- Configuração centralizada em `markerConfig.ts`
- Suporte a múltiplos tipos (business, service, classified, event, alert, etc)

**Problema**:
- ❌ Nenhum clustering implementado
- ❌ Todos os marcadores renderizados individualmente
- ❌ Performance ruim com muitos marcadores (>100)
- ❌ Poluição visual em zoom baixo

### 4.3 Filtros no Mapa

**Filtros Implementados**:
- ✅ Filtro territorial (bairro/cidade/grupo)
- ✅ Filtro por tipo de entidade (camadas)
- ✅ Busca por texto

**Filtros Faltando**:
- ❌ Filtro por distância/raio
- ❌ Ordenação por proximidade
- ❌ Filtro por área de cobertura

### 4.4 Controles do Mapa

**Implementados**:
- ✅ `MapSearchControl` - busca por texto
- ✅ `MapLocationControl` - geolocalização do usuário
- ✅ `MapLayerControl` - toggle de camadas
- ✅ `MapTerritoryControl` - informações territoriais

**Faltando**:
- ❌ Controle de raio de busca
- ❌ Controle de clustering
- ❌ Controle de área de cobertura

---

## 5. HOOKS GEOGRÁFICOS

### 5.1 Hooks Existentes

| Hook | Responsabilidade | Acesso Direto ao DB? |
|------|-----------------|---------------------|
| `useActiveTerritory` | Território ativo do usuário | ❌ Não (usa store) |
| `useTerritoryFilter` | Filtro territorial para queries | ❌ Não (usa store) |
| `useUserTerritory` | Território do usuário logado | ❌ Não (usa service) |
| `useCityNeighborhoodsPolygons` | Polígonos de bairros | ❌ Não (usa repository) |
| `useTerritoryPolygon` | Polígono de território único | ❌ Não (usa service) |

**Status**: ✅ Todos os hooks seguem SSOT, nenhum acesso direto ao banco

### 5.2 Hooks Faltando (CRÍTICO)

| Hook Necessário | Responsabilidade | Prioridade |
|----------------|-----------------|------------|
| `useSpatialSearch` | Busca por distância/raio | 🔴 CRÍTICA |
| `useNearbyEntities` | Entidades próximas ao usuário | 🔴 CRÍTICA |
| `useCoverageCheck` | Verificar cobertura de entidade | 🔴 CRÍTICA |
| `useGeocode` | Geocoding de endereço | 🔴 CRÍTICA |
| `useReverseGeocode` | Reverse geocoding de coordenadas | 🔴 CRÍTICA |

---

## 6. PROBLEMAS E GAMBIARRAS

### 6.1 Gambiarras Reais Encontradas

#### 🔴 CRÍTICO: Untyped Supabase Client

**Arquivo**: `src/integrations/supabase/untyped-client.ts`

```typescript
export const db = supabase as any;
```

**Impacto**: Perde type safety completo do Supabase

**Solução**: Remover arquivo e usar cliente tipado

#### 🟡 MÉDIO: SessionService com @ts-nocheck

**Arquivo**: `src/core/session/services/SessionService.ts`

**Impacto**: Service crítico sem verificação de tipos

**Solução**: Adicionar tipos explícitos

#### 🟡 MÉDIO: Type Casting Excessivo

**Arquivos**: Mobility services (ChatService, DriverService, RideService)

**Impacto**: Múltiplos `as any` para contornar tipos

**Solução**: Refatorar tipos e interfaces

### 6.2 Uso de `any` em Core

**Ocorrências**: 50+ em `src/core/**/*.ts`

**Maioria Justificada**:
- Payloads dinâmicos de update
- Dados de terceiros (Nominatim, OSM)
- Metadados flexíveis (JSONB)

**Alguns Injustificados**:
- `TerritorialHighlightRepositorySupabase`: `const db: any = supabase`
- Vários services com `error: any` em catch blocks

### 6.3 Lógica Duplicada

**Não encontrada**: O projeto está bem estruturado, sem duplicação significativa de lógica geográfica.

### 6.4 Dados Hardcoded

**Encontrados**:
- `EmpresaExemplo.ts` - dados de exemplo (legítimo para testes)
- `ExamplePostPage.tsx` - página de demonstração (legítimo)
- Coordenadas padrão em `MapLibreAdapter`: `[-38.5014, -12.9714]` (Salvador)

**Status**: ✅ Todos legítimos ou documentados

---

## 7. LACUNAS TÉCNICAS CRÍTICAS

### 7.1 Busca por Distância (PRIORIDADE MÁXIMA)

**Status Atual**: ❌ NÃO EXISTE

**O que falta**:
1. Adicionar coluna `point GEOMETRY(POINT, 4326)` em todas as tabelas com coordenadas
2. Criar índices espaciais GiST
3. Criar triggers de sincronização `latitude/longitude ↔ point`
4. Implementar `SpatialSearchService` com:
   - `searchByRadius(lat, lng, radiusKm, entityType)`
   - `searchByBounds(bbox, entityType)`
   - `orderByProximity(lat, lng, entities)`
5. Criar hooks:
   - `useSpatialSearch`
   - `useNearbyEntities`
6. Integrar com filtro territorial existente

**Entidades Afetadas**:
- `business_data`
- `professional_data`
- `classifieds`
- `events`
- `community_alerts`
- `tourist_points`
- `gastronomy_places`
- `driver_data` (já tem geometry)

### 7.2 Área de Cobertura (PRIORIDADE MÁXIMA)

**Status Atual**: ⚠️ TABELA EXISTE MAS NÃO É USADA

**Tabela Existente**: `service_areas`

**O que falta**:
1. Implementar `CoverageService` com:
   - `checkCoverage(entityId, userLat, userLng)`
   - `getCoverageAreas(entityId)`
   - `setCoverageByRadius(entityId, lat, lng, radiusKm)`
   - `setCoverageByLocations(entityId, locationIds)`
2. Criar hooks:
   - `useCoverageCheck`
   - `useEntityCoverage`
3. Integrar com UI:
   - Badge "Atende sua região"
   - Badge "Fora da área de cobertura"
4. Integrar com busca espacial

**Entidades Afetadas**:
- `business_data`
- `professional_data`
- `driver_data`
- `classifieds` (quando aplicável)

### 7.3 Geocoding/Reverse Geocoding (PRIORIDADE MÁXIMA)

**Status Atual**: ⚠️ IMPLEMENTAÇÃO FRAGMENTADA

**Implementações Existentes**:
- `GeocodingService` em `src/core/maps/services/GeocodingService.ts`
- Usa Nominatim via proxy Supabase
- Não é SSOT (usado apenas em alguns lugares)

**O que falta**:
1. Consolidar `GeocodingService` como SSOT único
2. Adicionar cache local/persistência
3. Adicionar tratamento robusto de falhas
4. Normalizar resposta
5. Criar hooks:
   - `useGeocode`
   - `useReverseGeocode`
6. Documentar como outros módulos devem consumir
7. Integrar com cadastros:
   - Cadastro de empresa
   - Cadastro de serviço
   - Cadastro de classificado
   - Cadastro de evento
   - Seletor de localização do usuário

### 7.4 Clustering de Marcadores (PRIORIDADE ALTA)

**Status Atual**: ❌ NÃO EXISTE

**O que falta**:
1. Escolher estratégia de clustering:
   - Opção A: Clustering client-side (Supercluster.js)
   - Opção B: Clustering server-side (PostGIS ST_ClusterKMeans)
2. Implementar `ClusteringService` ou adapter
3. Integrar com `MapLibreAdapter`
4. Renderizar clusters com contagem
5. Desdobrar clusters ao aproximar zoom
6. Manter compatibilidade com filtros territoriais

**Recomendação**: Clustering client-side com Supercluster.js (mais simples e performático para escala atual)

---

## 8. DEPENDÊNCIAS TÉCNICAS

### 8.1 Dependências Externas

**Já Instaladas**:
- ✅ `maplibre-gl` - renderização de mapas
- ✅ `@supabase/supabase-js` - cliente Supabase
- ✅ `react-query` - gerenciamento de estado assíncrono

**Necessárias**:
- ❌ `supercluster` - clustering de marcadores
- ❌ `@turf/turf` (opcional) - operações geoespaciais client-side

### 8.2 Dependências Internas

**Ordem de Implementação**:
1. Migrations (adicionar geometrias e índices)
2. Services (SpatialSearchService, CoverageService, GeocodingService)
3. Hooks (useSpatialSearch, useCoverageCheck, useGeocode)
4. Componentes (controles de mapa, badges de cobertura)
5. Integração com páginas existentes

---

## 9. RISCOS IDENTIFICADOS

### 9.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Performance com muitos marcadores | Alta | Alto | Implementar clustering obrigatório |
| Migração de coordenadas quebrar dados existentes | Média | Crítico | Migrations com validação e rollback |
| Geocoding Nominatim com rate limit | Média | Médio | Cache agressivo + fallback |
| Índices espaciais impactarem performance de escrita | Baixa | Baixo | Monitorar após deploy |

### 9.2 Riscos de Arquitetura

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Quebrar SSOT ao adicionar lógica espacial | Baixa | Alto | Code review rigoroso |
| Duplicar lógica geográfica em módulos | Média | Médio | Documentação clara + exemplos |
| Incompatibilidade com sistema territorial existente | Baixa | Alto | Testes de integração |

### 9.3 Riscos de Produto

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Usuários não entenderem busca por distância | Média | Médio | UI clara + onboarding |
| Cobertura mal configurada por empresas | Alta | Médio | Validação + sugestões automáticas |
| Clustering esconder entidades relevantes | Média | Médio | Zoom automático + preview |

---

## 10. PRÓXIMOS PASSOS

### 10.1 Ordem de Execução Recomendada

1. ✅ **Diagnóstico Técnico** (CONCLUÍDO)
2. 🔄 **Modelagem e Migrations** (PRÓXIMO)
   - Adicionar geometrias PostGIS
   - Criar índices espaciais
   - Triggers de sincronização
3. 🔄 **Services Centrais**
   - SpatialSearchService
   - CoverageService
   - GeocodingService (consolidar)
4. 🔄 **Hooks**
   - useSpatialSearch
   - useCoverageCheck
   - useGeocode/useReverseGeocode
5. 🔄 **Integração com Mapa**
   - Clustering
   - Controles de raio
   - Badges de cobertura
6. 🔄 **Integração com Filtros/Listagens**
   - Ordenação por proximidade
   - Filtro por distância
7. 🔄 **Documentação**
   - Guia de uso
   - Exemplos
   - Anti-padrões
8. 🔄 **Relatório Final**

### 10.2 Estimativa de Esforço

| Fase | Complexidade | Tempo Estimado |
|------|-------------|----------------|
| Migrations | Média | 2-3 horas |
| Services | Alta | 4-6 horas |
| Hooks | Média | 2-3 horas |
| Integração Mapa | Alta | 3-4 horas |
| Integração Listagens | Média | 2-3 horas |
| Documentação | Baixa | 1-2 horas |
| **TOTAL** | - | **14-21 horas** |

---

## 11. CONCLUSÃO

### 11.1 Resumo da Situação

O projeto possui uma **base arquitetural sólida** com SSOT bem implementado, mas **carece de capacidades geoespaciais avançadas** necessárias para transformar o mapa em uma ferramenta territorial inteligente.

**Principais Lacunas**:
1. ❌ Nenhuma busca por distância
2. ❌ Sistema de cobertura não funcional
3. ❌ Geocoding fragmentado
4. ❌ Nenhum clustering de marcadores

### 11.2 Viabilidade da ETAPA 1

**Viabilidade**: ✅ ALTA

**Justificativa**:
- Arquitetura preparada para extensão
- PostGIS já habilitado
- Padrão SSOT estabelecido
- Sem gambiarras críticas bloqueantes
- Equipe familiarizada com o código

### 11.3 Recomendação

**Prosseguir com a implementação da ETAPA 1** seguindo rigorosamente:
- Padrão SSOT (Database → Service → Hooks → Components)
- Migrations seguras com validação
- Services centralizados e reutilizáveis
- Documentação completa
- Testes de integração

**Próximo Passo**: Iniciar modelagem e migrations.

---

**Relatório elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Versão**: 1.0
