# G152 — Production Build Convergence

Data: 2026-09-12
Status: **SOURCE-PARTIAL / BUILD-PENDING**

## Objetivo

Convergir o source atual de `main` com o compilador de produção depois da consolidação de Mobilidade G151, sem restaurar facades/compatibilidades removidas e sem mascarar divergências de contrato com casts amplos.

## Evidência que abriu o gate

O último build de produção que chegou ao TypeScript mostrou erros reais de integração além das falhas de runner do GitHub Actions. Portanto o plano urgente não pode ser declarado encerrado apenas com os checkpoints source-closed anteriores.

## Correções aplicadas

- remove o export órfão `updateDriverData` do barrel de Mobilidade; a mutation já havia sido aposentada.
- deriva `RideRequest.status` da state machine canônica e mantém apenas aliases históricos explicitamente read-compatible; isso inclui `failed_delivery` sem duplicar a autoridade de lifecycle.
- estreita `requestId` do cliente de IA em boundary próprio, eliminando `unknown -> string` sem cast inseguro.
- mantém o escaping HTML do email compatível com o target TypeScript atual sem exigir `String.prototype.replaceAll`.
- torna a projeção order/delivery um literal estático interpretável pelo type parser do Supabase e remove casts de resposta desnecessários.
- cria lifecycle específico de `fraud_alerts` e deixa o painel administrativo de depender incorretamente do `ALERT_STATUS` genérico.

## Commits desta convergência

- `424c63a4a704959402d4649d0b8bedf100b79d24` — remover export órfão `updateDriverData`.
- `21ac575cea82a76044786e41b310bb93b91f3e2e` — derivar status da corrida da state machine.
- `edd912e8cb4c903dae17bf8394c06f4c9bb25c66` — narrowing seguro de `requestId` da IA.
- `1e48f718c1e7c40935a36e5ec53357c374859669` — compatibilidade do escaping de email com o target de build.
- `18871e82502334b94840a85970f09917974a7545` — projeção tipada do vínculo pedido/entrega.
- `db93a53b3b425a35ef984bddc1af542b09fc3b08` — SSOT de status de fraude.
- `00ec43a1cdbadf437c26a84a30b79e60a1487071` — painel usando lifecycle específico de fraude.

## Gates ainda abertos

1. `MotoboyAuthorizationService` ainda referencia `./MobilityService.impl`, removido fisicamente em G151; deve apontar ao owner/runtime canônico, sem recriar compatibility file.
2. `admin.queries.ts` ainda precisa eliminar a coerção de `AdminMobilityRealtimeOnlineDriverRow[]` para `RawRecord[]` e preservar o tipo factual da projeção.
3. `ProfessionalService.updateProfessionalStatus` ainda expõe `string` onde a mutation aceita apenas os estados administrativos canônicos.
4. `OperationalTrustCommandService` já usa o contrato G73 (`p_subject_role`), porém `types.generated.ts` ainda descreve a assinatura antiga do RPC. Os tipos devem ser regenerados a partir do banco; não editar o arquivo gerado manualmente para esconder drift.
5. A API do projeto Supabase está respondendo com timeout para geração de tipos e consulta de catálogo, então o gate de schema/runtime continua externo até uma leitura confiável.
6. GitHub Actions no HEAD G151 encerrou jobs sem steps/runner; é obrigatória uma execução real de suite/ratchets/E2E antes de certificação.
7. Vercel ainda não produziu build do HEAD desta convergência; o último build observado corresponde a um commit anterior deste lote.
8. Mobilidade permanece fora do lançamento público até build, autorização real, E2E e deploy same-SHA fecharem. Nenhum flag de launch deve ser aberto antes disso.

## Regra de saída

G152 só vira **CLOSED** quando:

- TypeScript/build de produção estiver verde no HEAD;
- tipos Supabase estiverem regenerados e coerentes com as migrations aplicadas;
- testes de segurança/ratchets e E2E executarem de verdade e passarem;
- deploy de produção comprovar o mesmo SHA validado;
- somente depois disso for reavaliado o launch gate de Mobilidade.
