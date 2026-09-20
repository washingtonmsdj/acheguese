# GitHub branch hygiene — 2026-09-20

Status: **AUDITADO / LIMPEZA FÍSICA PENDENTE DE AUTORIDADE DELETE REF**

Base auditada: `main@cbc6271a5761d96ba679d4e7d56eda0052edbe51`.

## Resultado da auditoria

O repositório possui **153 branches remotas** no corte auditado.

Classificação fail-closed:

- **74 branches**: o SHA atual da branch é exatamente o SHA de head de um PR já mergeado;
- **3 branches**: não possuem PR mergeado correspondente, mas o compare contra `main` retorna `ahead_by=0`, portanto todo o conteúdo já está contido na base;
- **72 branches**: possuem commits exclusivos e ficam preservadas;
- **2 branches alteradas depois de merge**: ainda possuem delta exclusivo e ficam preservadas;
- `main`: sempre preservada;
- `work/mvp-urgent`: preservada deliberadamente como única branch operacional reutilizável.

**Candidatas seguras à exclusão física: 77.**
**Branches preservadas: 76.**

As três branches seguras por contenção direta são:

- `cleanup/maps-governance-docs-20260918`;
- `fix/mvp-jobs-business-canonical-route`;
- `fix/mvp-paused-cost-backend-gates-20260919`.

As duas branches pós-merge com delta exclusivo que **não** devem ser apagadas neste corte são:

- `cleanup/active-compat-facades-20260919`;
- `codex/identidade-visual-achegue-se`.

## Ferramenta canônica

Foi adicionado:

`tools/github/cleanup-merged-branches.mjs`

Comando:

```bash
npm run maintenance:branches
```

O comportamento padrão é **dry-run**. Nenhuma ref é removida sem `--apply`.

Saída estruturada:

```bash
npm run maintenance:branches -- --json
```

Aplicação real:

```bash
npm run maintenance:branches -- --apply
```

Requer `GH_TOKEN` ou `GITHUB_TOKEN` com permissão para ler o repositório e deletar refs Git.

## Regras de segurança

A ferramenta preserva automaticamente:

1. `main` e `work/mvp-urgent`;
2. branch marcada como protegida;
3. branch que seja head de PR aberto;
4. branch cujo SHA mudou após a auditoria;
5. branch que deixe de estar contida na `main` antes do DELETE;
6. qualquer branch que ainda possua commits exclusivos.

Uma branch só entra como candidata quando:

- o SHA atual é exatamente o head de um PR já mergeado no mesmo repositório; **ou**
- o compare contra a base retorna `ahead_by=0`.

Antes de cada DELETE a ferramenta relê a branch e revalida SHA, proteção e PR aberto. Para candidatas classificadas por contenção, o compare é executado novamente imediatamente antes da exclusão.

## Limitação da integração atual

A conexão GitHub disponível nesta conversa não expõe `DELETE /git/refs/...` nem alteração administrativa de `delete_branch_on_merge`. Por isso **nenhuma branch foi mascarada movendo ref para `main`**.

A limpeza física deve ser executada somente com uma autoridade GitHub que tenha delete-ref. O utilitário foi preparado exatamente para tornar essa execução reproduzível, auditável e fail-closed.

## Ratchet

`tests/scripts/github-branch-cleanup.test.ts` valida que:

- base/branch reutilizável são preservadas;
- proteção tem precedência;
- PR aberto tem precedência;
- SHA mergeado exato pode ser limpo;
- branch totalmente contida na base pode ser limpa;
- qualquer commit exclusivo preserva a branch.

## Follow-up — 2026-09-20

- PR #238 consolidou `work/mvp-urgent` na `main` como `ce55b23fa3aa7c4d4fd68e56cea2944277e4e230`, removendo o fixture visual conceitual da Comunidade do runtime público.
- após o squash, `work/mvp-urgent` foi realinhada exatamente a `main@ce55b23f...`, permanecendo como branch operacional reutilizável e sem delta próprio.
- `cleanup/active-compat-facades-20260919` foi reauditada caminho a caminho: 12 dos 14 caminhos do delta já estão idênticos à `main` ou removidos nela; as duas diferenças restantes estão em `TouristPointDetailPage.tsx` e `TouristPointsPage.tsx`.
- essas duas diferenças residuais são **superseded e não devem ser integradas**: reintroduziriam a camada antiga `NearbyPlacesBlock` e o modo/placeholder `Ao redor`, enquanto a `main` atual mantém Pontos Turísticos item-first, sem placeholder contado como capability real.
- portanto essa branch deixa de ser candidata a merge. A exclusão física continua pendente de autoridade delete-ref; não mover/reforçar a ref artificialmente apenas para mascarar a limpeza.
- `codex/identidade-visual-achegue-se` continua preservada: é uma branch muito antiga/divergente com um grande lote conceitual exclusivo; não deve ser misturada ao corte urgente do MVP sem auditoria própria pós-MVP.

## Reauditoria das branches sem PR — 2026-09-20

Cruzamento do inventário remoto atual com os PRs fechados:

- **153 branches remotas** no total;
- `main` + `work/mvp-urgent`: 2 branches deliberadamente preservadas;
- **76 branches** restantes têm pelo menos um PR já mergeado;
- **54 branches** têm somente PR(s) fechado(s) sem merge;
- **21 branches** não possuem PR associado conhecido.

As **21 branches sem PR** ficam classificadas assim:

### Contidas na `main` e seguras para remoção física

- `cleanup/maps-governance-docs-20260918`;
- `fix/mvp-jobs-business-canonical-route`;
- `fix/mvp-paused-cost-backend-gates-20260919`.

Essas três já haviam sido provadas por compare com `ahead_by=0`.

### Superseded / não reintegrar

- `agent/ci-vercel-remote-migration-drift-gate`: substituída pelos validadores canônicos atuais e pela convergência remota fechada no PR #231;
- `agent/probe-private-classified-command-grants-final`;
- `agent/probe-private-classified-command-grants-test`;
- `agent/probe-private-classified-command-grants-test-v2`: probes temporários; a migration final `20260820025810_restrict_private_classified_command_grants.sql` já está na `main`;
- `agent/security-analytics-authority`: a migration de authority já está byte a byte na `main` e a reconciliação posterior entrou pelo PR #35;
- `agent/security-audit-ip-normalization`: precursor substituído pela normalização v2 mergeada no PR #38;
- `agent/security-auth-session-revocation`: o contrato útil de revogação foi absorvido pelo `session-rpc` atual e pelo ratchet `session-rpc-auth-authority-security.test.ts`, que cobre Supabase Auth e adiciona requirements posteriores;
- `agent/security-header-drift-guard`: contrato antigo de paths; a `main` usa os owners canônicos `src/shared/config/security.config.ts` e `tools/security/security-header-drift-contract.json`;
- `agent/security-nominatim-runtime-parity`: source do Edge é idêntico ao atual na `main`;
- `agent/security-push-config-runtime-parity`: a `main` contém uma versão posterior do Edge/contrato;
- `agent/web-seo-sitemap-build`: substituída pela decisão D-017 e pelo pipeline canônico `generate:sitemap -> validate-production-sitemap -> build -> validate dist`;
- `codex/ci-heavy-certification`: substituída pelo workflow corrente `certify-heavy-pr-auto.yml`, exact-SHA e com gates mais amplos;
- `security/lgpd-purge-classification-20260919`: substituída pela branch rebased mergeada; o `LGPD_PURGE_MATRIX.json` atual é byte a byte o da versão rebased.

Essas 13 branches **não são fonte de trabalho pendente**. Devem ser apagadas somente por delete-ref real quando a autoridade estiver disponível; não fazer merge nem mover ref para `main`.

### Quarentena / preservar até auditoria específica

- `codex/reformulacao-entrada-comunidade`: trabalho recente e amplo de design/runtime; não misturar com limpeza de branches nem com o corte urgente sem revisão própria;
- `module/mobilidade`.

`module/mobilidade-g62-work` e `tmp-should-not-create` saíram da quarentena após prova de ancestralidade linear: `tmp-should-not-create` é ancestral direto de `module/mobilidade-g62-work` (5 commits adiante / 0 atrás) e `module/mobilidade-g62-work` é ancestral direto de `module/mobilidade` (122 commits adiante / 0 atrás). Logo, a linha `module/mobilidade` preserva integralmente o trabalho dessas duas snapshots antigas.

`tmp-probe-unused` também saiu da quarentena após auditoria de conteúdo: as migrations G73/G74 do head são byte a byte iguais às cópias canônicas preservadas em `docs/09-reference/migrations-pending/`; vários arquivos de runtime já são idênticos à `main`; e a `main` mantém o ratchet `MobilityDriverPrivateReadModelsG73G74.test.ts`, que cobre os handlers atuais de histórico/ganhos privados e o contrato de feedback G73. Portanto a branch temporária não é fonte única de trabalho pendente.

`module/mobilidade` permanece como a única linha histórica de Mobilidade em quarentena. Como Mobilidade está fora do primeiro release, **não deve ser mergeada na `main` do MVP**; fica preservada como material de auditoria pós-MVP até seleção explícita de trabalho.

### Execução das branches superseded auditadas

`tools/github/branch-cleanup-superseded.json` fixa por nome + SHA as branches explicitamente auditadas como superseded.

- o comportamento padrão de `npm run maintenance:branches` **não mudou**;
- `--include-superseded` é opt-in e só torna elegível um head cujo SHA atual seja exatamente o SHA pinado na manifest;
- proteção de branch, PR aberto e mudança de SHA continuam tendo precedência e bloqueiam a exclusão;
- dry-run auditável: `npm run maintenance:branches -- --include-superseded --json`;
- aplicação física, somente com autoridade delete-ref: `npm run maintenance:branches -- --include-superseded --apply`.

A manifest contém **59 heads auditados**: as 13 branches sem PR já classificadas como superseded, 31 branches antigas de PR fechado cujo sucessor `rebased`, `v2` ou equivalente foi efetivamente mergeado, 3 snapshots/probes antigos de Mobilidade já comprovadamente redundantes, 6 branches temporárias antigas de certificação/recovery/ops e 6 precursores fechados/superseded adicionais de sitemap, facades, ProfileMembersManager e tipos Supabase. Branches ainda em quarentena não entram na manifest.

### Segundo lote — PR fechado substituído por sucessor mergeado

Foram adicionadas **31 branches** à manifest somente quando o histórico mostra uma linha sucessora inequívoca já mergeada (por exemplo `rebased`, `v2` ou a mesma correção consolidada na `main`).

Exemplos de pares comprovados: `cleanup/driver-history-dead-selector-20260918` -> PR #187, `cleanup/retire-billing-plan-facade-20260918` -> PR #190, `fix/admin-rollout-broker-20260918` -> PR #159, `security/bound-business-operation-config-columns-20260918` -> PR #158, `agent/reconcile-edge-admin-canary-deploy-guard` -> PR #58 e `agent/revoke-residual-anon-private-admin-helpers` -> PR #72.

Não entraram neste lote branches de Mobilidade, report/RPC sem sucessor inequívoco, LGPD operacional ainda sensível, recovery/ops temporário sem auditoria de conteúdo ou qualquer branch cujo destino ainda dependa de decisão funcional.

### Terceiro lote — certificação, recovery e ops temporários

Foram auditadas seis branches antigas de 2026-08-18/19 e todas foram classificadas como **superseded / não reintegrar**:

- `agent/ci-security-gate-recovery`: workflow diagnóstico self-hosted temporário; a `main` atual mantém `Security Check`, `Security Scan` e `Heavy PR Certification (Auto)` com proveniência exact-SHA e gates mantidos;
- `cert/production-auth-694b4f9`: certificação one-shot de logout em produção presa ao SHA antigo `694b4f9`; substituída pelo workflow de certificação pesada atual, que inclui logout autenticado e cobertura mais ampla;
- `cert/recovery-4.6-934f9df`: harness temporário de snapshot da Fase 4.6 preso ao candidato `934f9df`; a governança atual trata freshness de recovery como requisito explícito e bloqueia snapshot stale;
- `handoff/4.6h-final`: snapshot de handoff histórico e ancestral direto das duas linhas de recovery subsequentes, sem trabalho exclusivo que justifique manter o head;
- `ops/enable-hibp-20260818`: workflow one-shot para ativar HIBP nativo; a governança atual registra corretamente que o controle nativo está indisponível no plano Free e usa `tools/security/supabase-auth-hibp.mjs` como caminho canônico de check/apply quando houver suporte de provider/plano;
- `ops/recovery-refresh-20260818`: workflow/script temporário de captura preso ao estado de agosto e a um alvo local de Drive; foi substituído pela governança e validação atuais de recovery, que não aceitam evidência stale como prova de release.

Nenhuma dessas branches contém código de produto que deva voltar para o MVP. Todas entram na manifest apenas com **SHA pinado**, mantendo as mesmas proteções de branch protegida, PR aberto e mudança de head antes de qualquer delete-ref real.

### Quarto lote — precursores fechados com sucessor canônico

Foram classificados mais seis heads como **superseded / não reintegrar**:

- `agent/web-sitemap-build-contract`: precursor fechado sem merge; substituído pela linha SEO posterior e pela decisão D-017 com pipeline canônico `generate:sitemap -> validate-production-sitemap -> build -> validate dist`;
- `cleanup/active-compat-facades-20260919`: a auditoria já registrada provou que 12/14 caminhos estão absorvidos e os dois resíduos de Guide reintroduziriam UI placeholder/legada; agora essa conclusão também está refletida na manifest executável;
- `cleanup/final-compatibility-bridges-20260918`: tentativa anterior de aposentadoria de facades, substituída pela linha consolidada mergeada no PR #176;
- `cleanup/retire-live-compatibility-facades-20260918`: tentativa ainda mais antiga da mesma frente, também substituída pela consolidação posterior e pelos ratchets atuais;
- `cleanup/remove-stale-phase-comments-20260918`: precursor da consolidação de `ProfileMembersManager`; sucessor canônico mergeado no PR #171;
- `sync/supabase-types-canonical-20260918`: sync de tipos fechado sem merge; substituído pelo writer via PR do PR #153 e pelo sync live mergeado no PR #168.

Esse lote reduz branches fechadas sem merge que ainda apareciam como trabalho potencial, sem apagar nenhuma linha funcional única. Todas continuam protegidas por SHA pinado e revalidação antes de delete-ref.

## Próximo passo

Executar primeiro o dry-run com credencial administrativa, conferir que a contagem continua coerente e somente então usar `--apply`.

Depois da limpeza, habilitar `delete_branch_on_merge` no repositório quando a autoridade administrativa estiver disponível, para impedir novo acúmulo.
