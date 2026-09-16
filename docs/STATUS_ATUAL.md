# Status atual do Achegue-se

Atualizado em: 2026-09-16

## Estado de release

**NAO APROVADO PARA LANCAMENTO neste snapshot.**

O projeto possui arquitetura e controles de release maduros, mas o estado atual ainda tem gates objetivos vencidos ou sem evidencia fresca. Este documento registra o estado vigente; documentos em `docs/10-archive/` sao historicos e nao devem ser usados para declarar prontidao atual.

## Mobilidade

Estado: **arquitetura principal consistente, com hardening em andamento**.

Controles confirmados no codigo e no ambiente remoto:

- `GeolocationService` e o SSOT de geolocalizacao de dispositivo; hooks de mobilidade delegam para esse owner.
- Mutacoes criticas de corrida, entrega, aceite, disponibilidade e localizacao passam pelo broker `mobility-rpc`.
- A Edge Function `mobility-rpc` esta ativa no projeto remoto e exige JWT.
- As funcoes atomicas `mobility_*` consultadas no banco possuem `search_path` fixo e nao possuem `EXECUTE` direto para `anon` nem `authenticated`.
- As tabelas centrais de mobilidade consultadas possuem RLS habilitado; grants do browser ficam predominantemente em leitura autorizada.
- O contrato PRE-ACEITE usa rota aproximada/coarse e proibe identidade, contato, texto livre e endereco exato antes da relacao aceita.
- Em 2026-09-16 foi identificada divergencia em `MobilityDispatchConfigService`: `open_board` e `reservation_board` sinalizavam `showFullDetails: true` apesar do contrato canonico exigir `false`. A branch `audit/mobility-launch-hardening-2026-09-16` corrige as tres estrategias para `false` e adiciona regressao automatica.
- Na mesma branch, limites antes espalhados em `getConfig()` (`999`, raio de `50 km`, timeout de `24h` e limite de ofertas) passaram a campos nomeados do `DISPATCH_GLOBAL_CONFIG`, preservando os valores de negocio atuais sem duplicar sentinelas dentro dos consumidores.
- `auto-dispatch-ride` e `process-timeouts` permanecem sem JWT por desenho de job interno, mas usam a fronteira `CRON_SECRET`/`requireCronSecret`; `verify_jwt=false` nesses dois jobs nao significa endpoint sem autenticacao.

### Divida ainda aberta em mobilidade

- Unificar a politica operacional entre o config owner do app e o worker server-side `auto-dispatch-ride`, que ainda possui `CONFIG` proprio para timeout, retries, timeout total e raio. Hoje os valores principais coincidem, mas continuam sendo duas fontes que podem divergir.
- Revisar os antigos `TIMEOUTS`/`BUSINESS_RULES` de dispatch em `src/shared/types/mobility.constants.ts`, que ainda duplicam parte desses valores apesar de `MobilityDispatchConfigService` ser o config owner registrado.
- Corrigir no `auto-dispatch-ride` a validacao baseada em falsy (`!pickupLat || !pickupLng`) e os fallbacks `current_lat || 0` / `current_lng || 0`; coordenada valida `0` nao pode ser tratada como ausencia, e coordenada ausente nao deve virar `(0,0)` silenciosamente.
- Executar os gates focados de mobilidade e o gate completo de release no SHA final.
- Executar smoke/E2E operacional contra o ambiente final antes de liberar trafego real.

## Seguranca e Supabase

Projeto remoto validado: `acheguese` (`xhdowzacfujckjelqhtd`).

Estado observado em 2026-09-16:

- Supabase: `ACTIVE_HEALTHY`.
- `mobility-rpc`: ativo e `verify_jwt=true`.
- `auto-dispatch-ride` e `process-timeouts`: ativos com `verify_jwt=false`, classificados como jobs `cron-secret` e protegidos por `requireCronSecret` no codigo.
- O Security Advisor ainda reporta residuais conhecidos de PostGIS/extensoes, RPCs `SECURITY DEFINER` e HIBP nativo desabilitado.
- As excecoes temporarias `EXC-2026-08-11-AUTH-HIBP-FREE-PLAN` e `EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE` venceram em **2026-09-10**.
- Excecoes individuais de Poll registradas com validade ate **2026-09-11** tambem estao vencidas.
- O snapshot de recovery registrado em `FREE_RELEASE_GOVERNANCE.json` venceu em **2026-08-15** e nao constitui evidencia fresca para uma operacao mutavel em setembro.

Pelas regras da `Security Authority`, excecao expirada nao autoriza release. Renovacao nao deve ser automatica: exige nova evidencia remota e decisao explicita do owner humano.

## Configuracao e secrets

- `.env` versionado e o baseline publico deliberado do frontend.
- `.env.production` e template de contrato de ambiente.
- Segredos reais devem permanecer somente nos providers/ambientes privados; nao devem ser preenchidos nesses arquivos versionados.
- Nenhum segredo privado foi identificado nesses dois arquivos durante esta auditoria.

## Documentacao

Antes desta auditoria, varios documentos vivos apontavam para `docs/STATUS_ATUAL.md`, mas o arquivo nao existia. Este documento passa a preencher essa lacuna como resumo operacional vigente.

Regras:

- `docs/03-architecture/` e `docs/architecture/SSOT_REGISTRY.md`: arquitetura/SSOT vigente.
- `docs/09-reference/governance/security/`: autoridade e governanca de seguranca.
- `docs/10-archive/`: historico; nao comprova estado atual.
- Este arquivo: estado de release e riscos residuais atuais.

Ainda existem artefatos de governanca com timestamps/validades de agosto-setembro que precisam ser revalidados antes de qualquer afirmacao de release atual; nao atualizar datas por conveniencia sem repetir a evidencia correspondente.

## Evidencia de deploy e CI

Na consulta de 2026-09-16, a Vercel nao apresentou erros de runtime nas ultimas 24 horas. Isso descreve os deployments que conseguiram rodar, nao comprova o HEAD atual.

No SHA desta auditoria:

- o status Vercel falhou por `build-rate-limit` do plano, inclusive no SHA-base da `main`; nao e evidencia de erro de compilacao introduzido por este patch;
- `Security Check`, `Security Scan` e `SSOT Enforcement` encerraram como falha sem executar steps do job; por isso esses resultados tambem nao constituem evidencia tecnica de regressao nem de aprovacao;
- enquanto o runner/gates nao executarem de verdade, o PR permanece sem merge automatico.

## Gates para sair de NAO APROVADO

1. Revalidar e decidir explicitamente as excecoes expiradas de HIBP/PostGIS/Poll; nao renovar por inercia.
2. Capturar evidencia de recovery fresca conforme a politica vigente antes de operacao mutavel/release.
3. Restaurar capacidade de CI/deploy suficiente para que os jobs executem steps e um SHA candidato produza deployment de producao `READY`.
4. Executar `npm run validate:migrations`, `npm run validate:migrations:remote`, `npm run validate:free-release-governance:remote`, `npm run validate:security-authority`, `npm run security:validate` e `npm run verify:deploy` no SHA candidato.
5. Executar `npm run validate:ssot`, `npm run validate:hardcodes` e testes focados/E2E de mobilidade.
6. Fechar o drift de configuracao entre `MobilityDispatchConfigService`, constantes compartilhadas antigas e `auto-dispatch-ride`, alem da validacao de coordenadas zero/ausentes.
7. Confirmar deployment de producao `READY` para o mesmo SHA aprovado e executar smoke final.

Somente apos esses gates o status deste documento deve mudar para aprovado para lancamento.
