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
2. Nenhum preço pode ser calculado por fórmula comercial hardcoded no cliente.
3. Falha no Pricing Service deve falhar fechada; não inventar tarifa de contingência.
4. Valores provisórios de desenvolvimento nunca devem ser tratados como política comercial aprovada ou usados para declarar o módulo pronto para lançamento.
5. IDs de usuário e IDs de profile não são intercambiáveis.
6. Operações de motorista/motoboy devem validar atribuição e capacidade no backend.
7. Tracking/realtime deve ser escopado à corrida concreta; não abrir streams amplos por `user_id` quando o contrato exige `ride_id`.
8. Dados de auditoria podem permanecer sem policy de browser quando isso for intencional (RLS default-deny); acesso deve ocorrer apenas pelo caminho privilegiado explicitamente autorizado.
9. Funções `SECURITY DEFINER` só podem permanecer expostas quando o corpo valida ator/ownership ou quando o endpoint é deliberadamente público e limitado por um token seguro. Um grant não substitui autorização interna.
10. Reputação deve vir de avaliações reais. Estado sem avaliações é `NULL`/sem nota, nunca uma nota perfeita inventada.

## Estado verificado nesta auditoria

### Correto / já endurecido

- O fluxo principal de criação exige coordenadas válidas antes da precificação.
- `useMobilidade` chama o `pricingService.calculateEstimate(...)` e aborta a criação se a precificação falhar.
- O singleton canônico `src/core/pricing/instance.ts` rejeita regras históricas `fallback-*`; indisponibilidade do catálogo não pode virar preço hardcoded no runtime.
- `useDelivery` (motoboy) também falha fechado: não cria mais entrega com `suggestedPrice` ausente quando Pricing falha.
- O hook genérico de estimativa usa a mesma instância canônica de Pricing.
- O calculador legado local `baseFare + pricePerKm` foi removido de `mobility.helpers.ts`.
- `RideOperationalService` e `RideDeliveryOperationalActions` não possuem mais piso comercial `R$ 5`; só rejeitam preço estruturalmente inválido (`<= 0`/não finito).
- As funções server-owned `mobility_create_ride_atomic` e `mobility_create_delivery_atomic` também não possuem mais piso comercial fictício; continuam restritas a `service_role`/postgres e validam apenas preço positivo enquanto a política real não foi aprovada.
- A leitura de reputação do passageiro resolve corretamente Auth User ID versus Profile ID antes de consultar ratings.
- Passageiro sem avaliações ou com rating indisponível não recebe mais nota perfeita inventada `5.0`; a camada de leitura retorna estado neutro e a página de Histórico apresenta `Sem avaliações`.
- `driver_data.rating` não possui mais default `5.0`; novos motoristas começam sem nota. Os registros de motoristas sem corridas existentes foram normalizados para `NULL`.
- Foi removido um `driver_data` legado ligado a profile `business` somente após confirmar ausência de corrida, disponibilidade, localização e oferta; o banco voltou a ter zero extensões `driver_data` em profiles não-driver.
- Criação/transição operacional usa `RideOperationalService`/RPC em vez de gravar a tabela de corrida diretamente pela UI.
- Confirmação de entrega usa comando especializado no backend e valida estado retornado.
- Entrega exige vínculo de endereço/território e validações operacionais de motoboy.
- Todas as tabelas de mobilidade inspecionadas em `public` estão com RLS habilitado.
- `get_operational_verification_status` e `verify_operational_pin` verificam sessão/profile e participação/atribuição no banco.
- `ensure_ride_chat`, `send_ride_chat_message` e `mark_ride_chat_messages_read` exigem profile ativo e participação concreta na corrida; chat só é gravável nos estados operacionais permitidos.
- `get_shared_ride_safety_data` expõe somente share ativo, não expirado, com token válido e corrida ainda aberta.

### Bloqueadores antes de declarar pronto para lançamento

- [ ] Definir e aprovar a política comercial real de preços por modalidade. Até isso acontecer, todos os valores existentes em `pricing_rules` devem ser tratados como placeholders de desenvolvimento.
- [ ] Introduzir um estado explícito de prontidão comercial da precificação (ex.: metadata/config de aprovação) para impedir que valores provisórios sejam confundidos com preços de produção.
- [ ] Ajustar as demais superfícies de reputação (especialmente `PassageiroPage` e defaults residuais no hook) para mostrar explicitamente `Sem avaliações`, sem `5.0` ou `0.0` fictícios.
- [ ] Revisar `driver_profiles.rating DEFAULT 5.0`: a tabela está sem registros no ambiente auditado, mas o contrato legado ainda permite reputação inicial fictícia se voltar a ser usado.
- [ ] Revisar grants e corpos das demais funções `SECURITY DEFINER` de mobilidade sinalizadas pelo Supabase Security Advisor, especialmente safety, ratings e mutações de driver ainda não inspecionadas individualmente.
- [ ] Confirmar que `ride_state_audit` e `emergency_delivery_log` sem policies de browser são intencionalmente default-deny e possuem somente caminhos privilegiados necessários.
- [ ] Executar gates de typecheck, lint, testes de mobilidade, build e regressão E2E dos fluxos passageiro/motorista/motoboy após as correções.
- [ ] Validar concorrência/idempotência: dupla aceitação, cancelamento simultâneo, retry de RPC, reconnect realtime e confirmação duplicada.
- [ ] Validar autorização negativa: usuário A não pode ler/mutar corrida, chat, PIN, localização ou evidência do usuário B fora dos contratos públicos deliberados.
- [ ] Obter pipeline de deploy verde; o status Vercel observado nesta auditoria está bloqueado externamente por build-rate-limit.

## Hardcodes permitidos vs. proibidos

Constantes matemáticas ou de apresentação estáveis (por exemplo raio médio da Terra para Haversine ou labels de status) não são regras comerciais e podem existir localmente.

São proibidos no runtime de mobilidade: tarifa base, preço/km, preço mínimo, raio comercial, comissão, timeout comercial, política de cancelamento, expansão territorial ou qualquer regra de negócio que deva ser configurável/administrável pelo SSOT.

## Critério de lançamento

Não declarar mobilidade pronta apenas porque a UI funciona. O módulo só passa para `launch-ready` quando os itens acima estiverem fechados, **a política real de preços estiver definida/aprovada** e os gates automatizados tiverem sido executados contra o mesmo SHA que será publicado.
