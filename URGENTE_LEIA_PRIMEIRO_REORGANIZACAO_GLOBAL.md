# URGENTE — ponteiro operacional de estabilização

> **STATUS: PONTEIRO DE COMPATIBILIDADE, NÃO SSOT.**
>
> Este arquivo preserva o nome histórico usado por workflows/agentes antigos. A autoridade operacional continua em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`; o estado detalhado e verificável desta retomada está em `docs/08-roadmap/checkpoints/2026-09-16-global-stabilization-priorities.md`.

## Estado atual resumido

- `main` tem branch protection parcial desde 2026-09-17: `protected=true`, admins sujeitos às regras, force-push/deleção bloqueados e resolução de conversas exigida. PR obrigatório, checks e restrição de push ainda estão ausentes porque `Supabase Types Sync` escreve diretamente em `main` (issue #28);
- houve build/deploy real `READY` no mesmo SHA em `a30b7c7...`, mas commits posteriores não herdam essa certificação; qualquer HEAD final precisa repetir o gate real;
- Mobility continua pública **desabilitada** e já possui GPS minimizado, autorização negativa, preço terminal server-owned, replays sequenciais e contrato estrutural de atomicidade provados;
- a prova runtime de concorrência em duas sessões independentes continua aberta;
- drift de `types.generated.ts` continua aberto e deve ser corrigido somente pelo fluxo canônico de geração;
- Security Advisor revalidado em 2026-09-17: 1 erro de RLS no catálogo do PostGIS, 19 tabelas RLS sem policy confirmadas como deny-by-default e 9/85 RPCs `SECURITY DEFINER` expostas a `anon`/`authenticated`; a triagem é por autoridade e contrato, sem revoke em massa;
- probe negativo de analytics comprovou bloqueio de spoof de `user_id` e de evento operacional sem `service_role`;
- LGPD account-deletion reversível está reconciliado pela migration `20260826015916_reconcile_account_deletion_authority_live_drift`;
- purge destrutivo **não existe** ainda e agora possui gate fail-closed: `LGPD_PURGE_MATRIX.json` registra 28 FKs bloqueantes, sendo 25 anuláveis e 3 obrigatórias/RESTRICT, todas ainda sem decisão de retenção;
- `user-delete-account` legado permanece bloqueado; nenhuma política comercial ou de retenção será inventada para obter verde.

## Ordem urgente correta

### P0 — release authority

1. obter execução real de typecheck/lint/security/test/build/deploy no SHA candidato final;
2. exigir Vercel `READY` no mesmo SHA; `Ignored Build Step`, `pending`, rate-limit, commit ou merge não são aprovação;
3. ativar proteção/ruleset da `main` com PR obrigatório, sem force-push/deleção e required check executável.

### P1 — Mobilidade

Restante:

1. aprovar política comercial real por modalidade;
2. regenerar tipos Supabase pelo fluxo canônico;
3. provar concorrência real em sessões independentes;
4. executar E2E/smoke + same-SHA completo;
5. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até todos os gates.

### P1 — segurança transversal

1. classificar `SECURITY DEFINER` por autoridade real e adicionar negative probes onde necessário;
2. ativar Leaked Password Protection quando houver capacidade de gestão Auth;
3. tratar RLS/grants/extensões/PostGIS por menor privilégio, sem mudanças em massa por advisor;
4. priorizar relações sensíveis antes de normalizar policies permissivas.

### P1 — LGPD/privacidade

1. classificar explicitamente as 28 FKs de `LGPD_PURGE_MATRIX.json`;
2. só depois implementar worker/scheduler de purge idempotente e observável;
3. revogar sessões pela autoridade do Supabase Auth;
4. manter `user-delete-account` legado bloqueado;
5. certificar exportação contra `LGPD_EXPORT_MATRIX` antes de rollout.

### P2 — certificação funcional

Seguir issue #50: Mobilidade/Central -> Business/Gastronomia/Professionals -> Comunidade -> Marketplace/Identidade -> Admin e superfícies auxiliares. Placeholder, `launch-paused`, fallback ou E2E que retorna cedo não contam.

### P3 — performance/UX/limpeza

Só depois de contratos funcionais estáveis: índices/FKs com telemetria real, RLS redundante, bundle/CSS, visual SSOT, acessibilidade, responsividade e redução de bridges/documentação temporária.

## Regras invioláveis

- runtime + schema + testes prevalecem sobre checkpoint antigo;
- não remover feature válida ou reduzir gate para fazer build passar;
- não editar tipos Supabase gerados para esconder drift;
- não introduzir autoridade paralela no browser;
- mudança persistente de schema exige migration versionada;
- segurança sensível exige teste negativo;
- `READY` prova deploy, não certifica sozinho o fluxo funcional;
- detalhes pertencem aos checkpoints do roadmap, não a este ponteiro.

## Leia nesta ordem

1. `docs/README.md`;
2. `docs/03-architecture/CURRENT_RULES.md`;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
4. `docs/08-roadmap/checkpoints/2026-09-16-global-stabilization-priorities.md`;
5. `docs/08-roadmap/checkpoints/2026-09-16-mobility-authority-privacy-hardening.md`;
6. `SECURITY.md`.
