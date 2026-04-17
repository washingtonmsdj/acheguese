# MOBILIDADE (MOTOBOY) - RELATORIO COMPLETO E TASKS DE IMPLEMENTACAO

Data: 2026-04-17
Status deste documento: ANALISE + PLANO (sem implementacao de codigo neste passo)

## 1) Objetivo

Elevar a pagina de Mobilidade (carro chefe) ao mesmo nivel de robustez esperado para lancamento, com foco em:
- solicitacao de motoboy por usuario, empresa e gastronomia
- governanca/admin completa
- permissoes claras (quem pode solicitar, aceitar, concluir)
- SSOT real (uma fonte de verdade operacional)
- frontend atualizado no final

## 2) Escopo desta analise

Incluido:
- mobilidade/motoboy (runtime ride_requests)
- fluxo paralelo de delivery_requests (gastronomia)
- paginas de admin relacionadas
- paginas de usuario/perfil e paginas de empresa/gastronomia para solicitar motoboy
- pontos de permissao e rollout

Nao incluido (neste passo):
- implementacao de codigo
- execucao de testes

## 3) Diagnostico atual (estado real)

### 3.1 O que ja existe e esta funcional (base importante)

1. Runtime de motoboy em ride_requests existe:
- `src/modules/mobility/hooks/useDelivery.ts`
- `src/modules/mobility/core/RideOperationalService.ts` (createDelivery, confirmPickup, startDelivery, confirmDelivery, failDelivery)
- `src/modules/mobility/pages/MotoboyPage.tsx`
- `src/modules/mobility/hooks/useMotoboyPage.ts`

2. Rollout/admin basico de motoboy existe:
- toggle de mobilidade e modo motoboy por localizacao
- `src/modules/admin/pages/AdminOperacoes.tsx`

3. Capacidade de motorista x motoboy existe:
- `driver_data.can_do_delivery` e `can_do_rides`
- filtros em disponibilidade/ofertas
- `src/modules/mobility/hooks/useDriverDashboardBase.ts`

4. Planos/entitlements para rede de motoboy existem:
- `src/core/billing/entitlements.ts`

### 3.2 Lacunas criticas encontradas

1. SSOT quebrado por coexistencia de dois fluxos de entrega ativos:
- fluxo A (mobilidade): `ride_requests` com `ride_mode='motoboy'`
- fluxo B (gastronomia): `delivery_requests` via `DeliveryService`
- arquivos:
  - `src/modules/mobility/hooks/useDelivery.ts`
  - `src/modules/gastronomy/services/DeliveryService.ts` (inclusive com `// @ts-nocheck`)
  - `src/modules/gastronomy/hooks/useDeliveryRequests.ts`
- risco: dupla fonte de verdade, analytics divergente, operacao/admin fragmentados.

2. Integracao de solicitacao motoboy em paginas de negocio ainda incompleta:
- `useMotoboy` / `useDelivery` quase nao estao plugados em telas produtivas.
- `CreateDeliveryModal` existe, mas sem uso efetivo em paginas de empresa/gastronomia.
- arquivo sem uso detectado:
  - `src/modules/mobility/components/CreateDeliveryModal.tsx`

3. Fluxo de gastronomia incompleto para criar solicitacao:
- pagina de gestao de entregas lista/atualiza, mas nao expoe criacao de solicitacao de forma operacional completa.
- `CreateDeliveryRequestDialog` existe, mas nao esta conectado em pagina.
- arquivos:
  - `src/modules/gastronomy/pages/DeliveryManagementPage.tsx`
  - `src/modules/gastronomy/components/delivery/CreateDeliveryRequestDialog.tsx`

4. Permissao de quem pode solicitar motoboy ainda nao esta fechada ponta a ponta:
- service de mobilidade valida rollout e dados minimos, mas nao fecha regra de negocio por `sourceType/sourceId` no backend com governanca forte.
- falta matriz unica e enforcement explicito por ator (passenger/business/gastronomy/service/admin).

5. Admin nao cobre operacao completa de entregas motoboy:
- ha controle de toggle/diagnostico, mas nao ha superficie consolidada para:
  - fila de entregas motoboy
  - override manual (bloqueio, reatribuicao, cancelamento operacional)
  - auditoria por `source_type/source_id`

6. Riscos de qualidade no modulo paralelo de delivery:
- `src/modules/gastronomy/services/DeliveryService.ts` com `@ts-nocheck`.
- aumenta risco de regressao, mascara problemas de contrato/tipo.

7. Dependencia pendente no modulo vagas (impacta estabilidade geral de lancamento):
- logs indicam 400 por colunas ausentes `highlight_type` e `urgencia`.
- migracao esperada no proprio log:
  - `supabase/migrations/20260417100000_fix_vagas_urgencia_highlight.sql`
- isso precisa entrar como precondicao de ambiente limpo.

### 3.3 Cobertura ampliada (frontend + admin + ciclo completo)

Status usado nesta secao:
- COMPLETO = funcional com persistencia/fluxo de producao
- PARCIAL = existe UI/fluxo, mas com lacuna de regra, persistencia ou consistencia
- FALTANDO = placeholder/stub/TODO sem operacao real

#### A) Frontend de mobilidade (pagina completa)

1. Passageiro (`PassageiroPage`)
- Ativas + cancelamento: PARCIAL (cancelamento real existe, mas depende de estados e nao cobre todos os cenarios operacionais).
- Historico: PARCIAL (existe aba e componentes, mas com divergencias de tipo/dados).
- Avaliacoes de motorista: PARCIAL/FALTANDO (UI existe, mas handler atual em `useMobilidade` e stub com toast, sem gravacao real).
- Confirmacao de corrida e reporte de problema: FALTANDO (handlers stub em `useMobilidade` apenas com toast).
- Seguranca/SOS: PARCIAL (salva alerta, mas notificacoes para contatos/admin estao em TODO).

2. Historico do usuario
- `HistoricoPage` + `RideHistoryList`: PARCIAL.
- Lacunas objetivas:
  - filtro de tipo nao aplicado de forma canonica no hook (mapeamento fixo como "viagem"),
  - filtros de data/parcialmente inconsistentes,
  - rating nao consolidado (retorna undefined no hook),
  - coexistencia de outro historico (`PassengerRideHistory`) com `@ts-nocheck` e estrutura de rating diferente.

3. Motorista/Motoboy
- Painel motorista/motoboy e acoes operacionais (aceitar, iniciar, concluir, cancelar): PARCIAL/COMPLETO no core.
- Avaliar passageiro: FALTANDO (stub com toast em `useDriverDashboardBase.handleRatePassenger`).
- Separacao por capacidade (`can_do_delivery`/`can_do_rides`): COMPLETO no nivel de filtro de oferta.

4. Rastreamento compartilhado (`TrackRidePage`)
- Visualizacao base: PARCIAL.
- Realtime de atualizacao: FALTANDO (TODO explicito no arquivo).

5. Componentes relevantes ainda mockados/TODO em mobilidade
- Chat de mobilidade (`MobilityChatList`): FALTANDO (mock).
- Pontos de embarque (`BoardingPointsPanel`): FALTANDO (mock).
- Ranking de vizinhos (`NeighborRankingPanel`): FALTANDO (mock).
- Parte de notificacoes operacionais no core (`RideOperationalService`): PARCIAL (TODO para realtime/push).

#### B) Admin de mobilidade

1. `AdminOperacoes` (rollout + modo motoboy + diagnostico de tabelas)
- PARCIAL/COMPLETO para governanca de toggle.
- Nao substitui console operacional de entregas/corridas com acoes de incidente.

2. `AdminMotoristas` (aprovacao/suspensao/reativacao)
- Aprovacao: PARCIAL (usa `verifyUser`, mas processo de aprovacao documental ainda simplificado).
- Rejeicao: PARCIAL/FALTANDO (fluxo atual nao persiste estado de rejeicao de forma consistente).
- Historico de suspensao: FALTANDO (comentario explicito de tabela inexistente, retorna vazio).

3. `AdminReportsPassageiros`
- FALTANDO (pagina indica explicitamente que `ride_reports` nao existe e opera com dados vazios).

4. `AdminVerificacoes`
- FALTANDO (TODO explicito: `resident_verification_requests` nao criada).

5. `AdminAnalyticsMobilidade`
- PARCIAL (metricas basicas existem, mas com limitacoes por dependencia de tabelas ausentes e simplificacoes de status).

#### C) Regras de negocio/persistencia (quem pode fazer o que)

1. Solicitar motoboy por ator (usuario/empresa/gastronomia/servico)
- PARCIAL/FALTANDO no enforcement forte.
- Hoje ha validacoes de rollout e campos minimos, mas ainda sem hardening completo de ownership/entitlement por `source_type/source_id` no backend.

2. Avaliacoes (passageiro -> motorista, motorista -> passageiro)
- PARCIAL/FALTANDO.
- UI pronta em partes, persistencia incompleta (stubs) e dependencia de tabela/fluxo de ratings ainda nao consolidada.

3. Exclusao/soft delete
- Corrida/entrega: nao ha exclusao de entidade como fluxo de negocio (predomina cancelamento por status).
- Contatos de emergencia: COMPLETO para CRUD basico (inclui delete).

#### D) SSOT e consistencia tecnica

1. Dupla verdade de entrega (ja apontada na secao 3.2)
- CRITICO: `ride_requests` (motoboy mobility) x `delivery_requests` (gastronomia).

2. Tipagem e contratos
- PARCIAL.
- Existem sinais de debito tecnico:
  - `@ts-nocheck` em componentes/servicos relevantes,
  - tipos stub/export simplificado em `src/modules/mobility/types/index.ts`,
  - comentarios de migracao de tipos para generated.

### 3.4 Resposta objetiva sobre cobertura da analise

Nao, a primeira versao do relatorio nao cobria com a profundidade necessaria todos os pontos citados (historico, avaliacoes, aprovacao/rejeicao/suspensao de motorista e lacunas admin especificas).

Agora esta cobertura foi ampliada neste documento com:
- diagnostico de frontend de mobilidade por fluxo,
- diagnostico admin por pagina critica,
- status de persistencia real (completo/parcial/faltando),
- lacunas concretas para historico, avaliacao, aprovacao/rejeicao e operacao.

## 4) Decisao arquitetural obrigatoria (antes de codar)

## DECISAO D1 - SSOT de entrega motoboy

Escolha recomendada:
- consolidar rede de motoboy da plataforma em `ride_requests` (mobilidade), com `ride_mode='motoboy'`.
- tratar `delivery_requests` como fluxo legado/transitorio ou restrito a caso especifico (frota propria), sem competir com rede motoboy da plataforma.

Sem essa decisao, o projeto segue com dupla verdade.

## 5) Matriz de permissao alvo (obrigatoria)

### 5.1 Quem pode solicitar motoboy

1. Passenger:
- pode solicitar se autenticado + perfil valido + localizacao com motoboy habilitado.

2. Business/Gastronomy:
- pode solicitar se:
  - usuario tem vinculo valido com a empresa
  - plano da empresa permite (`canUseMotoboyNetwork` e `canRequestDelivery`)
  - modulo/territorio habilitados

3. Service profile:
- segue regra de vinculo + rollout + permissao de operacao.

4. Admin:
- pode operar override (nao necessariamente solicitar como usuario comum).

### 5.2 Quem pode aceitar/operar entrega

1. Motoboy/driver:
- precisa `can_do_delivery=true`, nao suspenso, online e elegivel.

2. Acoes de ciclo:
- apenas motoboy atribuido pode confirmar coleta/iniciar/concluir/falhar.
- apenas solicitante (ou admin) pode cancelar dentro das regras.

## 6) Plano de implementacao por fases (tasks)

## FASE 0 - Alinhamento e precondicoes (sem feature nova)

T0.1 Definir oficialmente D1 (SSOT motoboy em ride_requests) e registrar ADR.
T0.2 Aplicar migracoes pendentes de ambiente para remover erros 400 e ruido operacional:
- `20260417100000_fix_vagas_urgencia_highlight.sql`
- `20260417100001_backfill_vagas_highlight_type_from_destaque.sql`
T0.3 Levantar estado real do banco por checklist (colunas/indices/policies) e anexar evidencias.
T0.4 Garantir que as policies RLS de `ride_requests` estejam versionadas em `supabase/migrations` (nao apenas em `migrations_old`) para ambientes novos.

DoD Fase 0:
- ADR aprovado.
- ambiente sem erro 400 de colunas faltantes em vagas.
- checklist de schema aprovado.

## FASE 1 - Permissao e governanca de backend

T1.1 Criar/ajustar politica de autorizacao para create motoboy por `source_type/source_id`.
T1.2 Garantir validacao de ownership/association para `business` e `gastronomy`.
T1.3 Criar guard unico de permissao de solicitacao (service central), sem regra em componente.
T1.4 Fechar politica de cancelamento/override (solicitante x admin x motoboy).
T1.5 Auditoria obrigatoria para eventos criticos (create/accept/cancel/fail/complete).

DoD Fase 1:
- matriz de permissao implementada no backend/service.
- tentativas indevidas retornam erro padrao.
- trilha de auditoria disponivel.

## FASE 2 - Convergencia SSOT (eliminar dupla verdade)

T2.1 Definir destino do modulo `delivery_requests`:
- opcao A (recomendada): migrar fluxo rede motoboy para `ride_requests` e desativar fluxo paralelo.
- opcao B: manter `delivery_requests` apenas para frota propria, sem competir com motoboy rede.
T2.2 Remover `@ts-nocheck` de `DeliveryService` e aplicar tipagem forte.
T2.3 Garantir que hooks/paginas produtivas usem apenas o fluxo aprovado na D1.
T2.4 Atualizar docs SSOT e AdminSSOT para refletir fluxo final.

DoD Fase 2:
- 1 fluxo oficial por caso de uso.
- sem duplicacao de regra de negocio entre modulos.
- tipagem sem `@ts-nocheck` no core de entrega.

## FASE 3 - Integracao em paginas de negocio (empresa/gastronomia/usuario)

T3.1 Empresa: adicionar CTA real "Solicitar motoboy" na superficie correta (dashboard da empresa).
T3.2 Gastronomia: conectar criacao de solicitacao na pagina de entregas (hoje faltando ligacao efetiva).
T3.3 Usuario/perfil: expor atalhos funcionais para acompanhamento de entregas e status.
T3.4 Reutilizar `CreateDeliveryModal` (ou componente final consolidado) com validacao canonica de endereco/location.
T3.5 Garantir estados vazios/erro/loading sem pagina quebrada.
T3.6 Consolidar historico do usuario (uma unica estrategia), removendo divergencias entre `RideHistoryList` e `PassengerRideHistory`.
T3.7 Implementar persistencia real de avaliacao de motorista e confirmacao/reporte de corrida (substituir stubs no hook do passageiro).
T3.8 Implementar persistencia real de avaliacao de passageiro no fluxo do motorista/motoboy.
T3.9 Fechar realtime de `TrackRidePage` para status/localizacao sem polling manual.

DoD Fase 3:
- solicitacao motoboy executavel em telas de negocio reais.
- acompanhamentos de status acessiveis.
- sem caminho morto no frontend.
- historico e avaliacoes com persistencia real (sem toast stub).

## FASE 4 - Admin operacional completo

T4.1 Criar/expandir superficie admin de entregas motoboy (lista operacional).
T4.2 Filtros admin por:
- status
- territorio/location
- source_type/source_id
- motoboy
- SLA/idade da solicitacao
T4.3 Acoes admin:
- cancelar operacional
- reencaminhar/reprocessar dispatch
- bloquear solicitante/motoboy quando aplicavel
T4.4 Painel de saude operacional (SLA, tempo medio aceite, taxa falha/cancelamento).
T4.5 Fechar governanca de aprovacao/rejeicao de motorista com persistencia de decisao e trilha de auditoria (sem fluxo apenas visual).
T4.6 Implementar historico de suspensao/reativacao (ou substituir por fonte oficial existente) sem tela vazia.
T4.7 Implementar reports de passageiros (ride_reports ou modelo equivalente) para tirar pagina de estado inoperante.

DoD Fase 4:
- "nada fica sem admin" para motoboy.
- operacao consegue agir em incidentes sem SQL manual.
- aprovacao/rejeicao/suspensao de motorista com dados auditaveis e consultaveis.

## FASE 5 - Atualizacao final de frontend (pedido do usuario)

T5.1 Revisao de UX mobile-first das paginas:
- mobilidade passageiro
- mobilidade motoboy
- dashboard gastronomia/empresa para solicitar motoboy
T5.2 Consistencia visual (hero/layout/componentes/chamadas de acao).
T5.3 Mensagens e labels sem ambiguidade (corrida x entrega x motoboy).
T5.4 Tratamento de fallback/permissao negada/territorio desabilitado sem tela quebrada.

DoD Fase 5:
- fluxo claro para solicitar e operar entrega em mobile/desktop.
- sem botoes quebrados e sem estados mortos.

## FASE 6 - Testes (por ultimo, conforme solicitado)

T6.1 Testes de permissao por ator (unit/integration).
T6.2 Testes de fluxo E2E critico:
- business/gastronomia solicita
- motoboy aceita
- coleta
- entrega
- confirmacao/falha
T6.3 Testes admin de override e filtros.
T6.4 Testes de regressao territorial e mobile.
T6.5 Validacao de logs/console limpos e performance minima.

DoD Fase 6:
- suite critica passando.
- sem erro critico de console/500.
- checklist de lancamento aprovado.

## 7) Backlog detalhado (tasks tecnicas objetivas)

B1. Criar `MotoboyAuthorizationService` (ou equivalente) central.
B2. Integrar authorization service dentro de `RideOperationalService.createDelivery`.
B3. Garantir validacao `source_id` obrigatoria para `business/gastronomy/service`.
B4. Padronizar codigos de erro de permissao (sem mensagens ad-hoc).
B5. Consolidar query keys para entregas motoboy no frontend.
B6. Conectar `CreateDeliveryModal` em pelo menos 2 superficies produtivas (empresa e gastronomia).
B7. Adicionar pagina/lista "Minhas entregas solicitadas" para solicitante (perfil/dashboard).
B8. Criar `AdminMotoboyOperationsPage` (ou expandir AdminOperacoes) com tabela operacional.
B9. Criar metricas de SLA para admin.
B10. Remover `@ts-nocheck` de delivery service legado ou descontinuar modulo legado.
B11. Atualizar documentacao de SSOT e runbook de incidentes.
B12. Executar migracoes pendentes e registrar checksum/resultado.
B12.1 Versionar/aplicar RLS canonico de `ride_requests` no tronco principal de migrations.
B13. Remover stubs de `useMobilidade` (`rateRide`, `confirmRideCompletion`, `reportRideProblem`).
B14. Resolver inconsistencias de historico/filtros/tipos (`RideHistoryList` x `PassengerRideHistory`, `@ts-nocheck`).
B15. Implementar fluxo persistente de rejeicao de motorista no admin (status + motivo + data + autor).
B16. Implementar historico de suspensao no admin com fonte oficial (sem depender de tabela inexistente).
B17. Implementar backend/tabela para reports de passageiros e conectar `AdminReportsPassageiros`.
B18. Fechar TODO de notificacao SOS para contatos e administracao.
B19. Fechar realtime de `TrackRidePage` e remover TODO.

## 8) Riscos e bloqueios

R1. Sem decisao D1, qualquer implementacao de UI vai perpetuar duplicidade.
R2. Sem hardening de permissao backend, front pode parecer correto e ainda aceitar abuso.
R3. Sem admin operacional completo, incidentes vao para SQL manual (nao aceitavel para lancamento).
R4. Sem migracoes pendentes, ambiente continua gerando erro/ruido e mascara problemas reais.
R5. Se policies de `ride_requests` ficarem apenas em historico legado (`migrations_old`), ambientes novos podem subir sem protecao RLS esperada.

## 9) Sequencia recomendada de execucao

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6 (testes por ultimo)

## 10) Criterio de GO/NO-GO para Mobilidade

NO-GO se qualquer item abaixo falhar:
- SSOT nao consolidado
- permissoes de solicitacao/operacao sem enforcement backend
- falta de controle admin operacional
- solicitacao motoboy nao integrada em paginas reais de negocio
- fluxo motoboy com estados quebrados ou sem auditoria

GO somente quando:
- fases 0 a 5 completas
- fase 6 aprovada
- console limpo de erros criticos
- operacao/admin consegue agir sem gambiarras
