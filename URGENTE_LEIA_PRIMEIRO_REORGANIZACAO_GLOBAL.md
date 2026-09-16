# URGENTE — ponteiro operacional de estabilização

> **STATUS: PONTEIRO DE COMPATIBILIDADE, NÃO SSOT.**
>
> Este arquivo preserva o nome histórico usado por workflows/agentes antigos. A autoridade operacional continua em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`; detalhes de execução desta retomada estão no checkpoint `docs/08-roadmap/checkpoints/2026-09-16-global-stabilization-priorities.md`.

## Estado reconciliado em 2026-09-16

- `main` atual: `905583fb1143aef30617655e985a57d086278bce`;
- `main` continua **sem proteção** (`protected=false`, sem required checks);
- o último deploy Vercel que executou o build (`d97c996`) falhou por três regressões TypeScript;
- o HEAD atual está 12 commits à frente desse deploy e já contém as correções dos três blockers de source:
  - widening explícito no boundary de `RideRequestReadModel`;
  - `HistoryTone` preservado em `HistoryTab`;
  - `useRideShare` novamente exportado pelo barrel canônico de Safety;
- o status Vercel do HEAD atual é `failure` por **build rate limit do provider**, portanto ainda **não existe prova de build/deploy verde do SHA atual**;
- Mobilidade permanece `PUBLIC_LAUNCH_SURFACES.mobility=false` e não pode ser habilitada antes da certificação same-SHA.

## Ordem urgente correta

### P0 — fechar release authority

1. obter execução real do pipeline/build do HEAD atual quando o provider permitir;
2. corrigir qualquer erro novo de source que aparecer — sem reduzir gates;
3. exigir deployment `READY` do mesmo SHA;
4. ativar proteção/ruleset da `main` com PR obrigatório, sem force-push/deleção e required check executável;
5. não considerar rate-limit, commit ou merge como certificação positiva.

### P1 — concluir Mobilidade antes de feature nova

1. manter autoridade de preço/criação/transição server-owned;
2. fechar migrations pendentes no Postgres administrativo quando a conexão voltar;
3. executar probes negativos IDOR/BOLA e concorrência/idempotência;
4. regenerar tipos a partir do schema real;
5. rodar typecheck/lint/testes/E2E/build/deploy no mesmo SHA;
6. somente depois avaliar habilitação pública.

### P1 — segurança transversal

1. inventariar e justificar `SECURITY DEFINER` executável por `anon`/`authenticated`;
2. ativar Leaked Password Protection;
3. tratar RLS/grants/PostGIS com menor privilégio e testes negativos;
4. normalizar policies permissivas duplicadas primeiro nas relações sensíveis.

### P1 — LGPD/privacidade

1. não implantar as funções antigas de exclusão/exportação por atalho;
2. consolidar autoridade única de account deletion;
3. implementar purge idempotente/observável;
4. revogar sessões pela autoridade real do Supabase Auth;
5. provar completude da exportação contra o schema atual.

### P2 — certificação funcional por domínio

Seguir o programa #50: Mobilidade/Central -> Business/Gastronomia/Professionals -> Comunidade -> Marketplace/Identidade -> Admin e superfícies auxiliares. Placeholder, `launch-paused`, fallback ou E2E que retorna cedo não contam como certificação.

### P3 — performance/UX/limpeza

Só depois de contratos funcionais estáveis: índices/FKs com telemetria real, RLS redundante, bundle/CSS, visual SSOT, acessibilidade, responsividade e redução de documentação/bridges temporários.

## Regras invioláveis

- projeto real + runtime + schema + testes prevalecem sobre checkpoint antigo;
- não remover feature válida para fazer build passar;
- não reduzir gate para obter verde;
- não editar tipos Supabase gerados para esconder drift;
- não introduzir writer/browser authority paralela;
- mudança persistente de schema exige migration versionada;
- mudança de contrato deve reconciliar schema + types + service + UI + testes;
- segurança sensível exige teste negativo;
- `READY` prova deploy, não certifica sozinho o fluxo funcional;
- não voltar a acumular o histórico detalhado neste arquivo: usar checkpoints do roadmap.

## Leia nesta ordem

1. `docs/README.md`;
2. `docs/03-architecture/CURRENT_RULES.md`;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
4. `docs/08-roadmap/checkpoints/2026-09-16-global-stabilization-priorities.md`;
5. `docs/08-roadmap/checkpoints/2026-09-16-mobility-authority-privacy-hardening.md`;
6. `SECURITY.md`.
