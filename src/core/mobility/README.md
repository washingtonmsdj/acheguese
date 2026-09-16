# Mobilidade — contrato canônico de runtime

> Estado auditado em 2026-09-16. `docs/10-archive/**` é histórico e não é contrato de implementação.

## SSOT e fronteiras

- Ciclo operacional de corridas/entregas: `src/core/mobility/core/**` + comandos server-owned.
- Criação: `MobilityCreationService` → `mobility-create-rpc` → quote server-owned single-use.
- `mobility-rpc` é broker operacional de dispatch, presença e transições; não é owner de criação.
- Entrega comercial: `OrderDeliverySSOTService` + `DeliveryRpcService`.
- Preço transacional: `MobilityPriceQuoteService` → `mobility-pricing-rpc` → `mobility_price_quotes`.
- `PricingService` é somente repositório administrativo/leitura de regras persistidas; não calcula tarifa de corrida.
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
- `mobility_create_ride_atomic` e `mobility_create_delivery_atomic` usam assinatura canônica baseada em `p_quote_id`.
- Quote persiste passageiro, rota/território, coordenadas, regra/versão e valor e é consumida uma única vez.
- `useMobilidade` e `useDelivery` emitem quote pelo owner server-owned antes da criação.
- Todas as regras existentes no ambiente auditado estão `commercial_status=provisional`.
- Em produção, `src/core/pricing/instance.ts` rejeita regra que não esteja `commercial_status=approved`.
- `PricingService` não contém mais `calculateEstimate`, `calculateQuickEstimate`, `getFallbackRule`, velocidade média fictícia nem janelas/multiplicadores de pico hardcoded.
- Hooks client-side `usePriceEstimate/useQuickPriceEstimate` foram aposentados.
- O raw `PricingService` não é exportado por barrels públicos; aplicação usa a instância canônica.
- `tests/architecture/pricing-instance-ssot.test.ts` e `mobility-pricing-facade-ssot.test.ts` impedem reintrodução do motor local.

### Broker operacional

- `createRide/createDelivery`, `handleCreateRide`, `handleCreateDelivery`, `rideCreationRpcParams`, piso local de R$ 5 e parsing/serialização de `finalPrice` foram removidos de `supabase/functions/mobility-rpc/index.ts`.
- `tests/architecture/mobility-rpc-boundary.test.ts` trava criação exclusivamente em `mobility-create-rpc` e proíbe `finalPrice` no broker operacional.
- **Produção está em `mobility-rpc` v32 ACTIVE, com `verify_jwt=true`.** O bundle implantado foi relido após o cutover e confirma ausência dos caminhos legados de criação/`finalPrice`, preservando MFA administrativo, dispatch, transições, presença/localização e rate-limit compartilhado fail-closed.
- O parâmetro SQL `p_final_price` continua somente como compatibilidade de assinatura enquanto o canal PostgreSQL administrativo está indisponível; o broker não o envia e o backend não aceita preço terminal do cliente como autoridade.

### Reputação, histórico, PII e segurança

- Passageiro sem avaliações aparece como `Sem avaliações`; defaults artificiais `5.0` foram removidos.
- `driver_data.rating` e `driver_profiles.rating` não nascem mais com nota perfeita artificial.
- `ensure_admin_driver_data` foi aposentado e o orphan `driver_data` não-driver auditado foi removido.
- Corridas canceladas permanecem no histórico; `cancellation_reason` é snapshot de suporte e `ride_state_audit` é a trilha imutável.
- `ride_state_audit` e `emergency_delivery_log` estão default-deny com RLS e sem DML de browser; `20260916120500_lock_mobility_audit_default_deny.sql` e `mobility_audit_default_deny_spec.sql` travam o contrato.
- PIN/refresh, chat, rating, trust feedback, ride report e funções safety inspecionadas fazem checagens internas de sessão, ownership/participação/admin e limites de payload.
- `get_shared_ride_safety_data` só retorna share ativo, não expirado e corrida não-terminal; terminal revoga share.
- Histórico terminal do motorista usa read model redigido (`DriverRideHistoryReadService`) em vez de carregar PII completa da corrida.
- `RideRequestReadModel` comum não inclui telefone/nome de destinatário, notas, prova de entrega, metadata de falha ou descrição do pacote.
- `useActiveRide` resolve o Profile ID ativo e consulta somente estados abertos, sem carregar histórico terminal para achar a corrida atual.
- `useMobilidade` mantém seu `queryFn` sem `setState`; a reconciliação de `activeRide` ocorre em `useEffect`.
- O diagnóstico de schema Motoboy usa `HEAD` para validar colunas sensíveis sem materializar PII real.
- `MotoboyDeliveryActions` só renderiza PII entre `driver_accepted` e `in_delivery`; pré-aceite e estados terminais retornam `null`.
- G137/G138/G140/G141 travam identidade por Profile ID, read projection bounded, consulta aberta e janela operacional de PII.

### GPS e minimização

- Leitura precisa de `driver_locations` pelo passageiro só ocorre nos estados live autorizados após aceite e termina fora desse ciclo.
- `20260916133000_minimize_idle_driver_gps.sql` está versionada para limpar `driver_availability.current_lat/current_lng` e `driver_locations` quando o motorista fica offline/indisponível sem corrida, e para rejeitar novos snapshots fora de `available || active_ride`.
- Essa migration **ainda não foi aplicada em produção** porque a conexão administrativa PostgreSQL está retornando `Connection terminated due to connection timeout`.

## Bloqueadores antes de launch-ready

- [ ] **Definir e aprovar a política comercial real por modalidade.** Até lá, pricing live continua fail-closed.
- [ ] Remover da assinatura SQL o parâmetro de compatibilidade `p_final_price` quando o canal PostgreSQL administrativo voltar.
- [ ] Aplicar/verificar `20260916133000_minimize_idle_driver_gps.sql` assim que a conexão PostgreSQL administrativa voltar.
- [ ] Executar o probe negativo rollback-only entre usuários distintos para PIN/trust/report; ele está versionado, mas a execução foi interrompida pelo mesmo timeout do Postgres.
- [ ] Regenerar tipos Supabase a partir do schema real; não editar generated types manualmente.
- [ ] Executar typecheck, lint, testes de mobilidade/pricing, build e E2E no mesmo SHA.
- [ ] Provar concorrência/idempotência: dupla aceitação, cancelamento simultâneo, retry de RPC, reconnect realtime, quote duplicada e confirmação duplicada.
- [ ] Obter pipeline de deploy verde. O status Vercel atual falha por `build-rate-limit`, que é blocker externo e não prova erro de source.

## Hardcodes permitidos vs. proibidos

Constantes matemáticas/de apresentação estáveis podem existir localmente. São proibidos como autoridade de runtime: tarifa base, preço/km, preço mínimo, multiplicador/janela comercial, comissão, timeout comercial, política de cancelamento e expansão territorial.

## Critério de lançamento

`PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`. Mobilidade só passa para `launch-ready` quando os blockers acima estiverem fechados, a política comercial real estiver aprovada e os gates automatizados estiverem verdes no mesmo SHA publicado.
