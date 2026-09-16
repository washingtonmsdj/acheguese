# Mobilidade — contrato canônico de runtime

> Estado auditado em 2026-09-16. Este arquivo descreve o runtime atual; documentos em `docs/10-archive/**` são apenas históricos e não devem ser usados como contrato de implementação.

## SSOT e fronteiras

- O ciclo de vida operacional de corridas e entregas pertence a `src/core/mobility/core/**` e aos comandos server-owned expostos pelos serviços RPC.
- Pedido + entrega comercial usa `src/core/mobility/delivery/services/OrderDeliverySSOTService.ts` como SSOT de aplicação, com `DeliveryRpcService` na fronteira de mutação remota.
- Precificação oficial pertence a `src/core/pricing/**`. Código de mobilidade não deve possuir tabela paralela, fórmula local ou fallback monetário inventado.
- Geolocalização pertence ao SSOT compartilhado de geolocalização; mobilidade deve consumir o serviço, não criar ownership paralelo de GPS/cache/permissões.
- UI e hooks podem orquestrar estado de apresentação, mas não são autoridade para transições, autorização, preço final ou custódia de entrega.

## Regras obrigatórias

1. Nenhuma transição crítica deve depender somente de validação do browser.
2. Nenhum preço oficial pode ser calculado por fórmula hardcoded no cliente.
3. Falha no Pricing Service deve falhar fechada; não inventar tarifa de contingência.
4. IDs de usuário e IDs de profile não são intercambiáveis.
5. Operações de motorista/motoboy devem validar atribuição e capacidade no backend.
6. Tracking/realtime deve ser escopado à corrida concreta; não abrir streams amplos por `user_id` quando o contrato exige `ride_id`.
7. Dados de auditoria podem permanecer sem policy de browser quando isso for intencional (RLS default-deny); acesso deve ocorrer apenas pelo caminho privilegiado explicitamente autorizado.
8. Funções `SECURITY DEFINER` só podem permanecer expostas quando o corpo valida ator/ownership ou quando o endpoint é deliberadamente público e limitado por um token seguro. Um grant não substitui autorização interna.

## Estado verificado nesta auditoria

### Correto / já endurecido

- O fluxo principal de criação exige coordenadas válidas antes da precificação.
- `useMobilidade` chama o `pricingService.calculateEstimate(...)` e aborta a criação se a precificação oficial falhar.
- Criação/transição operacional usa `RideOperationalService`/RPC em vez de gravar a tabela de corrida diretamente pela UI.
- Confirmação de entrega usa comando especializado no backend e valida estado retornado.
- Entrega exige vínculo de endereço/território e validações operacionais de motoboy.
- Todas as tabelas de mobilidade inspecionadas em `public` estão com RLS habilitado.

### Bloqueadores antes de declarar pronto para lançamento

- [ ] Remover a regra duplicada/hardcoded de preço mínimo (`R$ 5,00`) do código de aplicação e reconciliar o mínimo com o SSOT de Pricing + validação autoritativa do backend.
- [ ] Parar de representar passageiro sem avaliações (ou consulta indisponível) como nota `5.0`; usar estado explícito `sem avaliações`/indisponível.
- [ ] Revisar grants e corpos das funções `SECURITY DEFINER` de mobilidade sinalizadas pelo Supabase Security Advisor, especialmente rating, safety share, PIN/verificação, chat e mutações de driver.
- [ ] Confirmar que `ride_state_audit` e `emergency_delivery_log` sem policies de browser são intencionalmente default-deny e possuem somente caminhos privilegiados necessários.
- [ ] Executar gates de typecheck, lint, testes de mobilidade, build e regressão E2E dos fluxos passageiro/motorista/motoboy após as correções.
- [ ] Validar concorrência/idempotência: dupla aceitação, cancelamento simultâneo, retry de RPC, reconnect realtime e confirmação duplicada.
- [ ] Validar autorização negativa: usuário A não pode ler/mutar corrida, chat, PIN, localização ou evidência do usuário B fora dos contratos públicos deliberados.

## Hardcodes permitidos vs. proibidos

Constantes matemáticas ou de apresentação estáveis (por exemplo raio médio da Terra para Haversine ou labels de status) não são regras comerciais e podem existir localmente.

São proibidos no runtime de mobilidade: tarifa base, preço/km, preço mínimo, raio comercial, comissão, timeout comercial, política de cancelamento, expansão territorial ou qualquer regra de negócio que já possua SSOT/configuração/backend autoritativo.

## Critério de lançamento

Não declarar mobilidade pronta apenas porque a UI funciona. O módulo só passa para `launch-ready` quando os itens acima estiverem fechados e os gates automatizados tiverem sido executados contra o mesmo SHA que será publicado.
