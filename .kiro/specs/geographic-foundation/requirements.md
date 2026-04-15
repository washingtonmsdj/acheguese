# Requirements Document - Geographic Foundation

## Document Metadata

- **Version**: 2.0.0
- **Created**: 2026-03-24
- **Status**: Canonical
- **Previous Version**: 1.0.0
- **Change Summary**: Resolved contradictions, closed structural decisions, defined canonical contracts

---

## Canonical Decisions

Esta seção documenta todas as decisões estruturais fechadas que eliminam ambiguidades e contradições do documento anterior.

### Decision 1: Geographic Path Strategy

**Decision**: Geographic paths usam códigos ISO para país/estado e slugs para cidade/bairro.

**Format**: `/br/ba/salvador/pituba`

**Rationale**:
- Códigos ISO são estáveis e internacionalmente reconhecidos
- Slugs para cidade/bairro permitem URLs amigáveis
- Híbrido balanceia estabilidade com legibilidade

**Implementation**:
- `geographic_path` é **persistido** no banco de dados
- Atualização em cascata quando slug de cidade/bairro muda
- Índice único em `geographic_path` para consultas rápidas

### Decision 2: Slug Resolution Strategy

**Decision**: Abandonar slug único global. Implementar três métodos de resolução:

1. `resolveById(location_id)` - Resolução por ID (primária)
2. `resolveByPath(geographic_path)` - Resolução por path completo
3. `resolveBySlugWithinParent(slug, parent_id)` - Resolução por slug dentro de parent

**Rationale**:
- Bairros com mesmo nome existem em cidades diferentes (ex: "Centro" em Salvador e "Centro" em São Paulo)
- Slug único global é impossível de manter
- Path completo garante unicidade

**Examples**:
```typescript
// Mesmo slug, paths diferentes
resolveByPath('/br/ba/salvador/centro')  // Centro de Salvador
resolveByPath('/br/sp/sao-paulo/centro') // Centro de São Paulo

// Resolução dentro de parent
resolveBySlugWithinParent('centro', salvador_id)  // Centro de Salvador
```

### Decision 3: Ownership Model for Service Areas

**Decision**: Service areas usam `owner_profile_id` (não `entity_type/entity_id`).

**Rationale**:
- Consistente com padrão SSOT do projeto (profile-centric architecture)
- Simplifica queries e joins
- Elimina polimorfismo complexo

**Schema**:
```sql
CREATE TABLE service_areas (
  id UUID PRIMARY KEY,
  owner_profile_id UUID NOT NULL REFERENCES profiles(id),
  location_id UUID NOT NULL REFERENCES locations(id),
  coverage_type TEXT NOT NULL CHECK (coverage_type IN ('district', 'city', 'radius_km')),
  radius_km DECIMAL,
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Decision 4: Descendant Limit Removed

**Decision**: Remover invariant `count(getDescendants(L.id)) <= 1000`.

**Rationale**:
- Não é invariante de domínio (é limite de performance)
- Implementar via paginação em runtime
- Permitir cidades grandes (São Paulo tem 96 distritos)

**Implementation**:
```typescript
// API com paginação
getDescendants(locationId, { limit: 100, offset: 0 })
```

### Decision 5: Geographic Path Persistence

**Decision**: `geographic_path` é **persistido** no banco de dados.

**Rationale**:
- Performance: evita reconstrução em toda query
- Simplicidade: índice único garante unicidade
- Consistência: atualização em cascata quando slug muda

**Update Strategy**:
```sql
-- Trigger para atualizar paths em cascata
CREATE OR REPLACE FUNCTION update_geographic_paths()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar path da localização modificada
  NEW.geographic_path := build_path(NEW.id);
  
  -- Atualizar paths de todos os descendentes
  UPDATE locations
  SET geographic_path = build_path(id)
  WHERE parent_id = NEW.id OR parent_id IN (
    SELECT id FROM locations WHERE parent_id = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Decision 6: Active vs Launch vs Soft Delete

**Decision**: Separar claramente três conceitos:

1. **`is_active`**: Localização está operacional (pode ser selecionada por usuários)
2. **`is_launch_area`**: Área onde sistema foi lançado (rollout inicial)
3. **`deleted_at`**: Soft delete para auditoria (localização removida)

**Semantics**:
- `is_active = false`: Localização temporariamente desativada (manutenção, problemas)
- `is_launch_area = true`: Área prioritária para rollout de novos módulos
- `deleted_at != null`: Localização removida (não deve aparecer em queries)

**Query Pattern**:
```sql
-- Localizações disponíveis
SELECT * FROM locations WHERE is_active = true AND deleted_at IS NULL;

-- Áreas de lançamento
SELECT * FROM locations WHERE is_launch_area = true AND is_active = true;
```

### Decision 7: Rollout Inheritance with Explicit Precedence

**Decision**: Herança de rollout com precedência explícita:

1. **Override local**: Rollout específico da localização tem prioridade máxima
2. **Fallback hierárquico**: Se não existe rollout local, herda do ancestor mais próximo
3. **Default false**: Se nenhum rollout existe na hierarquia, módulo está desabilitado
4. **Location inativa bloqueia**: `is_active = false` sempre desabilita todos os módulos

**Precedence Rules**:
```typescript
function isModuleEnabled(moduleKey: string, locationId: string): boolean {
  const location = getLocation(locationId);
  
  // Regra 4: Location inativa bloqueia tudo
  if (!location.is_active) return false;
  
  // Regra 1: Override local
  const localRollout = getRollout(moduleKey, locationId);
  if (localRollout) return localRollout.is_enabled;
  
  // Regra 2: Fallback hierárquico
  const ancestors = getAncestors(locationId);
  for (const ancestor of ancestors) {
    const ancestorRollout = getRollout(moduleKey, ancestor.id);
    if (ancestorRollout) return ancestorRollout.is_enabled;
  }
  
  // Regra 3: Default false
  return false;
}
```

**Interaction with `is_launch_area`**:
- `is_launch_area = true`: Sugere que módulos devem ser habilitados (não força)
- Rollout explícito sempre tem precedência sobre `is_launch_area`
- `is_launch_area` é hint para admins, não regra de negócio

### Decision 8: Radius Coverage Strategy

**Decision**: MVP usa Haversine simplificado. PostGIS é otimização futura.

**MVP Implementation**:
```typescript
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function coversLocation(serviceArea: ServiceArea, targetLocation: Location): boolean {
  if (serviceArea.coverage_type === 'radius_km') {
    const distance = haversineDistance(
      serviceArea.location.latitude,
      serviceArea.location.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );
    return distance <= serviceArea.radius_km;
  }
  // ... outros tipos
}
```

**Future Optimization**:
- Migrar para PostGIS quando performance for crítica
- Adicionar índices espaciais (GiST)
- Manter contrato da API inalterado

### Decision 9: Authorization Model

**Decision**: Autorização baseada em roles e ownership.

**Who Can Do What**:

| Action | Who Can |
|--------|---------|
| Create location | Admin users only |
| Edit location | Admin users only |
| Edit rollout | Admin users only |
| Create service_area | Profile owner (via `owner_profile_id`) |
| Edit service_area | Profile owner only |
| Create content in location | Any user with active profile in active location |
| Select location context | Any user (if location is active) |

**Implementation**:
```typescript
// Verificar se pode criar conteúdo em localização
function canCreateContentInLocation(profileId: string, locationId: string): boolean {
  const location = getLocation(locationId);
  if (!location.is_active) return false;
  
  const profile = getProfile(profileId);
  if (!profile.is_active) return false;
  
  return true;
}

// Verificar se pode editar service_area
function canEditServiceArea(profileId: string, serviceAreaId: string): boolean {
  const serviceArea = getServiceArea(serviceAreaId);
  return serviceArea.owner_profile_id === profileId;
}
```

### Decision 10: Public API Contracts

**Decision**: Definir contratos públicos explícitos para cada módulo.

**core/location API**:
```typescript
interface LocationAPI {
  // Resolução
  resolveById(locationId: string): Promise<Location>;
  resolveByPath(geographicPath: string): Promise<Location>;
  resolveBySlugWithinParent(slug: string, parentId: string): Promise<Location>;
  
  // Hierarquia
  getAncestors(locationId: string): Promise<Location[]>;
  getDescendants(locationId: string, options?: PaginationOptions): Promise<Location[]>;
  getChildren(locationId: string): Promise<Location[]>;
  
  // Contexto
  setLocationContext(locationId: string): Promise<void>;
  getLocationContext(): Location | null;
  
  // Validação
  isLocationActive(locationId: string): Promise<boolean>;
  canCreateContentInLocation(profileId: string, locationId: string): Promise<boolean>;
}
```

**core/coverage API**:
```typescript
interface CoverageAPI {
  // Service Areas
  createServiceArea(data: CreateServiceAreaData): Promise<ServiceArea>;
  updateServiceArea(serviceAreaId: string, data: UpdateServiceAreaData): Promise<ServiceArea>;
  deleteServiceArea(serviceAreaId: string): Promise<void>;
  
  // Consultas
  getServiceAreasForProfile(profileId: string): Promise<ServiceArea[]>;
  getPrimaryServiceArea(profileId: string): Promise<ServiceArea | null>;
  
  // Cobertura
  coversLocation(profileId: string, locationId: string): Promise<boolean>;
  getProfilesCoveringLocation(locationId: string): Promise<string[]>;
}
```

**core/rollout API**:
```typescript
interface RolloutAPI {
  // Consultas
  isModuleEnabled(moduleKey: string, locationId: string): Promise<boolean>;
  getEnabledModules(locationId: string): Promise<string[]>;
  getModuleConfig(moduleKey: string, locationId: string): Promise<Record<string, any> | null>;
  
  // Administração (admin only)
  setModuleRollout(moduleKey: string, locationId: string, isEnabled: boolean, config?: Record<string, any>): Promise<void>;
  deleteModuleRollout(moduleKey: string, locationId: string): Promise<void>;
}
```

### Decision 11: Module Key vs Route Segment

**Decision**: `module_key` é identificador interno. Não há mapeamento para route segments.

**Module Keys** (internal):
- `community`
- `business`
- `services`
- `mobility`
- `classifieds`
- `ads`

**Route Segments** (public URLs):
- `/comunidade`
- `/empresas`
- `/servicos`
- `/mobilidade`
- `/classificados`
- `/anuncios`

**Mapping**:
```typescript
const MODULE_ROUTE_MAP: Record<string, string> = {
  'community': 'comunidade',
  'business': 'empresas',
  'services': 'servicos',
  'mobility': 'mobilidade',
  'classifieds': 'classificados',
  'ads': 'anuncios',
};

function getRouteForModule(moduleKey: string): string {
  return MODULE_ROUTE_MAP[moduleKey] || moduleKey;
}
```

### Decision 12: Document Metadata Standards

**Decision**: Todos os documentos de spec seguem metadata padrão.

**Required Fields**:
- `Version`: Semantic versioning (MAJOR.MINOR.PATCH)
- `Created`: Data de criação (YYYY-MM-DD)
- `Status`: Draft | Review | Canonical | Deprecated
- `Previous Version`: Versão anterior (se aplicável)
- `Change Summary`: Resumo de mudanças (se aplicável)

---

## Introduction

Este documento define os requisitos canônicos para a fundação geográfica escalável do sistema, projetada para suportar expansão gradual começando por 4 bairros de Salvador, mas com arquitetura preparada para escala nacional (Brasil).

A fundação geográfica é uma infraestrutura transversal crítica que fornece:
- Hierarquia geográfica padronizada (país > estado > cidade > bairro)
- Sistema de cobertura de serviços por localização
- Controle de rollout gradual de módulos por área geográfica
- Single Source of Truth (SSOT) para dados geográficos

Esta infraestrutura elimina hardcoding de localizações e permite que todos os módulos de domínio (community, business, services, mobility, classifieds) compartilhem a mesma base geográfica sem duplicação.

## Glossary

- **Location_System**: Sistema de hierarquia geográfica que gerencia países, estados, cidades e bairros
- **Coverage_System**: Sistema que gerencia áreas de atuação/cobertura de profiles (profissionais, empresas, motoristas)
- **Rollout_System**: Sistema que controla ativação/desativação de módulos por localização
- **Geographic_Hierarchy**: Estrutura hierárquica: country > state > city > district (bairro)
- **Location_Slug**: Identificador em formato kebab-case para cada localização, único dentro do parent (ex: "pituba", "salvador", "bahia")
- **Geographic_Path**: Caminho completo persistido de uma localização usando códigos ISO para país/estado e slugs para cidade/bairro (ex: "/br/ba/salvador/pituba")
- **Service_Area**: Área de cobertura onde um profile pode atuar, referenciada por owner_profile_id
- **Launch_Area**: Área geográfica onde o sistema foi inicialmente lançado (is_launch_area = true)
- **Module_Rollout**: Ativação controlada de um módulo específico em uma localização com herança hierárquica
- **Location_Context**: Localização atualmente selecionada pelo usuário no aplicativo durante a sessão
- **Primary_Location**: Localização principal de um profile (residência, sede, área primária de atuação)
- **Coverage_Type**: Tipo de cobertura (district, city, radius_km)
- **Domain_Module**: Módulo de domínio do produto identificado por module_key (community, business, services, mobility, classifieds, ads)
- **Module_Key**: Identificador interno de módulo usado no sistema de rollout
- **Route_Segment**: Segmento de URL pública para módulo (ex: "comunidade" para module_key "community")

## Requirements

### Requirement 1: Hierarquia Geográfica

**User Story:** Como desenvolvedor do sistema, eu quero uma hierarquia geográfica padronizada, para que todos os módulos usem a mesma estrutura de localização sem duplicação.

#### Acceptance Criteria

1. THE Location_System SHALL armazenar localizações em estrutura hierárquica de 4 níveis: country > state > city > district
2. WHEN uma localização é criada, THE Location_System SHALL validar que o parent_id corresponde ao nível hierárquico correto
3. THE Location_System SHALL gerar automaticamente um slug único em formato kebab-case para cada localização
4. THE Location_System SHALL gerar automaticamente o geographic_path completo baseado na hierarquia (ex: "/br/ba/salvador/pituba")
5. THE Location_System SHALL armazenar coordenadas geográficas (latitude, longitude) para cada localização
6. THE Location_System SHALL manter flags is_active e is_launch_area para controle operacional
7. WHEN uma localização é desativada, THE Location_System SHALL manter os dados históricos sem deletar registros

### Requirement 2: Resolução de Localização

**User Story:** Como desenvolvedor, eu quero resolver localizações por ID, path ou slug, para que o sistema possa identificar localizações de forma flexível.

#### Acceptance Criteria

1. THE Location_System SHALL fornecer função resolveById(location_id) que retorna localização por ID
2. THE Location_System SHALL fornecer função resolveByPath(geographic_path) que retorna localização por path completo
3. THE Location_System SHALL fornecer função resolveBySlugWithinParent(slug, parent_id) que retorna localização por slug dentro de parent específico
4. WHEN múltiplos bairros com mesmo nome existem em cidades diferentes, THE Location_System SHALL diferenciá-los pelo geographic_path
5. WHEN slug ou path não existe, THE Location_System SHALL retornar erro descritivo
6. THE Location_System SHALL fornecer função getAncestors(location_id) que retorna array de ancestrais ordenados (mais próximo primeiro)
7. THE Location_System SHALL fornecer função getDescendants(location_id, options) que retorna descendentes com paginação

### Requirement 3: Contexto de Localização

**User Story:** Como usuário, eu quero selecionar minha localização no app, para que o conteúdo seja filtrado para minha área.

#### Acceptance Criteria

1. THE Location_System SHALL manter o location_context selecionado pelo usuário durante a sessão
2. WHEN o usuário seleciona uma localização, THE Location_System SHALL validar que a localização está ativa (is_active = true)
3. THE Location_System SHALL permitir seleção de localização em qualquer nível hierárquico (cidade ou bairro)
4. WHEN nenhuma localização é selecionada, THE Location_System SHALL usar a localização padrão baseada na residência do usuário
5. THE Location_System SHALL persistir a última localização selecionada para sessões futuras

### Requirement 4: Áreas de Cobertura

**User Story:** Como profile (profissional/empresa/motorista), eu quero definir minhas áreas de atuação, para que usuários saibam onde ofereço serviços.

#### Acceptance Criteria

1. THE Coverage_System SHALL permitir que profiles definam múltiplas service_areas referenciadas por owner_profile_id
2. THE Coverage_System SHALL suportar três coverage_types: "district" (bairro específico), "city" (cidade inteira), "radius_km" (raio em km)
3. WHEN coverage_type é "radius_km", THE Coverage_System SHALL exigir o campo radius_km com valor positivo
4. THE Coverage_System SHALL permitir marcar uma service_area como primária (is_primary = true)
5. THE Coverage_System SHALL validar que cada profile tem no máximo uma service_area primária
6. THE Coverage_System SHALL permitir ativar/desativar service_areas (is_active) sem deletar dados históricos
7. THE Coverage_System SHALL validar que location_id referencia localização existente e ativa

### Requirement 5: Consulta de Cobertura

**User Story:** Como usuário, eu quero ver apenas profiles que atendem minha área, para que os resultados sejam relevantes.

#### Acceptance Criteria

1. THE Coverage_System SHALL fornecer função coversLocation(profile_id, location_id) que retorna boolean
2. WHEN coverage_type é "district", THE Coverage_System SHALL retornar true apenas se location_id corresponde exatamente
3. WHEN coverage_type é "city", THE Coverage_System SHALL retornar true para qualquer bairro dentro da cidade (verificar parent_id)
4. WHEN coverage_type é "radius_km", THE Coverage_System SHALL calcular distância usando Haversine e retornar true se dentro do raio
5. THE Coverage_System SHALL considerar apenas service_areas ativas (is_active = true) nas consultas
6. THE Coverage_System SHALL fornecer função getProfilesCoveringLocation(location_id) que retorna array de profile_ids

### Requirement 6: Rollout de Módulos

**User Story:** Como administrador, eu quero ativar módulos gradualmente por localização, para que possamos fazer rollout controlado começando por 4 bairros.

#### Acceptance Criteria

1. THE Rollout_System SHALL permitir ativar/desativar cada domain_module independentemente por localização usando module_key
2. THE Rollout_System SHALL usar module_keys padronizados: "community", "business", "services", "mobility", "classifieds", "ads"
3. WHEN um módulo é desativado em uma localização, THE Rollout_System SHALL retornar false em isModuleEnabled para aquela localização
4. THE Rollout_System SHALL permitir configuração opcional por módulo/localização via campo config (JSONB)
5. THE Rollout_System SHALL implementar herança hierárquica: bairro herda de cidade, cidade herda de estado
6. THE Rollout_System SHALL fornecer função isModuleEnabled(module_key, location_id) que retorna boolean considerando herança

### Requirement 7: Consulta de Rollout com Precedência

**User Story:** Como desenvolvedor, eu quero verificar se um módulo está ativo em uma localização, para que o sistema mostre apenas funcionalidades disponíveis.

#### Acceptance Criteria

1. THE Rollout_System SHALL implementar isModuleEnabled(module_key, location_id) com precedência explícita
2. WHEN location.is_active é false, THE Rollout_System SHALL retornar false independente de rollout configurado
3. WHEN rollout existe para localização específica, THE Rollout_System SHALL usar valor local (override)
4. WHEN rollout não existe para localização, THE Rollout_System SHALL buscar em ancestrais (cidade → estado → país)
5. WHEN nenhum rollout existe na hierarquia, THE Rollout_System SHALL retornar false (opt-in por padrão)
6. THE Rollout_System SHALL cachear resultados de consulta de rollout para performance
7. THE Rollout_System SHALL invalidar cache quando configuração de rollout é alterada ou location.is_active muda

### Requirement 8: Rotas Geográficas

**User Story:** Como usuário, eu quero acessar conteúdo via URLs geográficas, para que possa compartilhar links específicos de localização.

#### Acceptance Criteria

1. THE Location_System SHALL suportar rotas no formato /br/ba/salvador/pituba
2. THE Location_System SHALL suportar rotas no formato /br/ba/salvador/pituba/{module} (ex: /br/ba/salvador/pituba/comunidade)
3. WHEN uma rota geográfica é acessada, THE Location_System SHALL validar que a localização existe e está ativa
4. WHEN uma localização não existe, THE Location_System SHALL retornar erro 404 com mensagem descritiva
5. WHEN uma localização está inativa, THE Location_System SHALL retornar erro 403 com mensagem informativa
6. THE Location_System SHALL extrair location_context da URL e aplicar automaticamente

### Requirement 9: Integração com Módulos de Domínio

**User Story:** Como desenvolvedor de módulo, eu quero usar a fundação geográfica, para que meu módulo respeite localizações sem implementar lógica própria.

#### Acceptance Criteria

1. THE Location_System SHALL fornecer API pública para todos os domain_modules consumirem
2. THE Location_System SHALL proibir que domain_modules acessem tabelas geográficas diretamente (devem usar serviços)
3. WHEN um domain_module cria conteúdo, THE Location_System SHALL exigir location_id válido
4. THE Location_System SHALL fornecer helpers para filtrar conteúdo por localização
5. THE Location_System SHALL fornecer helpers para validar se usuário pode criar conteúdo em uma localização

### Requirement 10: Dados Iniciais

**User Story:** Como administrador, eu quero popular dados geográficos iniciais, para que o sistema inicie com 4 bairros de Salvador configurados.

#### Acceptance Criteria

1. THE Location_System SHALL fornecer migration para popular hierarquia: Brasil > Bahia > Salvador > 4 bairros
2. THE Location_System SHALL marcar os 4 bairros iniciais como is_launch_area = true
3. THE Location_System SHALL gerar slugs corretos: "brasil", "bahia", "salvador", "pituba", etc
4. THE Location_System SHALL gerar geographic_paths corretos para toda a hierarquia
5. THE Location_System SHALL incluir coordenadas geográficas aproximadas para cada localização

### Requirement 11: Validação de Integridade

**User Story:** Como desenvolvedor, eu quero garantir integridade referencial, para que dados geográficos sejam consistentes.

#### Acceptance Criteria

1. THE Location_System SHALL validar que parent_id referencia uma localização existente
2. THE Location_System SHALL validar que parent_id está no nível hierárquico correto (cidade não pode ter país como pai direto)
3. THE Coverage_System SHALL validar que location_id referencia uma localização existente
4. THE Rollout_System SHALL validar que location_id referencia uma localização existente
5. THE Location_System SHALL validar que slugs são únicos dentro do mesmo nível hierárquico e parent
6. THE Location_System SHALL validar que geographic_paths são únicos globalmente

### Requirement 12: Nomenclatura SSOT

**User Story:** Como desenvolvedor, eu quero seguir padrão SSOT de nomenclatura, para que identificadores sejam consistentes com o resto do sistema.

#### Acceptance Criteria

1. THE Location_System SHALL usar location_id (não place_id, area_id ou geo_id)
2. THE Coverage_System SHALL usar owner_profile_id para identificar dono da service_area
3. THE Location_System SHALL usar creator_user_id para auditoria de quem criou a localização
4. THE Location_System SHALL proibir identificadores ambíguos (author_id, owner_id sem sufixo)
5. WHEN uma entidade tem localização primária, THE Location_System SHALL usar primary_location_id

### Requirement 13: Performance e Escalabilidade

**User Story:** Como desenvolvedor, eu quero que consultas geográficas sejam rápidas, para que o sistema escale para nível Brasil.

#### Acceptance Criteria

1. THE Location_System SHALL criar índice único em geographic_path para consultas rápidas
2. THE Location_System SHALL criar índice em slug para consultas dentro de parent
3. THE Location_System SHALL criar índice composto em (parent_id, type) para consultas hierárquicas
4. THE Coverage_System SHALL criar índice em owner_profile_id para consultas de cobertura
5. THE Coverage_System SHALL criar índice em location_id para joins eficientes
6. THE Rollout_System SHALL criar índice composto único em (location_id, module_key) para consultas de rollout
7. THE Location_System SHALL implementar paginação em getDescendants com limite padrão de 100 resultados

### Requirement 14: Auditoria e Rastreabilidade

**User Story:** Como administrador, eu quero rastrear mudanças em dados geográficos, para auditoria e troubleshooting.

#### Acceptance Criteria

1. THE Location_System SHALL registrar created_at e updated_at em todas as tabelas
2. THE Location_System SHALL registrar creator_user_id em locations para rastrear quem criou
3. THE Coverage_System SHALL registrar created_at para rastrear quando service_area foi criada
4. THE Rollout_System SHALL registrar updated_at para rastrear quando rollout foi modificado
5. THE Location_System SHALL manter histórico de mudanças em is_active via soft delete pattern

### Requirement 16: Autorização e Controle de Acesso

**User Story:** Como administrador, eu quero controlar quem pode criar/editar dados geográficos, para garantir integridade do sistema.

#### Acceptance Criteria

1. THE Location_System SHALL permitir apenas admin users criar novas localizações
2. THE Location_System SHALL permitir apenas admin users editar localizações existentes
3. THE Rollout_System SHALL permitir apenas admin users configurar rollouts de módulos
4. THE Coverage_System SHALL permitir que profile crie service_area apenas para si mesmo (owner_profile_id = active_profile_id)
5. THE Coverage_System SHALL permitir que profile edite apenas suas próprias service_areas
6. THE Location_System SHALL permitir que qualquer user com profile ativo selecione location_context se location.is_active = true
7. THE Location_System SHALL permitir que qualquer user com profile ativo crie conteúdo em localização ativa

### Requirement 17: Migração Incremental

**User Story:** Como desenvolvedor, eu quero migrar módulos existentes gradualmente, para que não quebremos funcionalidades atuais.

#### Acceptance Criteria

1. THE Location_System SHALL permitir que módulos existentes continuem funcionando durante migração
2. THE Location_System SHALL fornecer adapter para mapear dados legados (hardcoded "Salvador") para location_id
3. WHEN dados legados existem sem location_id, THE Location_System SHALL fornecer função para inferir localização
4. THE Location_System SHALL fornecer migration script para popular location_id em tabelas existentes
5. THE Location_System SHALL validar que migration não quebra queries existentes

---

## Public API Contracts

Esta seção define os contratos públicos que os módulos de domínio devem usar para interagir com a fundação geográfica.

### core/location API

```typescript
interface LocationAPI {
  // ============================================
  // Resolução de Localizações
  // ============================================
  
  /**
   * Resolve localização por ID
   * @throws LocationNotFoundError se location_id não existe
   */
  resolveById(locationId: string): Promise<Location>;
  
  /**
   * Resolve localização por geographic_path completo
   * @example resolveByPath('/br/ba/salvador/pituba')
   * @throws LocationNotFoundError se path não existe
   */
  resolveByPath(geographicPath: string): Promise<Location>;
  
  /**
   * Resolve localização por slug dentro de parent específico
   * @example resolveBySlugWithinParent('centro', salvador_id)
   * @throws LocationNotFoundError se slug não existe no parent
   */
  resolveBySlugWithinParent(slug: string, parentId: string): Promise<Location>;
  
  // ============================================
  // Navegação Hierárquica
  // ============================================
  
  /**
   * Retorna ancestrais ordenados (mais próximo primeiro)
   * @example getAncestors(pituba_id) => [salvador, bahia, brasil]
   */
  getAncestors(locationId: string): Promise<Location[]>;
  
  /**
   * Retorna descendentes com paginação
   * @param options.limit - Máximo de resultados (padrão: 100)
   * @param options.offset - Offset para paginação (padrão: 0)
   */
  getDescendants(
    locationId: string, 
    options?: { limit?: number; offset?: number }
  ): Promise<Location[]>;
  
  /**
   * Retorna filhos diretos (1 nível abaixo)
   * @example getChildren(salvador_id) => [pituba, barra, rio_vermelho, ...]
   */
  getChildren(locationId: string): Promise<Location[]>;
  
  // ============================================
  // Contexto de Localização
  // ============================================
  
  /**
   * Define location_context para sessão atual
   * @throws LocationInactiveError se location.is_active = false
   */
  setLocationContext(locationId: string): Promise<void>;
  
  /**
   * Retorna location_context atual ou null
   */
  getLocationContext(): Location | null;
  
  /**
   * Limpa location_context (volta para default)
   */
  clearLocationContext(): void;
  
  // ============================================
  // Validação
  // ============================================
  
  /**
   * Verifica se localização está ativa
   */
  isLocationActive(locationId: string): Promise<boolean>;
  
  /**
   * Verifica se profile pode criar conteúdo em localização
   * Regras: location.is_active = true E profile.is_active = true
   */
  canCreateContentInLocation(
    profileId: string, 
    locationId: string
  ): Promise<boolean>;
}

interface Location {
  id: string;
  type: 'country' | 'state' | 'city' | 'district';
  name: string;
  slug: string;
  geographic_path: string;
  parent_id: string | null;
  latitude: number;
  longitude: number;
  is_active: boolean;
  is_launch_area: boolean;
  creator_user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
```

### core/coverage API

```typescript
interface CoverageAPI {
  // ============================================
  // Gerenciamento de Service Areas
  // ============================================
  
  /**
   * Cria nova service_area para profile
   * @throws UnauthorizedError se owner_profile_id !== active_profile_id
   * @throws ValidationError se coverage_type = 'radius_km' e radius_km não fornecido
   */
  createServiceArea(data: CreateServiceAreaData): Promise<ServiceArea>;
  
  /**
   * Atualiza service_area existente
   * @throws UnauthorizedError se não é owner
   */
  updateServiceArea(
    serviceAreaId: string, 
    data: UpdateServiceAreaData
  ): Promise<ServiceArea>;
  
  /**
   * Deleta service_area (soft delete)
   * @throws UnauthorizedError se não é owner
   */
  deleteServiceArea(serviceAreaId: string): Promise<void>;
  
  // ============================================
  // Consultas de Service Areas
  // ============================================
  
  /**
   * Retorna todas as service_areas de um profile
   * @param includeInactive - Incluir áreas inativas (padrão: false)
   */
  getServiceAreasForProfile(
    profileId: string,
    includeInactive?: boolean
  ): Promise<ServiceArea[]>;
  
  /**
   * Retorna service_area primária do profile
   * @returns null se não tem área primária
   */
  getPrimaryServiceArea(profileId: string): Promise<ServiceArea | null>;
  
  // ============================================
  // Consultas de Cobertura
  // ============================================
  
  /**
   * Verifica se profile cobre localização
   * Considera apenas service_areas ativas
   */
  coversLocation(profileId: string, locationId: string): Promise<boolean>;
  
  /**
   * Retorna profiles que cobrem localização
   * @param options.limit - Máximo de resultados
   * @param options.offset - Offset para paginação
   */
  getProfilesCoveringLocation(
    locationId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<string[]>;
}

interface ServiceArea {
  id: string;
  owner_profile_id: string;
  location_id: string;
  coverage_type: 'district' | 'city' | 'radius_km';
  radius_km: number | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateServiceAreaData {
  owner_profile_id: string;
  location_id: string;
  coverage_type: 'district' | 'city' | 'radius_km';
  radius_km?: number;
  is_primary?: boolean;
}

interface UpdateServiceAreaData {
  location_id?: string;
  coverage_type?: 'district' | 'city' | 'radius_km';
  radius_km?: number;
  is_primary?: boolean;
  is_active?: boolean;
}
```

### core/rollout API

```typescript
interface RolloutAPI {
  // ============================================
  // Consultas de Rollout
  // ============================================
  
  /**
   * Verifica se módulo está habilitado em localização
   * Implementa precedência: local override > herança > default false
   * Bloqueia se location.is_active = false
   */
  isModuleEnabled(moduleKey: string, locationId: string): Promise<boolean>;
  
  /**
   * Retorna lista de módulos habilitados em localização
   */
  getEnabledModules(locationId: string): Promise<string[]>;
  
  /**
   * Retorna configuração de módulo em localização
   * @returns null se módulo não configurado ou desabilitado
   */
  getModuleConfig(
    moduleKey: string, 
    locationId: string
  ): Promise<Record<string, any> | null>;
  
  // ============================================
  // Administração (Admin Only)
  // ============================================
  
  /**
   * Configura rollout de módulo em localização
   * @throws UnauthorizedError se não é admin
   */
  setModuleRollout(
    moduleKey: string,
    locationId: string,
    isEnabled: boolean,
    config?: Record<string, any>
  ): Promise<void>;
  
  /**
   * Remove rollout de módulo em localização
   * Volta para herança hierárquica
   * @throws UnauthorizedError se não é admin
   */
  deleteModuleRollout(
    moduleKey: string,
    locationId: string
  ): Promise<void>;
  
  /**
   * Invalida cache de rollout
   * Usado após mudanças em is_active ou rollouts
   */
  invalidateCache(locationId?: string): Promise<void>;
}

interface ModuleRollout {
  id: string;
  location_id: string;
  module_key: string;
  is_enabled: boolean;
  config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
```

---

## Inheritance and Precedence Rules

Esta seção documenta as regras explícitas de herança e precedência para rollout de módulos.

### Rollout Inheritance Algorithm

```typescript
/**
 * Algoritmo canônico para verificar se módulo está habilitado
 */
function isModuleEnabled(moduleKey: string, locationId: string): boolean {
  // REGRA 1: Location inativa bloqueia tudo
  const location = getLocation(locationId);
  if (!location.is_active || location.deleted_at !== null) {
    return false;
  }
  
  // REGRA 2: Override local tem precedência máxima
  const localRollout = getRollout(moduleKey, locationId);
  if (localRollout !== null) {
    return localRollout.is_enabled;
  }
  
  // REGRA 3: Fallback hierárquico (ancestor mais próximo)
  const ancestors = getAncestors(locationId); // [cidade, estado, país]
  for (const ancestor of ancestors) {
    const ancestorRollout = getRollout(moduleKey, ancestor.id);
    if (ancestorRollout !== null) {
      return ancestorRollout.is_enabled;
    }
  }
  
  // REGRA 4: Default false (opt-in)
  return false;
}
```

### Precedence Table

| Condição | Resultado | Prioridade |
|----------|-----------|------------|
| `location.is_active = false` | `false` | 1 (máxima) |
| `location.deleted_at != null` | `false` | 1 (máxima) |
| Rollout local existe | `rollout.is_enabled` | 2 |
| Rollout em cidade existe | `rollout.is_enabled` | 3 |
| Rollout em estado existe | `rollout.is_enabled` | 4 |
| Rollout em país existe | `rollout.is_enabled` | 5 |
| Nenhum rollout existe | `false` | 6 (mínima) |

### Interaction with is_launch_area

`is_launch_area` é um **hint administrativo**, não uma regra de negócio:

- **NÃO afeta** `isModuleEnabled` diretamente
- **Sugere** que módulos devem ser habilitados naquela área
- **Usado** por admins para identificar áreas prioritárias
- **Rollout explícito** sempre tem precedência

```typescript
// ❌ ERRADO: is_launch_area não força habilitação
if (location.is_launch_area) {
  return true; // NUNCA fazer isso
}

// ✅ CORRETO: is_launch_area é apenas hint
const launchAreas = locations.filter(l => l.is_launch_area);
// Admin usa essa lista para configurar rollouts
```

### Cache Invalidation Rules

Cache deve ser invalidado quando:

1. Rollout é criado/atualizado/deletado
2. `location.is_active` muda
3. `location.deleted_at` é setado
4. Hierarquia muda (parent_id atualizado)

```typescript
// Eventos que invalidam cache
on('rollout.created', (rollout) => {
  invalidateCache(rollout.location_id);
  invalidateDescendantsCache(rollout.location_id);
});

on('location.updated', (location, changes) => {
  if ('is_active' in changes || 'deleted_at' in changes) {
    invalidateCache(location.id);
    invalidateDescendantsCache(location.id);
  }
});
```

---

## Migration Plan

Esta seção define o plano de migração incremental para implementar a fundação geográfica sem quebrar código existente.

### Phase 1: Core Infrastructure (Week 1-2)

**Goal**: Criar tabelas e serviços core sem afetar código existente.

**Tasks**:
1. Criar migrations para tabelas `locations`, `service_areas`, `module_rollouts`
2. Popular dados iniciais (Brasil > Bahia > Salvador > 4 bairros)
3. Implementar `core/location` service
4. Implementar `core/coverage` service
5. Implementar `core/rollout` service
6. Escrever testes unitários para services

**Success Criteria**:
- Tabelas criadas e populadas
- Services funcionando com testes passando
- Nenhum módulo existente afetado

### Phase 2: Adapter Layer (Week 3)

**Goal**: Criar adapters para mapear dados legados.

**Tasks**:
1. Criar `LocationAdapter` para mapear hardcoded "Salvador" para location_id
2. Criar função `inferLocationFromLegacyData()`
3. Adicionar location_id (nullable) em tabelas existentes (posts, businesses, etc)
4. Criar migration script para popular location_id em dados existentes

**Success Criteria**:
- Adapter funciona para dados legados
- location_id populado em 100% dos registros existentes
- Queries existentes continuam funcionando

### Phase 3: Module Migration (Week 4-6)

**Goal**: Migrar módulos um por vez para usar fundação geográfica.

**Order**:
1. `modules/community` (posts, comments)
2. `modules/business` (businesses, products)
3. `modules/services` (professionals, services)
4. `modules/mobility` (drivers, routes)
5. `modules/classifieds` (ads)

**Per-Module Tasks**:
1. Atualizar queries para usar location_id
2. Adicionar validação de location_context
3. Implementar filtros por localização
4. Atualizar UI para seletor de localização
5. Escrever testes de integração

**Success Criteria**:
- Módulo usa location_id em vez de hardcoded values
- Filtros por localização funcionando
- Testes passando

### Phase 4: Rollout System (Week 7)

**Goal**: Implementar sistema de rollout gradual.

**Tasks**:
1. Configurar rollouts iniciais para 4 bairros
2. Implementar UI admin para gerenciar rollouts
3. Adicionar verificação de rollout em rotas
4. Implementar cache de rollout
5. Testar herança hierárquica

**Success Criteria**:
- Rollout funcionando para todos os módulos
- Admin pode habilitar/desabilitar módulos por localização
- Cache funcionando corretamente

### Phase 5: Cleanup (Week 8)

**Goal**: Remover código legado e adapters.

**Tasks**:
1. Tornar location_id NOT NULL em todas as tabelas
2. Remover adapters e código de fallback
3. Remover hardcoded values
4. Atualizar documentação
5. Code review final

**Success Criteria**:
- Nenhum código legado restante
- 100% dos dados usando location_id
- Documentação atualizada

### Rollback Strategy

Cada fase tem rollback point:

**Phase 1 Rollback**:
- Drop tabelas geográficas
- Nenhum impacto em código existente

**Phase 2 Rollback**:
- Remover location_id (nullable) das tabelas
- Remover adapters
- Sistema volta ao estado anterior

**Phase 3 Rollback** (per-module):
- Reverter queries para usar hardcoded values
- Remover validações de location_context
- Módulo volta ao estado anterior

**Phase 4 Rollback**:
- Desabilitar verificação de rollout
- Todos os módulos ficam habilitados globalmente

### Migration Validation Checklist

Antes de cada fase:
- [ ] Backup do banco de dados
- [ ] Testes passando em staging
- [ ] Code review aprovado
- [ ] Documentação atualizada
- [ ] Rollback plan testado

Após cada fase:
- [ ] Testes passando em produção
- [ ] Métricas de performance normais
- [ ] Nenhum erro reportado
- [ ] Usuários não afetados

---

## Correctness Properties

Esta seção define properties testáveis que garantem a corretude do sistema geográfico.

### Property 1: Hierarquia Válida (Invariant)

**Property:** Para toda localização L, se L.parent_id não é nulo, então existe uma localização P onde P.id = L.parent_id E P.type está no nível hierárquico correto acima de L.type.

**Testable:** yes - property

**Test Strategy:** Property-based test que gera localizações aleatórias e valida que parent sempre existe e está no nível correto.

```typescript
// Níveis hierárquicos válidos
const VALID_HIERARCHY = {
  'district': 'city',
  'city': 'state',
  'state': 'country',
  'country': null
};

property('valid hierarchy', forAll(location(), (loc) => {
  if (loc.parent_id === null) {
    return loc.type === 'country';
  }
  const parent = getLocation(loc.parent_id);
  return parent.type === VALID_HIERARCHY[loc.type];
}));
```

### Property 2: Slug Único Dentro de Parent (Invariant)

**Property:** Para quaisquer duas localizações L1 e L2 onde L1.parent_id = L2.parent_id E L1.type = L2.type, então L1.slug ≠ L2.slug.

**Testable:** yes - property

**Test Strategy:** Property-based test que gera múltiplas localizações com mesmo parent e valida unicidade de slugs.

```typescript
property('unique slug within parent', forAll(array(location()), (locations) => {
  const grouped = groupBy(locations, loc => `${loc.parent_id}-${loc.type}`);
  return Object.values(grouped).every(group => {
    const slugs = group.map(loc => loc.slug);
    return slugs.length === new Set(slugs).size;
  });
}));
```

### Property 3: Geographic Path Único Global (Invariant)

**Property:** Para quaisquer duas localizações L1 e L2, se L1.id ≠ L2.id então L1.geographic_path ≠ L2.geographic_path.

**Testable:** yes - property

**Test Strategy:** Property-based test que gera localizações e valida que geographic_paths são globalmente únicos.

```typescript
property('unique geographic path', forAll(array(location()), (locations) => {
  const paths = locations.map(loc => loc.geographic_path);
  return paths.length === new Set(paths).size;
}));
```

### Property 4: Resolução Bidirecional (Round Trip)

**Property:** Para toda localização L, resolveByPath(L.geographic_path).id = L.id E resolveBySlugWithinParent(L.slug, L.parent_id).id = L.id.

**Testable:** yes - property

**Test Strategy:** Property-based test que cria localização, resolve por path e slug, e valida que retorna a mesma localização.

```typescript
property('resolution round trip', forAll(location(), async (loc) => {
  const byPath = await resolveByPath(loc.geographic_path);
  const bySlug = await resolveBySlugWithinParent(loc.slug, loc.parent_id);
  return byPath.id === loc.id && bySlug.id === loc.id;
}));
```

### Property 5: Cobertura Transitiva para City (Metamorphic)

**Property:** Se profile P cobre cidade C (coverage_type = "city"), então P cobre todos os bairros D onde D.parent_id = C.id E D.is_active = true.

**Testable:** yes - property

**Test Strategy:** Property-based test que cria cobertura de cidade e valida que todos os bairros ativos são cobertos.

```typescript
property('city coverage is transitive', forAll(
  profile(), 
  city(), 
  array(district()),
  async (profile, city, districts) => {
    // Criar cobertura de cidade
    await createServiceArea({
      owner_profile_id: profile.id,
      location_id: city.id,
      coverage_type: 'city'
    });
    
    // Validar que todos os bairros da cidade são cobertos
    const activeDistricts = districts.filter(d => 
      d.parent_id === city.id && d.is_active
    );
    
    return activeDistricts.every(async (district) => {
      return await coversLocation(profile.id, district.id);
    });
  }
));
```

### Property 6: Herança de Rollout (Metamorphic)

**Property:** Se módulo M está habilitado em cidade C E não há rollout específico para bairro D (onde D.parent_id = C.id) E D.is_active = true, então isModuleEnabled(M, D.id) = true.

**Testable:** yes - property

**Test Strategy:** Property-based test que habilita módulo em cidade e valida que bairros ativos herdam configuração.

```typescript
property('rollout inheritance', forAll(
  moduleKey(),
  city(),
  district(),
  async (module, city, district) => {
    assume(district.parent_id === city.id);
    assume(district.is_active === true);
    
    // Habilitar módulo na cidade
    await setModuleRollout(module, city.id, true);
    
    // Garantir que não há rollout no bairro
    await deleteModuleRollout(module, district.id);
    
    // Validar herança
    return await isModuleEnabled(module, district.id) === true;
  }
));
```

### Property 7: Location Inativa Bloqueia Rollout (Invariant)

**Property:** Para toda localização L onde L.is_active = false, isModuleEnabled(M, L.id) = false para qualquer módulo M.

**Testable:** yes - property

**Test Strategy:** Property-based test que desativa localização e valida que todos os módulos são bloqueados.

```typescript
property('inactive location blocks all modules', forAll(
  location(),
  moduleKey(),
  async (location, module) => {
    // Desativar localização
    await updateLocation(location.id, { is_active: false });
    
    // Tentar habilitar módulo
    await setModuleRollout(module, location.id, true);
    
    // Validar que módulo está bloqueado
    return await isModuleEnabled(module, location.id) === false;
  }
));
```

### Property 8: Ancestralidade Completa (Invariant)

**Property:** Para toda localização L do tipo "district", getAncestors(L.id) retorna exatamente 3 localizações: [city, state, country] nessa ordem.

**Testable:** yes - property

**Test Strategy:** Property-based test que cria hierarquia completa e valida que bairros sempre têm 3 ancestrais.

```typescript
property('complete ancestry for districts', forAll(district(), async (district) => {
  const ancestors = await getAncestors(district.id);
  return ancestors.length === 3 &&
         ancestors[0].type === 'city' &&
         ancestors[1].type === 'state' &&
         ancestors[2].type === 'country';
}));
```

### Property 9: Cobertura por Raio (Metamorphic)

**Property:** Se profile P cobre localização L1 com radius_km = R, e distância(L1, L2) < R, então P cobre L2.

**Testable:** yes - property

**Test Strategy:** Property-based test que gera localizações dentro de raio e valida cobertura.

```typescript
property('radius coverage', forAll(
  profile(),
  location(),
  location(),
  positiveNumber(),
  async (profile, loc1, loc2, radius) => {
    const distance = haversineDistance(
      loc1.latitude, loc1.longitude,
      loc2.latitude, loc2.longitude
    );
    
    assume(distance < radius);
    
    await createServiceArea({
      owner_profile_id: profile.id,
      location_id: loc1.id,
      coverage_type: 'radius_km',
      radius_km: radius
    });
    
    return await coversLocation(profile.id, loc2.id) === true;
  }
));
```

### Property 10: Service Area Primária Única (Invariant)

**Property:** Para todo profile P, count(service_areas WHERE owner_profile_id = P.id AND is_primary = true AND is_active = true) ≤ 1.

**Testable:** yes - property

**Test Strategy:** Property-based test que tenta criar múltiplas áreas primárias e valida que apenas uma é permitida.

```typescript
property('single primary service area', forAll(
  profile(),
  array(serviceAreaData()),
  async (profile, areasData) => {
    // Tentar criar múltiplas áreas primárias
    for (const data of areasData) {
      try {
        await createServiceArea({
          ...data,
          owner_profile_id: profile.id,
          is_primary: true
        });
      } catch (e) {
        // Esperado: segunda área primária deve falhar
      }
    }
    
    // Validar que apenas uma área primária existe
    const areas = await getServiceAreasForProfile(profile.id);
    const primaryAreas = areas.filter(a => a.is_primary && a.is_active);
    return primaryAreas.length <= 1;
  }
));
```

### Property 11: Geographic Path Consistency (Invariant)

**Property:** Para toda localização L, L.geographic_path = buildPath(L) onde buildPath reconstrói o path a partir da hierarquia.

**Testable:** yes - property

**Test Strategy:** Property-based test que valida que path persistido é consistente com hierarquia.

```typescript
property('geographic path consistency', forAll(location(), async (loc) => {
  const reconstructedPath = await buildPathFromHierarchy(loc.id);
  return loc.geographic_path === reconstructedPath;
}));

async function buildPathFromHierarchy(locationId: string): Promise<string> {
  const location = await getLocation(locationId);
  const ancestors = await getAncestors(locationId);
  
  const parts = [...ancestors.reverse(), location].map(loc => {
    // Usar código ISO para país/estado, slug para cidade/bairro
    if (loc.type === 'country' || loc.type === 'state') {
      return loc.slug; // Códigos ISO já estão em slug
    }
    return loc.slug;
  });
  
  return '/' + parts.join('/');
}
```

### Property 12: Rollout Override Precedence (Metamorphic)

**Property:** Se rollout local existe para módulo M em localização L, então isModuleEnabled(M, L.id) = rollout_local.is_enabled, independente de rollouts em ancestrais.

**Testable:** yes - property

**Test Strategy:** Property-based test que configura rollouts conflitantes e valida precedência local.

```typescript
property('local rollout overrides ancestors', forAll(
  moduleKey(),
  district(),
  boolean(),
  boolean(),
  async (module, district, localEnabled, cityEnabled) => {
    const city = await getLocation(district.parent_id);
    
    // Configurar rollout na cidade
    await setModuleRollout(module, city.id, cityEnabled);
    
    // Configurar rollout local (override)
    await setModuleRollout(module, district.id, localEnabled);
    
    // Validar que local tem precedência
    const enabled = await isModuleEnabled(module, district.id);
    return enabled === localEnabled;
  }
));
```

## Validation Checklist

### Requirements Quality

- [x] Todos os requirements seguem padrões EARS
- [x] Todos os termos técnicos estão definidos no Glossary
- [x] Nenhum requirement usa termos vagos ("quickly", "adequate", "reasonable")
- [x] Nenhum requirement usa pronomes ambíguos ("it", "them", "they")
- [x] Todos os requirements são testáveis
- [x] Nenhum requirement contém escape clauses ("where possible", "if feasible")

### SSOT Compliance

- [x] Identificadores seguem padrão SSOT (location_id, owner_profile_id, creator_user_id)
- [x] Service areas usam owner_profile_id (não entity_type/entity_id)
- [x] Nenhum identificador ambíguo (author_id, owner_id sem sufixo)
- [x] Consistente com profile-centric architecture

### Canonical Decisions

- [x] Geographic path strategy definida (códigos ISO + slugs)
- [x] Slug resolution strategy definida (três métodos)
- [x] Ownership model definido (owner_profile_id)
- [x] Descendant limit removido (paginação em runtime)
- [x] Geographic path persistence definida (persistido com trigger)
- [x] Active vs Launch vs Soft Delete separados
- [x] Rollout inheritance com precedência explícita
- [x] Radius coverage strategy definida (Haversine MVP)
- [x] Authorization model definido
- [x] Public API contracts definidos
- [x] Module key vs route segment definido
- [x] Document metadata standards definidos

### Correctness Properties

- [x] Correctness properties cobrem invariantes críticos
- [x] Correctness properties incluem round-trip para resolução
- [x] Property para herança de rollout com precedência
- [x] Property para location inativa bloqueando rollout
- [x] Property para geographic path consistency
- [x] Property para rollout override precedence
- [x] Todas as properties têm test strategy com código exemplo

### Migration Plan

- [x] Estratégia de migração incremental documentada
- [x] Fases definidas com success criteria
- [x] Rollback strategy para cada fase
- [x] Validation checklist para cada fase
- [x] Adapter layer para dados legados

### API Contracts

- [x] core/location API completo com tipos
- [x] core/coverage API completo com tipos
- [x] core/rollout API completo com tipos
- [x] Todos os métodos documentados com @throws
- [x] Exemplos de uso fornecidos

### Inheritance Rules

- [x] Algoritmo de herança documentado com código
- [x] Tabela de precedência definida
- [x] Interação com is_launch_area explicada
- [x] Regras de cache invalidation definidas

---

**Document Version:** 2.0.0  
**Created:** 2026-03-24  
**Status:** Canonical  
**Previous Version:** 1.0.0  
**Change Summary:** Resolved 12 structural contradictions, closed all open decisions, defined canonical contracts, added inheritance rules, migration plan, and comprehensive correctness properties with test strategies.
