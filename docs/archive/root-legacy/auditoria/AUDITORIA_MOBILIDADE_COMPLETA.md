# AUDITORIA COMPLETA DO MÓDULO DE MOBILIDADE

**Data:** 07/04/2026  
**Objetivo:** Inventário completo, classificação e identificação de duplicações/legado

---

## 1. INVENTÁRIO ESTRUTURAL

### 1.1 Estrutura de Diretórios
```
src/modules/mobility/
├── components/          # 30+ componentes
│   ├── chat/           # 2 componentes
│   ├── community/      # 4 componentes
│   ├── driver/         # 23 componentes
│   ├── landing/        # 5 componentes
│   ├── map/            # 1 componente
│   └── passenger/      # 6 componentes (inclui ride-card/)
├── core/               # Motor operacional (4 arquivos)
├── hooks/              # 28 hooks
├── migrations/         # 2 arquivos
├── pages/              # 11 páginas
├── schemas/            # 1 arquivo
├── scripts/            # 1 arquivo
├── services/           # 11 serviços
└── types/              # 2 arquivos
```

### 1.2 Contagem Total
- **Páginas:** 11
- **Componentes:** 67+
- **Hooks:** 28
- **Serviços:** 11
- **Core (Motor):** 4
- **Edge Functions:** 2 (auto-dispatch-ride, process-timeouts)
- **Tabelas principais:** 8+

---

## 2. MAPA DE PÁGINAS

| Arquivo | Rota | Finalidade | Status | Dependências | Localização |
|---------|------|------------|--------|--------------|-------------|
| **MobilidadeLandingPage.tsx** | `/mobilidade` | Landing page com hero e CTAs | ✅ Oficial | CanonicalHero, useMobilityUrls | ✅ Correto |
| **MobilidadePage.tsx** | `/mobilidade` (alternativa) | Landing com banners | ⚠️ Duplicada | BannerDisplay, useMobilityUrls | ⚠️ Duplicação |
| **PassageiroPage.tsx** | `/mobilidade/passageiro` | Dashboard do passageiro | ✅ Oficial | useMobilidade, CreateRideModal | ✅ Correto |
| **MotoristaPage.tsx** | `/mobilidade/motorista` | Dashboard do motorista (v1) | ⚠️ Legado ativo | useMotoristaPage, 30+ componentes | ⚠️ Manter temporário |
| **MotoristaPageV2.tsx** | `/motorista-v2` | Dashboard do motorista (v2) | ✅ Oficial | useMotoristaPageV2, mesmos componentes | ✅ Correto |
| **BuscandoMotoristaPage.tsx** | `/mobilidade/buscando/:rideId` | Tela de busca de motorista | ✅ Oficial | useRideSearch, RideTrackingMap | ✅ Correto |
| **DriverProfilePage.tsx** | `/mobilidade/motorista/perfil` | Perfil público do motorista | ✅ Oficial | useDriverProfile | ✅ Correto |
| **CriarMotoristaPage.tsx** | `/create-driver` | Cadastro de motorista | ⚠️ Legado | DriverRegistrationModal | ⚠️ Substituir por modal |
| **HistoricoPage.tsx** | `/mobilidade/historico` | Histórico de corridas | ✅ Oficial | useRideHistory | ✅ Correto |
| **EmergencyContactsPage.tsx** | `/mobilidade/contatos-emergencia` | Contatos de emergência | ✅ Oficial | - | ✅ Correto |
| **RotasPage.tsx** | - | Rotas de motorista | ❌ Obsoleto | - | ❌ Não usado |
| **TrackRidePage.tsx** | `/track/:token` | Rastreamento público | ✅ Oficial | mobilityService | ✅ Correto |

### Resumo de Páginas
- **Total:** 11 páginas
- **Oficiais:** 8 páginas
- **Duplicadas:** 1 (MobilidadePage vs MobilidadeLandingPage)
- **Legado ativo:** 2 (MotoristaPage, CriarMotoristaPage)
- **Obsoletas:** 1 (RotasPage)
- **Faltando:** 0 (cobertura completa)

---

## 3. MAPA DE FLUXOS

### 3.1 CRIAR CORRIDA
**Entrypoint:** PassageiroPage → CreateRideModal  
**Hook oficial:** `useMobilidade.createRide`  
**Service oficial:** `RideOperationalService.createRide`  
**Tabelas:** `ride_requests`, `ride_state_audit`  
**Funções:** Trigger `on_ride_status_change` → Edge Function `auto-dispatch-ride`  
**Status:** ✅ Oficial, motor operacional implementado

### 3.2 BUSCAR MOTORISTA (AUTO-DISPATCH)
**Entrypoint:** Trigger automático após criar corrida  
**Hook oficial:** `useRideSearch` (monitoramento)  
**Service oficial:** `AutoDispatchService.startDispatch`  
**Tabelas:** `driver_availability`, `ride_dispatch_audit`  
**Funções:** Edge Function `auto-dispatch-ride`  
**Status:** ✅ Oficial, dispatch sequencial implementado

### 3.3 ACEITAR CORRIDA
**Entrypoint:** MotoristaPage → DriverRidesList  
**Hook oficial:** `useMobilidade.acceptRide`  
**Service oficial:** `RideDispatchService.acceptRide`  
**Tabelas:** `ride_requests`, `driver_availability`, `ride_state_audit`  
**Funções:** Optimistic locking para evitar duplo aceite  
**Status:** ✅ Oficial, com proteção de race condition

### 3.4 CANCELAR CORRIDA
**Entrypoint:** PassageiroPage/MotoristaPage → CancelRideDialog  
**Hook oficial:** `useMobilidade.cancelRide`  
**Service oficial:** `RideOperationalService.cancelRide`  
**Tabelas:** `ride_requests`, `ride_state_audit`  
**Funções:** Validação de quem pode cancelar  
**Status:** ✅ Oficial, state machine validado

### 3.5 CONCLUIR CORRIDA
**Entrypoint:** MotoristaPage → CompleteRideDialog  
**Hook oficial:** `useMobilidade.completeRide`  
**Service oficial:** `RideOperationalService.completeRide`  
**Tabelas:** `ride_requests`, `driver_availability`, `ride_state_audit`  
**Funções:** Libera motorista automaticamente  
**Status:** ✅ Oficial, motor operacional

### 3.6 ACOMPANHAR PASSAGEIRO
**Entrypoint:** PassageiroPage → ActiveRideCard  
**Hook oficial:** `useRideRealtime`  
**Service oficial:** `mobilityService.getRideById`  
**Tabelas:** `ride_requests`  
**Funções:** Polling a cada 10s  
**Status:** ⚠️ Funcional mas sem realtime nativo

### 3.7 ACOMPANHAR MOTORISTA
**Entrypoint:** MotoristaPage → DriverRidesTab  
**Hook oficial:** `useMotoristaPage`  
**Service oficial:** `mobilityService.getRidesByDriver`  
**Tabelas:** `ride_requests`, `driver_data`  
**Funções:** Polling + GPS tracking  
**Status:** ✅ Oficial, GPS ativo

### 3.8 DISPATCH
**Entrypoint:** Automático via trigger  
**Hook oficial:** N/A (server-side)  
**Service oficial:** `AutoDispatchService`  
**Tabelas:** `ride_dispatch_audit`, `driver_availability`  
**Funções:** Edge Function `auto-dispatch-ride`  
**Status:** ✅ Oficial, sequencial com timeout

### 3.9 PRICING
**Entrypoint:** CreateRideModal  
**Hook oficial:** N/A (cálculo manual)  
**Service oficial:** ❌ Não implementado  
**Tabelas:** `ride_requests.suggested_price`  
**Funções:** ❌ Sem RPC de pricing  
**Status:** ❌ Faltando, apenas sugestão manual

### 3.10 SAFETY
**Entrypoint:** PassageiroPage → EmergencyButton  
**Hook oficial:** N/A  
**Service oficial:** `mobilityService.createEmergencyAlert`  
**Tabelas:** `emergency_alerts`, `ride_shares`  
**Funções:** Compartilhamento de localização  
**Status:** ⚠️ Parcial, tabelas criadas mas sem integração completa

### 3.11 REALTIME
**Entrypoint:** Todos os componentes de corrida ativa  
**Hook oficial:** `useRideRealtime`  
**Service oficial:** Supabase Realtime  
**Tabelas:** `ride_requests` (subscription)  
**Funções:** ⚠️ Implementado mas desabilitado  
**Status:** ⚠️ Código existe mas usa polling

---

## 4. CLASSIFICAÇÃO DO CÓDIGO

### 4.1 OFICIAL (Produção)
**Services:**
- `MobilityService.impl.ts` - SSOT principal
- `RideService.ts` - Operações de corrida
- `DriverService.ts` - Operações de motorista
- `ChatService.ts` - Chat de corridas

**Core (Motor Operacional):**
- `RideStateMachine.ts` - Máquina de estados
- `RideDispatchService.ts` - Dispatch e aceite
- `AutoDispatchService.ts` - Dispatch automático
- `RideOperationalService.ts` - Orquestrador

**Hooks principais:**
- `useMobilidade.ts` - Hook principal do passageiro
- `useMotoristaPage.ts` - Hook do motorista v1
- `useMotoristaPageV2.ts` - Hook do motorista v2
- `useRideSearch.ts` - Busca de motorista
- `useRideRealtime.ts` - Atualizações em tempo real
- `useRideOperations.ts` - Operações via motor

**Páginas:**
- `MobilidadeLandingPage.tsx`
- `PassageiroPage.tsx`
- `MotoristaPageV2.tsx`
- `BuscandoMotoristaPage.tsx`
- `DriverProfilePage.tsx`
- `HistoricoPage.tsx`
- `EmergencyContactsPage.tsx`
- `TrackRidePage.tsx`

### 4.2 COMPATIBILIDADE TRANSITÓRIA
**Páginas:**
- `MotoristaPage.tsx` - Manter até migração completa para V2
- `MobilidadePage.tsx` - Manter até decidir qual landing usar

**Hooks:**
- `useMobility.ts` - Hook alternativo com TanStack Query
- `useDriver.ts` - Stub, pode ser removido

### 4.3 LEGADO QUE PRECISA FICAR
**Componentes:**
- `DriverRegistrationModal.tsx` - Usado em múltiplos lugares
- `CreateRideModal.tsx` - Modal principal de criação
- Todos os componentes em `components/driver/` - Usados ativamente

**Services:**
- `RideCanonicalAdapter.ts` - Adaptador de compatibilidade

### 4.4 OBSOLETO/DUPLICADO (Pode Morrer)
**Páginas:**
- `RotasPage.tsx` - Não referenciada
- `CriarMotoristaPage.tsx` - Substituir por modal

**Hooks:**
- `useRides.ts` - Stub vazio
- `useDriver.ts` - Stub vazio

**Services:**
- Nenhum identificado como obsoleto

---

## 5. DUPLICAÇÃO E DESORGANIZAÇÃO

### 5.1 Páginas Duplicadas
1. **MobilidadePage.tsx vs MobilidadeLandingPage.tsx**
   - Ambas servem como landing page
   - MobilidadeLandingPage é mais completa (usa CanonicalHero)
   - MobilidadePage usa BannerDisplay
   - **Recomendação:** Manter MobilidadeLandingPage, remover MobilidadePage

2. **MotoristaPage.tsx vs MotoristaPageV2.tsx**
   - V2 é estrutura mais limpa
   - V1 ainda é rota oficial `/mobilidade/motorista`
   - **Recomendação:** Migrar rota para V2, deprecar V1

### 5.2 Hooks Duplicados
1. **useMobilidade.ts vs useMobility.ts**
   - useMobilidade: Hook principal com lógica completa
   - useMobility: Hook alternativo com TanStack Query
   - **Recomendação:** Manter useMobilidade, avaliar se useMobility é necessário

2. **useMotoristaPage.ts vs useMotoristaPageV2.ts**
   - Ambos fazem a mesma coisa
   - V2 é mais limpo
   - **Recomendação:** Consolidar em um único hook

### 5.3 Serviços Paralelos
- Não identificados. Estrutura de services está bem organizada.

### 5.4 Lógica Crítica Fora do Lugar
- ✅ Motor operacional está em `core/` (correto)
- ✅ Services estão em `services/` (correto)
- ✅ Hooks estão em `hooks/` (correto)

### 5.5 Arquivos Fora do Domínio
- Nenhum identificado. Tudo está dentro de `src/modules/mobility/`

### 5.6 Componentes que Deveriam Ser Fundidos
- Não identificados. Componentes têm responsabilidades claras.

---

## 6. LACUNAS REAIS

### 6.1 Quantas páginas existem?
**11 páginas**

### 6.2 Quais páginas faltam?
**Nenhuma.** Cobertura completa:
- Landing ✅
- Passageiro ✅
- Motorista ✅
- Busca ✅
- Perfil ✅
- Histórico ✅
- Emergência ✅
- Rastreamento ✅

### 6.3 Quais estão no lugar errado?
**Nenhuma.** Todas estão em `src/modules/mobility/pages/`

### 6.4 Quais estão incompletas?
1. **Pricing:** Sem serviço de cálculo automático
2. **Safety:** Tabelas criadas mas integração parcial
3. **Realtime:** Código existe mas usa polling

### 6.5 Quais parecem existir mas não deveriam?
1. **RotasPage.tsx** - Não referenciada, pode ser removida
2. **CriarMotoristaPage.tsx** - Funcionalidade já existe em modal

---

## 7. TABELAS E EDGE FUNCTIONS

### 7.1 Tabelas Principais
1. **ride_requests** - Corridas (tabela central)
2. **driver_data** - Dados do motorista
3. **driver_availability** - Disponibilidade em tempo real
4. **driver_locations** - Localização GPS
5. **ride_state_audit** - Auditoria de mudanças de estado
6. **ride_dispatch_audit** - Auditoria de dispatch
7. **emergency_alerts** - Alertas de emergência
8. **ride_shares** - Compartilhamento de corrida

### 7.2 Edge Functions
1. **auto-dispatch-ride** - Dispatch automático sequencial
2. **process-timeouts** - Processa timeouts de dispatch (cron)

### 7.3 Triggers
1. **on_ride_status_change** - Dispara dispatch quando status = searching_driver

---

## 8. PROBLEMAS ENCONTRADOS

### 8.1 Críticos
- ❌ **Pricing não implementado** - Apenas sugestão manual
- ⚠️ **Realtime desabilitado** - Usa polling ao invés de subscriptions

### 8.2 Médios
- ⚠️ **Duplicação de landing pages** - 2 páginas para mesma função
- ⚠️ **Duplicação de dashboard motorista** - V1 e V2 coexistindo
- ⚠️ **Safety parcial** - Tabelas criadas mas sem integração completa

### 8.3 Baixos
- ⚠️ **Hooks stub vazios** - useRides, useDriver não fazem nada
- ⚠️ **Página de rotas não usada** - RotasPage.tsx órfã

---

## 9. ORGANIZAÇÃO GERAL

### Status: ⚠️ BOM MAS PRECISA LIMPEZA

**Pontos Positivos:**
- ✅ Motor operacional bem estruturado (core/)
- ✅ Services organizados e com SSOT claro
- ✅ Componentes bem separados por domínio
- ✅ Hooks com responsabilidades claras
- ✅ State machine implementada
- ✅ Dispatch automático funcionando
- ✅ Auditoria completa de operações

**Pontos Negativos:**
- ❌ Duplicação de páginas (landing, motorista)
- ❌ Hooks stub vazios
- ❌ Pricing não implementado
- ❌ Realtime desabilitado
- ❌ Safety parcial

---

## 10. LIMPEZA RECOMENDADA (ORDEM SEGURA)

### Fase 1: Remoção de Código Morto (Seguro)
1. ✅ Remover `useRides.ts` (stub vazio)
2. ✅ Remover `useDriver.ts` (stub vazio)
3. ✅ Remover `RotasPage.tsx` (não referenciada)

### Fase 2: Consolidação de Duplicações (Médio Risco)
4. ⚠️ Decidir entre MobilidadePage vs MobilidadeLandingPage
5. ⚠️ Migrar rota `/mobilidade/motorista` para MotoristaPageV2
6. ⚠️ Deprecar MotoristaPage.tsx após migração
7. ⚠️ Consolidar useMotoristaPage + useMotoristaPageV2

### Fase 3: Substituição de Páginas por Modais (Médio Risco)
8. ⚠️ Substituir CriarMotoristaPage por DriverRegistrationModal
9. ⚠️ Atualizar rotas que apontam para /create-driver

### Fase 4: Implementação de Funcionalidades Faltantes (Alto Risco)
10. 🔴 Implementar serviço de pricing automático
11. 🔴 Habilitar realtime subscriptions
12. 🔴 Completar integração de safety

---

## 11. MÉTRICAS FINAIS

| Métrica | Valor | Status |
|---------|-------|--------|
| Total de páginas | 11 | ✅ |
| Páginas oficiais | 8 | ✅ |
| Páginas duplicadas | 2 | ⚠️ |
| Páginas obsoletas | 1 | ⚠️ |
| Hooks totais | 28 | ✅ |
| Hooks stub/vazios | 2 | ⚠️ |
| Services | 11 | ✅ |
| Componentes | 67+ | ✅ |
| Edge Functions | 2 | ✅ |
| Tabelas principais | 8 | ✅ |
| Fluxos implementados | 8/11 | ⚠️ |
| Cobertura funcional | ~73% | ⚠️ |

---

## 12. CONCLUSÃO

O módulo de mobilidade está **bem estruturado** com motor operacional robusto, mas precisa de **limpeza e completude**:

**Organização:** ⚠️ 7/10
- Estrutura de pastas correta
- SSOT bem definido
- Motor operacional implementado
- Mas tem duplicações e código morto

**Completude:** ⚠️ 7/10
- Fluxos principais funcionando
- Dispatch automático OK
- Mas falta pricing, realtime nativo e safety completo

**Prioridade de Ação:**
1. 🟢 **Baixo risco:** Remover código morto (Fase 1)
2. 🟡 **Médio risco:** Consolidar duplicações (Fase 2-3)
3. 🔴 **Alto risco:** Implementar funcionalidades faltantes (Fase 4)

**Próximo Passo Recomendado:**
Começar pela Fase 1 (remoção de código morto) que é 100% segura.
