# Mobilidade — contrato canônico de runtime

> Estado auditado em 2026-09-16. `docs/10-archive/**` é histórico e não é contrato de implementação.

## SSOT e fronteiras

- Ciclo operacional de corridas/entregas: `src/core/mobility/core/**` + comandos server-owned.
- Criação: `MobilityCreationService` → `mobility-create-rpc` → quote server-owned single-use.
- `mobility-rpc` é broker operacional de dispatch, presença e transições; não é owner de criação.
- Entrega comercial: `OrderDeliverySSOTService` + `DeliveryRpcService`.
- Preço transacional: `MobilityPriceQuoteService` → `mobility-pricing-rpc` → `mobility_price_quotes`.
- `PricingService` é repositório administrativo/leitura de regras persistidas; não calcula tarifa de corrida.
- Geolocalização usa o SSOT compartilhado; mobilidade não possui GPS/cache/permissões paralelos.
- UI/hooks nunca são autoridade de transição, ator, preço final ou custódia.

**Os valores atuais de `pricing_rules` são provisórios/fictícios de desenvolvimento e NÃO representam política comercial aprovada do Achegue-se.**

## Regras obrigatórias

1. Transições críticas precisam de autorização/validação server-side.
2. Browser não é autoridade de preço; criação usa quote server-owned, versionada e single-use.
3. Falha de pricing/quote é fail-closed. Não existe fallback monetário local.
4. Valores provisórios nunca tornam mobilidade pronta para lançamento.
5. Auth User ID e Profile ID não são intercambiáveis.
6. Motorista/motoboy precisa de ownership, atribuição e capacidade validados no backend.
7. Tracking preciso só existe durante necessidade operacional concreta.
8. Audit logs sensíveis podem permanecer sem policy de browser quando o contrato é default-deny intencional.
9. `SECURITY DEFINER` precisa validar ator/ownership internamente ou ser endpoint público deliberado e estritamente limitado.
10. Sem avaliações significa sem nota; nunca nota perfeita inventada.
11. Cancelamento precisa preservar ator, timestamp e motivo conhecido sem inventar histórico ausente.
12. Conclusão de corrida/entrega não aceita preço informado pelo motorista/browser.
13. PII de entrega só pode aparecer enquanto houver necessidade operacional ativa e não pertence ao histórico terminal genérico.

## Estado já endurecido

### Criação e pricing

- `CreateRideInput` usa `priceQuoteId`; passenger/profile, territórios, coordenadas e preço não são autoridade do browser.
- `mobility_create_ride_atomic` e `mobility_create_delivery_atomic` usam assinatura baseada em `p_quote_id`.
- Quote persiste passageiro, rota/território, coordenadas, regra/versão e valor e é consumida uma única vez.
- `useMobilidade` e `useDelivery` emitem quote pelo owner server-owned antes da criação.
- Todas as regras existentes no ambiente auditado estão `commercial_status=provisional`.
- Em produção, `src/core/pricing/instance.ts` rejeita regra que não esteja `commercial_status=approved`.
- O motor monetário local e hooks client-side de estimativa foram aposentados.

### Broker operacional e preço terminal

- criação paralela e parsing/serialização de `finalPrice` foram removidos de `mobility-rpc`;
- produção auditada está em `mobility-rpc` v32 ACTIVE com `verify_jwt=true`;
- o broker atual chama `mobility_transition_delivery_state_atomic` por argumentos nomeados e não envia preço terminal;
- `20260916233125_remove_mobility_delivery_final_price_compat.sql` removeu a assinatura pública com `p_final_price`;
- a assinatura pública atual é `(uuid,text,text,text,text,jsonb,jsonb)` e EXECUTE permanece somente para `service_role`;
- preço terminal deriva de estado monetário persistido, nunca do browser/motorista;
- `tests/architecture/mobility-build-contract.test.ts` e `mobility-rpc-boundary.test.ts` travam esse contrato.

### Reputação, histórico, PII e segurança

- Passageiro sem avaliações aparece como `Sem avaliações`; defaults artificiais `5.0` foram removidos.
- `driver_data.rating` e `driver_profiles.rating` não nascem mais com nota perfeita artificial.
- Corridas canceladas permanecem no histórico com trilha de auditoria.
- `ride_state_audit` e `emergency_delivery_log` estão default-deny para browser.
- PIN/refresh, chat, rating, trust feedback, ride report e safety têm checagens internas de sessão/ownership/participação/admin.
- O negative probe remoto de PIN/trust/report foi executado rollback-only e bloqueou usuário não participante.
- Histórico terminal do motorista usa read model redigido; `RideRequestReadModel` comum não contém PII sensível de entrega.
- `useActiveRide` resolve Profile ID ativo e consulta somente estados abertos.
- `MotoboyDeliveryActions` só expõe PII durante a janela operacional autorizada.

### GPS e minimização

- leitura precisa de `driver_locations` pelo passageiro só ocorre durante estados live autorizados;
- `20260916133000_minimize_idle_driver_gps.sql` foi aplicada no projeto Supabase canônico;
- motorista offline/indisponível sem corrida não conserva `current_lat/current_lng/last_location_update`;
- snapshot correspondente em `driver_locations` é removido;
- gravação de GPS fora de necessidade operacional é rejeitada;
- verificação pós-migration encontrou `idle_availability_with_gps = 0` e `idle_driver_location_snapshots = 0`.

## Bloqueadores antes de launch-ready

- [ ] **Definir e aprovar a política comercial real por modalidade.** Até lá, pricing live continua fail-closed.
- [ ] Regenerar tipos Supabase a partir do schema real; não editar generated types manualmente.
- [ ] Provar concorrência/idempotência: dupla aceitação, cancelamento simultâneo, retry de RPC, reconnect realtime, quote duplicada e confirmação duplicada.
- [ ] Executar typecheck, lint, testes de mobilidade/pricing, build e E2E no mesmo SHA.
- [ ] Obter pipeline/deploy verde. O status Vercel está bloqueado por `build-rate-limit`, que é blocker externo e não prova erro de source.
- [ ] Proteger `main` com ruleset/required checks quando a capacidade administrativa estiver disponível.

## Hardcodes permitidos vs. proibidos

Constantes matemáticas/de apresentação estáveis podem existir localmente. São proibidos como autoridade de runtime: tarifa base, preço/km, preço mínimo, multiplicador/janela comercial, comissão, timeout comercial, política de cancelamento e expansão territorial.

## Critério de lançamento

`PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. Mobilidade só passa para `launch-ready` quando os blockers acima estiverem fechados, a política comercial real estiver aprovada e os gates automatizados estiverem verdes no mesmo SHA publicado.
