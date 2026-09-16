# Mobilidade — contrato canônico de runtime

> Estado auditado em 2026-09-16. Este arquivo descreve o runtime atual; documentos em `docs/10-archive/**` são apenas históricos e não devem ser usados como contrato de implementação.

## SSOT e fronteiras

- O ciclo de vida operacional de corridas e entregas pertence a `src/core/mobility/core/**` e aos comandos server-owned expostos pelos serviços RPC.
- Pedido + entrega comercial usa `src/core/mobility/delivery/services/OrderDeliverySSOTService.ts` como SSOT de aplicação, com `DeliveryRpcService` na fronteira de mutação remota.
- Precificação pertence a `src/core/pricing/**`. Código de mobilidade não deve possuir tabela paralela, fórmula local ou fallback monetário inventado.
- **Os valores atuais de `pricing_rules` são provisórios/fictícios de desenvolvimento e ainda NÃO representam a política comercial aprovada do Achegue-se.**
- Geolocalização pertence ao SSOT compartilhado de geolocalização; mobilidade deve consumir o serviço, não criar ownership paralelo de GPS/cache/permissões.
- UI e hooks podem orquestrar estado de apresentação, mas não são autoridade para transições, autorização, preço final ou custódia de entrega.

## Regras obrigatórias

1. Nenhuma transição crítica deve depender somente de validação do browser.
2. Browser não é autoridade de preço. O contrato final de criação deve usar quote/versionamento server-owned.
3. Nenhum preço pode ser calculado por fórmula comercial hardcoded como autoridade de produção.
4. Falha no Pricing Service deve falhar fechada; não inventar tarifa de contingência.
5. Valores provisórios de desenvolvimento nunca devem ser tratados como política comercial aprovada ou usados para declarar o módulo pronto para lançamento.
6. IDs de usuário e IDs de profile não são intercambiáveis.
7. Operações de motorista/motoboy devem validar atribuição e capacidade no backend.
8. Tracking/realtime deve ser escopado à corrida concreta; não abrir streams amplos por `user_id` quando o contrato exige `ride_id`.
9. Dados de auditoria podem permanecer sem policy de browser quando isso for intencional (RLS default-deny); acesso deve ocorrer apenas pelo caminho privilegiado explicitamente autorizado.
10. Funções `SECURITY DEFINER` só podem permanecer expostas quando o corpo valida ator/ownership ou quando o endpoint é deliberadamente público e limitado por um token seguro. Um grant não substitui autorização interna.
11. Reputação deve vir de avaliações reais. Estado sem avaliações é `NULL`/sem nota, nunca uma nota perfeita inventada.
12. Cancelamentos são eventos de suporte/segurança: corrida, ator, timestamp e motivo conhecido devem permanecer auditáveis; ausência histórica não pode ser preenchida com motivo inventado.
13. Dados de localização devem obedecer minimização: coletar/streamar somente o necessário ao estado operacional e encerrar exposição no estado terminal.

## Estado verificado nesta auditoria

### Correto / já endurecido

- O fluxo principal de criação exige coordenadas válidas antes da precificação.
- `useMobilidade` chama a instância canônica de Pricing e aborta a criação se a precificação falhar.
- `src/core/pricing/instance.ts` rejeita regras históricas `fallback-*` e, em build de produção, rejeita regras sem `metadata.commercial_status = approved`.
- Todas as regras existentes no ambiente auditado estão explicitamente marcadas `commercial_status=provisional`.
- Multiplicadores de pico hardcoded do `PricingService` estão desabilitados na instância canônica até existir avaliação server-owned/persistida da política.
- `useDelivery` (motoboy) falha fechado: não cria entrega sem preço calculado pelo caminho de Pricing.
- O hook genérico de estimativa usa a mesma instância canônica.
- O calculador legado local `baseFare + pricePerKm` foi removido de `mobility.helpers.ts`.
- Pisos comerciais locais `R$ 5` foram removidos de `RideOperationalService`, `RideDeliveryOperationalActions` e das funções SQL atômicas de criação.
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
- Confirmação de entrega usa comando especializado no backend e valida estado retornado.
- Entrega exige vínculo de endereço/território e validações operacionais de motoboy.
- Todas as tabelas de mobilidade inspecionadas em `public` estão com RLS habilitado.
- `get_operational_verification_status` e `verify_operational_pin` verificam sessão/profile e participação/atribuição no banco.
- `ensure_ride_chat`, `send_ride_chat_message` e `mark_ride_chat_messages_read` exigem profile ativo e participação concreta na corrida; chat só é gravável nos estados operacionais permitidos.
- `get_shared_ride_safety_data` expõe somente share ativo, não expirado, com token válido e corrida ainda aberta.
- `submit_ride_rating` exige ator participante e corrida concluída/entregue, valida escala/comentário e aplica rate limit.
- `ensure_owned_driver_data`/`update_owned_driver_data` validam ownership; self-service usa whitelist e mudança de identidade/veículo revoga verificação até nova análise.
- Funções safety inspecionadas (`create_*`, share, evidence, revoke e status) fazem checagens internas de sessão/ator/participação/admin e limites de payload; evidência valida ainda ownership do objeto, tamanho e MIME.
- Hook duplicado morto de gerenciamento de regras em `src/core/pricing/hooks/usePricingRules.ts` foi removido após censo sem callers de runtime; admin está convergindo para `src/core/pricing/instance.ts`.

### Bloqueadores antes de declarar pronto para lançamento

- [ ] **P0 pricing server-owned:** `supabase/functions/mobility-rpc/index.ts` ainda recebe `suggestedPrice` do browser e `rideCreationRpcParams(...)` ainda contém mínimo literal `5`. Não trocar por outro hardcode: substituir por quote server-owned/versionada e idempotente.
- [ ] Definir e aprovar a política comercial real de preços por modalidade. Até isso acontecer, `pricing_rules` continua apenas ambiente de desenvolvimento/prova.
- [ ] Aposentar fisicamente os fallbacks monetários, janelas de pico e estimativa de duração fictícia ainda existentes dentro de `PricingService` depois de migrar todos os callers/testes para o owner final.
- [ ] Remover o export/singleton cru de `PricingService` depois que nenhum consumidor restante depender dele; runtime deve ter uma entrada canônica.
- [ ] Regenerar tipos Supabase a partir do schema real depois da restauração de `ride_requests.cancellation_reason`; não editar generated types manualmente.
- [ ] Confirmar que `ride_state_audit` e `emergency_delivery_log` sem policies de browser são intencionalmente default-deny e possuem somente caminhos privilegiados necessários.
- [ ] Revisar minimização/retention de GPS, telefone e endereço em estados terminais e compartilhamentos de corrida.
- [ ] Concluir auditoria das funções `SECURITY DEFINER` restantes e autorização negativa entre usuários distintos.
- [ ] Executar gates de typecheck, lint, testes de mobilidade/pricing, build e regressão E2E dos fluxos passageiro/motorista/motoboy no mesmo SHA.
- [ ] Validar concorrência/idempotência: dupla aceitação, cancelamento simultâneo, retry de RPC, reconnect realtime, quote duplicada e confirmação duplicada.
- [ ] Obter pipeline de deploy verde; rate-limit do Vercel é blocker externo e não conta como certificação de source.

## Referências de qualidade usadas na auditoria

O desenho é próprio do Achegue-se. OWASP MASVS/MASTG e NIST SP 800-163/Mobile Threat Catalogue são usados como baseline de segurança, especialmente para autorização remota, validação de entrada, vetting, minimização de localização e proteção de dados. Relatos públicos recentes de usuários/motoristas são usados somente como sinal qualitativo para evitar padrões ruins como corrida cancelada sem contexto, motivo de segurança genérico e decisão operacional sem evidência/audit trail.

## Hardcodes permitidos vs. proibidos

Constantes matemáticas ou de apresentação estáveis (por exemplo raio médio da Terra para Haversine ou labels de status) não são regras comerciais e podem existir localmente.

São proibidos como autoridade de runtime: tarifa base, preço/km, preço mínimo, multiplicador/janela comercial, comissão, timeout comercial, política de cancelamento, expansão territorial ou qualquer regra de negócio que deva ser configurável/administrável pelo SSOT.

## Critério de lançamento

Não declarar mobilidade pronta apenas porque a UI funciona. `PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. O módulo só passa para `launch-ready` quando os blockers acima estiverem fechados, a política real de preços estiver definida/aprovada, quote for server-owned e os gates automatizados tiverem sido executados contra o mesmo SHA que será publicado.
