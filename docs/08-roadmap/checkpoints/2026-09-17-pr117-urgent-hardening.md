# Checkpoint 2026-09-17 — PR #117: hardening urgente e gates de release

PR: [#117 — Harden mobility dispatch privacy and unify app/Edge policy](https://github.com/washingtonmsdj/acheguese/pull/117)
Branch: `audit/mobility-launch-hardening-main-2026-09-17`
HEAD remoto antes deste conjunto: `f3cbbf3f2bccc608c0560d084f6761774619b862`
Projeto Supabase canônico: `xhdowzacfujckjelqhtd`.

Este checkpoint registra o trabalho local preparado para o PR e os gates que ainda impedem a certificação. Código publicado, CI verde, autorização de release e deploy são estados distintos.

## Trabalho concluído neste conjunto

- O leitor de body das Edge Functions agora conta os bytes enquanto consome o stream e interrompe a leitura ao exceder o limite; testes cobrem limite, corpo excessivo e cancelamento.
- Os jobs conhecidos de E2E com credenciais não recebem secrets em código candidato de PR. A certificação autenticada/logout fica no fluxo manual confiável; antes do checkout, o fluxo prova que o SHA escolhido pertence ao histórico de `main`.
- O canário administrativo de Edge Functions só pode aplicar a partir de `main` e verifica o repositório `origin` canônico e a ancestralidade do SHA em `origin/main`.
- O preflight de Edge secrets usa o CLI Supabase empacotado, encaminha o token apenas ao processo filho e considera nomes de configuração sem imprimir valores ou digests. Inclui os requisitos de `ALLOWED_ORIGINS` e `TURNSTILE_SECRET_KEY` dos brokers públicos de intake e agora faz parte de `verify:deploy`.
- O gate de build falha quando faltam `VITE_SUPABASE_URL` ou `VITE_SUPABASE_PUBLISHABLE_KEY`; a chave pública do Turnstile permanece obrigatória somente para produção e é validada pelo contrato de produção.
- As violações de dependência foram corrigidas movendo os componentes de mapa para `core/maps`, usando o barrel público de tipos Supabase e importando componentes de território pelo owner compartilhado. O validador continua sem exceções novas.
- Consultas de slug público foram consolidadas no adapter de identidade; os limites de consultas de mapa agora usam uma configuração compartilhada; rotas concept/mock ficam só em desenvolvimento.
- O conceito de detalhe gastronômico foi movido para `dev`, mantendo a página de runtime e preservando cobertura de testes.

## Validação local

- `npm run typecheck:ci` passou.
- `npm run lint` passou sem erros; restaram dois avisos preexistentes em `RideTrackingMap.tsx` e `RideRequestForm.tsx`.
- `npm run build` passou com variáveis públicas de fixture: 6.094 módulos transformados.
- Passaram: `validate:deps` (0 violações), governança incremental/core-platform, governança de arquitetura, taxonomia, migrations locais e proveniência, URL SSOT, hardcodes, configuração de segurança e validação estática de segurança.
- Suites focadas passaram: 56 testes de contratos de segurança/CLI/body/authority; 22 testes de MapLibre, território gastronômico e ownership; 21 testes de preflight e fronteira de secrets; 39 testes de Community Interest.
- Os três workflows alterados são YAML válido; `git diff --check` passou.

## Gates externos ainda bloqueados

- `security:edge-secrets:preflight` encerra com token Supabase ausente. Nenhum nome de secret remoto foi verificado. O projeto não recebeu migration nem deploy de Edge Function.
- `validate:security-authority` e `validate:free-release-governance` falham porque as exceções HIBP e PostGIS venceram em 2026-09-10 e o snapshot manual de recuperação venceu em 2026-08-15. A policy exige evidência atual e proíbe renovação automática; este checkpoint não cria evidência nem aprova risco.
- As migrations pendentes de cutover para Community Interest e Professional Leads continuam fora de `supabase/migrations`; não foram aplicadas.
- A API GitHub revelou secrets E2E e de bypass no escopo do repositório, enquanto Preview/Production não têm secrets de ambiente configurados. As mudanças fecham os caminhos conhecidos, mas a fronteira sistêmica só fecha depois de migrar/rotacionar essas credenciais para um ambiente com branch policy restrita a `main` e remover os secrets do repositório. Os valores não são recuperáveis pela API; nenhum secret foi lido, apagado ou rotacionado.
- Na atualização de 2026-09-18, o HEAD remoto `3f1612287a36d4e56e3f7d06607b5340e36d872e` teve checks GitHub encerrados antes de qualquer step: a anotação da API diz `The job was not started because an Actions budget is preventing further use.`; os jobs têm `steps=[]`, inclusive `security-scan`, E2E fixture-backed e SSOT. Portanto, são gates bloqueados por orçamento, não resultados de teste do código. O E2E autenticado foi `SKIPPED` pela nova fronteira de confiança. `Heavy PR gates for exact head SHA` continua `QUEUED` e o contexto Vercel continua `PENDING`; não há certificação hospedada nem deploy `READY` deste SHA.

## Estado operacional

- `PUBLIC_LAUNCH_SURFACES.mobility` permanece `false`; este trabalho não certifica nem habilita Mobilidade.
- Não houve merge, aplicação de migration, deploy de Edge Function ou deploy de produção.
- O plano segue ativo. O próximo avanço depende de credencial Supabase com leitura de secrets, snapshot de recuperação atual e aprovação do owner para resolver as exceções expiradas, configuração protegida dos secrets GitHub, e novas execuções hospedadas no mesmo SHA.

## Atualização remota 2026-09-18

- PR #117 permanece aberto no branch `audit/mobility-launch-hardening-main-2026-09-17`, HEAD `3f1612287a36d4e56e3f7d06607b5340e36d872e`.
- A API GitHub confirmou que os checks `security-scan`, SSOT, E2E fixture-backed, lockfile, lint/typecheck e visual regression foram bloqueados antes de iniciar por orçamento do Actions. Nenhum step desses checks executou.
- A certificação pesada segue `QUEUED`; Vercel segue `PENDING`. O estado positivo de `Vercel Preview Comments` só confirma o comentário, não um deploy.
- Próxima verificação: após a liberação do orçamento do Actions e do limite da Vercel, iniciar novamente os gates para o SHA que estiver no HEAD e obter deploy `READY`; não interpretar o `SKIPPED` autenticado nem os checks sem runner como aprovação.

### Revisão remota Supabase (somente leitura)

- O conector Supabase autenticado confirmou o projeto canônico `acheguese` (`xhdowzacfujckjelqhtd`) como `ACTIVE_HEALTHY`. Isso permite inspecionar banco, migrations, advisors e Edge Functions; não dá acesso local ao CLI nem revela valores de secrets.
- As consultas remotas confirmaram RLS habilitado em `professional_leads` e `community_interest_registrations`. `anon` e `authenticated` não têm privilégio efetivo de `INSERT` nessas duas tabelas; `service_role` preserva `INSERT`.
- Ainda permanecem as policies legadas `professional_leads_public_insert` (`anon`), `professional_leads_authenticated_insert` (`authenticated`) e `community_interest_legacy_insert` (`anon`, `authenticated`). Em `professional_stats`, `authenticated` ainda tem `INSERT`/`UPDATE`/`DELETE`; o trigger `professional_leads_increment_contacts` ainda não existe. As verificações de acesso mostram o estado atual, mas não substituem os pré-requisitos operacionais dos cutovers G39/Community Interest.
- As três Edge Functions relevantes estão ativas (`register-community-interest` v4, `create-professional-lead` v2 e `submit-dpo-request` v1; todas `verify_jwt=false`). A comparação remota com os arquivos locais divergiu em 10 dos 16 arquivos empacotados; os três snapshots remotos de `_shared/security.ts` não têm a leitura incremental por stream com contagem real de bytes. Portanto, o hardening do leitor de body ainda não está no runtime remoto.
- O preflight de Edge secrets continua sem comprovar os nomes remotos: `SUPABASE_ACCESS_TOKEN` não está disponível para o CLI local, e o conector não oferece uma ferramenta de listagem de Edge secrets. Nenhum valor de secret foi lido ou alterado.
- O Security Advisor remoto reporta HIBP/leaked-password protection desabilitado (WARN), `public.spatial_ref_sys` sem RLS (ERROR do Advisor, superfície PostGIS) e findings de funções `SECURITY DEFINER` expostas. Isso confirma estado remoto para a revisão das exceções vencidas; não autoriza renová-las nem fazer mudanças em lote.
- A lista remota de migrations e os arquivos locais não coincidem em quantidade e há entradas com o mesmo nome sob versões diferentes, além de entradas presentes só em um dos lados. Isso exige reconciliação de proveniência antes de qualquer aplicação e não prova, por si só, divergência de schema.
- O cutover G39 segue bloqueado pelo frontend LIVE e pelos smokes anônimo/autenticado ausentes; o cutover Community Interest também exige evidência de secrets configurados e frontend do broker LIVE. Nenhum cutover ou deploy foi aplicado.
