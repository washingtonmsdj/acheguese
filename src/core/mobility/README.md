# Mobilidade — contrato canônico de runtime

> Estado auditado em 2026-09-16. Este arquivo descreve o runtime atual; documentos em `docs/10-archive/**` são apenas históricos e não devem ser usados como contrato de implementação.

## SSOT e fronteiras

- O ciclo de vida operacional de corridas e entregas pertence a `src/core/mobility/core/**` e aos comandos server-owned expostos pelos serviços RPC.
- **Criação de corrida/entrega pertence a `MobilityCreationService` → `mobility-create-rpc` → quote server-owned single-use.** `MobilityRpcService` não é owner de criação.
- Pedido + entrega comercial usa `src/core/mobility/delivery/services/OrderDeliverySSOTService.ts` como SSOT de aplicação, com `DeliveryRpcService` na fronteira de mutação remota.
- Precificação pertence a `src/core/pricing/**` e à emissão server-owned de `mobility_price_quotes`. Código de mobilidade não deve possuir tabela paralela, fórmula local ou fallback monetário inventado.
- **Os valores atuais de `pricing_rules` são provisórios/fictícios de desenvolvimento e ainda NÃO representam a política comercial aprovada do Achegue-se.**
- Geolocalização pertence ao SSOT compartilhado de geolocalização; mobilidade deve consumir o serviço, não criar ownership paralelo de GPS/cache/permissões.
- UI e hooks podem orquestrar estado de apresentação, mas não são autoridade para transições, autorização, preço final ou custódia de entrega.

## Regras obrigatórias

1. Nenhuma transição crítica deve depender somente de validação do browser.
2. Browser não é autoridade de preço. Criação usa quote/versionamento server-owned e single-use.
3. Nenhum preço pode ser calculado por fórmula comercial hardcoded como autoridade de produção.
4. Falha no Pricing/Quote Service deve falhar fechada; não inventar tarifa de contingência.
5. Valores provisórios de desenvolvimento nunca devem ser tratados como política comercial aprovada ou usados para declarar o módulo pronto para lançamento.
6. IDs de usuário e IDs de profile não são intercambiáveis.
7. Operações de motorista/motoboy devem validar atribuição e capacidade no backend.
8. Tracking/realtime deve ser escopado à corrida concreta; não abrir streams amplos por `user_id` quando o contrato exige `ride_id`.
9. Dados de auditoria podem permanecer sem policy de browser quando isso for intencional (RLS default-deny); acesso deve ocorrer apenas pelo caminho privilegiado explicitamente autorizado.
10. Funções `SECURITY DEFINER` só podem permanecer expostas quando o corpo valida ator/ownership ou quando o endpoint é deliberadamente público e limitado por um token seguro. Um grant não substitui autorização interna.
11. Reputação deve vir de avaliações reais. Estado sem avaliações é `NULL`/sem nota, nunca uma nota perfeita inventada.
12. Cancelamentos são eventos de suporte/segurança: corrida, ator, timestamp e motivo conhecido devem permanecer auditáveis; ausência histórica não pode ser preenchida com motivo inventado.
13. Dados de localização devem obedecer minimização: coletar/streamar somente o necessário ao estado operacional e encerrar exposição no estado terminal.
14. **Conclusão de corrida/entrega não aceita preço informado pelo motorista/browser.** O valor terminal deve ser derivado do estado monetário server-owned persistido.

## Estado verificado nesta auditoria

### Correto / já endurecido

- Criação de corrida e motoboy usa `mobility-create-rpc` separado do broker operacional genérico.
- `CreateRideInput` não recebe passenger/profile, IDs territoriais, coordenadas ou preço como autoridade de criação; o contrato sensível é o `priceQuoteId` server-owned.
- `mobility_create_ride_atomic` e `mobility_create_delivery_atomic` em produção possuem somente as assinaturas canônicas baseadas em `p_quote_id`; as antigas assinaturas com preço/rota vindos do browser foram removidas.
- A quote carrega passageiro, endereços, territórios, coordenadas, regra/versão e valor; criação persiste esses fatos a partir da quote bloqueada e consome a quote uma única vez.
- `useMobilidade` e `useDelivery` emitem a quote pelo owner de pricing antes de solicitar criação; falha de pricing/quote aborta o fluxo.
- `src/core/pricing/instance.ts` rejeita regras históricas `fallback-*` e, em build de produção, rejeita regras sem `metadata.commercial_status = approved`.
- Todas as regras existentes no ambiente auditado estão explicitamente marcadas `commercial_status=provisional`.
- Multiplicadores de pico hardcoded do `PricingService` estão desabilitados na instância canônica até existir avaliação server-owned/persistida da política.
- O calculador legado local `baseFare + pricePerKm` foi removido de `mobility.helpers.ts`.
- Pisos comerciais locais `R$ 5` foram removidos dos owners operacionais e das funções SQL canônicas de criação. O literal remanescente no handler de criação legado de `mobility-rpc` não alcança mais uma assinatura SQL compatível e deve ser removido fisicamente antes do lançamento.
- `CreateRideModal` não permite preço manual nem usa estimativa monetária local como autoridade; entrega foi separada para `CreateDeliveryModal`.
- `CreateDeliveryModal` também não apresenta estimativa provisória como preço contratual e, para passageiro, resolve coleta por GPS/reverse geocode reconciliado em vez de usar centro territorial como origem.
- `MobilityRpcService` não expõe mais `createRide/createDelivery`; criação pertence exclusivamente a `MobilityCreationService`.
- Gates operacionais 6 e 7 foram migrados para quotes técnicas single-use isoladas, sem transformar preço de fixture em política comercial.
- A leitura de reputação do passageiro resolve corretamente Auth User ID versus Profile ID antes de consultar ratings.
- Passageiro sem avaliações ou com rating indisponível não recebe mais nota perfeita inventada `5.0`; Histórico e Passageiro apresentam `Sem avaliações`.
- `driver_data.rating` não possui mais default `5.0`; novos motoristas começam sem nota. Registros sem corridas foram normalizados para `NULL`.
- `driver_profiles.rating` legado também deixou de nascer com nota perfeita no schema auditado.
- `ensure_admin_driver_data` legado foi aposentado do banco.
- Foi removido um `driver_data` legado ligado a profile `business` somente após confirmar ausência de corrida, disponibilidade, localização e oferta; o banco voltou a ter zero extensões `driver_data` em profiles não-driver.
- Criação/transição operacional usa `RideOperationalService`/RPC em vez de gravar a tabela de corrida diretamente pela UI.
- Corridas canceladas permanecem no histórico; `RideHistoryUnified` inclui estados fechados/cancelados.
- `ride_requests.cancellation_reason` foi restaurado como snapshot de suporte e é preenchido pela transição atômica; `ride_state_audit` continua sendo a trilha imutável.
- No backfill auditado havia 6 corridas canceladas: 5 possuíam motivo recuperável do audit e 1 permaneceu sem motivo porque não havia evidência histórica para reconstrução.
- `CancelRideDialog` usa códigos estáveis de motivo e inclui categorias explícitas de segurança para passageiro/motorista, preservando texto legível junto do código.
- Conclusão de entrega usa o wrapper G70 transacional: registra `delivered` e fecha `completed` dentro do mesmo comando server-side.
- O wrapper G70 é executável por `service_role`, não por `anon`/`authenticated`.
- `finalPrice` foi removido de `CompleteRideDialog`, `useRideOperations`, `useDelivery`, `useMotoristaPage`, `useMotoboyPage`, `MotoboyDeliveryActions`, `RideOperationalService`, `RideDeliveryOperationalActions` e `MobilityRpcService`.
- O parâmetro SQL legado `p_final_price` permanece apenas como compatibilidade temporária; o wrapper G70 passa `NULL::numeric` ao base e garante `final_price = COALESCE(final_price, suggested_price)` a partir do valor persistido. Valor enviado por cliente não possui autoridade.
- Entrega exige vínculo de endereço/território e validações operacionais de motoboy.
- Todas as tabelas de mobilidade inspecionadas em `public` estão com RLS habilitado.
- `ride_state_audit` e `emergency_delivery_log` estão explicitamente default-deny: RLS ligado, zero policies e zero DML de `anon`/`authenticated`. A migration `20260916120500_lock_mobility_audit_default_deny.sql` e o spec `supabase/tests/mobility_audit_default_deny_spec.sql` travam esse contrato; comandos de entrega emergencial auditados permanecem `service_role`-only.
- `get_operational_verification_status`, `verify_operational_pin` e `refresh_operational_pin_for_requester` verificam sessão/profile e participação/atribuição; refresh do PIN exige o próprio solicitante da corrida ainda ativa, com limitação de frequência.
- `ensure_ride_chat`, `send_ride_chat_message` e `mark_ride_chat_messages_read` exigem profile ativo e participação concreta na corrida; chat só é gravável nos estados operacionais permitidos.
- `get_shared_ride_safety_data` expõe somente share ativo, não expirado, com token válido e corrida ainda aberta.
- `submit_ride_rating` exige ator participante e corrida concluída/entregue, valida escala/comentário e aplica rate limit.
- `submit_ride_trust_feedback` limita ator/alvo às relações reais da corrida (passageiro↔motorista/motoboy e, quando aplicável, motoboy→merchant), com enumeração de motivos e rate limit server-side.
- `create_ride_report` passa pelo trigger `trg_guard_ride_report_write`, que recalcula o profile ativo, exige participante da corrida ou admin, redefine `reporter_type`, limita frequência e bloqueia denúncia pendente duplicada; o payload do browser não é autoridade de identidade.
- `ensure_owned_driver_data`/`update_owned_driver_data` validam ownership; self-service usa whitelist e mudança de identidade/veículo revoga verificação até nova análise.
- Funções safety inspecionadas (`create_*`, share, evidence, revoke e status) fazem checagens internas de sessão/ator/participação/admin e limites de payload; evidência valida ainda ownership do objeto, tamanho e MIME.
- Hook duplicado morto de gerenciamento de regras em `src/core/pricing/hooks/usePricingRules.ts` foi removido após censo sem callers de runtime; admin está convergindo para `src/core/pricing/instance.ts`.

### Bloqueadores antes de declarar pronto para lançamento

- [ ] **Definir e aprovar a política comercial real de preços por modalidade.** Até isso acontecer, `pricing_rules` continua apenas ambiente de desenvolvimento/prova e emissão comercial live deve permanecer fail-closed.
- [ ] **Remover fisicamente de `supabase/functions/mobility-rpc/index.ts` os handlers/actions legados `createRide/createDelivery` e o parsing de `finalPrice`.** Hoje criação legada já não consegue mutar o banco porque não existe assinatura SQL antiga compatível, mas código morto exposto não deve permanecer no artefato de lançamento.
- [ ] Depois do deploy do broker limpo, remover da assinatura SQL o parâmetro de compatibilidade `p_final_price`; não existe caller canônico que precise dele.
- [ ] Aposentar fisicamente os fallbacks monetários, janelas de pico e estimativa de duração fictícia ainda existentes dentro de `PricingService` depois de migrar todos os callers/testes para o owner final.
- [ ] Remover o export/singleton cru de `PricingService` depois que nenhum consumidor restante depender dele; runtime deve ter uma entrada canônica.
- [ ] Regenerar tipos Supabase a partir do schema real depois das mudanças recentes de `ride_requests`/pricing; não editar generated types manualmente.
- [ ] Revisar minimização/retention de GPS, telefone e endereço em estados terminais e compartilhamentos de corrida.
- [ ] Executar autorização negativa entre usuários distintos para funções sensíveis de mobilidade/safety, além dos checks estáticos já auditados.
- [ ] Executar gates de typecheck, lint, testes de mobilidade/pricing, build e regressão E2E dos fluxos passageiro/motorista/motoboy no mesmo SHA.
- [ ] Validar concorrência/idempotência: dupla aceitação, cancelamento simultâneo, retry de RPC, reconnect realtime, quote duplicada e confirmação duplicada.
- [ ] Obter pipeline de deploy verde; rate-limit do Vercel é blocker externo e não conta como certificação de source.

## Referências de qualidade usadas na auditoria

O desenho é próprio do Achegue-se. OWASP MASVS/MASTG e NIST SP 800-163/Mobile Threat Catalogue são usados como baseline de segurança, especialmente para autorização remota, validação de entrada, vetting, minimização de localização e proteção de dados. Relatos públicos recentes de usuários/motoristas são usados somente como sinal qualitativo para evitar padrões ruins como corrida cancelada sem contexto, motivo de segurança genérico e decisão operacional sem evidência/audit trail.

## Hardcodes permitidos vs. proibidos

Constantes matemáticas ou de apresentação estáveis (por exemplo raio médio da Terra para Haversine ou labels de status) não são regras comerciais e podem existir localmente.

São proibidos como autoridade de runtime: tarifa base, preço/km, preço mínimo, multiplicador/janela comercial, comissão, timeout comercial, política de cancelamento, expansão territorial ou qualquer regra de negócio que deva ser configurável/administrável pelo SSOT.

## Critério de lançamento

Não declarar mobilidade pronta apenas porque a UI funciona. `PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. O módulo só passa para `launch-ready` quando os blockers acima estiverem fechados, a política real de preços estiver definida/aprovada e os gates automatizados tiverem sido executados contra o mesmo SHA que será publicado.
