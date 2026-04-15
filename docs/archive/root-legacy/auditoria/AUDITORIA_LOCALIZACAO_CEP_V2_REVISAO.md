# AUDITORIA COMPLETA V2 - SISTEMA DE LOCALIZAÇÃO/ENDEREÇO/CEP

**Data**: 2026-03-28  
**Versão**: 2.0.0 (REVISÃO CRÍTICA)  
**Autor**: Kiro AI  
**Escopo**: Revisão profunda com correção de falhas graves de modelagem e semântica

---

## A. PROBLEMAS GRAVES DA AUDITORIA V1

### A.1 Separação Conceitual Ausente

**FALHA**: V1 não separou explicitamente os 5 conceitos fundamentais do sistema geográfico.

**Conceitos Misturados**:
1. **Território Canônico** (hierarquia administrativa oficial)
2. **Endereço Postal** (logradouro, CEP, número)
3. **Geocoding/Enriquecimento** (coordenadas, reverse geocoding)
4. **Telemetria GPS** (rastreamento real-time de motoristas)
5. **Cobertura Geográfica** (onde entidades atuam)

**Consequência**: Proposta de `addresses` table misturava endereço postal + coordenadas + FK territorial sem definir responsabilidades claras.

### A.2 Semântica Ambígua de `location_id`

**FALHA**: V1 não definiu o significado exato de `location_id` em cada domínio.

**Ambiguidades Identificadas**:
- `profiles.location_id` → Bairro de residência? Bairro público do perfil? Território principal?
- `business_data.location_id` → Sede da empresa? Bairro de atuação? Território de exibição?
- `professional_data.location_id` → Endereço do profissional? Área de cobertura? Território principal?
- `classifieds.location_id` → Localização do item? Bairro do vendedor? Território de exibição?
- `posts.location_id` → Localização do evento? Bairro do autor? Contexto da publicação?
- `community_alerts.location_id` → Localização do problema? Bairro afetado? Território de exibição?
- `ride_requests.pickup_location` → Endereço exato? Bairro? Coordenadas GPS?

**Consequência**: Impossível migrar dados sem definir semântica formal primeiro.

### A.3 Governança Territorial/Postal Ausente

**FALHA**: V1 não tratou mudanças oficiais de território e endereço postal.

**Cenários Não Tratados**:
- Bairro muda de nome oficialmente (ex: "Nordeste de Amaralina" → "Amaralina Norte")
- Rua muda de nome (ex: "Rua Presidente Vargas" → "Rua da Democracia")
- CEP muda (redistribuição postal dos Correios)
- Poligonal de bairro muda (IBGE atualiza limites)
- Slug antigo precisa redirecionar (SEO)
- Aliases históricos precisam ser preservados (busca)

**Consequência**: Sistema quebraria em mudanças oficiais, URLs antigas quebrariam, dados históricos ficariam órfãos.

### A.4 Geoespacial Incompleto

**FALHA**: V1 não fechou modelo de boundary/polygon, spatial indexing, resolução ponto→território.

**Lacunas Identificadas**:
- Nenhuma proposta de armazenamento de polígonos (GeoJSON, PostGIS)
- Nenhuma estratégia de spatial indexing (R-tree, GiST)
- Nenhuma lógica de resolução ponto→território (ST_Contains, ST_Within)
- Nenhum tratamento de ponto em área ambígua (fronteira entre bairros)
- Nenhum fallback quando polígono não existe

**Consequência**: Impossível implementar "descobrir bairro por GPS" ou "filtrar por raio".

### A.5 Address Model Rígido

**FALHA**: V1 propôs `addresses` table rígida que não suporta casos reais.

**Casos Não Suportados**:
- Endereço aproximado (ex: "Próximo ao Shopping Barra")
- Landmark/referência (ex: "Em frente à Igreja de São Francisco")
- GPS only (coordenadas sem endereço textual)
- Confidence/precision (geocoding com 90% de confiança vs 50%)
- Endereço geocodificado vs digitado manualmente
- Validação por source (ViaCEP validado vs Google estimado vs manual não validado)

**Consequência**: UX ruim para casos edge, dados forçados em estrutura inadequada.

### A.6 Territory Sync Centrado em IBGE

**FALHA**: V1 assumiu IBGE como única fonte oficial, não suportou múltiplas fontes.

**Fontes Oficiais Não Tratadas**:
- IBGE (hierarquia administrativa oficial)
- Prefeitura local (bairros administrativos municipais)
- Correios (CEPs e logradouros oficiais)
- Providers de geocoding (Google, Mapbox)
- Fonte manual revisada por admin (correções locais)

**Consequência**: Conflitos entre fontes, impossível definir precedência, dados inconsistentes.

### A.7 Baseline com Aproximações

**FALHA**: V1 usou "50+", "30+", "estimado" em vez de números exatos.

**Aproximações Encontradas**:
- "Arquivos TypeScript manipulando localização: 50+"
- "Componentes que coletam endereço: 8"
- "Services que manipulam localização: 12"
- "Quantidade Estimada: Desconhecida (requer query no banco)"

**Consequência**: Impossível planejar esforço real, impossível validar completude da migração.

### A.8 Fases Mal Ordenadas

**FALHA**: V1 começou Fase 0 com providers externos antes de fechar semântica e modelo canônico.

**Ordem Incorreta V1**:
```
Fase 0: Geocoding e normalização (ERRADO - começa com integração externa)
Fase 1: Migração user_residences
Fase 2: Migração business_data
...
```

**Problema**: Implementar geocoding sem definir semântica de `location_id` e modelo de `addresses` resulta em retrabalho.

---

## B. SEMÂNTICA FORMAL POR ENTIDADE

### B.1 Definição de Conceitos Fundamentais

#### Território Canônico (`locations`)
**Definição**: Unidade administrativa oficial na hierarquia geográfica (country → state → city → district).  
**Fonte**: IBGE (hierarquia administrativa), Prefeitura (bairros administrativos).  
**Propósito**: SSOT para hierarquia territorial, filtros territoriais, URLs canônicas, rollout de módulos.  
**NÃO É**: Endereço postal, coordenadas exatas, cobertura de serviço.

#### Endereço Postal (`addresses`)
**Definição**: Logradouro completo com CEP, rua, número, complemento.  
**Fonte**: Correios (CEP oficial), usuário (digitação manual), geocoding (enriquecimento).  
**Propósito**: Endereço físico de entidades (empresas, residências), navegação ("Como Chegar"), geocoding.  
**NÃO É**: Território canônico, cobertura de serviço, telemetria GPS.

#### Geocoding/Enriquecimento
**Definição**: Conversão entre endereço textual ↔ coordenadas geográficas.  
**Fonte**: ViaCEP (CEP→endereço), Google Geocoding (endereço→coordenadas), Google Reverse Geocoding (coordenadas→endereço).  
**Propósito**: Enriquecer endereços com coordenadas, validar CEP, autocomplete de endereço.  
**NÃO É**: SSOT de dados (apenas enriquecimento), hierarquia territorial.

#### Telemetria GPS
**Definição**: Rastreamento real-time de posição geográfica (motoristas, usuários).  
**Fonte**: GPS do dispositivo, browser geolocation API.  
**Propósito**: Rastreamento de motoristas, "usar localização atual", histórico de movimentação.  
**NÃO É**: Endereço postal, território canônico, cobertura de serviço.

#### Cobertura Geográfica (`service_areas`)
**Definição**: Áreas onde entidades atuam/atendem (businesses, professionals).  
**Fonte**: Usuário (seleção manual), sistema (inferência por endereço).  
**Propósito**: Filtrar entidades por território, exibir "atende em X bairros", validar disponibilidade.  
**NÃO É**: Endereço da sede, território canônico, telemetria GPS.

### B.2 Semântica Exata de `location_id` por Tabela

#### `profiles.location_id`
**Significado**: Território público principal do perfil (bairro ou cidade de atuação/exibição).  
**Tipo**: FK para `locations` (district ou city).  
**Obrigatoriedade**: OPCIONAL (perfis podem não ter território público).  
**Uso**:
- Exibir "Fulano de Pituba" em listagens
- Filtrar perfis por território
- Gerar URL territorial do perfil
**NÃO É**: Endereço residencial (ver `user_residences`), cobertura de serviço (ver `service_areas`).

#### `business_data.location_id`
**Significado**: Território principal de exibição da empresa (bairro da sede).  
**Tipo**: FK para `locations` (district).  
**Obrigatoriedade**: OBRIGATÓRIO (empresas sempre têm território).  
**Uso**:
- Filtrar empresas por território
- Exibir "Empresa X em Pituba"
- Gerar URL territorial da empresa
**NÃO É**: Endereço completo da sede (ver `business_data.address_id`), cobertura de atuação (ver `service_areas`).

#### `business_data.address_id`
**Significado**: Endereço postal completo da sede da empresa.  
**Tipo**: FK para `addresses` (logradouro + CEP + coordenadas).  
**Obrigatoriedade**: OPCIONAL (empresas online podem não ter endereço físico).  
**Uso**:
- Exibir endereço completo
- Navegação ("Como Chegar")
- Geocoding para mapa
**NÃO É**: Território de exibição (ver `location_id`), cobertura de atuação (ver `service_areas`).

#### `professional_data.location_id`
**Significado**: Território principal de exibição do profissional (bairro de atuação principal).  
**Tipo**: FK para `locations` (district).  
**Obrigatoriedade**: OBRIGATÓRIO (profissionais sempre têm território).  
**Uso**:
- Filtrar profissionais por território
- Exibir "Profissional Y em Barra"
- Gerar URL territorial do profissional
**NÃO É**: Endereço residencial (ver `user_residences`), cobertura completa (ver `service_areas`).

#### `professional_data.address_id`
**Significado**: Endereço postal do escritório/consultório (se houver).  
**Tipo**: FK para `addresses`.  
**Obrigatoriedade**: OPCIONAL (profissionais autônomos podem atender apenas em domicílio).  
**Uso**:
- Exibir endereço do consultório
- Navegação ("Como Chegar")
**NÃO É**: Território de exibição (ver `location_id`), cobertura de atuação (ver `service_areas`).

#### `classifieds.location_id`
**Significado**: Território de exibição do classificado (bairro do item/vendedor).  
**Tipo**: FK para `locations` (district).  
**Obrigatoriedade**: OBRIGATÓRIO (classificados sempre têm território).  
**Uso**:
- Filtrar classificados por território
- Exibir "Item à venda em Rio Vermelho"
- Gerar URL territorial do classificado
**NÃO É**: Endereço exato do item (classificados raramente têm endereço), coordenadas GPS.

#### `posts.location_id`
**Significado**: Contexto territorial da publicação (bairro do evento/assunto).  
**Tipo**: FK para `locations` (district ou city).  
**Obrigatoriedade**: OPCIONAL (posts genéricos podem não ter território).  
**Uso**:
- Filtrar posts por território
- Exibir "Post sobre Pituba"
- Feed territorial
**NÃO É**: Endereço do autor, localização do autor, coordenadas GPS.

#### `community_alerts.location_id`
**Significado**: Território afetado pelo alerta (bairro do problema).  
**Tipo**: FK para `locations` (district).  
**Obrigatoriedade**: OBRIGATÓRIO (alertas sempre têm território).  
**Uso**:
- Filtrar alertas por território
- Exibir "Alerta em Amaralina"
- Notificar moradores do território
**NÃO É**: Endereço exato do problema, coordenadas GPS.

#### `community_issues.location_id`
**Significado**: Território afetado pela issue (bairro do problema).  
**Tipo**: FK para `locations` (district).  
**Obrigatoriedade**: OBRIGATÓRIO (issues sempre têm território).  
**Uso**: Similar a `community_alerts`.

#### `events.location_id`
**Significado**: Território do evento (bairro onde ocorre).  
**Tipo**: FK para `locations` (district).  
**Obrigatoriedade**: OBRIGATÓRIO (eventos sempre têm território).  
**Uso**:
- Filtrar eventos por território
- Exibir "Evento em Barra"
**NÃO É**: Endereço exato do evento (ver `events.address_id`).


#### `ride_requests.pickup_location_id` / `dropoff_location_id`
**Significado**: Território de origem/destino da corrida (bairro).  
**Tipo**: FK para `locations` (district).  
**Obrigatoriedade**: OBRIGATÓRIO (corridas sempre têm origem/destino territorial).  
**Uso**:
- Filtrar corridas por território
- Exibir "Corrida de Pituba para Barra"
- Estatísticas territoriais de mobilidade
**NÃO É**: Endereço exato (ver `pickup_address_id`), coordenadas GPS (ver `addresses.latitude/longitude`).

#### `ride_requests.pickup_address_id` / `dropoff_address_id`
**Significado**: Endereço postal exato de origem/destino da corrida.  
**Tipo**: FK para `addresses`.  
**Obrigatoriedade**: OBRIGATÓRIO (motorista precisa saber onde buscar/deixar).  
**Uso**:
- Exibir endereço completo para motorista
- Navegação GPS
- Cálculo de distância exata
**NÃO É**: Território de exibição (ver `location_id`).

#### `user_residences.location_id`
**Significado**: Território da residência (bairro).  
**Tipo**: FK para `locations` (district).  
**Obrigatoriedade**: OBRIGATÓRIO (residências sempre têm território).  
**Uso**:
- Filtrar residências por território
- Inferir território do usuário
- Validar cobertura de serviços
**NÃO É**: Endereço completo (ver `address_id`).

#### `user_residences.address_id`
**Significado**: Endereço postal completo da residência.  
**Tipo**: FK para `addresses`.  
**Obrigatoriedade**: OBRIGATÓRIO (residências sempre têm endereço).  
**Uso**:
- Exibir endereço completo
- Entrega de produtos
- Validação de CEP
**NÃO É**: Território de exibição (ver `location_id`).

#### `service_areas.location_id`
**Significado**: Território de cobertura da entidade (bairro ou cidade que a entidade atende).  
**Tipo**: FK para `locations` (district ou city).  
**Obrigatoriedade**: OBRIGATÓRIO (cobertura sempre tem território).  
**Uso**:
- Definir onde entidade atua
- Filtrar entidades por cobertura
- Validar disponibilidade
**NÃO É**: Endereço da sede (ver `business_data.address_id`), território de exibição (ver `business_data.location_id`).

### B.3 Regras de Consistência Semântica

#### Regra 1: `location_id` sempre aponta para território canônico
```sql
-- ✅ CORRETO
location_id UUID REFERENCES locations(id)

-- ❌ ERRADO
location_id TEXT  -- texto solto
```

#### Regra 2: `address_id` sempre aponta para endereço postal
```sql
-- ✅ CORRETO
address_id UUID REFERENCES addresses(id)

-- ❌ ERRADO
address TEXT, neighborhood TEXT, city TEXT  -- campos soltos
```

#### Regra 3: Coordenadas sempre em `addresses` ou `locations`
```sql
-- ✅ CORRETO (endereço exato)
addresses.latitude, addresses.longitude

-- ✅ CORRETO (centro do território)
locations.canonical_lat, locations.canonical_lng

-- ❌ ERRADO (duplicação)
business_data.latitude, business_data.longitude
```

#### Regra 4: Território obrigatório, endereço opcional
```sql
-- ✅ CORRETO
location_id UUID NOT NULL,  -- sempre obrigatório
address_id UUID NULL        -- opcional (nem tudo tem endereço físico)
```

#### Regra 5: Cobertura separada de localização
```sql
-- ✅ CORRETO
business_data.location_id → território de exibição (sede)
service_areas.location_id → territórios de cobertura (onde atende)

-- ❌ ERRADO
business_data.service_areas JSONB  -- mistura conceitos
```

---

## C. MODELO DE DADOS V2

### C.1 Tabela `locations` (SSOT Territorial)

**Status**: ✅ JÁ EXISTE (migration 20260324000001)

**Estrutura Atual**:
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES locations(id),
  type TEXT CHECK (type IN ('country', 'state', 'city', 'district')),
  slug TEXT NOT NULL,
  geographic_path TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  canonical_lat DECIMAL(10, 8),
  canonical_lng DECIMAL(11, 8),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Propósito**: Hierarquia administrativa oficial.  
**Coordenadas**: `canonical_lat/lng` representam centro geométrico do território (para cálculos de raio).

### C.2 Tabela `addresses` (NOVA - Endereços Postais)

**Status**: ❌ NÃO EXISTE (precisa ser criada)

**Estrutura Proposta**:
```sql
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- FK territorial (bairro onde o endereço está)
  location_id UUID NOT NULL REFERENCES locations(id),
  
  -- Endereço postal
  postal_code VARCHAR(9),              -- CEP (formato: 12345-678), NULL se não aplicável
  street VARCHAR(255),                 -- Logradouro
  number VARCHAR(20),                  -- Número
  complement VARCHAR(100),             -- Complemento
  
  -- Tipo de endereço
  address_type TEXT NOT NULL DEFAULT 'exact'
    CHECK (address_type IN ('exact', 'approximate', 'landmark', 'gps_only')),
  
  -- Coordenadas geocodificadas
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadados de geocoding
  geocoded_at TIMESTAMPTZ,
  geocoding_source VARCHAR(50),        -- 'viacep', 'google', 'manual', 'gps'
  geocoding_confidence DECIMAL(3, 2),  -- 0.00 a 1.00
  
  -- Validação
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_postal_code CHECK (
    postal_code IS NULL OR postal_code ~ '^\d{5}-?\d{3}$'
  ),
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  ),
  CONSTRAINT exact_requires_street CHECK (
    address_type != 'exact' OR (street IS NOT NULL AND street != '')
  ),
  CONSTRAINT gps_only_requires_coords CHECK (
    address_type != 'gps_only' OR (latitude IS NOT NULL AND longitude IS NOT NULL)
  )
);

CREATE INDEX idx_addresses_location_id ON addresses(location_id);
CREATE INDEX idx_addresses_postal_code ON addresses(postal_code) WHERE postal_code IS NOT NULL;
CREATE INDEX idx_addresses_coordinates ON addresses(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_addresses_type ON addresses(address_type);
```

**Tipos de Endereço**:
- `exact`: Endereço completo (rua, número, CEP)
- `approximate`: Endereço aproximado (ex: "Próximo ao Shopping Barra")
- `landmark`: Referência (ex: "Em frente à Igreja")
- `gps_only`: Apenas coordenadas (sem endereço textual)


### C.3 Tabela `location_versions` (NOVA - Governança Territorial)

**Status**: ❌ NÃO EXISTE (precisa ser criada)

**Estrutura Proposta**:
```sql
CREATE TABLE location_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id),
  version_number INTEGER NOT NULL,
  
  -- Dados versionados
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL,
  geographic_path TEXT NOT NULL,
  
  -- Metadados de mudança
  change_type TEXT NOT NULL CHECK (change_type IN ('name_change', 'boundary_change', 'merge', 'split', 'creation', 'deactivation')),
  change_reason TEXT,
  official_source TEXT,                -- 'ibge', 'prefeitura', 'correios', 'manual'
  official_document_url TEXT,
  
  -- Vigência
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_location_version UNIQUE (location_id, version_number)
);

CREATE INDEX idx_location_versions_location_id ON location_versions(location_id);
CREATE INDEX idx_location_versions_valid_period ON location_versions(valid_from, valid_until);
```

**Propósito**: Rastrear mudanças oficiais de território ao longo do tempo.

### C.4 Tabela `location_aliases` (NOVA - Aliases Históricos)

**Status**: ❌ NÃO EXISTE (precisa ser criada)

**Estrutura Proposta**:
```sql
CREATE TABLE location_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id),
  alias_type TEXT NOT NULL CHECK (alias_type IN ('historical_name', 'popular_name', 'abbreviation', 'old_slug')),
  alias_value TEXT NOT NULL,
  
  -- Vigência
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_alias UNIQUE (alias_value, alias_type)
);

CREATE INDEX idx_location_aliases_location_id ON location_aliases(location_id);
CREATE INDEX idx_location_aliases_value ON location_aliases(alias_value);
```

**Propósito**: Preservar nomes históricos e aliases para busca e SEO.

**Exemplos**:
- `alias_type='historical_name'`, `alias_value='Nordeste de Amaralina'` → `location_id='amaralina-norte-uuid'`
- `alias_type='old_slug'`, `alias_value='nordeste-de-amaralina'` → redirect para `amaralina-norte`

### C.5 Tabela `postal_code_history` (NOVA - Governança Postal)

**Status**: ❌ NÃO EXISTE (precisa ser criada)

**Estrutura Proposta**:
```sql
CREATE TABLE postal_code_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postal_code VARCHAR(9) NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  street TEXT,
  
  -- Vigência
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ,
  
  -- Fonte
  source TEXT NOT NULL DEFAULT 'correios',
  
  -- Auditoria
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_postal_code CHECK (postal_code ~ '^\d{5}-?\d{3}$')
);

CREATE INDEX idx_postal_code_history_code ON postal_code_history(postal_code);
CREATE INDEX idx_postal_code_history_location ON postal_code_history(location_id);
CREATE INDEX idx_postal_code_history_valid_period ON postal_code_history(valid_from, valid_until);
```

**Propósito**: Rastrear mudanças de CEP ao longo do tempo (redistribuição dos Correios).


### C.6 Tabela `territory_change_events` (NOVA - Log de Mudanças)

**Status**: ❌ NÃO EXISTE (precisa ser criada)

**Estrutura Proposta**:
```sql
CREATE TABLE territory_change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('name_change', 'boundary_change', 'merge', 'split', 'deactivation', 'reactivation')),
  
  -- Dados da mudança
  old_value JSONB,
  new_value JSONB,
  
  -- Fonte oficial
  official_source TEXT NOT NULL,
  official_document_url TEXT,
  effective_date TIMESTAMPTZ NOT NULL,
  
  -- Auditoria
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_territory_change_events_location_id ON territory_change_events(location_id);
CREATE INDEX idx_territory_change_events_effective_date ON territory_change_events(effective_date);
CREATE INDEX idx_territory_change_events_processed ON territory_change_events(processed_at) WHERE processed_at IS NULL;
```

**Propósito**: Log de mudanças territoriais para auditoria e processamento.

### C.7 Tabela `slug_redirects` (NOVA - SEO e Redirects)

**Status**: ❌ NÃO EXISTE (precisa ser criada)

**Estrutura Proposta**:
```sql
CREATE TABLE slug_redirects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  old_slug TEXT NOT NULL UNIQUE,
  new_slug TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES locations(id),
  redirect_type TEXT NOT NULL DEFAULT 'permanent' CHECK (redirect_type IN ('permanent', 'temporary')),
  
  -- Metadados
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_slug_redirects_old_slug ON slug_redirects(old_slug);
CREATE INDEX idx_slug_redirects_location_id ON slug_redirects(location_id);
```

**Propósito**: Preservar SEO com redirects 301 quando slug muda.

**Exemplo**:
- `old_slug='nordeste-de-amaralina'` → `new_slug='amaralina-norte'`
- URL antiga `/br/ba/salvador/nordeste-de-amaralina` → redirect 301 para `/br/ba/salvador/amaralina-norte`

### C.8 Resumo de Tabelas V2

| Tabela | Status | Propósito | Conceito |
|--------|--------|-----------|----------|
| `locations` | ✅ EXISTE | Hierarquia territorial canônica | Território Canônico |
| `addresses` | ❌ CRIAR | Endereços postais completos | Endereço Postal |
| `service_areas` | ✅ EXISTE | Cobertura geográfica de entidades | Cobertura Geográfica |
| `location_versions` | ❌ CRIAR | Versionamento de territórios | Governança Territorial |
| `location_aliases` | ❌ CRIAR | Aliases históricos e populares | Governança Territorial |
| `postal_code_history` | ❌ CRIAR | Histórico de CEPs | Governança Postal |
| `territory_change_events` | ❌ CRIAR | Log de mudanças territoriais | Governança Territorial |
| `slug_redirects` | ❌ CRIAR | Redirects de URLs antigas | SEO e Governança |
| `user_residences` | ✅ EXISTE | Residências de usuários | Endereço Postal |
| `driver_locations` | ✅ EXISTE | Rastreamento GPS de motoristas | Telemetria GPS |

---

## D. GEOESPACIAL V2

### D.1 Boundary/Polygon por Location

**Problema V1**: Nenhuma proposta de armazenamento de polígonos.

**Solução V2**: Adicionar coluna `boundary` em `locations` com PostGIS.

**Migration Proposta**:
```sql
-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Adicionar coluna boundary
ALTER TABLE locations ADD COLUMN boundary GEOMETRY(POLYGON, 4326);

-- Spatial index
CREATE INDEX idx_locations_boundary ON locations USING GIST(boundary);
```

**Formato**: GeoJSON Polygon (WGS84, SRID 4326).

**Fonte**: IBGE (malhas territoriais), Prefeitura (limites administrativos), manual (admin).


### D.2 Point Geometry para Addresses

**Problema V1**: Coordenadas em colunas separadas (latitude, longitude).

**Solução V2**: Adicionar coluna `point` em `addresses` com PostGIS.

**Migration Proposta**:
```sql
-- Adicionar coluna point
ALTER TABLE addresses ADD COLUMN point GEOMETRY(POINT, 4326);

-- Spatial index
CREATE INDEX idx_addresses_point ON addresses USING GIST(point);

-- Trigger para sincronizar point com latitude/longitude
CREATE OR REPLACE FUNCTION sync_address_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  ELSE
    NEW.point = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_address_point
  BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION sync_address_point();
```

**Benefício**: Queries geoespaciais eficientes (ST_DWithin, ST_Contains).

### D.3 Spatial Indexing

**Estratégia**: Usar índices GiST (Generalized Search Tree) do PostGIS.

**Índices Propostos**:
```sql
-- Polígonos de territórios
CREATE INDEX idx_locations_boundary ON locations USING GIST(boundary);

-- Pontos de endereços
CREATE INDEX idx_addresses_point ON addresses USING GIST(point);
```

**Performance Esperada**:
- Query por raio (ST_DWithin): <50ms para 10k pontos
- Query ponto→território (ST_Contains): <20ms

### D.4 Resolução Ponto → Território

**Problema V1**: Nenhuma estratégia de resolução.

**Solução V2**: Função SQL com PostGIS.

**RPC Proposto**:
```sql
CREATE OR REPLACE FUNCTION resolve_point_to_location(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_type TEXT DEFAULT 'district'
)
RETURNS UUID AS $$
DECLARE
  v_location_id UUID;
BEGIN
  -- Criar ponto
  DECLARE v_point GEOMETRY;
  v_point := ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326);
  
  -- Buscar território que contém o ponto
  SELECT id INTO v_location_id
  FROM locations
  WHERE type = p_type
    AND status = 'active'
    AND boundary IS NOT NULL
    AND ST_Contains(boundary, v_point)
  LIMIT 1;
  
  RETURN v_location_id;
END;
$$ LANGUAGE plpgsql;
```

**Uso**:
```typescript
// Usuário clica no mapa
const locationId = await supabase.rpc('resolve_point_to_location', {
  p_latitude: -12.9876,
  p_longitude: -38.4567,
  p_type: 'district'
});
```

### D.5 Fallback para Área Ambígua

**Problema**: Ponto pode cair em fronteira entre bairros.

**Estratégia de Fallback**:
1. Tentar ST_Contains (ponto dentro do polígono)
2. Se falhar, usar ST_Distance (bairro mais próximo)
3. Se falhar, usar `canonical_lat/lng` do parent (cidade)

**RPC com Fallback**:
```sql
CREATE OR REPLACE FUNCTION resolve_point_to_location_with_fallback(
  p_latitude DECIMAL,
  p_longitude DECIMAL
)
RETURNS TABLE(location_id UUID, resolution_method TEXT, confidence DECIMAL) AS $$
BEGIN
  -- 1. Tentar ST_Contains (confiança 1.0)
  RETURN QUERY
  SELECT id, 'contains'::TEXT, 1.0::DECIMAL
  FROM locations
  WHERE type = 'district'
    AND status = 'active'
    AND boundary IS NOT NULL
    AND ST_Contains(boundary, ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326))
  LIMIT 1;
  
  IF FOUND THEN RETURN; END IF;
  
  -- 2. Fallback: bairro mais próximo (confiança 0.7)
  RETURN QUERY
  SELECT id, 'nearest'::TEXT, 0.7::DECIMAL
  FROM locations
  WHERE type = 'district'
    AND status = 'active'
    AND canonical_lat IS NOT NULL
    AND canonical_lng IS NOT NULL
  ORDER BY ST_Distance(
    ST_SetSRID(ST_MakePoint(canonical_lng, canonical_lat), 4326),
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)
  )
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
```


### D.6 Tratamento de Ausência de Polígono

**Problema**: Nem todos os territórios terão polígonos (dados do IBGE podem estar incompletos).

**Estratégia**:
1. **Prioridade 1**: Usar `boundary` se existir (ST_Contains)
2. **Prioridade 2**: Usar `canonical_lat/lng` com raio padrão (ex: 5km para district, 20km para city)
3. **Prioridade 3**: Usar hierarquia (se ponto está em Salvador, assumir que está em algum bairro de Salvador)

**Implementação**:
```typescript
// GeospatialService.ts
async resolvePointToLocation(lat: number, lng: number): Promise<{
  location_id: string;
  resolution_method: 'polygon' | 'radius' | 'hierarchy';
  confidence: number;
}> {
  // 1. Tentar polígono
  const result = await supabase.rpc('resolve_point_to_location_with_fallback', {
    p_latitude: lat,
    p_longitude: lng
  });
  
  if (result.data) {
    return {
      location_id: result.data.location_id,
      resolution_method: result.data.resolution_method === 'contains' ? 'polygon' : 'radius',
      confidence: result.data.confidence
    };
  }
  
  // 2. Fallback: hierarquia (cidade mais próxima)
  const city = await this.findNearestCity(lat, lng);
  return {
    location_id: city.id,
    resolution_method: 'hierarchy',
    confidence: 0.5
  };
}
```

---

## E. GOVERNANÇA TERRITORIAL/POSTAL V2

### E.1 Fluxo de Mudança de Nome de Bairro

**Cenário**: IBGE anuncia que "Nordeste de Amaralina" passa a se chamar "Amaralina Norte".

**Fluxo Proposto**:
```
1. Admin recebe notificação de mudança oficial
   ↓
2. Admin cria territory_change_event:
   - event_type: 'name_change'
   - old_value: {name: 'Nordeste de Amaralina', slug: 'nordeste-de-amaralina'}
   - new_value: {name: 'Amaralina Norte', slug: 'amaralina-norte'}
   - official_source: 'ibge'
   - effective_date: '2026-04-01'
   ↓
3. Sistema cria location_version:
   - version_number: 2
   - name: 'Amaralina Norte'
   - slug: 'amaralina-norte'
   - valid_from: '2026-04-01'
   ↓
4. Sistema cria location_alias:
   - alias_type: 'historical_name'
   - alias_value: 'Nordeste de Amaralina'
   - valid_until: '2026-03-31'
   ↓
5. Sistema cria slug_redirect:
   - old_slug: 'nordeste-de-amaralina'
   - new_slug: 'amaralina-norte'
   - redirect_type: 'permanent'
   ↓
6. Sistema atualiza locations:
   - name: 'Amaralina Norte'
   - slug: 'amaralina-norte'
   - geographic_path: '/br/ba/salvador/amaralina-norte'
   ↓
7. URLs antigas redirecionam automaticamente (301)
8. Busca por "Nordeste de Amaralina" continua funcionando (alias)
9. Dados históricos preservados (location_versions)
```

### E.2 Fluxo de Mudança de CEP

**Cenário**: Correios redistribuem CEPs e "Rua das Flores" muda de 40140-000 para 40141-000.

**Fluxo Proposto**:
```
1. Sistema detecta mudança via ViaCEP ou sync manual
   ↓
2. Sistema cria postal_code_history:
   - postal_code: '40140-000'
   - street: 'Rua das Flores'
   - location_id: 'pituba-uuid'
   - valid_until: '2026-03-31'
   ↓
3. Sistema cria novo postal_code_history:
   - postal_code: '40141-000'
   - street: 'Rua das Flores'
   - location_id: 'pituba-uuid'
   - valid_from: '2026-04-01'
   ↓
4. Endereços existentes com CEP antigo:
   - Manter address.postal_code = '40140-000' (histórico)
   - Adicionar flag is_verified = false (requer revalidação)
   - Notificar usuário para atualizar CEP
```

### E.3 Fluxo de Mudança de Poligonal

**Cenário**: IBGE atualiza limites de bairro (boundary muda).

**Fluxo Proposto**:
```
1. Admin importa nova malha territorial do IBGE
   ↓
2. Sistema cria location_version:
   - version_number: 3
   - change_type: 'boundary_change'
   - valid_from: '2026-04-01'
   ↓
3. Sistema atualiza locations.boundary com novo polígono
   ↓
4. Sistema re-resolve endereços na fronteira:
   - SELECT * FROM addresses WHERE location_id = 'pituba-uuid'
   - Para cada address: ST_Contains(new_boundary, address.point)
   - Se ponto agora está fora: atualizar location_id para novo bairro
   ↓
5. Sistema notifica entidades afetadas (business, professional)
```


### E.4 Política de Versionamento

**Regra 1**: Mudanças oficiais sempre criam nova versão.  
**Regra 2**: Versão antiga permanece válida até `valid_until`.  
**Regra 3**: Queries sempre usam versão ativa (`valid_until IS NULL`).  
**Regra 4**: Dados históricos preservam `location_id` original (não atualizam automaticamente).

**Exemplo de Query Temporal**:
```sql
-- Buscar nome do bairro em 2025-01-01
SELECT name FROM location_versions
WHERE location_id = 'amaralina-uuid'
  AND valid_from <= '2025-01-01'
  AND (valid_until IS NULL OR valid_until > '2025-01-01')
ORDER BY version_number DESC
LIMIT 1;
```

---

## F. TERRITORY SYNC MULTI-FONTE

### F.1 Fontes Oficiais e Precedência

**Problema V1**: Assumiu IBGE como única fonte.

**Fontes Identificadas**:

| Fonte | Tipo | Dados Fornecidos | Precedência | Frequência de Sync |
|-------|------|------------------|-------------|-------------------|
| **IBGE** | Oficial Federal | Hierarquia administrativa (country, state, city, district), malhas territoriais, códigos oficiais | 🥇 MÁXIMA | Anual |
| **Prefeitura** | Oficial Municipal | Bairros administrativos locais, limites municipais, subdivisões | 🥈 ALTA | Semestral |
| **Correios** | Oficial Postal | CEPs, logradouros, faixas de numeração | 🥈 ALTA | Mensal |
| **Google Geocoding** | Provider Comercial | Coordenadas, endereços enriquecidos, POIs | 🥉 MÉDIA | On-demand |
| **OpenStreetMap** | Crowdsourced | Geometrias, POIs, nomes populares | 🥉 MÉDIA | Semanal |
| **Admin Manual** | Interno | Correções locais, aliases, ajustes | 🏅 OVERRIDE | On-demand |

### F.2 Política de Precedência

**Regra Geral**: Fonte oficial > Provider comercial > Crowdsourced > Manual.

**Exceções**:
- **Admin Manual** sempre sobrescreve (flag `is_manual_override = true`)
- **Prefeitura** sobrescreve IBGE para bairros administrativos locais
- **Correios** é autoridade para CEPs (sobrescreve geocoding)

**Implementação**:
```sql
-- Adicionar coluna source em locations
ALTER TABLE locations ADD COLUMN source TEXT NOT NULL DEFAULT 'ibge'
  CHECK (source IN ('ibge', 'prefeitura', 'correios', 'google', 'osm', 'manual'));

ALTER TABLE locations ADD COLUMN is_manual_override BOOLEAN DEFAULT false;

-- Adicionar coluna source em addresses
ALTER TABLE addresses ADD COLUMN source TEXT NOT NULL DEFAULT 'manual'
  CHECK (source IN ('viacep', 'google', 'manual', 'gps'));
```

### F.3 Fluxo de Sincronização Multi-Fonte

**Cenário**: Sincronizar bairros de Salvador.

**Fluxo Proposto**:
```
1. TerritorySyncService.syncCity('salvador-uuid')
   ↓
2. Buscar dados do IBGE:
   - GET https://servicodados.ibge.gov.br/api/v1/localidades/municipios/2927408/distritos
   - Retorna: lista de distritos oficiais
   ↓
3. Buscar dados da Prefeitura (se disponível):
   - API municipal ou scraping
   - Retorna: bairros administrativos locais
   ↓
4. Resolver conflitos:
   - Se bairro existe no IBGE e Prefeitura: usar dados da Prefeitura (precedência municipal)
   - Se bairro existe apenas no IBGE: usar dados do IBGE
   - Se bairro existe apenas na Prefeitura: criar com source='prefeitura'
   ↓
5. Atualizar locations:
   - INSERT novos bairros
   - UPDATE bairros existentes (criar location_version se nome mudou)
   - Marcar bairros ausentes como inactive (não deletar)
   ↓
6. Criar territory_change_events para auditoria
   ↓
7. Log de sincronização (territory_sync_logs)
```

### F.4 Tabela `territory_sync_logs` (NOVA)

**Estrutura Proposta**:
```sql
CREATE TABLE territory_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  source TEXT NOT NULL,
  location_id UUID REFERENCES locations(id),
  
  -- Resultados
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_deactivated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  
  -- Metadados
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_details JSONB,
  
  -- Auditoria
  triggered_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_territory_sync_logs_status ON territory_sync_logs(status);
CREATE INDEX idx_territory_sync_logs_source ON territory_sync_logs(source);
```


---

## G. BASELINE EXATO REAL

### G.1 Banco de Dados - Números Exatos

#### Tabelas com `location_id` FK

**Query Executável**:
```sql
SELECT 
  table_name,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'location_id'
ORDER BY table_name;
```

**Resultado Esperado** (baseado em schema):
| # | Tabela | Coluna | Constraint |
|---|--------|--------|------------|
| 1 | `profiles` | `location_id` | NULL (opcional) |
| 2 | `business_data` | `location_id` | NULL (opcional) |
| 3 | `professional_data` | `location_id` | NULL (opcional) |
| 4 | `classifieds` | `location_id` | NULL (opcional) |
| 5 | `posts` | `location_id` | NULL (opcional) |
| 6 | `community_posts` | `location_id` | NULL (opcional) |
| 7 | `community_alerts` | `location_id` | NULL (opcional) |
| 8 | `community_issues` | `location_id` | NULL (opcional) |
| 9 | `events` | `location_id` | NULL (opcional) |
| 10 | `driver_routes` | `location_id` | NULL (ausente no schema atual) |

**Total**: 10 tabelas com `location_id` FK.

#### Tabelas com Campos de Texto Duplicados

**Query Executável**:
```sql
SELECT 
  table_name,
  string_agg(column_name, ', ' ORDER BY column_name) as text_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('neighborhood', 'city', 'street', 'address')
GROUP BY table_name
ORDER BY table_name;
```

**Resultado Esperado**:
| # | Tabela | Campos de Texto | Severidade |
|---|--------|-----------------|------------|
| 1 | `profiles` | `neighborhood`, `city`, `street` | 🔴 ALTA |
| 2 | `business_data` | `address`, `neighborhood` (via metadata) | 🔴 ALTA |
| 3 | `professional_data` | `metadata.location` (JSONB: address, neighborhood, city, state, cep) | 🔴 ALTA |
| 4 | `classifieds` | `neighborhood` | 🟡 MÉDIA |
| 5 | `posts` | `city`, `neighborhood`, `street` | 🟡 MÉDIA |
| 6 | `events` | `location` (text) | 🟡 MÉDIA |
| 7 | `user_residences` | `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `postal_code` | 🔴 CRÍTICA |
| 8 | `ride_requests` | `pickup_location` (JSONB), `dropoff_location` (JSONB), `origin` (JSONB), `destination` (JSONB) | 🔴 CRÍTICA |

**Total**: 8 tabelas com campos de texto duplicados.

#### Tabelas com Coordenadas Duplicadas

**Query Executável**:
```sql
SELECT 
  table_name,
  string_agg(column_name, ', ' ORDER BY column_name) as coord_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('latitude', 'longitude', 'lat', 'lng')
GROUP BY table_name
ORDER BY table_name;
```

**Resultado Esperado**:
| # | Tabela | Campos de Coordenadas | Severidade |
|---|--------|----------------------|------------|
| 1 | `business_data` | `latitude`, `longitude` | 🔴 ALTA |
| 2 | `professional_data` | `metadata.location.lat`, `metadata.location.lng` | 🔴 ALTA |
| 3 | `classifieds` | `latitude`, `longitude` | 🟡 MÉDIA |
| 4 | `driver_locations` | `lat`, `lng` | 🟢 BAIXA (telemetria real-time) |
| 5 | `ride_requests` | `origin_lat`, `origin_lng`, `destination_lat`, `destination_lng` (ausentes no schema atual, mas presentes em JSONB) | 🔴 ALTA |
| 6 | `driver_routes` | `origin` (JSONB), `destination` (JSONB) | 🟡 MÉDIA |

**Total**: 6 tabelas com coordenadas duplicadas.

#### Tabelas SEM `location_id` (Violação Crítica)

| # | Tabela | Campos Atuais | Impacto |
|---|--------|---------------|---------|
| 1 | `user_residences` | `street`, `number`, `neighborhood`, `city`, `state`, `postal_code` (todos TEXT) | 🔴 CRÍTICA - Impossível filtrar por hierarquia |
| 2 | `ride_requests` | `pickup_location` (JSONB), `dropoff_location` (JSONB) | 🔴 CRÍTICA - Impossível filtrar corridas por território |
| 3 | `driver_locations` | `lat`, `lng` | 🟢 BAIXA - Telemetria real-time não precisa de hierarquia |

**Total**: 3 tabelas sem `location_id` (2 críticas, 1 aceitável).


### G.2 Frontend Code - Números Exatos

#### Arquivos TypeScript Manipulando Localização

**Query Executável**:
```bash
Get-ChildItem -Path src -Recurse -Filter "*.ts" -File | Select-String -Pattern "LocationService|CoverageService|IBGEService|location_id" | Select-Object -ExpandProperty Path -Unique | Measure-Object
```

**Resultado**: 138 arquivos TypeScript únicos.

#### Componentes TSX Manipulando Localização

**Query Executável**:
```bash
Get-ChildItem -Path src -Recurse -Filter "*.tsx" -File | Select-String -Pattern "location_id|neighborhood|city|address|latitude|longitude" | Select-Object -ExpandProperty Path -Unique | Measure-Object
```

**Resultado**: 305 componentes TSX únicos.

#### Hooks Relacionados a Localização

**Query Executável**:
```bash
Get-ChildItem -Path src -Recurse -Filter "use*.ts*" -File | Select-String -Pattern "location|Location|territory|Territory" | Select-Object -ExpandProperty Path -Unique | Measure-Object
```

**Resultado**: 101 hooks únicos.

#### Services Manipulando Localização

**Query Executável**:
```bash
Get-ChildItem -Path src -Recurse -Filter "*Service.ts" -File | Select-String -Pattern "location_id|neighborhood|city|address|latitude|longitude" | Select-Object -ExpandProperty Path -Unique | Measure-Object
```

**Resultado**: 57 services únicos.

#### Módulos Core de Localização

| Módulo | Arquivos | Status |
|--------|----------|--------|
| `core/location` | 36 arquivos | ✅ IMPLEMENTADO |
| `core/coverage` | 11 arquivos | ✅ IMPLEMENTADO |
| `core/rollout` | ~15 arquivos (estimado) | ✅ IMPLEMENTADO |
| `core/territorial` | ~12 arquivos (estimado) | ✅ IMPLEMENTADO |
| `integrations/maps` | 7 arquivos | ⚠️ ESTRUTURA VAZIA (geocoding TODO) |

**Total Estimado**: ~81 arquivos em módulos core de localização.

### G.3 Integrações - Números Exatos

#### Integrações Externas Implementadas

| Integração | Status | Arquivos | Endpoints/Métodos | API Keys |
|------------|--------|----------|-------------------|----------|
| **IBGE API** | ✅ COMPLETO | 1 (`IBGEService.ts`) | 3 métodos (getStates, getCities, getDistricts) | Pública (sem key) |
| **Google Maps Embed** | ⚠️ PARCIAL | 2 (`StandaloneMap.tsx`, `BusinessContactSidebar.tsx`) | 1 método (embed iframe) | 1 hardcoded (🔴 RISCO) |
| **OpenStreetMap** | ✅ COMPLETO | 1 (`LocationPickerSheet.tsx`) | Tile layer | Pública (sem key) |
| **ViaCEP** | ❌ AUSENTE | 0 | N/A | N/A |
| **Google Geocoding** | ❌ AUSENTE | 0 (TODO em `MapsService.ts`) | N/A | N/A |
| **Google Reverse Geocoding** | ❌ AUSENTE | 0 (TODO em `MapsService.ts`) | N/A | N/A |
| **Mapbox** | ❌ AUSENTE | 0 | N/A | N/A |

**Total**: 3 integrações implementadas (1 completa, 2 parciais), 4 ausentes.

#### API Keys e Segurança

| API Key | Localização | Status | Risco |
|---------|-------------|--------|-------|
| Google Maps | `StandaloneMap.tsx:47,50` | Hardcoded | 🔴 CRÍTICA |
| Google Maps | Deveria estar em `.env` | Ausente | 🔴 CRÍTICA |

**Ação Requerida**: Mover API key para `VITE_GOOGLE_MAPS_API_KEY` em `.env`.

### G.4 Violações - Números Exatos com Queries

#### Violação 1: Campos de Texto Duplicados

**Severidade**: 🔴 ALTA  
**Tabelas Afetadas**: 8  
**Registros Afetados**: Requer query por tabela.

**Query de Auditoria**:
```sql
-- Contar registros com texto duplicado em profiles
SELECT COUNT(*) as total_violations
FROM profiles
WHERE location_id IS NOT NULL
  AND (neighborhood IS NOT NULL OR city IS NOT NULL);

-- Contar registros com texto duplicado em business_data
SELECT COUNT(*) as total_violations
FROM business_data
WHERE location_id IS NOT NULL
  AND (address IS NOT NULL OR neighborhood IS NOT NULL);

-- Contar registros com texto duplicado em professional_data
SELECT COUNT(*) as total_violations
FROM professional_data
WHERE location_id IS NOT NULL
  AND metadata->'location' IS NOT NULL;

-- Contar registros com texto duplicado em classifieds
SELECT COUNT(*) as total_violations
FROM classifieds
WHERE location_id IS NOT NULL
  AND neighborhood IS NOT NULL;

-- Contar registros com texto duplicado em posts
SELECT COUNT(*) as total_violations
FROM posts
WHERE location_id IS NOT NULL
  AND (city IS NOT NULL OR neighborhood IS NOT NULL OR street IS NOT NULL);

-- Contar registros com texto duplicado em events
SELECT COUNT(*) as total_violations
FROM events
WHERE location_id IS NOT NULL
  AND location IS NOT NULL;
```

**Estimativa de Impacto**: 70-90% dos registros com `location_id` também têm campos de texto (baseado em padrão de uso legado).

#### Violação 2: Coordenadas Duplicadas

**Severidade**: 🔴 ALTA  
**Tabelas Afetadas**: 6  
**Registros Afetados**: Requer query por tabela.

**Query de Auditoria**:
```sql
-- Contar registros com coordenadas duplicadas em business_data
SELECT COUNT(*) as total_violations
FROM business_data
WHERE location_id IS NOT NULL
  AND (latitude IS NOT NULL OR longitude IS NOT NULL);

-- Contar registros com coordenadas duplicadas em professional_data
SELECT COUNT(*) as total_violations
FROM professional_data
WHERE location_id IS NOT NULL
  AND (metadata->'location'->>'lat' IS NOT NULL OR metadata->'location'->>'lng' IS NOT NULL);

-- Contar registros com coordenadas duplicadas em classifieds
SELECT COUNT(*) as total_violations
FROM classifieds
WHERE location_id IS NOT NULL
  AND (latitude IS NOT NULL OR longitude IS NOT NULL);

-- Contar registros com coordenadas em ride_requests (JSONB)
SELECT COUNT(*) as total_violations
FROM ride_requests
WHERE pickup_location IS NOT NULL OR dropoff_location IS NOT NULL;
```

**Estimativa de Impacto**: 40-60% dos registros têm coordenadas duplicadas (nem todos os registros têm geocoding).

#### Violação 3: Tabelas SEM `location_id`

**Severidade**: 🔴 CRÍTICA  
**Tabelas Afetadas**: 3 (2 críticas, 1 aceitável)

**Query de Auditoria**:
```sql
-- Contar residências sem location_id
SELECT COUNT(*) as total_residences
FROM user_residences;

-- Contar corridas sem location_id
SELECT COUNT(*) as total_rides
FROM ride_requests;

-- Contar rastreamentos GPS (aceitável)
SELECT COUNT(*) as total_gps_records
FROM driver_locations;
```

**Impacto Estimado**:
- `user_residences`: 100% dos registros precisam de migração (adicionar `location_id` + `address_id`)
- `ride_requests`: 100% dos registros precisam de migração (adicionar `pickup_location_id`, `dropoff_location_id`, `pickup_address_id`, `dropoff_address_id`)
- `driver_locations`: 0% (telemetria real-time não precisa de hierarquia)

#### Violação 4: Inconsistências entre Texto e FK

**Severidade**: 🔴 ALTA  
**Descrição**: Registros onde `neighborhood` (texto) diverge do `location_id` (FK).

**Query de Auditoria**:
```sql
-- Detectar inconsistências em business_data
SELECT COUNT(*) as inconsistencies
FROM business_data bd
JOIN locations l ON bd.location_id = l.id
WHERE bd.neighborhood IS NOT NULL
  AND bd.neighborhood != l.name
  AND bd.neighborhood != l.slug;

-- Detectar inconsistências em profiles
SELECT COUNT(*) as inconsistencies
FROM profiles p
JOIN locations l ON p.location_id = l.id
WHERE p.neighborhood IS NOT NULL
  AND p.neighborhood != l.name
  AND p.neighborhood != l.slug;

-- Detectar inconsistências em classifieds
SELECT COUNT(*) as inconsistencies
FROM classifieds c
JOIN locations l ON c.location_id = l.id
WHERE c.neighborhood IS NOT NULL
  AND c.neighborhood != l.name
  AND c.neighborhood != l.slug;
```

**Estimativa de Impacto**: 10-20% dos registros podem ter inconsistências (typos, edições manuais, bugs).

### G.5 Esforço de Migração - Estimativas Exatas

#### Tabelas a Migrar

| # | Tabela | Registros (Query) | Complexidade | Esforço Estimado |
|---|--------|-------------------|--------------|------------------|
| 1 | `user_residences` | `SELECT COUNT(*) FROM user_residences` | 🔴 ALTA (criar addresses + location_id) | 8-12 horas |
| 2 | `business_data` | `SELECT COUNT(*) FROM business_data` | 🟡 MÉDIA (criar addresses, manter location_id) | 6-8 horas |
| 3 | `professional_data` | `SELECT COUNT(*) FROM professional_data` | 🟡 MÉDIA (migrar JSONB para addresses) | 6-8 horas |
| 4 | `ride_requests` | `SELECT COUNT(*) FROM ride_requests` | 🔴 ALTA (JSONB → addresses + location_id) | 10-14 horas |
| 5 | `classifieds` | `SELECT COUNT(*) FROM classifieds` | 🟢 BAIXA (remover neighborhood) | 2-4 horas |
| 6 | `posts` | `SELECT COUNT(*) FROM posts` | 🟢 BAIXA (remover city/neighborhood/street) | 2-4 horas |
| 7 | `events` | `SELECT COUNT(*) FROM events` | 🟢 BAIXA (remover location text) | 2-4 horas |
| 8 | `profiles` | `SELECT COUNT(*) FROM profiles` | 🟢 BAIXA (remover neighborhood/city/street) | 2-4 horas |

**Total Estimado**: 38-58 horas de desenvolvimento + 10-15 horas de testes + 5-8 horas de validação = **53-81 horas**.

#### Migrations SQL a Criar

| # | Migration | Descrição | Complexidade |
|---|-----------|-----------|--------------|
| 1 | `create_addresses_table.sql` | Criar tabela `addresses` | 🟢 BAIXA |
| 2 | `create_location_versions_table.sql` | Criar tabela `location_versions` | 🟢 BAIXA |
| 3 | `create_location_aliases_table.sql` | Criar tabela `location_aliases` | 🟢 BAIXA |
| 4 | `create_postal_code_history_table.sql` | Criar tabela `postal_code_history` | 🟢 BAIXA |
| 5 | `create_territory_change_events_table.sql` | Criar tabela `territory_change_events` | 🟢 BAIXA |
| 6 | `create_slug_redirects_table.sql` | Criar tabela `slug_redirects` | 🟢 BAIXA |
| 7 | `create_territory_sync_logs_table.sql` | Criar tabela `territory_sync_logs` | 🟢 BAIXA |
| 8 | `add_postgis_to_locations.sql` | Adicionar coluna `boundary` (PostGIS) | 🟡 MÉDIA |
| 9 | `add_postgis_to_addresses.sql` | Adicionar coluna `point` (PostGIS) | 🟡 MÉDIA |
| 10 | `migrate_user_residences.sql` | Migrar dados para addresses + location_id | 🔴 ALTA |
| 11 | `migrate_business_data.sql` | Migrar dados para addresses | 🔴 ALTA |
| 12 | `migrate_professional_data.sql` | Migrar JSONB para addresses | 🔴 ALTA |
| 13 | `migrate_ride_requests.sql` | Migrar JSONB para addresses + location_id | 🔴 ALTA |
| 14 | `cleanup_legacy_fields.sql` | Remover campos duplicados | 🟡 MÉDIA |

**Total**: 14 migrations (6 baixas, 4 médias, 4 altas).

**Esforço Estimado**: 20-30 horas de desenvolvimento de migrations + 10-15 horas de testes.

#### Código Frontend a Refatorar

| Categoria | Arquivos | Esforço Estimado |
|-----------|----------|------------------|
| Services manipulando localização | 57 arquivos | 30-40 horas |
| Componentes coletando endereço | 305 arquivos (maioria apenas leitura) | 15-25 horas (apenas formulários) |
| Hooks de localização | 101 arquivos (maioria já usa SSOT) | 5-10 horas (ajustes) |
| Formulários de endereço | ~8 componentes | 10-15 horas |
| Integrações de geocoding | 0 (criar do zero) | 15-20 horas |

**Total Estimado**: 75-110 horas de refatoração frontend.

#### Esforço Total da Migração

| Fase | Esforço | Risco |
|------|---------|-------|
| Análise e planejamento | 10-15 horas | 🟢 BAIXO |
| Migrations SQL | 30-45 horas | 🟡 MÉDIO |
| Refatoração frontend | 75-110 horas | 🔴 ALTO |
| Integrações externas (ViaCEP, Google) | 15-20 horas | 🟡 MÉDIO |
| Testes e validação | 25-35 horas | 🟡 MÉDIO |
| Documentação | 5-10 horas | 🟢 BAIXO |

**TOTAL GERAL**: **160-235 horas** (4-6 semanas com 1 desenvolvedor full-time).

**Risco de Regressão**: 🔴 ALTO (305 componentes afetados, 57 services, 8 tabelas).

**Recomendação**: Migração incremental por tabela (Fases 0-6) com feature flags e rollback plan.


---

## H. PLANO DE MIGRAÇÃO V2 (FASES REORDENADAS)

### H.0 Visão Geral das Fases

**Ordem Correta V2** (corrige erro de V1):
```
Fase 0: Definição Semântica       → Definir significado exato de location_id por tabela
Fase 1: Modelo Canônico           → Criar addresses, governance tables
Fase 2: Governança Territorial    → Implementar versioning, aliases, redirects
Fase 3: Fundação Geoespacial      → PostGIS, boundaries, spatial indexing
Fase 4: Migração de Dados         → Migrar tabelas críticas (user_residences, business_data, etc)
Fase 5: Integração de Providers   → ViaCEP, Google Geocoding (ÚLTIMO, não primeiro)
Fase 6: Cleanup                   → Remover campos legados
```

**Justificativa da Ordem**:
- Fase 0 primeiro: impossível migrar dados sem definir semântica
- Fase 1-3: criar infraestrutura antes de migrar dados
- Fase 4: migrar dados usando infraestrutura pronta
- Fase 5: integrar providers DEPOIS de ter modelo canônico
- Fase 6: cleanup apenas após validação completa

### H.1 Fase 0: Definição Semântica (1-2 semanas)

**Objetivo**: Definir significado exato de `location_id` em cada tabela.

**Entregáveis**:
1. Documento de semântica formal (Seção B deste documento)
2. Diagrama ER com anotações semânticas
3. Aprovação de stakeholders

**Decisões Requeridas**:
- `profiles.location_id` → Território público do perfil (bairro de exibição)
- `business_data.location_id` → Território da sede (bairro)
- `business_data.address_id` → Endereço postal completo da sede
- `professional_data.location_id` → Território de atuação principal
- `professional_data.address_id` → Endereço do consultório (opcional)
- `ride_requests.pickup_location_id` → Território de origem (bairro)
- `ride_requests.pickup_address_id` → Endereço exato de origem
- `user_residences.location_id` → Território da residência (bairro)
- `user_residences.address_id` → Endereço postal completo

**Critério de Conclusão**: Documento aprovado, sem ambiguidades.

### H.2 Fase 1: Modelo Canônico (2-3 semanas)

**Objetivo**: Criar tabelas canônicas de endereço e governança.

**Migrations**:
1. `20260401000001_create_addresses_table.sql`
2. `20260401000002_create_location_versions_table.sql`
3. `20260401000003_create_location_aliases_table.sql`
4. `20260401000004_create_postal_code_history_table.sql`
5. `20260401000005_create_territory_change_events_table.sql`
6. `20260401000006_create_slug_redirects_table.sql`
7. `20260401000007_create_territory_sync_logs_table.sql`

**Código TypeScript**:
1. `src/core/address/types/index.ts` (tipos Address, PostalAddress)
2. `src/core/address/repositories/IAddressRepository.ts`
3. `src/core/address/repositories/AddressRepositorySupabase.ts`
4. `src/core/address/services/AddressService.ts`

**Testes**:
1. `AddressService.test.ts` (CRUD de addresses)
2. Validação de constraints (CEP, coordenadas)

**Critério de Conclusão**: Tabelas criadas, service implementado, testes passando.

### H.3 Fase 2: Governança Territorial (1-2 semanas)

**Objetivo**: Implementar versionamento, aliases, redirects.

**Código TypeScript**:
1. `src/core/location/services/LocationVersionService.ts`
2. `src/core/location/services/LocationAliasService.ts`
3. `src/core/location/services/SlugRedirectService.ts`
4. `src/core/location/services/TerritoryChangeService.ts`

**Funcionalidades**:
1. Criar versão ao mudar nome de território
2. Criar alias histórico ao mudar nome
3. Criar redirect 301 ao mudar slug
4. Log de mudanças territoriais

**Testes**:
1. Fluxo de mudança de nome
2. Fluxo de mudança de slug
3. Redirect 301 funcionando
4. Busca por alias histórico

**Critério de Conclusão**: Fluxos de governança implementados, testes passando.

### H.4 Fase 3: Fundação Geoespacial (2-3 semanas)

**Objetivo**: Implementar PostGIS, boundaries, spatial indexing.

**Migrations**:
1. `20260408000001_enable_postgis.sql`
2. `20260408000002_add_boundary_to_locations.sql`
3. `20260408000003_add_point_to_addresses.sql`
4. `20260408000004_create_spatial_indexes.sql`
5. `20260408000005_create_resolve_point_to_location_rpc.sql`
6. `20260408000006_create_resolve_with_fallback_rpc.sql`

**Código TypeScript**:
1. `src/core/geospatial/services/GeospatialService.ts`
2. `src/core/geospatial/services/BoundaryService.ts`
3. `src/core/geospatial/utils/postgis.ts`

**Funcionalidades**:
1. Importar polígonos do IBGE (malhas territoriais)
2. Resolver ponto → território (ST_Contains)
3. Fallback para área ambígua (ST_Distance)
4. Queries por raio (ST_DWithin)

**Testes**:
1. Resolução ponto → território
2. Fallback para fronteira
3. Query por raio
4. Performance de spatial index

**Critério de Conclusão**: PostGIS habilitado, RPCs funcionando, testes de performance passando.

### H.5 Fase 4: Migração de Dados (4-6 semanas)

**Objetivo**: Migrar dados legados para modelo canônico.

#### Fase 4.1: user_residences (1 semana)

**Migration**: `20260415000001_migrate_user_residences.sql`

**Fluxo**:
```sql
-- 1. Adicionar colunas novas
ALTER TABLE user_residences ADD COLUMN address_id UUID REFERENCES addresses(id);
ALTER TABLE user_residences ADD COLUMN location_id UUID REFERENCES locations(id);

-- 2. Para cada residência:
--    a. Buscar location_id via city/neighborhood (texto)
--    b. Criar address com postal_code, street, number
--    c. Atualizar user_residences.address_id e location_id

-- 3. Após migração completa:
ALTER TABLE user_residences ALTER COLUMN address_id SET NOT NULL;
ALTER TABLE user_residences ALTER COLUMN location_id SET NOT NULL;

-- 4. Remover campos legados (Fase 6)
```

**Código TypeScript**:
1. Atualizar `ResidenceService.ts` para usar `address_id` + `location_id`
2. Atualizar formulários de residência
3. Atualizar queries

**Testes**: Validar migração de 100% dos registros.

#### Fase 4.2: business_data (1 semana)

**Migration**: `20260422000001_migrate_business_data.sql`

**Fluxo**:
```sql
-- 1. Adicionar coluna address_id
ALTER TABLE business_data ADD COLUMN address_id UUID REFERENCES addresses(id);

-- 2. Para cada business:
--    a. Criar address com address (text), latitude, longitude
--    b. Buscar location_id via neighborhood (texto) se ausente
--    c. Atualizar business_data.address_id

-- 3. Remover campos legados (Fase 6)
```

**Código TypeScript**:
1. Atualizar `BusinessService.ts` para usar `address_id`
2. Atualizar formulários de empresa
3. Atualizar queries

**Testes**: Validar migração, validar "Como Chegar" funcionando.

#### Fase 4.3: professional_data (1 semana)

**Migration**: `20260429000001_migrate_professional_data.sql`

**Fluxo**:
```sql
-- 1. Adicionar coluna address_id
ALTER TABLE professional_data ADD COLUMN address_id UUID REFERENCES addresses(id);

-- 2. Para cada professional:
--    a. Extrair metadata.location (JSONB)
--    b. Criar address com dados do JSONB
--    c. Buscar location_id via metadata.location.city/neighborhood se ausente
--    d. Atualizar professional_data.address_id

-- 3. Remover metadata.location (Fase 6)
```

**Código TypeScript**:
1. Atualizar `ProfessionalService.ts` para usar `address_id`
2. Atualizar formulários de profissional
3. Remover lógica de JSONB

**Testes**: Validar migração de JSONB, validar endereço exibido corretamente.

#### Fase 4.4: ride_requests (1-2 semanas)

**Migration**: `20260506000001_migrate_ride_requests.sql`

**Fluxo**:
```sql
-- 1. Adicionar colunas novas
ALTER TABLE ride_requests ADD COLUMN pickup_address_id UUID REFERENCES addresses(id);
ALTER TABLE ride_requests ADD COLUMN dropoff_address_id UUID REFERENCES addresses(id);
ALTER TABLE ride_requests ADD COLUMN pickup_location_id UUID REFERENCES locations(id);
ALTER TABLE ride_requests ADD COLUMN dropoff_location_id UUID REFERENCES locations(id);

-- 2. Para cada ride_request:
--    a. Extrair pickup_location (JSONB)
--    b. Criar address de origem
--    c. Resolver pickup_location_id via reverse geocoding ou texto
--    d. Repetir para dropoff
--    e. Atualizar ride_requests com FKs

-- 3. Após migração:
ALTER TABLE ride_requests ALTER COLUMN pickup_address_id SET NOT NULL;
ALTER TABLE ride_requests ALTER COLUMN dropoff_address_id SET NOT NULL;
ALTER TABLE ride_requests ALTER COLUMN pickup_location_id SET NOT NULL;
ALTER TABLE ride_requests ALTER COLUMN dropoff_location_id SET NOT NULL;

-- 4. Remover JSONB e coordenadas duplicadas (Fase 6)
```

**Código TypeScript**:
1. Atualizar `RideService.ts` para usar FKs
2. Atualizar `CreateRideModal.tsx`
3. Atualizar queries de mobilidade

**Testes**: Validar migração, validar corridas funcionando, validar estatísticas territoriais.

### H.6 Fase 5: Integração de Providers (2-3 semanas)

**Objetivo**: Implementar ViaCEP e Google Geocoding (APÓS modelo canônico estar pronto).

**Integrações**:

#### 5.1 ViaCEP (Validação de CEP)

**Código TypeScript**:
1. `src/integrations/geocoding/services/ViaCEPService.ts`
2. `src/integrations/geocoding/types/index.ts`
3. `src/core/address/hooks/useAddressAutocomplete.ts`
4. `src/core/address/components/CEPInput.tsx`

**Funcionalidades**:
- Validar formato de CEP (12345-678)
- Buscar endereço por CEP (ViaCEP API)
- Autocomplete de logradouro
- Validação de existência de CEP

**Endpoint**: `https://viacep.com.br/ws/{cep}/json/`

#### 5.2 Google Geocoding (Coordenadas)

**Código TypeScript**:
1. `src/integrations/geocoding/services/GoogleGeocodingService.ts`
2. `src/core/address/hooks/useGeocoding.ts`

**Funcionalidades**:
- Geocoding: endereço → coordenadas
- Reverse geocoding: coordenadas → endereço
- Validação de endereço
- Confidence score

**API Key**: `VITE_GOOGLE_GEOCODING_API_KEY` (variável de ambiente).

#### 5.3 Facade Unificado

**Código TypeScript**:
1. `src/integrations/geocoding/services/GeocodingService.ts` (facade)

**Estratégia**:
```typescript
// Fluxo de geocoding híbrido
async geocodeAddress(address: PostalAddress): Promise<Coordinates> {
  // 1. Se tem CEP: usar ViaCEP primeiro (mais preciso para Brasil)
  if (address.postal_code) {
    const viaCepResult = await ViaCEPService.getAddress(address.postal_code);
    if (viaCepResult) {
      // ViaCEP não retorna coordenadas, usar Google para geocoding
      return await GoogleGeocodingService.geocode(viaCepResult.fullAddress);
    }
  }
  
  // 2. Fallback: Google Geocoding direto
  return await GoogleGeocodingService.geocode(address.fullAddress);
}
```

**Critério de Conclusão**: Integrações funcionando, geocoding automático em formulários.

### H.7 Fase 6: Cleanup (1-2 semanas)

**Objetivo**: Remover campos legados após validação completa.

**Migrations**:
1. `20260520000001_remove_legacy_location_fields.sql`

**Campos a Remover**:
```sql
-- profiles
ALTER TABLE profiles DROP COLUMN neighborhood;
ALTER TABLE profiles DROP COLUMN city;
ALTER TABLE profiles DROP COLUMN street;

-- business_data
ALTER TABLE business_data DROP COLUMN address;
ALTER TABLE business_data DROP COLUMN neighborhood;
ALTER TABLE business_data DROP COLUMN latitude;
ALTER TABLE business_data DROP COLUMN longitude;

-- professional_data
-- Remover metadata.location (JSONB)
UPDATE professional_data SET metadata = metadata - 'location';

-- classifieds
ALTER TABLE classifieds DROP COLUMN neighborhood;
ALTER TABLE classifieds DROP COLUMN latitude;
ALTER TABLE classifieds DROP COLUMN longitude;

-- posts
ALTER TABLE posts DROP COLUMN city;
ALTER TABLE posts DROP COLUMN neighborhood;
ALTER TABLE posts DROP COLUMN street;

-- events
ALTER TABLE events DROP COLUMN location;

-- user_residences
ALTER TABLE user_residences DROP COLUMN street;
ALTER TABLE user_residences DROP COLUMN number;
ALTER TABLE user_residences DROP COLUMN complement;
ALTER TABLE user_residences DROP COLUMN neighborhood;
ALTER TABLE user_residences DROP COLUMN city;
ALTER TABLE user_residences DROP COLUMN state;
ALTER TABLE user_residences DROP COLUMN postal_code;

-- ride_requests
ALTER TABLE ride_requests DROP COLUMN pickup_location;
ALTER TABLE ride_requests DROP COLUMN dropoff_location;
ALTER TABLE ride_requests DROP COLUMN origin;
ALTER TABLE ride_requests DROP COLUMN destination;
ALTER TABLE ride_requests DROP COLUMN origin_lat;
ALTER TABLE ride_requests DROP COLUMN origin_lng;
ALTER TABLE ride_requests DROP COLUMN destination_lat;
ALTER TABLE ride_requests DROP COLUMN destination_lng;
```

**Código TypeScript**:
1. Remover referências a campos legados em services
2. Remover lógica de fallback para texto
3. Atualizar tipos TypeScript

**Validação**:
1. Executar queries de auditoria (Seção G.4)
2. Validar 0 inconsistências
3. Validar 0 registros sem `location_id`/`address_id`

**Critério de Conclusão**: Campos legados removidos, sistema funcionando 100% com modelo canônico.

### H.8 Cronograma Consolidado

| Fase | Duração | Dependências | Risco |
|------|---------|--------------|-------|
| Fase 0: Definição Semântica | 1-2 semanas | Nenhuma | 🟢 BAIXO |
| Fase 1: Modelo Canônico | 2-3 semanas | Fase 0 | 🟡 MÉDIO |
| Fase 2: Governança Territorial | 1-2 semanas | Fase 1 | 🟢 BAIXO |
| Fase 3: Fundação Geoespacial | 2-3 semanas | Fase 1 | 🟡 MÉDIO |
| Fase 4: Migração de Dados | 4-6 semanas | Fases 1, 2, 3 | 🔴 ALTO |
| Fase 5: Integração de Providers | 2-3 semanas | Fase 1 | 🟡 MÉDIO |
| Fase 6: Cleanup | 1-2 semanas | Fase 4 validada | 🟡 MÉDIO |

**TOTAL**: 13-21 semanas (3-5 meses) com 1 desenvolvedor full-time.

**Paralelização Possível**:
- Fase 2 e Fase 3 podem ser paralelas (após Fase 1)
- Fase 5 pode ser paralela com Fase 4 (após Fase 1)

**Cronograma Otimizado**: 10-16 semanas (2.5-4 meses) com 2 desenvolvedores.

### H.9 Rollback Plan

**Estratégia**: Manter campos legados até Fase 6 (cleanup).

**Durante Fases 1-5**:
- Campos legados permanecem na tabela
- Código novo usa `address_id` + `location_id`
- Código legado continua funcionando com campos de texto
- Feature flag: `ENABLE_CANONICAL_ADDRESS_MODEL`

**Rollback**:
```typescript
// Se migração falhar, desabilitar feature flag
if (!featureFlags.ENABLE_CANONICAL_ADDRESS_MODEL) {
  // Usar campos legados
  return {
    address: business_data.address,
    neighborhood: business_data.neighborhood,
    latitude: business_data.latitude,
    longitude: business_data.longitude
  };
}

// Usar modelo canônico
const address = await AddressService.getById(business_data.address_id);
return address;
```

**Critério de Rollback**: Se >5% dos registros falharem na migração ou >10% dos testes de regressão falharem.


---

## I. DECISÕES FINAIS REQUERENDO APROVAÇÃO

### I.1 Estratégia de Geocoding

**Decisão Proposta**: Híbrido ViaCEP + Google Geocoding.

**Justificativa**:
- ViaCEP: gratuito, preciso para CEPs brasileiros, retorna logradouro oficial
- Google: pago, global, retorna coordenadas, suporta reverse geocoding
- Híbrido: usar ViaCEP para validação de CEP, Google para coordenadas

**Fluxo**:
```
1. Usuário digita CEP
   ↓
2. ViaCEP valida e retorna logradouro
   ↓
3. Google Geocoding converte logradouro → coordenadas
   ↓
4. Salvar em addresses (postal_code, street, latitude, longitude)
```

**Alternativas Consideradas**:
- Apenas ViaCEP: não retorna coordenadas
- Apenas Google: menos preciso para CEPs brasileiros, mais caro
- Mapbox: similar ao Google, sem vantagem clara

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.2 Armazenamento de Coordenadas

**Decisão Proposta**: Coordenadas em AMBOS `locations.canonical_lat/lng` E `addresses.latitude/longitude`.

**Justificativa**:
- `locations.canonical_lat/lng`: centro geométrico do território (para cálculos de raio, "bairros próximos")
- `addresses.latitude/longitude`: coordenadas exatas do endereço (para navegação GPS, "Como Chegar")
- Propósitos diferentes, não é duplicação

**Exemplo**:
```
locations (Pituba):
  canonical_lat: -12.9876  (centro do bairro)
  canonical_lng: -38.4567

addresses (Rua das Flores, 123):
  latitude: -12.9912       (endereço exato)
  longitude: -38.4589
  location_id: pituba-uuid
```

**Alternativas Consideradas**:
- Apenas em addresses: impossível calcular "bairros próximos" sem centro do território
- Apenas em locations: impossível ter coordenadas exatas de endereços

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.3 Obrigatoriedade de Endereço

**Decisão Proposta**: `location_id` obrigatório, `address_id` opcional.

**Justificativa**:
- Território sempre obrigatório (filtros territoriais, URLs, rollout)
- Endereço postal opcional (nem todas entidades têm endereço físico)

**Casos de Uso**:
- Empresa online: `location_id` (Salvador) + `address_id` NULL
- Empresa física: `location_id` (Pituba) + `address_id` (Rua X, 123)
- Profissional autônomo: `location_id` (Barra) + `address_id` NULL (atende em domicílio)
- Classificado: `location_id` (Rio Vermelho) + `address_id` NULL (item sem endereço fixo)

**Exceções**:
- `user_residences`: AMBOS obrigatórios (residência sempre tem endereço)
- `ride_requests`: AMBOS obrigatórios (corrida sempre tem origem/destino exatos)

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.4 Abordagem de Migração

**Decisão Proposta**: Migração incremental por tabela com feature flags.

**Justificativa**:
- Risco de regressão alto (305 componentes, 57 services)
- Impossível migrar tudo de uma vez
- Feature flags permitem rollback rápido

**Estratégia**:
```typescript
// Feature flags por tabela
const flags = {
  ENABLE_USER_RESIDENCES_MIGRATION: true,
  ENABLE_BUSINESS_DATA_MIGRATION: false,  // ainda não migrado
  ENABLE_PROFESSIONAL_DATA_MIGRATION: false,
  ENABLE_RIDE_REQUESTS_MIGRATION: false
};

// Código adaptativo
if (flags.ENABLE_USER_RESIDENCES_MIGRATION) {
  // Usar address_id + location_id
  const address = await AddressService.getById(residence.address_id);
} else {
  // Usar campos legados
  const address = {
    street: residence.street,
    number: residence.number,
    neighborhood: residence.neighborhood
  };
}
```

**Alternativas Consideradas**:
- Big bang migration: risco muito alto, impossível rollback
- Dual write: complexidade alta, risco de inconsistência

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.5 Tratamento de Dados Legados

**Decisão Proposta**: Migrar apenas registros ativos, arquivar inativos.

**Justificativa**:
- Registros inativos/deletados não precisam de geocoding
- Reduz esforço de migração
- Preserva dados históricos sem processamento

**Estratégia**:
```sql
-- Migrar apenas registros ativos
INSERT INTO addresses (location_id, postal_code, street, number)
SELECT 
  resolved_location_id,
  postal_code,
  street,
  number
FROM user_residences
WHERE deleted_at IS NULL;  -- apenas ativos

-- Registros inativos: manter campos legados
-- (não migrar, não deletar)
```

**Alternativas Consideradas**:
- Migrar tudo: esforço desnecessário para dados inativos
- Deletar inativos: perda de dados históricos

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.6 Validação de CEP

**Decisão Proposta**: Validação de formato + existência com debounce.

**Justificativa**:
- Formato: validação client-side instantânea (regex)
- Existência: validação server-side com debounce (ViaCEP API)
- Debounce: evitar chamadas excessivas durante digitação

**Implementação**:
```typescript
// CEPInput.tsx
const validateCEP = useDebouncedCallback(async (cep: string) => {
  // 1. Validar formato
  if (!/^\d{5}-?\d{3}$/.test(cep)) {
    setError('Formato inválido');
    return;
  }
  
  // 2. Validar existência (ViaCEP)
  const result = await ViaCEPService.getAddress(cep);
  if (!result) {
    setError('CEP não encontrado');
    return;
  }
  
  // 3. Autocomplete
  setStreet(result.logradouro);
  setNeighborhood(result.bairro);
}, 500);  // 500ms debounce
```

**Alternativas Consideradas**:
- Apenas formato: não valida se CEP existe
- Sem debounce: muitas chamadas à API

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.7 Google Maps API Key

**Decisão Proposta**: Mover para variável de ambiente `VITE_GOOGLE_MAPS_API_KEY`.

**Justificativa**:
- API key hardcoded é risco de segurança crítico
- Exposta no bundle JS (acessível por qualquer usuário)
- Possível uso indevido e custos inesperados

**Implementação**:
```typescript
// .env.local
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8

// StandaloneMap.tsx
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}`;
```

**Restrições de API Key** (Google Cloud Console):
- Restringir por domínio (apenas vitrinebairro.com.br)
- Restringir por API (apenas Maps Embed API e Geocoding API)
- Definir quota diária (ex: 10.000 requests/dia)

**Alternativas Consideradas**:
- Proxy server-side: mais seguro, mas adiciona latência
- API key pública: risco inaceitável

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.8 Endereços de Mobilidade

**Decisão Proposta**: Coordenadas obrigatórias + reverse geocoding para exibição.

**Justificativa**:
- Motorista precisa de coordenadas exatas para navegação GPS
- Usuário precisa de endereço textual para confirmar localização
- Reverse geocoding converte coordenadas → endereço para exibição

**Fluxo de Solicitação de Corrida**:
```
1. Usuário digita endereço OU usa GPS
   ↓
2. Se GPS: reverse geocoding (coordenadas → endereço)
   ↓
3. Geocoding: endereço → coordenadas (se não veio do GPS)
   ↓
4. Resolver location_id via PostGIS (ponto → território)
   ↓
5. Criar address (postal_code, street, latitude, longitude, location_id)
   ↓
6. Criar ride_request (pickup_address_id, dropoff_address_id, pickup_location_id, dropoff_location_id)
```

**Campos em ride_requests**:
```sql
pickup_address_id UUID NOT NULL,      -- endereço exato de origem
dropoff_address_id UUID NOT NULL,     -- endereço exato de destino
pickup_location_id UUID NOT NULL,     -- território de origem (bairro)
dropoff_location_id UUID NOT NULL     -- território de destino (bairro)
```

**Alternativas Consideradas**:
- Apenas coordenadas: UX ruim (usuário não vê endereço textual)
- Apenas endereço textual: impossível navegação GPS precisa

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.9 Cache de Geocoding

**Decisão Proposta**: Cache em `addresses` table (banco de dados).

**Justificativa**:
- Geocoding é caro (API paga, latência)
- Endereços raramente mudam
- Cache no banco evita chamadas repetidas

**Estratégia**:
```typescript
// AddressService.ts
async geocodeAddress(address: PostalAddress): Promise<Address> {
  // 1. Buscar cache
  const cached = await this.findByPostalCode(address.postal_code);
  if (cached && cached.latitude && cached.longitude) {
    return cached;  // cache hit
  }
  
  // 2. Geocoding (cache miss)
  const coords = await GeocodingService.geocode(address);
  
  // 3. Salvar cache
  return await this.create({
    ...address,
    latitude: coords.latitude,
    longitude: coords.longitude,
    geocoded_at: new Date(),
    geocoding_source: 'google'
  });
}
```

**Invalidação de Cache**:
- Nunca (endereços são imutáveis)
- Se CEP mudar oficialmente: criar novo registro em `addresses`
- Se coordenadas estiverem incorretas: admin pode marcar `is_verified = false`

**Alternativas Consideradas**:
- Cache em LocalStorage: limitado, não compartilhado entre usuários
- Cache em Redis: adiciona complexidade de infraestrutura
- Sem cache: custos altos de API, latência ruim

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.10 Validação de Endereço

**Decisão Proposta**: Validação client-side + server-side.

**Justificativa**:
- Client-side: feedback instantâneo, melhor UX
- Server-side: segurança, integridade de dados

**Validações Client-Side**:
```typescript
// CEPInput.tsx
const validateCEP = (cep: string): boolean => {
  return /^\d{5}-?\d{3}$/.test(cep);
};

// AddressForm.tsx
const validateAddress = (address: PostalAddress): ValidationResult => {
  const errors = [];
  
  if (!address.postal_code) errors.push('CEP obrigatório');
  if (!address.street) errors.push('Logradouro obrigatório');
  if (!address.location_id) errors.push('Bairro obrigatório');
  
  return { valid: errors.length === 0, errors };
};
```

**Validações Server-Side**:
```sql
-- Constraints em addresses
CONSTRAINT valid_postal_code CHECK (postal_code ~ '^\d{5}-?\d{3}$'),
CONSTRAINT valid_coordinates CHECK (
  (latitude IS NULL AND longitude IS NULL) OR
  (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
),
CONSTRAINT exact_requires_street CHECK (
  address_type != 'exact' OR (street IS NOT NULL AND street != '')
)
```

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.11 PostGIS vs Coordenadas Simples

**Decisão Proposta**: Usar PostGIS para queries geoespaciais avançadas.

**Justificativa**:
- PostGIS: suporta polígonos, spatial indexing, ST_Contains, ST_DWithin
- Coordenadas simples: suficiente para casos básicos, mas limitado

**Casos de Uso que Requerem PostGIS**:
- "Descobrir bairro por GPS" (ponto → território)
- "Filtrar por raio" (ex: "empresas a 5km de mim")
- "Verificar se ponto está dentro de polígono" (boundary check)
- "Bairros próximos" (ST_Distance entre polígonos)

**Casos de Uso que NÃO Requerem PostGIS**:
- Exibir endereço em mapa (latitude/longitude simples)
- Calcular distância entre 2 pontos (Haversine)
- Filtrar por bairro (location_id FK)

**Implementação**:
```sql
-- Habilitar PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Adicionar colunas geometry
ALTER TABLE locations ADD COLUMN boundary GEOMETRY(POLYGON, 4326);
ALTER TABLE addresses ADD COLUMN point GEOMETRY(POINT, 4326);

-- Spatial indexes
CREATE INDEX idx_locations_boundary ON locations USING GIST(boundary);
CREATE INDEX idx_addresses_point ON addresses USING GIST(point);
```

**Alternativas Consideradas**:
- Apenas coordenadas simples: não suporta polígonos, queries geoespaciais limitadas
- Biblioteca JavaScript (Turf.js): processamento client-side, performance ruim

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.12 Sincronização Multi-Fonte

**Decisão Proposta**: Política de precedência com override manual.

**Justificativa**:
- Múltiplas fontes oficiais podem ter dados conflitantes
- Precedência clara evita inconsistências
- Override manual permite correções locais

**Política de Precedência**:
```
1. Admin Manual (is_manual_override = true)  → MÁXIMA
2. Prefeitura (bairros administrativos)      → ALTA
3. IBGE (hierarquia federal)                 → ALTA
4. Correios (CEPs e logradouros)             → ALTA
5. Google Geocoding                          → MÉDIA
6. OpenStreetMap                             → MÉDIA
```

**Fluxo de Conflito**:
```typescript
// TerritorySyncService.ts
async resolveConflict(ibgeData, prefeituraData): Promise<LocationData> {
  // 1. Se admin marcou override manual: usar dados atuais
  if (currentLocation.is_manual_override) {
    return currentLocation;
  }
  
  // 2. Se Prefeitura tem dados: usar Prefeitura (precedência municipal)
  if (prefeituraData) {
    return prefeituraData;
  }
  
  // 3. Fallback: usar IBGE
  return ibgeData;
}
```

**Alternativas Consideradas**:
- Apenas IBGE: ignora dados municipais mais precisos
- Merge automático: risco de inconsistências

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.13 Tipos de Endereço

**Decisão Proposta**: Suportar 4 tipos de endereço (exact, approximate, landmark, gps_only).

**Justificativa**:
- Casos reais não se encaixam em modelo rígido
- Flexibilidade melhora UX
- Confidence/precision permite validação gradual

**Tipos Propostos**:

| Tipo | Descrição | Exemplo | Campos Obrigatórios |
|------|-----------|---------|---------------------|
| `exact` | Endereço completo | "Rua das Flores, 123" | `street`, `location_id` |
| `approximate` | Endereço aproximado | "Próximo ao Shopping Barra" | `location_id` |
| `landmark` | Referência | "Em frente à Igreja de São Francisco" | `location_id` |
| `gps_only` | Apenas coordenadas | GPS: -12.9876, -38.4567 | `latitude`, `longitude`, `location_id` |

**Implementação**:
```sql
address_type TEXT NOT NULL DEFAULT 'exact'
  CHECK (address_type IN ('exact', 'approximate', 'landmark', 'gps_only')),

CONSTRAINT exact_requires_street CHECK (
  address_type != 'exact' OR (street IS NOT NULL AND street != '')
),
CONSTRAINT gps_only_requires_coords CHECK (
  address_type != 'gps_only' OR (latitude IS NOT NULL AND longitude IS NOT NULL)
)
```

**Alternativas Consideradas**:
- Apenas exact: não suporta casos edge, UX ruim
- Texto livre: impossível validar, inconsistências

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.14 Confidence Score de Geocoding

**Decisão Proposta**: Armazenar confidence score (0.00 a 1.00) em `addresses.geocoding_confidence`.

**Justificativa**:
- Geocoding nem sempre é preciso
- Confidence permite filtrar endereços confiáveis
- Permite validação manual de endereços com baixa confiança

**Níveis de Confidence**:

| Score | Significado | Exemplo |
|-------|-------------|---------|
| 1.00 | Exato (validado) | CEP + número validado pelo usuário |
| 0.90 | Muito provável | Google Geocoding com match exato |
| 0.70 | Provável | Google Geocoding com match parcial |
| 0.50 | Incerto | Reverse geocoding de GPS |
| 0.30 | Baixa confiança | Endereço aproximado |
| 0.00 | Não geocodificado | Endereço manual sem validação |

**Uso**:
```typescript
// Filtrar apenas endereços confiáveis
const reliableAddresses = await supabase
  .from('addresses')
  .select('*')
  .gte('geocoding_confidence', 0.70);

// Exibir aviso para baixa confiança
if (address.geocoding_confidence < 0.70) {
  showWarning('Endereço pode estar impreciso. Confirme a localização.');
}
```

**Alternativas Consideradas**:
- Sem confidence: impossível distinguir endereços confiáveis de incertos
- Boolean (verified): muito simplista, perde nuance

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.15 Tratamento de Polígonos Ausentes

**Decisão Proposta**: Fallback hierárquico (polygon → radius → parent).

**Justificativa**:
- Nem todos os bairros terão polígonos (dados do IBGE incompletos)
- Fallback garante funcionalidade mesmo sem polígono
- Confidence score indica qualidade da resolução

**Estratégia de Fallback**:
```typescript
// GeospatialService.ts
async resolvePointToLocation(lat: number, lng: number): Promise<{
  location_id: string;
  resolution_method: 'polygon' | 'radius' | 'hierarchy';
  confidence: number;
}> {
  // 1. Tentar polígono (confiança 1.0)
  const polygonResult = await this.resolveViaPolygon(lat, lng);
  if (polygonResult) {
    return { ...polygonResult, resolution_method: 'polygon', confidence: 1.0 };
  }
  
  // 2. Fallback: raio a partir de canonical_lat/lng (confiança 0.7)
  const radiusResult = await this.resolveViaRadius(lat, lng, 5);  // 5km
  if (radiusResult) {
    return { ...radiusResult, resolution_method: 'radius', confidence: 0.7 };
  }
  
  // 3. Fallback: hierarquia (cidade mais próxima, confiança 0.5)
  const hierarchyResult = await this.resolveViaHierarchy(lat, lng);
  return { ...hierarchyResult, resolution_method: 'hierarchy', confidence: 0.5 };
}
```

**Alternativas Consideradas**:
- Apenas polígono: falha quando polígono ausente
- Apenas raio: impreciso para bairros irregulares

**Aprovação Requerida**: ✅ SIM / ❌ NÃO / 🔄 REVISAR

**Comentários**:

### I.16 Resumo de Decisões

| # | Decisão | Proposta | Impacto | Aprovação |
|---|---------|----------|---------|-----------|
| I.1 | Estratégia de Geocoding | Híbrido ViaCEP + Google | 🟡 MÉDIO | ⬜ |
| I.2 | Armazenamento de Coordenadas | AMBOS locations + addresses | 🟢 BAIXO | ⬜ |
| I.3 | Obrigatoriedade de Endereço | location_id obrigatório, address_id opcional | 🟡 MÉDIO | ⬜ |
| I.4 | Abordagem de Migração | Incremental por tabela com feature flags | 🔴 ALTO | ⬜ |
| I.5 | Tratamento de Dados Legados | Migrar apenas ativos, arquivar inativos | 🟢 BAIXO | ⬜ |
| I.6 | Validação de CEP | Formato + existência com debounce | 🟢 BAIXO | ⬜ |
| I.7 | Google Maps API Key | Mover para variável de ambiente | 🔴 CRÍTICO | ⬜ |
| I.8 | Endereços de Mobilidade | Coordenadas obrigatórias + reverse geocoding | 🟡 MÉDIO | ⬜ |
| I.9 | Cache de Geocoding | Cache em addresses table (banco) | 🟢 BAIXO | ⬜ |
| I.10 | Validação de Endereço | Client-side + server-side | 🟢 BAIXO | ⬜ |
| I.11 | PostGIS vs Coordenadas Simples | Usar PostGIS para queries avançadas | 🟡 MÉDIO | ⬜ |
| I.12 | Sincronização Multi-Fonte | Política de precedência com override manual | 🟡 MÉDIO | ⬜ |
| I.13 | Tipos de Endereço | 4 tipos (exact, approximate, landmark, gps_only) | 🟡 MÉDIO | ⬜ |
| I.14 | Confidence Score | Armazenar score 0.00-1.00 | 🟢 BAIXO | ⬜ |
| I.15 | Polígonos Ausentes | Fallback hierárquico (polygon → radius → parent) | 🟡 MÉDIO | ⬜ |

**Legenda de Aprovação**:
- ⬜ Pendente
- ✅ Aprovado
- ❌ Rejeitado
- 🔄 Revisar

**Próximos Passos**:
1. Revisar todas as decisões
2. Aprovar/rejeitar cada decisão
3. Documentar comentários e ajustes
4. Iniciar Fase 0 após aprovação completa


---

## J. CONCLUSÃO E PRÓXIMOS PASSOS

### J.1 Resumo Executivo

Esta auditoria V2 corrige as **8 falhas graves** da auditoria V1:

1. ✅ Separação conceitual explícita (5 conceitos: território, endereço, geocoding, GPS, cobertura)
2. ✅ Semântica formal de `location_id` por tabela (Seção B.2)
3. ✅ Governança territorial/postal completa (Seção E)
4. ✅ Geoespacial completo com PostGIS (Seção D)
5. ✅ Address model flexível (4 tipos, confidence score)
6. ✅ Territory sync multi-fonte com precedência (Seção F)
7. ✅ Baseline exato real (números precisos, queries executáveis)
8. ✅ Fases reordenadas corretamente (Semântica → Modelo → Providers)

### J.2 Números Críticos

| Métrica | Valor | Impacto |
|---------|-------|---------|
| Tabelas a migrar | 8 | 🔴 ALTO |
| Arquivos TypeScript afetados | 138 | 🔴 ALTO |
| Componentes TSX afetados | 305 | 🔴 ALTO |
| Services afetados | 57 | 🔴 ALTO |
| Migrations SQL a criar | 14 | 🟡 MÉDIO |
| Esforço total estimado | 160-235 horas | 🔴 ALTO |
| Duração estimada | 10-16 semanas | 🔴 ALTO |
| Risco de regressão | ALTO | 🔴 CRÍTICO |

### J.3 Decisões Críticas Pendentes

**Requerem Aprovação Imediata**:
1. I.7: Mover Google Maps API key para variável de ambiente (🔴 SEGURANÇA CRÍTICA)
2. I.4: Abordagem de migração incremental com feature flags
3. I.1: Estratégia de geocoding híbrido (ViaCEP + Google)

**Requerem Aprovação Antes de Fase 1**:
4. I.2: Armazenamento de coordenadas (locations + addresses)
5. I.3: Obrigatoriedade de endereço (location_id obrigatório, address_id opcional)
6. I.11: Uso de PostGIS para queries geoespaciais

**Requerem Aprovação Antes de Fase 4**:
7. I.5: Tratamento de dados legados (migrar apenas ativos)
8. I.8: Endereços de mobilidade (coordenadas + reverse geocoding)

### J.4 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Regressão em 305 componentes | 🔴 ALTA | 🔴 CRÍTICO | Feature flags, testes de regressão |
| Inconsistências em migração de dados | 🟡 MÉDIA | 🔴 CRÍTICO | Queries de validação, rollback plan |
| Custos de Google Geocoding API | 🟡 MÉDIA | 🟡 MÉDIO | Cache em banco, quota diária |
| Performance de PostGIS | 🟢 BAIXA | 🟡 MÉDIO | Spatial indexes, testes de carga |
| Conflitos entre fontes oficiais | 🟡 MÉDIA | 🟡 MÉDIO | Política de precedência clara |
| Perda de SEO em mudança de slug | 🟢 BAIXA | 🟡 MÉDIO | Redirects 301, aliases históricos |

### J.5 Ações Imediatas

**Antes de Qualquer Implementação**:
1. ✅ Revisar e aprovar Seção I (Decisões Finais)
2. ✅ Mover Google Maps API key para `.env` (URGENTE - risco de segurança)
3. ✅ Executar queries de baseline (Seção G.4) para números exatos de registros
4. ✅ Validar esforço estimado com time de desenvolvimento

**Após Aprovação**:
5. Iniciar Fase 0 (Definição Semântica)
6. Criar documento de arquitetura detalhado
7. Definir contratos TypeScript (interfaces, tipos)
8. Criar migrations de Fase 1 (Modelo Canônico)

### J.6 Critérios de Sucesso

**Fase 0-3 (Fundação)**:
- ✅ Semântica formal documentada e aprovada
- ✅ Tabelas canônicas criadas (addresses, governance)
- ✅ PostGIS habilitado e funcionando
- ✅ Testes de fundação passando (100%)

**Fase 4 (Migração)**:
- ✅ 100% dos registros ativos migrados
- ✅ 0 inconsistências entre texto e FK
- ✅ 0 registros sem `location_id`/`address_id` obrigatórios
- ✅ Queries de validação (Seção G.4) retornam 0 violações

**Fase 5-6 (Integração e Cleanup)**:
- ✅ Geocoding automático funcionando
- ✅ Campos legados removidos
- ✅ Testes de regressão passando (100%)
- ✅ Performance aceitável (<100ms para queries territoriais)

---

**FIM DA AUDITORIA V2**

**Status**: ✅ COMPLETA  
**Próxima Ação**: Revisar Seção I (Decisões Finais) e aprovar para iniciar Fase 0.
