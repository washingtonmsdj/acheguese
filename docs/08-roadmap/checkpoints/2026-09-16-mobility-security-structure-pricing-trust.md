# Checkpoint 2026-09-16 — Mobilidade: segurança, estrutura, pricing e confiança

## Direção

O objetivo desta linha não é copiar Uber, Lyft ou qualquer concorrente. O alvo é um contrato de mobilidade seguro, auditável, previsível e melhor estruturado, usando padrões externos apenas como referência de qualidade e ameaças conhecidas.

Referências usadas nesta revisão:

- OWASP MASVS/MASTG: autorização deve ser aplicada no endpoint remoto; operações sensíveis precisam de controles adicionais; entrada não confiável deve ser validada; armazenamento, rede, autenticação e privacidade devem ter gates próprios.
- NIST SP 800-163 / Mobile Threat Catalogue: vetting de segurança deve ser parte do release e localização deve ser coletada somente quando necessária, com minimização e escopo claro.
- relatos públicos recentes de usuários/motoristas de apps de mobilidade foram usados apenas como sinal qualitativo de falhas de produto recorrentes: corrida cancelada que desaparece ou perde contexto, falta de motivo de cancelamento de segurança, e decisões operacionais sem evidência/trilha suficiente.

Essas referências não substituem o projeto real nem definem regras comerciais do Achegue-se.

## Fechado nesta linha

### Reputação

- [x] passageiro sem avaliação não recebe mais `5.0` fictício no serviço, hook, Histórico ou painel do Passageiro;
- [x] `driver_data.rating` perdeu `DEFAULT 5.0`; motoristas sem corridas foram normalizados para `NULL`;
- [x] `driver_profiles.rating` legado perdeu default perfeito e `NOT NULL` no ambiente auditado vazio;
- [x] `ensure_admin_driver_data` legado foi aposentado no banco após confirmar que já deveria estar removido pela linha canônica.

### Pricing

- [x] calculador local morto de tarifa removido da mobilidade;
- [x] pisos comerciais `R$ 5` removidos de `RideOperationalService`, `RideDeliveryOperationalActions` e das funções atômicas SQL de criação;
- [x] valores existentes em `pricing_rules` marcados como `metadata.commercial_status = provisional`;
- [x] runtime canônico recusa fallback `fallback-*` e, em build de produção, recusa regra que não esteja `commercial_status=approved`;
- [x] multiplicadores de pico locais/hardcoded foram desabilitados na instância canônica enquanto a avaliação de períodos/multiplicadores não for server-owned;
- [x] constantes monetárias fictícias mortas foram removidas de `PRICING_CONSTANTS`;
- [x] novas regras criadas no admin nascem explicitamente provisórias e a UI diferencia `Ativa` de `Aprovada para produção`;
- [x] hooks/admin reads de pricing começaram a convergir para `src/core/pricing/instance.ts`;
- [x] hook duplicado morto `src/core/pricing/hooks/usePricingRules.ts` removido após censo sem callers de runtime.

### Cancelamento, suporte e auditabilidade

- [x] corridas encerradas/canceladas permanecem no histórico; `getUserRides` não filtra cancelamentos e `RideHistoryUnified` trata estados fechados;
- [x] `ride_requests.cancellation_reason` foi restaurado como snapshot de suporte/auditoria e retroalimentado a partir do último evento de cancelamento em `ride_state_audit` quando havia motivo;
- [x] `mobility_transition_ride_state_atomic` grava motivo na corrida e continua gravando a transição no audit log na mesma operação server-owned;
- [x] diálogo de cancelamento passou a usar códigos estáveis + rótulos, incluindo motivos de segurança para passageiro e motorista, sem depender do texto traduzido como identidade do evento;
- [x] no snapshot pós-migração existem 6 corridas canceladas; 5 recuperaram motivo histórico e 1 não possuía motivo anterior para reconstrução sem inventar dado.

### Segurança server-owned já auditada

- [x] criação/transições críticas continuam atrás do broker/RPC server-owned;
- [x] RLS está habilitado nas tabelas de mobilidade inspecionadas;
- [x] PIN operacional, chat e share público foram revisados por participação/ownership e escopo;
- [x] `submit_ride_rating` exige corrida concluída/entregue e ator participante;
- [x] mutações self-service de motorista possuem ownership + whitelist e resetam verificação quando identidade/veículo muda;
- [x] funções safety inspecionadas validam sessão, ator, participação/admin, payload, coordenadas e, para evidências, ownership do objeto, MIME e tamanho;
- [x] extensões `driver_data` inconsistentes ligadas a profile não-driver foram removidas somente após prova de ausência de vínculo operacional.

## P0 confirmados — ainda impedem `launch-ready`

### P0.1 — preço ainda não é integralmente server-owned

O broker `supabase/functions/mobility-rpc/index.ts` ainda possui `rideCreationRpcParams(...)` com limite mínimo literal `5` e encaminha `suggestedPrice` vindo do cliente para `mobility_create_*_atomic`.

Isso é incompatível com o alvo final. Não corrigir trocando `5` por outro número. A solução canônica deve ser:

1. browser envia rota/contexto, nunca autoridade de preço;
2. backend obtém regra aprovada e dados de rota necessários;
3. backend calcula/assina ou persiste uma quote com identidade/versionamento;
4. criação da corrida referencia essa quote server-owned;
5. retries devem ser idempotentes e não criar duas quotes/corridas;
6. preço final deve ter trilha de versão/regra aplicada.

Até esse cutover, pricing continua bloqueador de lançamento público.

### P0.2 — legado interno ainda existe no `PricingService`

`src/core/pricing/services/PricingService.ts` ainda contém:

- regras monetárias `fallback-*` históricas;
- janelas/multiplicadores de pico hardcoded;
- estimativa de duração baseada em velocidade média fixa;
- export do singleton cru além da instância canônica.

A fachada canônica bloqueia fallback e pico local, portanto esses caminhos não devem definir preço ao usuário. Mesmo assim precisam ser fisicamente aposentados depois de migrar todos os callers/testes e substituir a estimativa de duração pelo contrato real de routing/quote.

### P0.3 — schema types

A migration adicionou/restaurou `ride_requests.cancellation_reason`. Não editar `types.generated.ts` manualmente. Regenerar tipos Supabase a partir do schema real no gate apropriado; até lá o bounded read model contém a extensão local explícita.

### P0.4 — release/security gates

Ainda faltam no mesmo SHA:

- typecheck;
- lint;
- unit/integration de mobilidade/pricing;
- regressão E2E passageiro/motorista/motoboy;
- authz negativa entre usuários distintos;
- concorrência/idempotência (duplo aceite, retry, cancelamento simultâneo, confirmação duplicada);
- vetting de privacidade de localização e limpeza após estados terminais;
- build/deploy verde. Rate-limit do Vercel não conta como build aprovado nem como reprovação de source.

## Próxima ordem de execução

1. **Correção:** remover autoridade de preço do browser e o piso `5` do broker mediante quote server-owned/versionada.
2. **Correção:** migrar todos os imports restantes do singleton cru de Pricing para a entrada canônica.
3. **Correção:** aposentar fisicamente fallback/pico/duração fictícios do `PricingService` após censo de callers/testes.
4. **Correção:** revisar retenção/minimização de GPS, contato e endereço em estados terminais e shares.
5. **Correção:** concluir SECURITY DEFINER/default-deny audit e authz negativa.
6. **Só depois implementação:** melhorias de UX/safety adicionais (timeline de incidente, recurso/contestação, suporte contextual, detecção operacional), sempre sobre eventos auditáveis e sem decisão opaca sem evidência.

## Regra de release

`PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. Não habilitar Mobilidade porque a UI parece pronta. O módulo só pode mudar de estado após política comercial real aprovada, quote server-owned, segurança negativa/concorrrência testada e build/deploy do mesmo SHA.
