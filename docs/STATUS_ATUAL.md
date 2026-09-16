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
- As funcoes atomicas `mobility_*` consultadas no banco nao possuem `EXECUTE` direto para `anon` nem `authenticated`.
- As tabelas centrais de mobilidade consultadas possuem RLS habilitado; grants do browser ficam predominantemente em leitura autorizada.
- O contrato PRE-ACEITE usa rota aproximada/coarse e proibe identidade, contato, texto livre e endereco exato antes da relacao aceita.
- Em 2026-09-16 foi identificada divergencia em `MobilityDispatchConfigService`: `open_board` e `reservation_board` sinalizavam `showFullDetails: true` apesar do contrato canônico exigir `false`. A correcao esta na branch `audit/mobility-launch-hardening-2026-09-16` com regressao automatica.

### Divida ainda aberta em mobilidade

- Consolidar valores de politica de dispatch ainda espalhados no proprio config owner (`999`, raio `50 km`, timeout `24h`) para campos nomeados do SSOT, evitando sentinelas/numeros magicos.
- Executar os gates focados de mobilidade e o gate completo de release no SHA final.
- Executar smoke/E2E operacional contra o ambiente final antes de liberar trafego real.

## Seguranca e Supabase

Projeto remoto validado: `acheguese` (`xhdowzacfujckjelqhtd`).

Estado observado em 2026-09-16:

- Supabase: `ACTIVE_HEALTHY`.
- `mobility-rpc`: ativo e `verify_jwt=true`.
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

## Evidencia de deploy

Na consulta de 2026-09-16, a Vercel nao apresentou erros de runtime nas ultimas 24 horas. Entretanto, a `main` recebe commits em alta frequencia e o HEAD auditado ainda nao tinha evidencia de um deployment `READY` correspondente no snapshot consultado. Commits cancelados por supersedencia nao equivalem a falha, mas tambem nao comprovam o HEAD final.

## Gates para sair de NAO APROVADO

1. Revalidar e decidir explicitamente as excecoes expiradas de HIBP/PostGIS/Poll; nao renovar por inercia.
2. Capturar evidencia de recovery fresca conforme a politica vigente antes de operacao mutavel/release.
3. Executar `npm run validate:migrations`, `npm run validate:migrations:remote`, `npm run validate:free-release-governance:remote`, `npm run validate:security-authority`, `npm run security:validate` e `npm run verify:deploy` no SHA candidato.
4. Executar `npm run validate:ssot`, `npm run validate:hardcodes` e testes focados/E2E de mobilidade.
5. Confirmar deployment de producao `READY` para o mesmo SHA aprovado e executar smoke final.

Somente apos esses gates o status deste documento deve mudar para aprovado para lancamento.
