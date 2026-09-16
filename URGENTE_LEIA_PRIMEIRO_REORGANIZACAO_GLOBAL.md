# URGENTE — ponteiro operacional de estabilização

> **STATUS: PONTEIRO DE COMPATIBILIDADE, NÃO SSOT.**
>
> Este arquivo preserva o nome histórico usado por workflows/agentes antigos. A autoridade operacional continua em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`; detalhes desta retomada estão em `docs/08-roadmap/checkpoints/2026-09-16-global-stabilization-priorities.md`.

## Estado reconciliado em 2026-09-16

- `main` atual desta atualização: `8a7b92484784a4e3880e1a77ddace0f4d24a0948`;
- `main` continua **sem proteção** (`protected=false`, sem required checks);
- as três regressões TypeScript do último build executado já estão corrigidas no source e possuem ratchet de arquitetura;
- Vercel ainda não forneceu prova de build/deploy verde do SHA atual porque o status está bloqueado por **build rate limit do provider**;
- o canal PostgreSQL administrativo voltou;
- a minimização de GPS de motorista foi aplicada e verificada, sem snapshots ociosos remanescentes;
- o probe negativo rollback-only de Mobilidade comprovou bloqueio de terceiro usuário em PIN/trust/report;
- a compatibilidade pública `p_final_price` foi removida do wrapper terminal de entrega, mantendo preço server-owned e EXECUTE apenas para `service_role`;
- Mobilidade permanece `PUBLIC_LAUNCH_SURFACES.mobility=false` até certificação same-SHA.

## Ordem urgente correta

### P0 — fechar release authority

1. obter execução real do pipeline/build do HEAD candidato quando o provider permitir;
2. corrigir qualquer erro novo de source sem reduzir gates;
3. exigir deployment `READY` do mesmo SHA;
4. ativar proteção/ruleset da `main` com PR obrigatório, sem force-push/deleção e required check executável;
5. não considerar rate-limit, commit ou merge como certificação positiva.

### P1 — concluir Mobilidade antes de feature nova

Fechado nesta retomada:

- [x] migration de minimização de GPS aplicada/verificada;
- [x] probe negativo PIN/trust/report executado rollback-only;
- [x] compatibilidade `p_final_price` removida com migration versionada e ratchet de arquitetura.

Restante:

1. definir/aprovar política comercial real por modalidade;
2. regenerar tipos a partir do schema real, sem edição manual;
3. provar concorrência/idempotência: dupla aceitação, cancelamento simultâneo, retries/reconnect, quote duplicada e confirmação duplicada;
4. rodar typecheck/lint/testes/E2E/build/deploy no mesmo SHA;
5. somente depois avaliar habilitação pública.

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
- não voltar a acumular histórico detalhado neste arquivo: usar checkpoints do roadmap.

## Leia nesta ordem

1. `docs/README.md`;
2. `docs/03-architecture/CURRENT_RULES.md`;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
4. `docs/08-roadmap/checkpoints/2026-09-16-global-stabilization-priorities.md`;
5. `docs/08-roadmap/checkpoints/2026-09-16-mobility-authority-privacy-hardening.md`;
6. `SECURITY.md`.
