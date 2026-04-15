# FUNDAÇÃO GEOGRÁFICA - RESUMO EXECUTIVO

**Status**: ✅ Etapa 1 Aprovada e Congelada  
**Data**: 2026-03-24

---

## 🎯 VISÃO GERAL

A fundação geográfica estabelece a infraestrutura territorial do produto através de 4 módulos:

```
┌─────────────────────────────────────────────────────────┐
│                    MÓDULOS DE DOMÍNIO                   │
│         (business, mobility, services, etc)             │
└────────────────────┬────────────────────────────────────┘
                     │ consomem
        ┌────────────┴────────────┬──────────────┐
        ↓                         ↓              ↓
┌───────────────┐    ┌────────────────┐   ┌─────────────┐
│core/location  │    │core/coverage   │   │core/rollout │
│SSOT territorial│   │Cobertura       │   │Ativação     │
└───────┬───────┘    └────────┬───────┘   └──────┬──────┘
        │                     │                   │
        └─────────────────────┴───────────────────┘
                              │
                    ┌─────────┴──────────┐
                    ↓                    ↓
            ┌───────────────┐    ┌──────────────┐
            │integrations/  │    │shared/*      │
            │maps           │    │              │
            │GPS, geocoding │    │types, utils  │
            └───────────────┘    └──────────────┘
```

---

## 📦 4 MÓDULOS DEFINIDOS

### 1. `core/location` - SSOT Territorial

**O que faz**: Gerencia a hierarquia geográfica canônica

**Exemplo**: Brasil > BA > Salvador > Pituba

**Responsabilidades**:
- Entidade `Location` (id, parent_id, type, slug, path)
- Resolução por ID, path, slug
- Navegação de árvore (ancestors, descendants)
- Contexto geográfico do app

**Não faz**: GPS, geocoding, distância, cobertura, rollout

---

### 2. `core/coverage` - Cobertura de Entidades

**O que faz**: Define onde cada entidade atua

**Exemplo**: Business#456 cobre Pituba e Barra

**Responsabilidades**:
- Entidade `ServiceArea`
- Cobertura por district/city/radius
- Verificar se entidade cobre localização
- Listar entidades em localização

**Não faz**: Hierarquia geográfica, rollout, GPS

---

### 3. `core/rollout` - Ativação de Módulos

**O que faz**: Controla quais módulos estão ativos por região

**Exemplo**: mobility ativo em Salvador, inativo em Feira

**Responsabilidades**:
- Entidade `ModuleRollout`
- Ativação por localização
- Herança de ativação
- Override local

**Não faz**: Hierarquia geográfica, cobertura, GPS

---

### 4. `integrations/maps` - Serviços Geoespaciais

**O que faz**: Integração com mapas externos

**Exemplo**: Rua X → lat/lng, calcular distância

**Responsabilidades**:
- Geocoding/reverse geocoding
- GPS do browser
- Cálculos de distância
- Renderização de mapas

**Não faz**: Hierarquia geográfica, cobertura, rollout

---

## 🔄 FLUXO DE DEPENDÊNCIAS

```
core/location → shared
core/coverage → core/location + shared
core/rollout → core/location + shared
integrations/maps → shared
```

**Regra de ouro**: `coverage` e `rollout` NÃO dependem um do outro.

---

## 🗺️ PADRÃO `geographic_path`

### Formato Canônico
```
/{country_code}/{state_code}/{city_slug}/{district_slug}
```

### Exemplos
```
/br                           # Brasil
/br/ba                        # Bahia
/br/ba/salvador               # Salvador
/br/ba/salvador/pituba        # Pituba
/br/sp/sao-paulo              # São Paulo
/br/sp/sao-paulo/vila-mariana # Vila Mariana
```

### Regras
- **country/state**: códigos ISO (2 letras minúsculas)
- **city/district**: slugs kebab-case

---

## 🚫 PROIBIÇÕES PARA MÓDULOS

### ❌ Módulos de domínio NÃO podem:

1. **Acessar integrações diretamente**
```typescript
// ❌ ERRADO
import { mapsClient } from '@/integrations/maps/client';

// ✅ CORRETO
import { GeocodingService } from '@/integrations/maps';
```

2. **Definir cobertura inline**
```typescript
// ❌ ERRADO
const isCovered = lat > -24 && lat < -23;

// ✅ CORRETO
const isCovered = await CoverageService.doesCover(entityId, locationId);
```

3. **Controlar rollout inline**
```typescript
// ❌ ERRADO
const isActive = process.env.VITE_MOBILITY_ENABLED === 'true';

// ✅ CORRETO
const isActive = await RolloutService.isModuleActive('mobility', locationId);
```

4. **Manipular hierarquia geográfica**
```typescript
// ❌ ERRADO
await supabase.from('locations').insert({ name: 'Nova Cidade' });

// ✅ CORRETO
// Apenas core/location pode criar/modificar localizações
```

---

## 📁 ESTRUTURA CRIADA

```
src/
├── core/
│   ├── location/          ✅ SSOT territorial
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── providers/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── README.md
│   │   └── index.ts
│   │
│   ├── coverage/          ✅ Cobertura de entidades
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── README.md
│   │   └── index.ts
│   │
│   └── rollout/           ✅ Rollout de módulos
│       ├── services/
│       ├── hooks/
│       ├── types/
│       ├── utils/
│       ├── README.md
│       └── index.ts
│
└── integrations/
    └── maps/              ✅ Serviços geoespaciais
        ├── services/
        ├── hooks/
        ├── types/
        ├── utils/
        ├── README.md
        └── index.ts
```

---

## 📚 DOCUMENTAÇÃO CRIADA

### Principais
1. **GEOGRAPHIC_FOUNDATION.md** - Documento oficial (completo)
2. **GEOGRAPHIC_FOUNDATION_RULES.md** - Regras de dependência
3. **GEOGRAPHIC_FOUNDATION_STAGE1_FROZEN.md** - Checklist de congelamento
4. **GEOGRAPHIC_FOUNDATION_SUMMARY.md** - Este resumo

### Por Módulo
5. **src/core/location/README.md**
6. **src/core/coverage/README.md**
7. **src/core/rollout/README.md**
8. **src/integrations/maps/README.md**

---

## 📊 NÚMEROS DA ENTREGA

- **Arquivos criados**: 26
- **Pastas criadas**: 14
- **Documentos**: 8
- **Código quebrado**: 0
- **Tempo de implementação**: Etapa 1 apenas (estrutural)

---

## ✅ O QUE ESTÁ CONGELADO

- ✅ Estrutura de pastas
- ✅ Responsabilidades de cada módulo
- ✅ Fluxo de dependências
- ✅ Padrão `geographic_path`
- ✅ Regras de importação
- ✅ Separação de conceitos

---

## 🔄 PRÓXIMAS ETAPAS

### Etapa 2: Contratos Públicos (PRÓXIMA)
Definir interfaces TypeScript sem implementação

### Etapa 3: Schema de Dados
Definir estrutura de tabelas

### Etapa 4: Migrations
Criar migrations SQL

### Etapa 5: Implementação
Implementar services, hooks, utils

### Etapa 6: Integração
Integrar com módulos de domínio

---

## 🎯 CASOS DE USO

### Criar Business
```typescript
// 1. Validar localização
const location = await LocationService.getLocationById(locationId);

// 2. Verificar rollout
const isActive = await RolloutService.isModuleActive('business', locationId);

// 3. Criar business
const business = await createBusiness(data);

// 4. Definir cobertura
await CoverageService.setCoverage(business.id, coverageLocationIds);
```

### Buscar Businesses em Localização
```typescript
// Coverage resolve quais businesses cobrem esta localização
const businessIds = await CoverageService.getEntitiesCovering(locationId);
const businesses = await getBusinessesByIds(businessIds);
```

### Verificar Módulo Disponível
```typescript
const { activeLocation } = useLocationContext();
const isAvailable = await RolloutService.isModuleActive('mobility', activeLocation.id);
```

---

## 📖 LEITURA RECOMENDADA

### Para Começar
1. Este resumo (você está aqui)
2. [GEOGRAPHIC_FOUNDATION.md](./GEOGRAPHIC_FOUNDATION.md) - Documento completo

### Para Implementar
3. [GEOGRAPHIC_FOUNDATION_RULES.md](./GEOGRAPHIC_FOUNDATION_RULES.md) - Regras
4. READMEs dos módulos específicos

### Para Validar
5. [GEOGRAPHIC_FOUNDATION_STAGE1_FROZEN.md](./GEOGRAPHIC_FOUNDATION_STAGE1_FROZEN.md) - Checklist

---

**Versão**: 1.0.0  
**Status**: ✅ CONGELADO  
**Última Atualização**: 2026-03-24

