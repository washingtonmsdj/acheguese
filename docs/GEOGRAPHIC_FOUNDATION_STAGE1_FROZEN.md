# FUNDAÇÃO GEOGRÁFICA - ETAPA 1 CONGELADA

**Status**: ✅ CONGELADO  
**Data de Congelamento**: 2026-03-24  
**Versão**: 1.0.0

---

## ✅ CHECKLIST DE CONGELAMENTO

### Conceitos Fundamentais ✅
- [x] `core/location` é SSOT territorial (não wrapper de GPS)
- [x] Hierarquia geográfica pertence a `location` (não coverage)
- [x] Separação clara: location vs coverage vs rollout vs maps
- [x] Coordenadas lat/lng pertencem a `integrations/maps`
- [x] Geocoding pertence a `integrations/maps`

### Responsabilidades Definidas ✅
- [x] `core/location`: hierarquia, árvore, contexto
- [x] `core/coverage`: cobertura de entidades
- [x] `core/rollout`: ativação de módulos
- [x] `integrations/maps`: GPS, geocoding, distância

### Limites e Dependências ✅
- [x] `location` → shared apenas
- [x] `coverage` → location + shared
- [x] `rollout` → location + shared (NÃO usa coverage)
- [x] `maps` → shared apenas (sem dependência de core)
- [x] Módulos → core/* + integrations/maps

### Padrão `geographic_path` ✅
- [x] Formato: `/{country_code}/{state_code}/{city_slug}/{district_slug}`
- [x] Exemplos: `/br/ba/salvador/pituba`, `/br/sp/sao-paulo/vila-mariana`
- [x] Códigos ISO para country/state
- [x] Slugs kebab-case para city/district

### Estrutura de Pastas ✅
- [x] Estrutura de `core/location` criada
- [x] Estrutura de `core/coverage` criada
- [x] Estrutura de `core/rollout` criada
- [x] Estrutura de `integrations/maps` criada
- [x] Padrão consistente: services/hooks/types/utils
- [x] READMEs criados para cada módulo
- [x] Placeholders (.gitkeep) criados

### Regras para Módulos ✅
- [x] Proibições documentadas (6 regras)
- [x] Permissões documentadas
- [x] Exemplos de uso correto
- [x] Exemplos de uso incorreto

### Documentação ✅
- [x] Documento oficial criado: `GEOGRAPHIC_FOUNDATION.md`
- [x] Regras de dependência: `GEOGRAPHIC_FOUNDATION_RULES.md`
- [x] Checklist de congelamento: `GEOGRAPHIC_FOUNDATION_STAGE1_FROZEN.md`
- [x] READMEs por módulo
- [x] Responsabilidades claras
- [x] Fluxo de dependências
- [x] Exemplos práticos

---

## 📁 ESTRUTURA CRIADA

### Documentação
```
docs/
├── GEOGRAPHIC_FOUNDATION.md              # ✅ Documento principal
├── GEOGRAPHIC_FOUNDATION_RULES.md        # ✅ Regras de dependência
└── GEOGRAPHIC_FOUNDATION_STAGE1_FROZEN.md # ✅ Este documento
```

### Core Modules
```
src/core/
├── location/                    # ✅ SSOT territorial
│   ├── services/               # ✅ Placeholder
│   ├── hooks/                  # ✅ Existente (mantido)
│   ├── providers/              # ✅ Existente (mantido)
│   ├── types/                  # ✅ Placeholder
│   ├── utils/                  # ✅ Placeholder
│   ├── README.md               # ✅ Criado
│   ├── index.ts                # ✅ Atualizado com documentação
│   └── LocationService.ts      # ✅ Existente (será refatorado na Etapa 5)
│
├── coverage/                   # ✅ Cobertura de entidades
│   ├── services/               # ✅ Placeholder
│   ├── hooks/                  # ✅ Placeholder
│   ├── types/                  # ✅ Placeholder
│   ├── utils/                  # ✅ Placeholder
│   ├── README.md               # ✅ Criado
│   └── index.ts                # ✅ Criado
│
└── rollout/                    # ✅ Rollout de módulos
    ├── services/               # ✅ Placeholder
    ├── hooks/                  # ✅ Placeholder
    ├── types/                  # ✅ Placeholder
    ├── utils/                  # ✅ Placeholder
    ├── README.md               # ✅ Criado
    └── index.ts                # ✅ Criado
```

### Integrations
```
src/integrations/
└── maps/                       # ✅ Serviços geoespaciais
    ├── services/               # ✅ Placeholder
    ├── hooks/                  # ✅ Placeholder
    ├── types/                  # ✅ Placeholder
    ├── utils/                  # ✅ Placeholder
    ├── README.md               # ✅ Criado
    └── index.ts                # ✅ Criado
```

---

## 🚫 O QUE NÃO FOI FEITO (PROPOSITALMENTE)

### Não Implementado ❌
- [ ] Services reais (apenas placeholders)
- [ ] Hooks reais (apenas placeholders)
- [ ] Types reais (apenas placeholders)
- [ ] Utils reais (apenas placeholders)
- [ ] Schema de dados
- [ ] Migrations
- [ ] Integração com módulos de domínio
- [ ] Testes

### Justificativa
A Etapa 1 é apenas estrutural e conceitual. Implementação será feita nas etapas seguintes.

---

## 📊 MÉTRICAS

### Arquivos Criados
- Documentação: 3 arquivos
- READMEs: 4 arquivos
- Index files: 3 arquivos
- Placeholders: 16 arquivos
- Total: 26 arquivos

### Pastas Criadas
- `src/core/coverage/`: 4 subpastas
- `src/core/rollout/`: 4 subpastas
- `src/integrations/maps/`: 4 subpastas
- `src/core/location/`: 2 subpastas (novas)
- Total: 14 subpastas

### Código Existente Preservado
- `src/core/location/LocationService.ts`: ✅ Mantido
- `src/core/location/hooks/useLocation.ts`: ✅ Mantido
- `src/core/location/providers/LocationProvider.tsx`: ✅ Mantido
- `src/core/location/index.ts`: ✅ Atualizado (não quebrado)

---

## 🔄 PRÓXIMAS ETAPAS

### Etapa 2: Contratos Públicos (PRÓXIMA)
**Objetivo**: Definir interfaces TypeScript sem implementação

**Entregas**:
- [ ] Interfaces de `LocationService`
- [ ] Interfaces de `CoverageService`
- [ ] Interfaces de `RolloutService`
- [ ] Interfaces de `GeocodingService`, `GeolocationService`, `DistanceService`
- [ ] Types compartilhados: `Location`, `ServiceArea`, `ModuleRollout`, `Coordinates`
- [ ] Tipos de retorno e erro
- [ ] Documentação de contratos

**Não fazer**:
- Implementação de lógica
- Schema de dados
- Migrations

### Etapa 3: Schema de Dados
**Objetivo**: Definir estrutura de tabelas

**Entregas**:
- [ ] Schema de `locations`
- [ ] Schema de `service_areas`
- [ ] Schema de `module_rollouts`
- [ ] Relacionamentos
- [ ] Índices
- [ ] Constraints

### Etapa 4: Migrations
**Objetivo**: Criar migrations SQL

**Entregas**:
- [ ] Migration de `locations`
- [ ] Migration de `service_areas`
- [ ] Migration de `module_rollouts`
- [ ] Dados iniciais (seed)

### Etapa 5: Implementação
**Objetivo**: Implementar services, hooks, utils

**Entregas**:
- [ ] Implementação de services
- [ ] Implementação de hooks
- [ ] Implementação de utils
- [ ] Testes unitários

### Etapa 6: Integração
**Objetivo**: Integrar com módulos de domínio

**Entregas**:
- [ ] Integração com `modules/business`
- [ ] Integração com `modules/mobility`
- [ ] Integração com `modules/services`
- [ ] Migração de código existente
- [ ] Testes de integração

---

## 🔒 REGRAS DE CONGELAMENTO

### O que está CONGELADO ✅
- Estrutura de pastas
- Responsabilidades de cada módulo
- Fluxo de dependências
- Padrão `geographic_path`
- Regras de importação
- Separação de conceitos

### O que pode MUDAR 🔄
- Implementação interna (desde que respeite contratos)
- Otimizações de performance
- Detalhes de schema (desde que respeite conceitos)
- Nomes de métodos específicos (desde que respeite responsabilidades)

### O que NÃO pode MUDAR ❌
- Responsabilidades de cada módulo
- Fluxo de dependências (quem depende de quem)
- Padrão `geographic_path`
- Separação location vs coverage vs rollout vs maps
- Proibições para módulos de domínio

---

## 📝 APROVAÇÃO

**Aprovado por**: Equipe de Arquitetura  
**Data**: 2026-03-24  
**Versão**: 1.0.0  
**Status**: ✅ CONGELADO

**Próxima Revisão**: Após Etapa 2 (Contratos Públicos)

---

## 📚 REFERÊNCIAS

### Documentos Criados
1. [GEOGRAPHIC_FOUNDATION.md](./GEOGRAPHIC_FOUNDATION.md) - Documento principal
2. [GEOGRAPHIC_FOUNDATION_RULES.md](./GEOGRAPHIC_FOUNDATION_RULES.md) - Regras de dependência
3. [GEOGRAPHIC_FOUNDATION_STAGE1_FROZEN.md](./GEOGRAPHIC_FOUNDATION_STAGE1_FROZEN.md) - Este documento

### Documentos Relacionados
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura geral
- [CURRENT_RULES.md](./CURRENT_RULES.md) - Regras vigentes
- [DATA_MODELING.md](./DATA_MODELING.md) - Modelagem de dados

---

**Última Atualização**: 2026-03-24  
**Responsável**: Equipe de Arquitetura

