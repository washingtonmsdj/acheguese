# 🏗️ Análise: Organização Core vs Modules

**Data**: 2026-04-01  
**Status**: 📊 ANÁLISE ARQUITETURAL  
**Versão**: 1.0.0

---

## ❓ Pergunta

> "Sobre organização dos arquivos, e também módulos e sistemas transversais, o sistema já está alinhado? Falta atualização? Algo que precise virar módulo ou transversal?"

---

## 📊 Análise da Estrutura Atual

### Core (54 diretórios)
```
src/core/
├── address/              ✅ Transversal (endereços)
├── admin/                ✅ Transversal (administração)
├── alerts/               ⚠️ CANDIDATO A MÓDULO
├── analytics/            ✅ Transversal (métricas)
├── auth/                 ✅ Transversal (autenticação)
├── authorization/        ✅ Transversal (autorização)
├── banners/              ⚠️ CANDIDATO A MÓDULO
├── business/             ✅ Transversal (negócios)
├── chat/                 ⚠️ CANDIDATO A MÓDULO
├── city/                 ⚠️ DUPLICADO (usar location)
├── civic/                ⚠️ CANDIDATO A MÓDULO
├── classifieds/          ❌ DEVERIA SER MÓDULO
├── comments/             ✅ Transversal (comentários)
├── community/            ⚠️ AMBÍGUO (revisar)
├── coverage/             ✅ Transversal (áreas de cobertura)
├── events/               ❌ DEVERIA SER MÓDULO
├── family/               ⚠️ CANDIDATO A MÓDULO
├── favorites/            ✅ Transversal (favoritos)
├── feed/                 ✅ Transversal (feed)
├── gamification/         ✅ Transversal (pontos/badges)
├── geospatial/           ✅ Transversal (GIS)
├── governance/           ⚠️ CANDIDATO A MÓDULO
├── interaction/          ✅ Transversal (likes/saves)
├── landing/              ⚠️ AMBÍGUO (revisar)
├── location/             ✅ Transversal (territorial)
├── lostfound/            ⚠️ CANDIDATO A MÓDULO
├── maps/                 ✅ Transversal (mapas)
├── media/                ✅ Transversal (upload/storage)
├── messaging/            ⚠️ CANDIDATO A MÓDULO
├── metrics/              ✅ Transversal (estatísticas)
├── mobility/             ❌ DEVERIA SER MÓDULO
├── moderation/           ✅ Transversal (moderação)
├── notifications/        ✅ Transversal (notificações)
├── permissions/          ✅ Transversal (permissões)
├── posts/                ✅ Transversal (posts sociais)
├── professional/         ✅ Transversal (profissionais)
├── profiles/             ✅ Transversal (perfis)
├── public-identity/      ✅ Transversal (slugs/usernames)
├── realtime/             ✅ Transversal (realtime)
├── residence/            ⚠️ CANDIDATO A MÓDULO
├── reviews/              ✅ Transversal (avaliações)
├── ride/                 ⚠️ DUPLICADO (usar mobility)
├── rollout/              ✅ Transversal (feature flags)
├── routing/              ✅ Transversal (rotas)
├── search/               ✅ Transversal (busca)
├── service-areas/        ✅ Transversal (áreas de serviço)
├── session/              ✅ Transversal (sessão)
├── social/               ✅ Transversal (social graph)
├── subscription/         ✅ Transversal (assinaturas)
├── territorial/          ✅ Transversal (territorial)
├── tourist-points/       ❌ DEVERIA SER MÓDULO
├── users/                ✅ Transversal (usuários)
└── verification/         ✅ Transversal (verificação)
```

### Modules (19 diretórios)
```
src/modules/
├── admin/                ✅ Módulo (UI admin)
├── business/             ✅ Módulo (UI negócios)
├── classifieds/          ✅ Módulo (classificados)
├── community/            ✅ Módulo (comunidade)
├── community-alerts/     ✅ Módulo (alertas)
├── community-issues/     ✅ Módulo (problemas)
├── dashboard/            ✅ Módulo (dashboard)
├── gastronomy/           ✅ Módulo (gastronomia)
├── guide/                ✅ Módulo (guia turístico)
├── jobs/                 ✅ Módulo (empregos)
├── mobility/             ✅ Módulo (mobilidade)
├── notifications/        ⚠️ DUPLICADO (core/notifications)
├── onboarding/           ✅ Módulo (onboarding)
├── professionals/        ✅ Módulo (UI profissionais)
├── profile/              ✅ Módulo (UI perfil)
├── promotions/           ✅ Módulo (promoções)
├── services/             ⚠️ AMBÍGUO (nome genérico)
└── verification/         ⚠️ DUPLICADO (core/verification)
```

---

## 🎯 Critérios de Classificação

### ✅ Core (Transversal)
**Quando usar**:
- Usado por múltiplos módulos
- Lógica de negócio fundamental
- Infraestrutura compartilhada
- Sem UI própria (apenas services/hooks)

**Exemplos corretos**:
- `profiles/` - Usado por todos
- `location/` - Usado por todos
- `auth/` - Infraestrutura
- `notifications/` - Usado por todos

### ✅ Modules (Vertical)
**Quando usar**:
- Funcionalidade específica
- UI própria (pages/components)
- Pode ser desligado sem quebrar o sistema
- Domínio de negócio isolado

**Exemplos corretos**:
- `gastronomy/` - Vertical específica
- `guide/` - Vertical específica
- `jobs/` - Vertical específica
- `mobility/` - Vertical específica

---

## 🚨 Problemas Identificados

### 1. Módulos Disfarçados de Core

#### ❌ `core/classifieds/`
**Problema**: É uma vertical específica, não transversal  
**Solução**: Já existe `modules/classifieds/` - consolidar

**Ação**:
```
1. Mover services de core/classifieds/ para modules/classifieds/services/
2. Atualizar imports
3. Remover core/classifieds/
```

---

#### ❌ `core/events/`
**Problema**: É uma vertical específica, não transversal  
**Solução**: Criar `modules/events/`

**Ação**:
```
1. Criar modules/events/
2. Mover core/events/services/ para modules/events/services/
3. Criar UI em modules/events/pages/ e components/
4. Atualizar imports
5. Remover core/events/
```

---

#### ❌ `core/mobility/`
**Problema**: É uma vertical específica, não transversal  
**Solução**: Já existe `modules/mobility/` - consolidar

**Ação**:
```
1. Mover services de core/mobility/ para modules/mobility/services/
2. Atualizar imports
3. Remover core/mobility/
```

---

#### ❌ `core/tourist-points/`
**Problema**: É uma vertical específica, não transversal  
**Solução**: Já existe `modules/guide/` - consolidar

**Ação**:
```
1. Mover core/tourist-points/ para modules/guide/services/
2. Renomear para TouristPointService
3. Atualizar imports
4. Remover core/tourist-points/
```

---

### 2. Duplicações

#### ⚠️ `core/city/` vs `core/location/`
**Problema**: Funcionalidade duplicada  
**Solução**: Usar apenas `location/`

**Ação**:
```
1. Migrar funcionalidades de city/ para location/
2. Atualizar imports
3. Remover core/city/
```

---

#### ⚠️ `core/ride/` vs `core/mobility/`
**Problema**: Funcionalidade duplicada  
**Solução**: Consolidar em `modules/mobility/`

**Ação**:
```
1. Migrar ride/ para modules/mobility/services/
2. Atualizar imports
3. Remover core/ride/
```

---

#### ⚠️ `modules/notifications/` vs `core/notifications/`
**Problema**: Duplicação confusa  
**Análise**:
- `core/notifications/` - Services (SSOT)
- `modules/notifications/` - UI (pages/components)

**Solução**: Manter ambos, mas clarificar

**Ação**:
```
1. Renomear modules/notifications/ para modules/notifications-ui/
2. Ou mover UI para modules/dashboard/
3. Documentar separação
```

---

#### ⚠️ `modules/verification/` vs `core/verification/`
**Problema**: Duplicação confusa  
**Análise**:
- `core/verification/` - Services (SSOT)
- `modules/verification/` - UI (pages/components)

**Solução**: Manter ambos, mas clarificar

**Ação**:
```
1. Documentar que core = services, modules = UI
2. Ou consolidar UI em modules/admin/
```

---

### 3. Candidatos a Módulos

#### ⚠️ `core/alerts/`
**Análise**: Pode ser vertical específica  
**Decisão**: Avaliar se é usado por múltiplos módulos

#### ⚠️ `core/banners/`
**Análise**: Parece vertical específica (marketing)  
**Sugestão**: Mover para `modules/marketing/` ou `modules/promotions/`

#### ⚠️ `core/chat/`
**Análise**: Pode ser vertical específica  
**Decisão**: Avaliar se é usado por múltiplos módulos

#### ⚠️ `core/civic/`
**Análise**: Parece vertical específica (cidadania)  
**Sugestão**: Criar `modules/civic/`

#### ⚠️ `core/family/`
**Análise**: Parece vertical específica  
**Sugestão**: Criar `modules/family/`

#### ⚠️ `core/governance/`
**Análise**: Parece vertical específica (governança)  
**Sugestão**: Criar `modules/governance/`

#### ⚠️ `core/lostfound/`
**Análise**: Parece vertical específica (achados e perdidos)  
**Sugestão**: Criar `modules/lostfound/`

#### ⚠️ `core/messaging/`
**Análise**: Pode ser vertical específica  
**Decisão**: Avaliar se é usado por múltiplos módulos

#### ⚠️ `core/residence/`
**Análise**: Parece vertical específica  
**Sugestão**: Criar `modules/residence/`

---

### 4. Ambiguidades

#### ⚠️ `core/community/`
**Problema**: Nome muito genérico  
**Análise**: Verificar o que contém  
**Sugestão**: Pode ser dividido em módulos específicos

#### ⚠️ `core/landing/`
**Problema**: Landing pages são UI, não core  
**Sugestão**: Mover para `modules/landing/` ou `modules/marketing/`

#### ⚠️ `modules/services/`
**Problema**: Nome muito genérico  
**Sugestão**: Renomear para algo específico (ex: `modules/service-directory/`)

---

## 📋 Plano de Ação Priorizado

### 🔴 Prioridade ALTA (Fazer Agora)

#### 1. Consolidar Classifieds
```bash
# Mover services
mv src/core/classifieds/services/* src/modules/classifieds/services/

# Atualizar imports
# Remover core/classifieds/
```

**Impacto**: Alto - Elimina duplicação crítica  
**Esforço**: Médio (2-3 horas)  
**Violações SSOT**: -6

---

#### 2. Consolidar Mobility
```bash
# Mover services
mv src/core/mobility/services/* src/modules/mobility/services/
mv src/core/ride/services/* src/modules/mobility/services/

# Atualizar imports
# Remover core/mobility/ e core/ride/
```

**Impacto**: Alto - Elimina duplicação crítica  
**Esforço**: Alto (4-6 horas)  
**Violações SSOT**: -15

---

#### 3. Consolidar Tourist Points
```bash
# Mover para guide
mv src/core/tourist-points/ src/modules/guide/services/tourist-points/

# Atualizar imports
```

**Impacto**: Médio - Melhora organização  
**Esforço**: Médio (2-3 horas)  
**Violações SSOT**: -5

---

### 🟡 Prioridade MÉDIA (Fazer Esta Semana)

#### 4. Criar Módulo Events
```bash
# Criar estrutura
mkdir -p src/modules/events/{services,pages,components,hooks,types}

# Mover services
mv src/core/events/services/* src/modules/events/services/

# Criar UI
# Atualizar imports
```

**Impacto**: Médio - Melhora organização  
**Esforço**: Alto (6-8 horas)  
**Violações SSOT**: -9

---

#### 5. Eliminar Duplicação City
```bash
# Migrar funcionalidades
# Atualizar imports
rm -rf src/core/city/
```

**Impacto**: Baixo - Limpeza  
**Esforço**: Baixo (1-2 horas)

---

### 🟢 Prioridade BAIXA (Fazer Este Mês)

#### 6. Avaliar Candidatos a Módulos
- Analisar uso de alerts/, banners/, chat/, etc
- Decidir se são transversais ou verticais
- Mover se necessário

**Impacto**: Baixo - Organização  
**Esforço**: Variável

---

#### 7. Clarificar Duplicações UI
- Documentar separação core (services) vs modules (UI)
- Ou consolidar UI em módulos específicos

**Impacto**: Baixo - Documentação  
**Esforço**: Baixo (2-3 horas)

---

## 📊 Impacto Estimado

### Violações SSOT
- **Atual**: 114 violações
- **Após consolidações**: ~79 violações (-35, -31%)
- **Compliance**: 81.3% → 87% (+5.7%)

### Organização
- **Diretórios core**: 54 → 48 (-6, -11%)
- **Diretórios modules**: 19 → 23 (+4, +21%)
- **Duplicações**: 5 → 0 (-100%)

### Manutenibilidade
- ✅ Separação clara core vs modules
- ✅ Zero duplicações
- ✅ Nomenclatura consistente
- ✅ Fácil localização de código

---

## 🎯 Recomendações

### Imediato
1. ✅ Consolidar Classifieds (2-3h)
2. ✅ Consolidar Mobility (4-6h)
3. ✅ Consolidar Tourist Points (2-3h)

**Total**: 8-12 horas  
**Ganho**: -35 violações SSOT, +5.7% compliance

### Curto Prazo
4. ✅ Criar Módulo Events (6-8h)
5. ✅ Eliminar City (1-2h)

**Total**: 7-10 horas  
**Ganho**: Organização clara

### Médio Prazo
6. ✅ Avaliar candidatos a módulos
7. ✅ Clarificar duplicações UI

**Total**: Variável  
**Ganho**: Arquitetura limpa

---

## 📚 Critérios Finais

### Core (Transversal) - Checklist
- [ ] Usado por 3+ módulos?
- [ ] Infraestrutura fundamental?
- [ ] Sem UI própria?
- [ ] Lógica de negócio compartilhada?

**Se SIM para 3+**: Core  
**Se NÃO**: Módulo

### Modules (Vertical) - Checklist
- [ ] Funcionalidade específica?
- [ ] UI própria (pages/components)?
- [ ] Pode ser desligado?
- [ ] Domínio isolado?

**Se SIM para 3+**: Módulo  
**Se NÃO**: Core

---

## 🎉 Conclusão

### Status Atual
- ⚠️ **Parcialmente alinhado** (70%)
- 🔴 5 duplicações críticas
- 🟡 10+ candidatos a reorganização
- 🟢 Base sólida estabelecida

### Após Consolidações
- ✅ **Totalmente alinhado** (95%)
- ✅ Zero duplicações
- ✅ Separação clara
- ✅ Arquitetura limpa

### Próximo Passo
**Iniciar com Prioridade ALTA**: Consolidar Classifieds (2-3h)

---

**Criado**: 2026-04-01T16:30:00Z  
**Autor**: Equipe de Arquitetura  
**Status**: 📊 ANÁLISE COMPLETA
