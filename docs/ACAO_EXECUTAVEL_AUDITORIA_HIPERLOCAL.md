# Plano de Acao Executavel: Auditoria Hiperlocal Achegue-se

Data: 2026-05-06
Status: documento vivo
Objetivo: transformar as auditorias em um plano que qualquer IA/agente consiga executar com baixo risco, sem depender do contexto da conversa.

## Prompt Mestre Para Outra IA

```text
Voce e uma IA engenheira senior trabalhando no repositorio Achegue-se. Execute o plano em docs/ACAO_EXECUTAVEL_AUDITORIA_HIPERLOCAL.md com disciplina de engenharia.

Regras obrigatorias:
1. Antes de editar, leia os documentos vivos listados neste plano.
2. Nao implemente tarefas fora da fase atual sem registrar motivo.
3. Nao reverta alteracoes existentes que voce nao fez.
4. Preserve o design system e os padroes atuais do projeto.
5. Para cada tarefa, identifique arquivos afetados, implemente, rode validacoes indicadas e atualize o checklist.
6. Se uma tarefa depender de schema/tabela/env ausente, crie adaptacao segura, documente bloqueio e nao invente dados falsos.
7. Nao deixe mocks, placeholders, TODOs novos ou `as any` novos sem justificativa explicita.
8. Toda tela alterada precisa continuar responsiva em mobile.
9. Ao finalizar uma fase, rode as validacoes da fase e atualize `docs/STATUS_ATUAL.md`.
10. Priorize P0 antes de P1, P1 antes de P2, P2 antes de P3.
```

## Progresso Atual

- [x] Fase 0: Preparacao e baseline
- [x] Fase 1: Arquitetura, taxonomia e rotas canonicas
- [x] Fase 2: Mobilidade, motorista e motoboy
- [ ] Fase 3: Gastronomia e delivery integrado
- [ ] Fase 4: Profissionais e servicos
- [ ] Fase 5: Marketplace social/local e comunidade
- [ ] Fase 6: Confianca, identidade, reputacao e notificacoes
- [ ] Fase 7: Admin, moderacao, billing e operacao
- [ ] Fase 8: SEO, mobile, performance, busca e IA
- [ ] Fase 9: Documentacao viva e encerramento

## Fontes de Verdade

Leia antes de executar:

- `docs/AUDITORIA_PRODUTO_HIPERLOCAL_CHECKLIST.md`
- `docs/audits/AUDITORIA_MODULO_MOBILIDADE.md`
- `docs/audits/AUDITORIA_MODULO_PROFISSIONAIS.md`
- `docs/audits/AUDITORIA_MODULO_GASTRONOMIA_NICHOS.md`
- `docs/audits/AUDITORIA_DOCS_OBSOLETOS.md`
- `package.json`

Documentos que nao devem ser tratados como verdade sem revisao:

- Docs antigos com termos como `FINAL`, `100%`, `completo`, `pronto para producao`, `zero TODO`.
- Relatorios historicos soltos na raiz.
- READMEs de migracao que ainda citam modelos legados.

## Validacoes Obrigatorias

Rodar no minimo:

```powershell
npm run typecheck
npm run validate:architecture:community
npm run validate:taxonomy
```

Rodar quando a fase tocar nos respectivos temas:

```powershell
npm run lint
npm run test
npm run validate:docs-structure
npm run validate:migrations
npm run security:validate
npm run test:e2e
```

Se uma validacao ja falhava antes da tarefa, registre:

- comando executado;
- erro atual;
- se o erro foi reduzido, mantido ou piorado;
- proxima acao recomendada.

## Definicao Global de Pronto

O plano so deve ser considerado concluido quando:

- `npm run typecheck` passa.
- `npm run validate:architecture:community` passa ou tem excecao documentada e aprovada.
- `npm run validate:taxonomy` passa ou tem SSOT atualizado e documentado.
- Nao ha `window.confirm()` em fluxos de producao sensiveis.
- Rotas canonicas principais estao sincronizadas.
- Mobilidade passageiro/motorista/motoboy funciona ponta a ponta.
- Gastronomia gera fluxo de pedido e entrega coerente.
- Central Profissional deixou de ser placeholder.
- Docs obsoletos foram marcados/arquivados.
- `docs/STATUS_ATUAL.md` reflete o estado real.

## Ordem de Execucao

1. Fase 0: Preparacao e baseline.
2. Fase 1: Arquitetura, taxonomia e rotas canonicas.
3. Fase 2: Mobilidade, motorista e motoboy.
4. Fase 3: Gastronomia e delivery integrado.
5. Fase 4: Profissionais e servicos.
6. Fase 5: Marketplace social/local e comunidade.
7. Fase 6: Confianca, identidade, reputacao e notificacoes.
8. Fase 7: Admin, moderacao, billing e operacao.
9. Fase 8: SEO, mobile, performance, busca e IA.
10. Fase 9: Documentacao viva e encerramento.

Nao pule P0. Se precisar reordenar, documente o motivo.

---

# Fase 0: Preparacao e Baseline

Status: concluida em 2026-05-06

## Tarefa 0.1: Registrar estado inicial
Status: concluida

Objetivo: evitar que a IA misture problemas preexistentes com problemas criados por ela.

Passos:

- Rodar `git status --short`.
- Rodar `npm run typecheck`.
- Rodar `npm run validate:architecture:community`.
- Rodar `npm run validate:taxonomy`.
- Rodar busca de riscos:

```powershell
rg -n "TODO|FIXME|mock|Mock|deprecated|legacy|as any|confirm\(" src/core src/modules
```

Criterio de aceite:

- Criar ou atualizar `docs/STATUS_ATUAL.md` com baseline datado.
- Registrar quais validacoes passam e quais falham.
- Nao alterar codigo nesta tarefa, exceto o documento de status.

## Tarefa 0.2: Criar formato de acompanhamento
Status: concluida

Objetivo: manter execucao auditavel.

Passos:

- Em `docs/STATUS_ATUAL.md`, criar secoes:
  - `Validacoes`
  - `P0 abertos`
  - `P1 abertos`
  - `Alteracoes recentes`
  - `Bloqueios`
  - `Proxima fase`

Criterio de aceite:

- Qualquer IA consegue abrir `docs/STATUS_ATUAL.md` e saber o que falta sem reler todo o repositorio.

---

# Fase 1: Arquitetura, Taxonomia e Rotas Canonicas

Status: concluida em 2026-05-06

## Tarefa 1.1: Corrigir arquitetura da comunidade
Status: concluida

Objetivo: fazer `npm run validate:architecture:community` passar.

Evidencias:

- `src/core/community/services/LostFoundRuntimeService.ts` importa agregador legado `@/modules/community`.
- `src/app/routes/prefetch.ts` importa `@/core/community/*` fora dos dominios permitidos.

Passos:

- Inspecionar o script `scripts/validate-community-transversal-boundaries.ts`.
- Entender regra exata antes de editar.
- Substituir import legado por import direto do servico/tipo permitido.
- Ajustar `prefetch.ts` para usar camada permitida ou adaptador de rota.
- Nao mover modulos inteiros sem necessidade.

Criterio de aceite:

- `npm run validate:architecture:community` passa.
- `npm run typecheck` passa.
- Nenhum import circular novo.

## Tarefa 1.2: Corrigir taxonomia do projeto
Status: concluida

Objetivo: fazer `npm run validate:taxonomy` passar ou atualizar SSOT de forma intencional.

Evidencias:

- `src/modules/ai` e `src/modules/central` fora do SSOT permitido.
- Pastas legadas em `src/core/landing`, `src/core/supabase`, `src/core/classifieds`, `src/core/mobility`.

Passos:

- Ler `scripts/validate-project-taxonomy.ts`.
- Identificar arquivo/fonte SSOT de modulos permitidos.
- Decidir para cada item:
  - adicionar como modulo oficial;
  - mover para local canonico;
  - transformar em compatibilidade legada controlada;
  - arquivar/remover apenas se confirmado que nao ha uso.
- Usar `rg` para verificar imports antes de mover qualquer pasta.

Criterio de aceite:

- `npm run validate:taxonomy` passa.
- `npm run typecheck` passa.
- Decisao documentada em `docs/STATUS_ATUAL.md`.

## Tarefa 1.3: Consolidar rotas canonicas da Central
Status: concluida

Objetivo: Central deve ser cockpit operacional; Perfil deve ser identidade/configuracao; Mobilidade publica deve ser aquisicao/landing.

Arquivos provaveis:

- `src/modules/central/pages/CentralMotoristaPage.tsx`
- `src/modules/central/pages/CentralMotoboyPage.tsx`
- `src/modules/central/components/centralNavigation.config.ts`
- arquivos de URLs/hooks como `useAppUrls` e configuracoes de rotas.

Passos:

- Mapear rotas atuais de motorista e motoboy.
- Corrigir atalhos da Central para `/central/motorista/*` e `/central/motoboy/*`.
- Manter redirects seguros para rotas antigas de perfil.
- Garantir que CTAs de cadastro de motoboy preservem tipo `motoboy`.
- Verificar que menu lateral, cards e botoes apontam para o mesmo destino.

Criterio de aceite:

- Central Motorista nao navega para caminhos antigos de perfil quando a acao e operacional.
- Central Motoboy nao navega para caminhos antigos de perfil quando a acao e operacional.
- Rotas antigas, se existirem, redirecionam sem quebrar links.
- `npm run typecheck` passa.

---

# Fase 2: Mobilidade, Motorista e Motoboy
Status: `CONCLUIDA` em 2026-05-06

## Tarefa 2.1: Fechar tracking real do motorista/motoboy
Status: `CONCLUIDA` em 2026-05-06

Objetivo: remover `noop` e conectar disponibilidade/tracking ao estado real.

Arquivos provaveis:

- `src/modules/mobility/hooks/useDriverDashboardBase.ts`
- `src/core/tracking/services/TrackingService.ts`
- `src/core/mobility/services/mobility.mutations.ts`
- `src/modules/mobility/services/mobility.mutations.ts`
- hooks de status operacional do motorista.

Passos:

- Localizar onde disponibilidade e tracking sao persistidos.
- Substituir `toggleTracking: () => undefined` por chamada real.
- Se tracking historico depender de tabela ausente, criar fallback seguro que atualize status atual e registre bloqueio do historico.
- Evitar polling agressivo alem do necessario.
- Garantir que erro de permissao de geolocalizacao seja exibido em UI.

Criterio de aceite:

- Motorista/motoboy consegue ativar/desativar tracking.
- UI reflete estado persistido.
- Falha de permissao/localizacao nao quebra dashboard.
- `npm run typecheck` passa.
- Implementado: `toggleTracking` real no `useDriverOperationalStatus` e wiring no `useDriverDashboardBase`.
- Implementado: `updateDriverLocation` deixou de ser `noop` e agora persiste em `driver_availability` + heartbeat.

## Tarefa 2.2: Fechar realtime/push operacional
Status: `CONCLUIDA` em 2026-05-06

Objetivo: motorista, motoboy e passageiro recebem mudancas criticas sem reload.

Arquivos provaveis:

- `src/modules/mobility/core/RideOperationalService.ts`
- `src/modules/mobility/hooks/useRideRealtime*`
- centro de notificacoes e preferencias.

Eventos minimos:

- nova oferta de corrida;
- nova entrega;
- motorista aceitou;
- corrida iniciada;
- corrida concluida;
- corrida cancelada;
- pedido saiu para entrega;
- entrega concluida;
- emergencia acionada.

Criterio de aceite:

- Realtime atualiza dashboards ativos.
- Notificacao transacional e criada para eventos criticos.
- Falha de realtime tem fallback por refetch controlado.
- Implementado: `useRideRealtime` agora emite `in_progress`, `in_delivery`, `delivered` e `completed`.
- Implementado: `useDriverDashboardBase`, `useRideSearch` e `useDelivery` reagem aos novos eventos em tempo real.
- Implementado: `RideOperationalService.handlePostTransition` cria notificacoes transacionais para passageiro/motorista nos eventos criticos.

## Tarefa 2.3: Passageiro E2E
Status: `CONCLUIDA` em 2026-05-06

Objetivo: passageiro deve conseguir usar corrida e entrega sem ambiguidade.

Arquivos provaveis:

- `src/modules/mobility/pages/PassageiroPage.tsx`
- `src/modules/mobility/components/CreateRideModal*`
- `src/modules/mobility/components/ActiveRideCard*`
- `src/modules/mobility/components/RideTrackingMap*`

Passos:

- Separar acao `Nova corrida` de `Entrega rapida`.
- Garantir que entrega abre modal/tipo correto.
- Remover casts desnecessarios de status quando possivel.
- Validar historico, avaliacao, cancelamento e emergencia.

Criterio de aceite:

- Criar corrida nao cria entrega por engano.
- Criar entrega nao cria corrida por engano.
- Status exibido corresponde ao status canonico.
- Cancelamento exige motivo quando a regra de negocio exigir.
- Implementado: `CreateRideModal` com `initialType` e `PassageiroPage` abrindo entrega com tipo `entrega`.
- Implementado: `PassageiroPage` usa conjuntos canonicos de status sem casts `as any` para busca, rastreamento e corridas ativas.

## Tarefa 2.4: Motorista E2E
Status: `CONCLUIDA` em 2026-05-06

Objetivo: motorista deve aceitar, iniciar, concluir, cancelar e ver ganhos com consistencia.

Passos:

- Validar oferta, aceite, inicio, conclusao, cancelamento, avaliacao.
- Padronizar ganhos: bruto, taxa, liquido, periodo.
- Garantir que cancelamento preserva motivo e auditoria.
- Confirmar que motorista sem verificacao operacional nao aceita corrida.

Criterio de aceite:

- Dashboard nao mostra acoes impossiveis para o status atual.
- Ganhos batem com corridas concluidas.
- Cancelamento gera evento e notificacao.
- Implementado: lista ativa de motorista agora exclui entregas motoboy (evita acoes incorretas de corrida em entregas).
- Implementado: estados `cancelled_by_driver` e `cancelled_by_passenger` tratados na UI de acoes do motorista.
- Implementado: `DriverRidesList` agora exibe iniciar/concluir/cancelar apenas para estados permitidos (sem acao impossivel para status final ou invalido).
- Implementado: helpers puros de mobilidade alinhados aos estados canonicos (`cancelled_by_*`, `failed_delivery`, `expired`, entrega em rota).
- Implementado: ganhos calculados apenas sobre estados pagaveis (`completed` e `delivered`), mantendo `failed_delivery` no historico sem inflar receita.

## Tarefa 2.5: Motoboy E2E
Status: `CONCLUIDA` em 2026-05-06

Objetivo: motoboy deve operar entrega como fluxo proprio, nao como corrida renomeada.

Passos:

- Validar onboarding proprio de motoboy.
- Garantir que entregas possuem coleta, destino, comprovante, status e SLA.
- Criar ou conectar tela de incidentes: cliente ausente, endereco errado, restaurante atrasado, item danificado.
- Remover fallbacks legados quando houver modelo canonico.

Criterio de aceite:

- Motoboy ve apenas entregas compativeis com sua permissao/capacidade.
- Entrega tem linha do tempo propria.
- Restaurante, cliente e motoboy compartilham status coerente.
- Implementado: dialog de falha da entrega com motivos estruturados canonicos (auditoria/SLA), evitando motivo livre inconsistente.
- Implementado: estado terminal `failed_delivery` incluído no histórico/fechamento de motorista e motoboy (não some da operação após incidente).
- Implementado: hook legado de motorista tambem reconhece `delivered` e `failed_delivery` como estados de fechamento operacional.
- Implementado: `OrderDeliveryLinkService` mapeia `failed_delivery`, `driver_on_the_way` e `driver_arrived` para status de pedido/logistica.

## Tarefa 2.6: Bloqueio e suspensao operacional
Status: `CONCLUIDA` em 2026-05-06

Objetivo: garantir que usuario, motorista ou motoboy bloqueado/suspenso nao consiga solicitar, receber ou aceitar chamados por brecha de UI/API.

Passos:

- Validar suspensao do perfil solicitante antes de criar corrida comum.
- Validar suspensao do solicitante antes de criar entrega motoboy, incluindo fontes `passenger`, `business`, `gastronomy` e `service`.
- Validar suspensao, verificacao, assinatura ativa e capacidade operacional antes de motorista/motoboy ficar online/disponivel.
- Filtrar motoristas/motoboys suspensos, nao verificados, sem assinatura ativa ou sem capacidade do modo na busca de dispatch.
- Validar as mesmas regras no aceite direto da corrida/entrega, sem depender apenas da interface.
- Validar motoboy atribuido antes de coleta, inicio da rota, confirmacao de entrega e falha de entrega.

Criterio de aceite:

- Usuario suspenso nao cria corrida nem entrega.
- Motorista/motoboy suspenso nao entra na fila de disponibilidade.
- Motorista/motoboy suspenso, nao verificado, sem assinatura ativa ou sem capacidade do modo nao aparece para dispatch.
- Aceite direto bloqueia motorista/motoboy inelegivel mesmo se a UI for burlada.
- `npm run typecheck` passa.
- Implementado: `RideOperationalService` bloqueia solicitante suspenso em corrida e entrega.
- Implementado: `MotoboyAuthorizationService` bloqueia usuario suspenso em todas as fontes de solicitacao de entrega.
- Implementado: `DriverAvailabilityService` bloqueia disponibilidade e dispatch de motorista/motoboy inelegivel.
- Implementado: `RideDispatchService.acceptRide` valida suspensao, verificacao, assinatura e capacidade antes do aceite.
- Implementado: operacoes de motoboy validam elegibilidade antes de coleta, rota, entrega e falha.
- Implementado: telas de disponibilidade da Central e Perfil passam o modo operacional correto (`ride`/`motoboy`) ao SSOT e bloqueiam ativacao quando a capacidade do modo esta desabilitada.
- Implementado: acao admin de colocar motorista offline tambem sincroniza `driver_availability`, nao apenas `driver_data`.

---

# Fase 3: Gastronomia e Delivery Integrado

## Tarefa 3.1: Fechar pedido E2E

Status: em andamento.

Objetivo: cliente compra, restaurante opera, motoboy entrega e todos veem status correto.

Arquivos provaveis:

- `src/modules/business/gastronomy/pages/*`
- `src/modules/business/gastronomy/components/*`
- `src/modules/business/gastronomy/services/*`
- `src/modules/mobility/pages/MotoboyPage.tsx`
- servicos de delivery/motoboy.

Fluxo minimo:

- cliente abre restaurante;
- seleciona itens;
- monta carrinho;
- confirma pedido;
- restaurante aceita;
- restaurante prepara;
- pedido e despachado;
- motoboy aceita/retira;
- cliente acompanha;
- entrega conclui;
- avaliacao e recibo.

Criterio de aceite:

- Fluxo funciona sem status quebrado.
- Pedido cancelado notifica cliente/restaurante/motoboy conforme contexto.
- Nao ha dados mockados em fluxo principal de pedido.

Implementado nesta fase:

- [x] Corrigido contrato de criacao de entrega gastronomica: `ride_requests.source_id` passa a receber `orders.id`, permitindo que `OrderDeliveryLinkService.getRideRequestByOrderId(orderId)` encontre a entrega correta.
- [x] Separada a chave de autorizacao (`authorizationSourceId`) da entidade operacional persistida (`sourceId`), evitando quebrar a autorizacao por restaurante no `MotoboyAuthorizationService`.
- [x] Criada sincronizacao central `OrderDeliveryLinkService.syncRideStatusToOrder`, acionada por `RideOperationalService.transitionTo` e `acceptRide`.
- [x] Status do motoboy agora avanca o pedido SSOT em caminho logistico seguro: aceito, preparando, pronto, retirado, entregue, cancelado ou falhou.
- [x] Front da loja passou a listar pedidos pelo `OrderDeliverySSOTService` via `OrderService`, removendo dependencia das colunas legadas `orders.business_id/status/order_type`.
- [x] Tela de pedidos e detalhes usam rotas canonicas da Central para navegacao e exibem dados adaptados de `orders/order_items/order_timeline_events`.
- [x] Tela de entregas da loja combina entregas manuais com entregas vinculadas a pedidos, buscando `ride_requests` por `order.id` pelo `OrderDeliveryLinkService`.
ide_requests por order.id pelo OrderDeliveryLinkService.
- [x] Checkout grava snapshot operacional de cliente/entrega em `orders.source_metadata` para a loja listar pedidos com dados uteis sem depender de tabela legada.
- [x] Comprovante do motoboy agora sincroniza de `ride_requests.proof_of_delivery` para `orders.proof_of_delivery` e aparece no detalhe do pedido.
ide_requests.proof_of_delivery para orders.proof_of_delivery e aparece no detalhe do pedido.
- [x] Criada comunicacao operacional derivada do SSOT: `OrderDeliveryNotificationService` notifica cliente, loja e motoboy em criacao/mudanca de status sem quebrar o fluxo se notificacao falhar.
- [x] Detalhe do pedido ganhou painel operacional da loja via `OrderService`: aceitar, iniciar preparo, marcar pronto, despachar/entregar e cancelar com motivo auditavel no SSOT.

## Tarefa 3.2: Substituir `confirm()` nativo

Status: concluida.

Objetivo: acoes destrutivas devem usar dialog do design system.

Arquivos com evidencia:

- `src/modules/business/gastronomy/pages/DeliveryAreaPage.tsx`
- `src/modules/business/gastronomy/pages/MenuManagementPage.tsx`
- `src/modules/business/gastronomy/components/delivery/NeighborhoodManager.tsx`
- `src/modules/business/gastronomy/components/hours/ExceptionsManager.tsx`

Passos:

- Identificar padrao de dialog existente no projeto.
- Substituir `window.confirm()` por dialog acessivel.
- Garantir loading, erro e confirmacao.

Criterio de aceite:

- [x] `rg -n "confirm\\(" src/modules/business/gastronomy -S` nao encontra esses casos.
- [x] Acoes destrutivas usam `ConfirmActionDialog`, baseado em `AlertDialog` do design system.
- [x] Dialogs preservam estado pendente e bloqueiam confirmacao quando ha operacao destrutiva em andamento.

## Tarefa 3.3: Controlar nichos beta

Status: validado parcialmente.

Objetivo: nichos incompletos nao podem aparecer como completos.

Arquivo principal:

- `src/modules/business/gastronomy/niches/registry.ts`

Passos:

- Definir regra de exposicao: publico, beta, admin, desativado.
- Garantir que pizza, sushi, acai, pastel, churrascaria e bares respeitem status real.
- Corrigir placeholder `pizza_sizes` ou marcar como configuracao real.

Criterio de aceite:

- Usuario final nao ve nicho beta como produto completo.
- Admin consegue identificar maturidade do nicho.

Estado atual validado:

- [x] `pizza` esta como `full_enabled`, `isSelectable: true`, `isPublic: true`.
- [x] `sushi`, `acai`, `pastel`, `churrascaria` e `bares` estao como `beta_enabled`, `isSelectable: false`, `isPublic: false`.
- [x] Placeholder `pizza_sizes` removido do painel/admin de pizzaria.
- [x] Billing legado de gastronomia arquivado em `src/modules/business/gastronomy/billing/legacy` e removido do barrel publico.

---

# Fase 4: Profissionais e Servicos

## Tarefa 4.1: Substituir Central Profissional placeholder

Objetivo: profissional precisa de cockpit real.

Arquivo principal:

- `src/modules/central/pages/CentralProfissionalPage.tsx`

Dashboard minimo:

- novos leads;
- orcamentos abertos;
- agenda/disponibilidade;
- reputacao;
- desempenho;
- plano/visibilidade;
- CTA para editar servico/perfil;
- CTA para responder leads.

Criterio de aceite:

- Arquivo nao declara mais que e placeholder.
- Central Profissional exibe dados reais ou estados vazios honestos.
- Nao ha mock apresentado como dado real.

## Tarefa 4.2: Criar funil de lead/orcamento

Objetivo: cliente deve pedir orcamento e profissional deve responder.

Passos:

- Mapear tabelas/servicos existentes para leads/orcamentos.
- Se ja existir entidade, conectar UI.
- Se nao existir, propor migration com schema minimo:
  - cliente;
  - profissional;
  - categoria;
  - descricao;
  - localidade;
  - status;
  - mensagens/eventos;
  - timestamps.
- Criar notificacao para novo lead e resposta.

Criterio de aceite:

- Cliente solicita orcamento.
- Profissional recebe e muda status.
- Cliente acompanha resposta.
- Evento aparece no centro de notificacoes.

## Tarefa 4.3: Reputacao, verificacao e area de atendimento

Objetivo: profissional precisa ser confiavel localmente.

Passos:

- Remover `confirm()` nativo de areas de atendimento.
- Conectar reputacao a avaliacoes pos-servico.
- Exibir selo/verificacao quando houver base real.
- Garantir que area de atendimento usa localidade canonica.

Criterio de aceite:

- Prestador possui area de atendimento real.
- Perfil publico mostra confianca sem expor dados sensiveis.
- Avaliacao nao pode ser criada sem contexto valido quando regra exigir.

---

# Fase 5: Marketplace Social/Local e Comunidade

## Tarefa 5.1: Socializar classificados

Objetivo: classificado deve ser entidade social/local, nao apenas listagem.

Implementar/verificar:

- comentarios/perguntas publicas;
- salvar;
- compartilhar no feed;
- report;
- status: ativo, reservado, vendido, pausado, expirado, removido;
- reputacao de vendedor/comprador;
- bairro verificado;
- taxa de resposta;
- alertas anti-golpe.

Criterio de aceite:

- Anuncio circula no bairro com controle anti-spam.
- Vendedor tem sinais de confianca.
- Conversa privada tem contexto do anuncio.

## Tarefa 5.2: Feed unificado do bairro

Objetivo: "Meu Bairro" deve agregar conteudo util, nao virar feed barulhento.

Conteudos:

- posts;
- alertas;
- problemas urbanos;
- eventos;
- classificados;
- recomendacoes;
- empresas ativas;
- servicos.

Ranking minimo:

- proximidade;
- reputacao;
- urgencia;
- recencia;
- interesse;
- atividade do usuario.

Criterio de aceite:

- Feed mostra contexto territorial.
- Usuario consegue silenciar tema/categoria.
- Conteudo comercial tem rotulo e limite.

## Tarefa 5.3: Completar comunidade, grupos, eventos e achados/perdidos

Itens P0/P1:

- post sempre com `location_id`;
- finalizar envio de comentario onde houver TODO;
- remover grupo mock da experiencia real;
- corrigir envio mock de imagem/audio;
- eventos com RSVP, recorrencia, local, capacidade e lembrete;
- achados/perdidos com contato privado, status encontrado/devolvido/encerrado e correspondencia automatica.

Criterio de aceite:

- Nenhum mock aparece como dado real.
- Cada entidade tem territorio e politica de visibilidade.

---

# Fase 6: Confianca, Identidade, Reputacao e Notificacoes

## Tarefa 6.1: Matriz de permissoes por persona

Personas obrigatorias:

- morador;
- comerciante;
- profissional;
- motorista;
- motoboy;
- admin;
- moderador local.

Criterio de aceite:

- Documento ou configuracao define permissoes por persona.
- UI nao mostra acao que o usuario nao pode executar.
- Backend/RLS/servico tambem valida permissao.

## Tarefa 6.2: Reputacao unificada

Entidades:

- pessoa;
- negocio;
- anuncio;
- servico;
- entrega;
- corrida;
- comentario/recomendacao.

Sinais:

- verificacao;
- avaliacoes;
- taxa de resposta;
- cancelamentos;
- denuncias;
- tempo de comunidade;
- conclusoes reais.

Criterio de aceite:

- Reputacao nao e apenas visual.
- Ranking local usa reputacao como sinal.
- Denuncias afetam risco/moderacao.

## Tarefa 6.3: Matriz de notificacoes

Eventos minimos:

- comentario;
- mensagem;
- pedido;
- entrega;
- corrida;
- alerta;
- problema apoiado;
- proposta/orcamento;
- venda;
- avaliacao;
- moderacao.

Canais:

- in-app;
- push;
- email quando adequado;
- digest.

Criterio de aceite:

- Preferencias por modulo/bairro/gravidade.
- Quiet hours/anti-spam para notificacoes nao criticas.
- Alertas criticos nao dependem de digest.

---

# Fase 7: Admin, Moderacao, Billing e Operacao

## Tarefa 7.1: Fila unica de moderacao

Objetivo: admin deve moderar conteudo transversalmente.

Escopo:

- posts;
- comentarios;
- mensagens;
- anuncios;
- alertas;
- problemas;
- negocios;
- profissionais;
- corridas/entregas sensiveis.

Criterio de aceite:

- Existe fila unica ou ponto de entrada claro.
- Cada item tem tipo, origem, bairro, gravidade, status, SLA e audit log.

## Tarefa 7.2: Audit log admin

Objetivo: acoes sensiveis precisam ser rastreaveis.

Acoes:

- banir/desbanir;
- aprovar/rejeitar;
- alterar plano;
- remover conteudo;
- verificar empresa/profissional/motorista;
- editar dados territoriais.

Criterio de aceite:

- Toda acao sensivel registra autor, data, antes/depois e motivo.

## Tarefa 7.3: Billing e entitlements

Objetivo: monetizacao deve ser unica e previsivel.

Passos:

- Criar matriz unica de entitlement.
- Unificar planos de empresas, profissionais, gastronomia, educacao, boosts e paginas premium.
- Remover/arquivar billing deprecated de gastronomia.
- Garantir que alertas/problemas civicos/seguranca nao sejam bloqueados por monetizacao.

Criterio de aceite:

- UI e servico consultam a mesma regra.
- Nao ha duplicidade contraditoria de permissao.

---

# Fase 8: SEO, Mobile, Performance, Busca e IA

## Tarefa 8.1: SEO e rotas publicas

Itens:

- corrigir rota com typo `businesss` ou manter redirect canonico controlado;
- sitemap dinamico com URLs reais;
- canonicals para empresas, servicos, gastronomia, classificados, educacao e turismo;
- schema.org para LocalBusiness, Product/Offer, Event, JobPosting, Place e FAQ.

Criterio de aceite:

- Rotas canonicas nao competem entre si.
- Sitemap nao depende de TODO para URLs principais.

## Tarefa 8.2: Mobile/PWA

Itens:

- push;
- instalacao PWA;
- deep links;
- offline basico para telas criticas quando viavel;
- responsividade de dashboards complexos.

Criterio de aceite:

- Passageiro, motorista, motoboy, restaurante e profissional operam em tela mobile sem layout quebrado.

## Tarefa 8.3: Busca e IA

Itens:

- busca global por modulo e territorio;
- ranking local: perto, confiavel, aberto agora, recomendado;
- IA citando entidades reais e abrindo pagina correta;
- evitar chat generico para intencoes transacionais nao suportadas;
- resumo por IA apenas com fontes reais.

Criterio de aceite:

- IA nao inventa empresa, servico, alerta, produto ou recomendacao.
- Resultado leva para rota canonica.

---

# Fase 9: Documentacao Viva e Encerramento

## Tarefa 9.1: Criar e manter `docs/STATUS_ATUAL.md`

Conteudo minimo:

- data;
- branch;
- validacoes;
- P0 abertos;
- P1 abertos;
- modulos prontos;
- modulos incompletos;
- bloqueios;
- proximas tarefas.

Criterio de aceite:

- Nenhum documento antigo e necessario para saber estado atual.

## Tarefa 9.2: Marcar ou arquivar docs obsoletos

Alvos:

- `docs/STATUS.md`;
- `docs/VALIDACAO_FINAL_E_PROXIMOS_PASSOS.md`;
- docs com `FINAL`, `100%`, `completo`, `pronto para producao`, `zero TODO`;
- relatorios historicos soltos na raiz.

Passos:

- Nao apagar sem necessidade.
- Se historico, mover para `docs/archive` ou adicionar banner:

```markdown
> Historico: este documento nao representa o status atual. Consulte `docs/STATUS_ATUAL.md`.
```

Criterio de aceite:

- Documentos obsoletos nao competem com documentos vivos.

## Tarefa 9.3: Atualizar auditorias

Ao concluir cada fase:

- Atualizar checklist correspondente.
- Registrar validacoes executadas.
- Registrar pendencias restantes.
- Remover afirmacoes que deixaram de ser verdade.

Criterio de aceite:

- Auditoria geral e docs por modulo refletem o codigo atual.

---

# Backlog Completo Por Modulo

## Comunidade / Feed

- [ ] P0: garantir `location_id`, escopo territorial e politica de visibilidade em todo post.
- [ ] P0: finalizar comentarios onde houver TODO.
- [ ] P1: feed "Tudo do bairro".
- [ ] P1: ranking por proximidade, reputacao, urgencia, recencia e interesses.
- [ ] P1: tipos claros de publicacao.
- [ ] P1: edicao e historico de comentarios.
- [ ] P1: seguir post/topico/bairro/grupo.
- [ ] P2: enquetes auditaveis.
- [ ] P2: silenciar tema/pessoa/categoria.

## Marketplace / Classificados

- [ ] P0: comentarios/perguntas publicas.
- [ ] P0: salvar, compartilhar e report.
- [ ] P0: reputacao comprador/vendedor.
- [ ] P0: status do anuncio.
- [ ] P1: distribuir no feed/grupos com limite.
- [ ] P1: bairro verificado e taxa de resposta.
- [ ] P1: protecoes anti-golpe.
- [ ] P2: ofertas, contraofertas e reserva.
- [ ] P2: boost local controlado.

## Empresas

- [ ] P0: consolidar rotas legadas e canonicas.
- [ ] P0: reivindicacao/verificacao antes de recursos sensiveis.
- [ ] P1: prova social do bairro.
- [ ] P1: botao unico de conversao.
- [ ] P1: posts comerciais com rotulo e limite.
- [ ] P1: ranking "Faves do bairro".
- [ ] P2: painel de leads por origem.
- [ ] P2: campanhas locais.

## Servicos / Profissionais

- [ ] P0: verificar identidade, telefone e area.
- [ ] P0: substituir Central Profissional placeholder.
- [ ] P0: lead/orcamento/notificacao.
- [ ] P1: agenda/disponibilidade.
- [ ] P1: recomendacao conectada ao perfil.
- [ ] P1: avaliacoes pos-servico.
- [ ] P2: pacotes/precos/FAQ.
- [ ] P2: selo para categorias sensiveis.

## Recomendacoes

- [ ] P0: vincular recomendacao a empresa/profissional real.
- [ ] P1: melhor resposta/resposta verificada.
- [ ] P1: reputacao de quem recomendou.
- [ ] P1: recomendacao como sinal de ranking.
- [ ] P2: deduplicar perguntas.
- [ ] P2: resumo por IA com fontes.

## Alertas / Seguranca

- [ ] P0: usar centroide/territorio, nunca endereco exato do morador.
- [ ] P0: revisar feature flag e estado real.
- [ ] P1: push por gravidade/bairro/raio.
- [ ] P1: confirmacao/encerramento por moradores confiaveis.
- [ ] P1: moderacao com SLA e audit log.
- [ ] P2: alertas oficiais quando houver fonte confiavel.

## Problemas Urbanos / Zeladoria

- [ ] P0: status operacional.
- [ ] P1: apoiar, seguir, comentar e anexar foto.
- [ ] P1: agrupamento anti-duplicata.
- [ ] P1: painel publico do bairro.
- [ ] P2: encaminhar/exportar para orgaos.

## Grupos

- [ ] P0: remover mocks reais.
- [ ] P0: corrigir envio mock de imagem/audio.
- [ ] P1: tipos de grupo.
- [ ] P1: regras, aprovacao, convites, denuncias e moderacao.
- [ ] P1: escopo claro entre feed e chat.

## Eventos

- [ ] P1: RSVP/interesse/participar.
- [ ] P1: recorrencia, local, capacidade e lembretes.
- [ ] P1: organizador verificado.
- [ ] P2: calendario e digest.

## Achados e Perdidos

- [ ] P0: contato privado, sem expor telefone.
- [ ] P1: status encontrado/devolvido/encerrado.
- [ ] P1: correspondencia automatica.
- [ ] P2: alertas em feed/grupos.

## Gastronomia / Delivery

- [ ] P0: pedido E2E.
- [ ] P0: restaurante E2E.
- [x] P0: integracao com motoboy.
- [x] P0: remover `confirm()` nativo.
- [x] P0: controlar deprecated/beta.
- [ ] P1: SLA de pedido.
- [ ] P1: painel realtime.
- [ ] P1: regras de area de entrega.
- [ ] P1: reputacao de restaurante.
- [ ] P2: recorrencia, estoque, analytics e campanhas.

## Mobilidade / Motoboy

- [ ] P0: tracking real.
- [ ] P0: realtime/push.
- [ ] P0: passageiro E2E.
- [ ] P0: motorista E2E.
- [ ] P0: motoboy E2E.
- [ ] P0: rotas Central/Perfil/Mobilidade.
- [ ] P1: precificacao e comprovante.
- [ ] P1: disputas, cancelamentos e SLA.
- [ ] P2: ranking de motoristas/motoboys.

## Vagas

- [ ] P0: implementar candidatura ou CTA externo claro.
- [ ] P1: perfil/curriculo local com privacidade.
- [ ] P1: empresa verificada para publicar.
- [ ] P1: vagas no feed com limite.
- [ ] P2: matching.

## Educacao

- [ ] P0: substituir mocks por dados reais ou demo explicita.
- [ ] P0: remover `confirm()` nativo.
- [ ] P1: funil de lead.
- [ ] P1: recomendacoes locais.
- [ ] P2: eventos educacionais e analytics real.

## Mapa / Perto de Mim

- [ ] P0: nao expor localizacao sensivel.
- [ ] P1: filtros unificados.
- [ ] P1: rota consistente.
- [ ] P2: clustering/cache/offline.

## Turismo / Guia

- [ ] P1: integrar eventos, gastronomia, rota e favoritos.
- [ ] P1: SEO territorial.
- [ ] P2: roteiros e colecoes.

## Mensagens / Chat

- [ ] P0: inbox unificada.
- [ ] P0: anti-spam e links suspeitos.
- [ ] P1: contexto fixo por conversa.
- [ ] P1: leitura, anexos e respostas rapidas.
- [ ] P2: disputa/suporte.

## Perfil / Identidade / Familia

- [ ] P0: identidade canonica unica.
- [ ] P0: verificacao de bairro sem expor endereco.
- [ ] P1: perfil publico com privacidade.
- [ ] P1: reputacao por persona com raiz comum.
- [ ] P2: familia/domicilio.
- [ ] P3: LGPD na UI.

## Admin / Moderacao

- [ ] P0: consolidar admin legado/duplicado.
- [ ] P0: fila unica de moderacao.
- [ ] P0: audit log.
- [ ] P1: painel por bairro.
- [ ] P1: SLAs.
- [ ] P1: anti-fraude.

## Billing / Monetizacao

- [ ] P0: matriz unica de entitlement.
- [ ] P1: planos, boosts, cupons, paginas premium e leads.
- [ ] P1: nao monetizar seguranca/civico essencial.
- [ ] P2: ROI local para comerciantes.

## Notificacoes

- [ ] P0: matriz por evento e canal.
- [ ] P1: push para eventos criticos.
- [ ] P1: preferencias por modulo/bairro/gravidade.
- [ ] P2: digest e quiet hours.

## SEO / Rotas

- [ ] P0: corrigir `businesss` ou redirect canonico.
- [ ] P0: sitemap dinamico real.
- [ ] P1: canonicals por modulo.
- [ ] P1: schema.org.

## Performance / Qualidade

- [ ] P0: reduzir `as any` em fronteiras criticas.
- [ ] P0: remover mocks de producao.
- [ ] P1: E2E para comunidade, empresa, gastronomia, mobilidade e alertas.
- [ ] P2: performance budget e Sentry/analytics.

---

# Como Marcar Uma Tarefa Como Concluida

Para cada item concluido, a IA deve registrar no commit/relatorio:

- tarefa;
- arquivos alterados;
- resumo tecnico;
- validacoes executadas;
- resultado das validacoes;
- riscos restantes;
- docs atualizados.

Modelo:

```text
Tarefa: 2.1 Fechar tracking real
Arquivos: ...
Implementacao: ...
Validacoes: npm run typecheck, ...
Resultado: ...
Riscos restantes: ...
Docs atualizados: docs/STATUS_ATUAL.md, ...
```

## Regra Final

Nao considerar o projeto pronto porque a UI existe. Considerar pronto apenas quando o fluxo operacional, as permissoes, os dados, as notificacoes, a moderacao, os estados vazios, os erros, o mobile e as validacoes tecnicas estiverem fechados.
