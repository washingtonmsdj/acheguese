# Mobility branch retirement — 2026-09-12

## Decisão

`module/mobilidade` está **APOSENTADA COMO BRANCH DE TRABALHO** e não deve receber novos commits.

A autoridade de source para Mobilidade passa a ser exclusivamente a `main`, seguindo a governança `MAIN_ONLY` e os checkpoints incrementais. A branch histórica **não deve ser mergeada, rebaseda, resetada ou substituída em bloco** sobre a `main`.

Ela está elegível para exclusão do repositório após este checkpoint porque o conteúdo útil foi reconciliado por gates controlados e a `main` já evoluiu além do tip da branch.

## Evidência de proveniência

- tip auditado de `module/mobilidade`: `3872bd19262458b4bb979550337594a7aa745a29`
  - mensagem: `test(mobility): lock privacy safety ratchet G79`
- tip auditado de `module/mobilidade-g62-work`: `8ba5ae2d84be5b3e0d9efa51fdcf5cb2f5fbe5c1`
- `module/mobilidade-g62-work` é ancestral direto de `module/mobilidade`:
  - `module/mobilidade` está 122 commits à frente;
  - 0 commits atrás;
  - portanto a branch `g62-work` não contém trabalho que não exista em `module/mobilidade`.
- comparação Git bruta entre `module/mobilidade` e a `main` auditada mostrou divergência histórica (`main` 286 commits à frente e a branch 223 commits exclusivos por ancestry). Isso **não autoriza merge bruto**: os gates foram reconciliados na `main` por commits diferentes e em ordem controlada.

## Prova de absorção semântica na `main`

A `main` contém os gates que compõem e supersedem o trabalho útil da branch histórica:

- G62 — `27ed63526594efb228bbd03a1a568d0e531115a4` — canonical ride status writes;
- G63 — `9e87d71da8e45fb096da4e330362f54d65b1e604` — legacy ride status provenance;
- G64 — `d4ea44042f3503e218c8e24082e2401c9891d6f5` — single lifecycle authority;
- G65 — `07b25b3d1ae00411c4191248b4ada5cfd6adbeda` — passenger ride view policy;
- G66 — `d31b954f630768dab888be2101cd9e9d07120ee0` — live tracking synchronization/privacy;
- G67 — `f871c4022903fd0042c01487b7b81e1f2df2dee3` — secure boarding progression;
- G68 — `364f2cd9f512bb030b783656723c365bede354e4` — precise driver tracking scoped to active rides;
- G69 — `4ce44ffdffde51576cc44eee832963296aa34ba3` — fail-closed delivery verification;
- G55–G70 reconciled closure — `49120dd4bfd79e3a17eb709ac89cd1c44920400a`;
- G71/G72/G75–G80 — `c889ec753cbca8f80b40411dbdb0a1c4d9fe8c40` — durable emergency delivery chain;
- G73/G74 — `55a96d671decb7ba58c726331a1c652866dae96b` — private driver read models;
- G81 — `d236a4c44f942bba1882b5a55f6e23a23b69c2de` — receiver-confirmed failed-delivery handoff;
- G82 — integrated and closed through the `a8bd8e8c9a8012c2a73247b9029ca68a3789d3ea` checkpoint lineage;
- G83 — driver availability/presence SSOT integrated in `main`; runtime DDL closure remains separately gated by Supabase connectivity;
- G84 — admin privilege + canonical MFA/AAL2 authority integrated in `main`; exact-source deploy provenance remains a separate runtime gate.

O tip da branch histórica termina em G79. A `main` portanto contém o equivalente reconciliado de G62–G79 e já avança por G80–G84.

## Prova de evolução estrutural

A árvore atual da `main` é deliberadamente diferente e mais nova que `module/mobilidade`. Exemplo: a branch histórica ainda contém `DriverPresenceService.ts`; a `main` aposentou esse serviço e usa `DriverActivityStatsService.ts` + `driver_availability` como autoridade operacional. Reintroduzir a branch por merge bruto restauraria autoridade obsoleta e poderia regredir G83/G84.

## Pull requests

Na auditoria de 2026-09-12 não havia PR aberto com `module/mobilidade` como head.

## Política após aposentadoria

1. Não escrever mais em `module/mobilidade` nem em `module/mobilidade-g62-work`.
2. Não usar essas branches como base de novas features, hotfixes ou integrações.
3. Toda continuidade de Mobilidade ocorre diretamente na `main`, com gates/checkpoints pequenos e rastreáveis.
4. O histórico necessário permanece nos commits e checkpoints mesmo após a exclusão dos refs de branch.
5. A exclusão física dos refs é uma operação de higiene do Git e não altera o conteúdo consolidado da `main`.

## Estado separado de runtime

A aposentadoria da branch é uma decisão de **source control**. Ela não muda os gates de runtime ainda abertos:

- `PUBLIC_LAUNCH_SURFACES.mobility=false` permanece;
- G83 DDL permanece bloqueado enquanto o banco Supabase estiver indisponível para preflight;
- exact-source deploy de `mobility-rpc` continua dependente do runner de produção;
- build/E2E/security não devem ser declarados verdes sem execução correspondente.
