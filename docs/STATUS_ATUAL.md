# Status atual do Achegue-se

Atualizado em: 2026-09-17

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
- `MobilityDispatchConfigService` mantem `showFullDetails: false` nas tres estrategias de dispatch e possui regressao contra retorno de exposicao completa pre-aceite.
- A politica operacional de dispatch foi consolidada em `src/shared/contracts/mobilityDispatchPolicy.ts`, modulo runtime-neutral consumido pelo app e por `auto-dispatch-ride`; timeout por oferta, retry, raio e timeout total deixam de existir como literals concorrentes no Edge.
- `src/shared/types/mobility.constants.ts` nao carrega mais os antigos `OFFER_TIMEOUT_SECONDS`, `TOTAL_TIMEOUT_MINUTES`, `MAX_RETRY_ATTEMPTS` e `SEARCH_RADIUS_KM` de dispatch.
- `auto-dispatch-ride` aceita coordenada numerica `0`, rejeita coordenadas ausentes/NaN/Infinity e nao inventa `(0,0)` para motorista sem GPS.
- `auto-dispatch-ride` e `process-timeouts` permanecem sem JWT por desenho de job interno, mas usam a fronteira `CRON_SECRET`/`requireCronSecret`; `verify_jwt=false` nesses dois jobs nao significa endpoint sem autenticacao.

### Divida ainda aberta em mobilidade

- Executar os gates focados e o gate completo de release no SHA final; a mudanca de SSOT compartilhado ainda precisa de execucao real do runner.
- Executar smoke/E2E operacional contra o ambiente final antes de liberar trafego real.
- Manter `PUBLIC_LAUNCH_SURFACES.mobility=false` enquanto os gates do roadmap continuarem abertos.

## Seguranca e Supabase

Projeto remoto validado: `acheguese` (`xhdowzacfujckjelqhtd`).

Estado observado em 2026-09-16/17:

- Supabase: `ACTIVE_HEALTHY` na ultima verificacao remota registrada.
- `mobility-rpc`: ativo e `verify_jwt=true` na ultima verificacao remota registrada.
- `auto-dispatch-ride` e `process-timeouts`: classificados como jobs `cron-secret` e protegidos por `requireCronSecret` no codigo.
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

Antes desta auditoria, varios documentos vivos apontavam para `docs/STATUS_ATUAL.md`, mas o arquivo nao existia. Este documento preenche essa lacuna como resumo operacional vigente.

Regras:

- `docs/03-architecture/` e `docs/architecture/SSOT_REGISTRY.md`: arquitetura/SSOT vigente.
- `docs/09-reference/governance/security/`: autoridade e governanca de seguranca.
- `docs/10-archive/`: historico; nao comprova estado atual.
- Este arquivo: estado de release e riscos residuais atuais.

Ainda existem artefatos de governanca com timestamps/validades de agosto-setembro que precisam ser revalidados antes de qualquer afirmacao de release atual; nao atualizar datas por conveniencia sem repetir a evidencia correspondente.

## Evidencia de deploy e CI

No HEAD `1500471a41090d4feec36ddb3b9215433de2ef9d` do PR #116, os GitHub-hosted workflows continuam reproduzindo a falha pre-step: `Security Check` encerrou quatro jobs com `steps=[]`. `Security Scan` tambem falhou no hosted layer. `SSOT Enforcement`, `SSOT Territorial Tests` e `Heavy PR Certification (Auto)` foram observados em fila apos o ultimo push.

Isso nao e evidencia de regressao do codigo nem de aprovacao. Enquanto os runners/gates nao executarem de verdade, o PR permanece sem merge automatico.

## Gates para sair de NAO APROVADO

1. Revalidar e decidir explicitamente as excecoes expiradas de HIBP/PostGIS/Poll; nao renovar por inercia.
2. Capturar evidencia de recovery fresca conforme a politica vigente antes de operacao mutavel/release.
3. Restaurar capacidade de CI/deploy suficiente para que os jobs executem steps e um SHA candidato produza deployment de producao `READY`.
4. Executar `npm run validate:migrations`, `npm run validate:migrations:remote`, `npm run validate:free-release-governance:remote`, `npm run validate:security-authority`, `npm run security:validate` e `npm run verify:deploy` no SHA candidato.
5. Executar `npm run validate:ssot`, `npm run validate:hardcodes`, typecheck/lint/testes focados e E2E de mobilidade no mesmo SHA.
6. Confirmar deployment de producao `READY` para o mesmo SHA aprovado e executar smoke final.

Somente apos esses gates o status deste documento deve mudar para aprovado para lancamento.
