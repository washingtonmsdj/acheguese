# GATE 1: ROUTING REAL - FASE 1 DIAGNÓSTICO

**Data:** 07/04/2026  
**Objetivo:** Eliminar linha reta/Haversine do fluxo principal e implementar routing real

---

## SITUAÇÃO ATUAL

### ✅ Fundação Técnica Existente:

1. **RoutingService (SSOT)** - `src/core/routing/services/RoutingService.ts`
   - Interface unificada para routing
   - Abstração de provider
   - Validações implementadas
   - Normalização de respostas
   - **Status:** Implementado e funcional

2. **Tipos Completos** - `src/core/routing/types/index.ts`
   - RouteRequest/RouteResponse
   - ETARequest/ETAResponse
   - DistanceMatrixRequest/Response
   - RoutingProvider interface
   - TransportProfile types
   - **Status:** Completo

3. **Instância Singleton** - `src/core/routing/instance.ts`
   - `routingService` exportado
   - Configurado com MockRoutingProvider
   - Função `reconfigureRoutingProvider` disponível
   - **Status:** Pronto para troca de provider

### ❌ Problemas Identificados:

1. **MockRoutingProvider em Produção**
   - Usa Haversine (linha reta)
   - Não desenha rota real
   - Velocidades fixas por perfil
   - Não considera trânsito
   - **Arquivo:** `src/integrations/maps/providers/MockRoutingProvider.ts`

2. **Fallback Manual em useDriverLocation**
   - Cálculo Haversine direto no hook
   - Usado quando routingService falha
   - **Arquivo:** `src/modules/mobility/hooks/useDriverLocation.ts`
   - **Linhas:** 67-78

3. **Haversine em RideDispatchService**
   - Método `calculateDistance` privado
   - Usado para buscar motoristas próximos
   - **Arquivo:** `src/modules/mobility/core/RideDispatchService.ts`
   - **Linhas:** 338-352

### 🔍 Onde Linha Reta é Usada:

| Local | Arquivo | Uso | Impacto |
|---|---|---|---|
| MockRoutingProvider | `src/integrations/maps/providers/MockRoutingProvider.ts` | Cálculo de rota, ETA e distância | **CRÍTICO** - Afeta tudo |
| useDriverLocation | `src/modules/mobility/hooks/useDriverLocation.ts` | Fallback de ETA | **ALTO** - ETA errado |
| RideDispatchService | `src/modules/mobility/core/RideDispatchService.ts` | Busca de motoristas | **MÉDIO** - Raio de busca |

### 📊 Consumidores do RoutingService:

1. **useDriverLocation** - Cálculo de ETA
2. **PricingService** - Cálculo de distância para preço (via routingService)
3. **Mapas** - Desenho de rota (potencial, não implementado)

---

## ESCOLHA DO PROVIDER

### Opções Avaliadas:

#### 1. OSRM (Open Source Routing Machine)
**Prós:**
- ✅ Open source e gratuito
- ✅ Self-hosted (controle total)
- ✅ Rápido (C++)
- ✅ API simples e bem documentada
- ✅ Suporta múltiplos perfis (car, bike, foot)
- ✅ Comunidade ativa
- ✅ Dados OpenStreetMap

**Contras:**
- ⚠️ Requer servidor próprio
- ⚠️ Manutenção de dados OSM
- ⚠️ Não tem trânsito em tempo real nativo

**Custo:** Gratuito (apenas infraestrutura)

#### 2. Valhalla
**Prós:**
- ✅ Open source
- ✅ Mais features que OSRM
- ✅ Suporta multimodal
- ✅ Elevation data
- ✅ Isochrones

**Contras:**
- ⚠️ Mais complexo de configurar
- ⚠️ Mais pesado que OSRM
- ⚠️ Documentação menos clara

**Custo:** Gratuito (apenas infraestrutura)

#### 3. GraphHopper
**Prós:**
- ✅ Open source
- ✅ Fácil de usar
- ✅ API cloud disponível

**Contras:**
- ⚠️ API cloud tem limites
- ⚠️ Self-hosted requer Java

**Custo:** Gratuito até 500 req/dia (cloud)

#### 4. Google Maps Directions API
**Prós:**
- ✅ Trânsito em tempo real
- ✅ Dados mais precisos
- ✅ Zero manutenção

**Contras:**
- ❌ Caro ($5/1000 requests)
- ❌ Vendor lock-in
- ❌ Limites de uso

**Custo:** $5 por 1000 requests

#### 5. Mapbox Directions API
**Prós:**
- ✅ Trânsito em tempo real
- ✅ Boa documentação
- ✅ Integração fácil

**Contras:**
- ❌ Caro ($0.60/1000 requests)
- ❌ Vendor lock-in

**Custo:** $0.60 por 1000 requests

---

## DECISÃO TÉCNICA

### ✅ ESCOLHIDO: OSRM (Open Source Routing Machine)

**Justificativa Objetiva:**

1. **Custo Zero:** Apenas infraestrutura (servidor já existe)
2. **Controle Total:** Self-hosted, sem vendor lock-in
3. **Performance:** C++ nativo, resposta <100ms
4. **Simplicidade:** API REST simples, fácil integração
5. **Maturidade:** Usado por Uber, Lyft, Mapbox
6. **Escalabilidade:** Suporta milhões de requests/dia
7. **Dados Atualizados:** OpenStreetMap atualizado semanalmente

**Estratégia de Implementação:**

**FASE 1 (Agora):** Usar OSRM público (demo.project-osrm.org)
- Validar integração
- Testar fluxo completo
- Sem custo
- Limite: 1 req/s (suficiente para desenvolvimento)

**FASE 2 (Produção):** Self-hosted OSRM
- Deploy em servidor próprio
- Dados OSM do Brasil
- Sem limites
- Controle total

**Fallback:** Se OSRM público estiver indisponível, usar MockProvider temporariamente (com warning explícito)

---

## ARQUIVOS QUE SERÃO ALTERADOS

### 1. Novo Provider (Criar):
- `src/integrations/maps/providers/OSRMProvider.ts` ✨ NOVO

### 2. Configuração (Alterar):
- `src/core/routing/instance.ts` - Trocar MockProvider por OSRMProvider

### 3. Hooks (Alterar):
- `src/modules/mobility/hooks/useDriverLocation.ts` - Remover fallback Haversine

### 4. Services (Alterar):
- `src/modules/mobility/core/RideDispatchService.ts` - Usar routingService para distância

### 5. Componentes de Mapa (Alterar):
- `src/modules/mobility/components/RideTrackingMap.tsx` - Desenhar rota real
- `src/modules/mobility/components/map/LiveTrackingMap.tsx` - Desenhar rota real
- `src/modules/mobility/pages/BuscandoMotoristaPage.tsx` - Desenhar rota real

### 6. Pricing (Validar):
- `src/core/pricing/services/PricingService.ts` - Já usa routingService ✅

---

## PRÓXIMOS PASSOS (FASE 2)

1. Implementar OSRMProvider
2. Integrar com mapa (desenhar rota real)
3. Integrar com ETA (usar duração real)
4. Integrar com pricing (usar distância real)
5. Remover fallbacks de linha reta
6. Validar fluxo completo

---

## RISCOS IDENTIFICADOS

### Risco 1: OSRM Público Indisponível
**Mitigação:** Fallback controlado para MockProvider com warning explícito

### Risco 2: Latência de Rede
**Mitigação:** Cache de rotas recentes, timeout de 5s

### Risco 3: Dados OSM Desatualizados
**Mitigação:** Atualização semanal automática (quando self-hosted)

### Risco 4: Rotas em Áreas Sem Cobertura
**Mitigação:** Validação de bounds, fallback para linha reta com warning

---

## MÉTRICAS DE SUCESSO

Após implementação, validar:

- [ ] Mapa desenha rota real (não linha reta)
- [ ] ETA usa duração real da rota
- [ ] Pricing usa distância real da rota
- [ ] Fallback Haversine removido do fluxo principal
- [ ] Latência <2s para cálculo de rota
- [ ] Taxa de sucesso >95%
- [ ] Diferença entre linha reta e rota real documentada

---

## CONCLUSÃO FASE 1

**Diagnóstico Completo:**
- ✅ Fundação técnica sólida (RoutingService SSOT)
- ✅ Provider escolhido (OSRM)
- ✅ Arquivos identificados
- ✅ Estratégia definida

**Próximo Passo:** FASE 2 - Implementação do OSRMProvider

**Tempo Estimado:** 1-2 dias para implementação completa
