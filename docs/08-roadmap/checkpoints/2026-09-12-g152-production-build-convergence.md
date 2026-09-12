# G152 — Production Build Convergence

Data: 2026-09-12
Status: **SOURCE-PARTIAL / BUILD-PENDING**

## Objetivo

Convergir o source atual de `main` com o compilador de produção depois da consolidação de Mobilidade G151, sem restaurar facades/compatibilidades removidas, sem mascarar divergências de contrato com casts amplos e sem manter documentação/tooling que ainda reconheça owners aposentados como válidos.

## Evidência que abriu o gate

O último build de produção que chegou ao TypeScript mostrou erros reais de integração além das falhas de runner do GitHub Actions. Parte daqueles erros já não correspondia ao source atual, portanto este checkpoint separa explicitamente:

- erro ainda reproduzível no código atual;
- erro já corrigido por commits posteriores;
- gate externo ainda não executável por indisponibilidade de provider.

## Correções aplicadas — convergência de build

- remove o export órfão `updateDriverData` do barrel de Mobilidade; a mutation já havia sido aposentada;
- deriva `RideRequest.status` da state machine canônica e mantém apenas aliases históricos explicitamente read-compatible; isso inclui `failed_delivery` sem duplicar a autoridade de lifecycle;
- estreita `requestId` do cliente de IA em boundary próprio, eliminando `unknown -> string` sem cast inseguro;
- mantém o escaping HTML do email compatível com o target TypeScript atual sem exigir `String.prototype.replaceAll`;
- torna a projeção order/delivery um literal estático interpretável pelo type parser do Supabase e remove casts de resposta desnecessários;
- cria lifecycle específico de `fraud_alerts` e deixa o painel administrativo de depender incorretamente do `ALERT_STATUS` genérico.

## Correções aplicadas — retirada de legado/hardcodes/owners aposentados

- `MotoboyAuthorizationService` deixou de importar o `MobilityService.impl.ts`, removido em G151, e agora consome diretamente `MobilityRuntimeService`;
- o resíduo privado `resolvePlanTierByBusinessIds()` foi removido após prova de zero callers; autorização de plano permanece exclusivamente no `EntitlementResolver`;
- `ProfessionalService.clearCache()` foi removido: era no-op sem callers; `updateProfessionalStatus()` passou a herdar o tipo do owner real de mutation em vez de aceitar `string` arbitrário;
- `tools/architecture/check-ssot-compliance.ts` deixou de aceitar `MobilityService.impl.ts` como owner válido e passou a proteger também `ride_requests`;
- o hook Husky de SSOT aponta para o registry canônico atual, não para documentação antiga;
- `docs/architecture/SSOT_REGISTRY.md` e `tools/architecture/architecture-registry.ts` foram reconciliados com os owners reais em `src/core/mobility`;
- `docs/01-product/STATUS.md` foi reduzido a tombstone curto; o antigo snapshot substituído não participa mais da autoridade operacional e seu histórico permanece no Git/arquivo histórico;
- Vercel ignore, testes de release, scanners de segurança, policy de `service_role` e workflow SSOT deixaram de classificar/consultar `.kiro` como artefato ativo;
- a árvore histórica `.kiro` foi preparada para remoção física depois da retirada dessas dependências ativas; referências históricas em `docs/10-archive` e entradas necessárias de `.gitleaksignore` não são tratadas como runtime authority.

## Commits principais desta convergência

- `424c63a4a704959402d4649d0b8bedf100b79d24` — remover export órfão `updateDriverData`;
- `21ac575cea82a76044786e41b310bb93b91f3e2e` — derivar status da corrida da state machine;
- `edd912e8cb4c903dae17bf8394c06f4c9bb25c66` — narrowing seguro de `requestId` da IA;
- `1e48f718c1e7c40935a36e5ec53357c374859669` — compatibilidade do escaping de email com o target de build;
- `18871e82502334b94840a85970f09917974a7545` — projeção tipada do vínculo pedido/entrega;
- `db93a53b3b425a35ef984bddc1af542b09fc3b08` — SSOT de status de fraude;
- `00ec43a1cdbadf437c26a84a30b79e60a1487071` — painel usando lifecycle específico de fraude;
- `a82d07a1790ae5f8bc31d1c5103f6a84dcc66e43` — retirar dependência runtime do compatibility service removido;
- `ee87a1079135a22967ed725d0ab158f87a03d6e0` — retirar resíduo de plan-tier sem callers;
- `4d5970f8a4412c1b63265b9283e3431e9acfa1cf` — retirar API de cache no-op e estreitar contrato profissional;
- `1a08d1cf12e182728ed50da3f2e1f266851573a3` — corrigir checker SSOT e owners de Mobilidade;
- `bafcbb13f32fb484291dbb8cf85203c50566d9ef` — apontar hook SSOT ao registry canônico;
- `fe5e942bc8a006ca7052c08bb9cb930e86cd1627` — reconciliar SSOT Registry documental;
- `b5b4060ad87a1af706b511200b1333de50859ccc` — reconciliar registry executável de arquitetura;
- `8c46b5bf3bc3edf81212d0a8fcd490e471a8991c` — aposentar snapshot ativo de STATUS;
- `def14f49059874e8a433c299f5dd96e4a9c6fd3a` — retirar classificação `.kiro` do release ignore;
- `6bfd46de226041b6b8af746b7e6cd7f518c76c18` — retirar fixture `.kiro` do teste de release;
- `2365bbca713728af4d4ee68fe39e2c9224ed9a2a` — retirar `.kiro` do boundary scanner;
- `f533b91af00be1855b41b9c362b8090bc982672f` — retirar guidance `.kiro` do workflow SSOT;
- `9684cd514555eb23e7a98741c0d53f8d483b6eae` — retirar `.kiro` do scanner global de segurança;
- `2f3a5b98de40c80d1a7bd5620cbdd4255fd58798` — retirar exceção `.kiro` da policy de service-role.

## Pendências reais atuais

1. **Contrato Supabase gerado:** `OperationalTrustCommandService` já usa o contrato G73 (`p_subject_role`), mas `types.generated.ts` ainda representa a assinatura anterior. O arquivo gerado não deve ser editado manualmente; precisa ser regenerado a partir do banco.
2. **Provider Supabase indisponível para esse gate:** tentativas de gerar tipos e consultar catálogo continuam retornando timeout/Gateway Timeout; portanto o drift não pode ser certificado nem fechado artificialmente.
3. **GitHub Actions sem execução real:** jobs recentes encerram com `steps: []` e `runner_id: 0`; suite/ratchets/E2E ainda não possuem execução confiável no HEAD.
4. **Build Vercel same-SHA:** ainda não existe prova de build de produção verde para o HEAD desta convergência. Logs antigos não devem ser usados como lista de erros atual sem confronto com o source.
5. **Certificação operacional:** segurança/ratchets, E2E de passageiro/motorista/motoboy, smoke responsivo e deploy same-SHA precisam executar e passar.
6. **Launch gate:** Mobilidade permanece `PUBLIC_LAUNCH_SURFACES.mobility=false` até todos os gates acima fecharem.

## Pendências removidas desta lista por já estarem corrigidas

- referência de `MotoboyAuthorizationService` a `MobilityService.impl.ts` — **RESOLVIDA**;
- coerção `AdminMobilityRealtimeOnlineDriverRow[] -> RawRecord[]` do log Vercel antigo — **não existe mais no source atual**; o read owner atual é `AdminDriverPresenceReadService`;
- `ProfessionalService.updateProfessionalStatus(string)` — **RESOLVIDA** com contrato derivado do owner real;
- documentação/guardrails que aceitavam owners de Mobilidade já removidos — **RESOLVIDOS** nos registries/checkers ativos.

## Regra de saída

G152 só vira **CLOSED** quando:

- TypeScript/build de produção estiver verde no HEAD;
- tipos Supabase estiverem regenerados e coerentes com as migrations aplicadas;
- testes de segurança/ratchets e E2E executarem de verdade e passarem;
- deploy de produção comprovar o mesmo SHA validado;
- somente depois disso for reavaliado o launch gate de Mobilidade.
