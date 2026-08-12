# Security Authority

Status: ativo
Data: 2026-08-11

Security Authority e o ponto de entrada operacional para mudancas que afetam
seguranca, privacidade, autorizacao, Supabase, secrets, migrations, storage,
rotas protegidas, dados pessoais e fluxos transacionais.

Ela nao substitui `SECURITY.md`, `docs/SUPABASE_SECRETS.md`, migrations ou
scripts. Ela define quando cada fonte deve ser usada e qual evidencia e
obrigatoria antes de considerar uma alteracao pronta.

## Objetivo

Reduzir regressao real de seguranca sem criar burocracia inutil.

Riscos prioritarios:

- BOLA/IDOR por acesso a registros de outro usuario, perfil, empresa, pedido,
  entrega, territorio ou evento de moderacao.
- Vazamento de `service_role`, segredo de provider ou chave privada.
- RLS ausente, permissiva ou desconectada do modelo de autorizacao.
- RPC `SECURITY DEFINER` exposta a `anon` ou `authenticated` sem justificativa.
- Storage publico com listagem ampla.
- Migration com drift local/remoto.
- Uso de redirect, fallback falso ou mock para esconder falha de autorizacao.
- Tratamento incorreto de PII/LGPD.

## Escopo

- Supabase Database, Auth, Storage, Edge Functions, RPCs e migrations.
- Politicas RLS, grants, views e funcoes privilegiadas.
- Secrets locais, CI, Vercel e scripts administrativos.
- Rotas protegidas, guards e services que leem ou escrevem dados sensiveis.
- Fluxos de pedidos, delivery, pagamentos, trust/moderacao e perfil.
- Regras para agentes de IA antes de editar codigo sensivel.

## Fora De Escopo

- Criar outras Authorities agora.
- Substituir a arquitetura territorial ou de rotas.
- Autorizar redirect como solucao de seguranca.
- Criar runtime paralelo para contornar RLS.
- Criar validadores novos antes de confirmar lacuna real nos scripts atuais.

## Fontes Canonicas

- [Security Policy raiz](../../../SECURITY.md)
- [Seguranca do projeto](../../SECURITY.md)
- [Workflow de secrets Supabase](../../SUPABASE_SECRETS.md)
- [Migrations](../../MIGRATIONS.md)
- [Status atual](../../STATUS_ATUAL.md)
- [Advisor remoto Supabase](../../audits/SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md)
- [Drift remoto Supabase](../../audits/SUPABASE_REMOTE_MIGRATION_DRIFT_2026-07-06.md)
- [Excecoes ativas](./EXCEPTIONS.md)
- [Governanca de release controlado no Free](./FREE_RELEASE_GOVERNANCE.md)
- [SSOT executavel do release Free](./FREE_RELEASE_GOVERNANCE.json)
- [SSOT dos residuais do Advisor](./SUPABASE_ADVISOR_RESIDUALS.json)
- [Policy de fronteira service_role](./SERVICE_ROLE_BOUNDARY_POLICY.json)
- `scripts/security/validate-security.mjs`
- `scripts/validate-supabase-advisor-residuals.ts`
- `scripts/validate-supabase-migrations.ts`
- `scripts/validate-supabase-remote-migration-drift.ts`
- `scripts/verify-deploy-ready.mjs`
- `supabase/migrations/`

## Docs Da Authority

- [Modelo Supabase seguro](./SUPABASE_SECURITY_MODEL.md)
- [Niveis de risco](./RISK_LEVELS.md)
- [Regras para agentes de IA](./AI_AGENT_RULES.md)
- [Excecoes](./EXCEPTIONS.md)

## Comandos Obrigatorios

Mudancas Critical em Supabase, Auth, RLS, RPC, Storage, PII, pedidos, delivery
ou trust devem passar por:

```powershell
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:free-release-governance:remote
npm run validate:security-authority
npm run security:validate
npm run verify:deploy
```

Quando houver credencial remota Supabase disponivel e o objetivo for fechar
release de seguranca, rode tambem:

```powershell
npm run security:advisor:residuals
```

Esse comando chama o Advisor remoto e falha se aparecer achado fora dos
residuais mapeados nas excecoes ativas. Ele aceita que achados conhecidos
desaparecam.

Para validar um export JSON sem rede:

```powershell
npm run security:advisor:residuals -- --advisor-json caminho/advisor.json
```

A allowlist desse comando vive em
[SUPABASE_ADVISOR_RESIDUALS.json](./SUPABASE_ADVISOR_RESIDUALS.json); nao
duplicar `cache_key` em scripts ou docs.

Para a excecao PostGIS/extension-owner, execute o preflight read-only antes de
qualquer migration que pretenda usar o marcador `extension-owner-preflight`:

```powershell
npm run security:postgis:preflight
```

Resultado `blocked` significa que a role remota atual ainda nao tem ownership
suficiente; nao criar migration para `spatial_ref_sys` ou `st_estimatedextent`
nesse estado.

Para autorizar uma janela controlada no Supabase Free, execute:

```powershell
npm run validate:free-release-governance
npm run validate:free-release-governance:remote
```

O primeiro validator exige owner humano, excecoes HIBP/PostGIS vigentes,
fingerprint PostGIS sem mudanca material, recovery manual dentro da validade e
off-device verificado. Ele nao afirma freshness remota. O segundo consulta o
Supabase linkado em modo read-only e compara migrations, Auth e Storage com o
snapshot vigente; operacao mutavel sem essa evidencia falha fechado. Nenhum dos
dois transforma Free em Pro nem substitui qualquer gate tecnico.

## Estados De Controle

- `CONTROL_IMPLEMENTED`: o controle existe e foi comprovado.
- `VALID_TEMPORARY_EXCEPTION`: risco especifico aceito por owner, com prazo,
  mitigacoes e triggers de encerramento.
- `VERIFIED_COMPENSATING_CONTROL`: controle alternativo comprovado, sem falsa
  equivalencia com o controle ausente.
- `EXPIRED_EXCEPTION`: registro historico que nao autoriza release.
- `BLOCKER`: evidencia, owner, validade ou gate obrigatorio ausente.

Na janela Free atual, HIBP e PostGIS usam `VALID_TEMPORARY_EXCEPTION`, recovery
usa `VERIFIED_COMPENSATING_CONTROL` e PITR permanece
`UNAVAILABLE_ON_PLAN / RESIDUAL_RISK_ACCEPTED`.

Mudancas High devem ter ao menos typecheck, lint ou teste focado proporcional:

```powershell
npm run typecheck:app
npm run lint
```

Quando a mudanca tocar rotas, territorio, URLs ou SSOT:

```powershell
npm run validate:ssot
npm run validate:hardcodes
npm run validate:upload:ssot
```

O gate de release `npm run verify:deploy` executa `validate:deps` e
`validate:taxonomy`, `validate:architecture:incremental`,
`validate:architecture:governance`, `validate:session-context`,
`validate:ssot`, `validate:hardcodes` e
`validate:upload:ssot` antes dos gates Supabase/security. Portanto violacoes de
camada, ciclos arquiteturais, imports legados, modulos fora da taxonomia,
quebras de governanca, identificadores ambiguos de contexto de sessao,
regressoes de hooks legados de auth/profile, quebras de URL/SSOT canonico,
hardcodes operacionais e
desvios do SSOT de upload bloqueiam release junto com as regras da Security
Authority.

## Regras Executaveis Atuais

`npm run validate:migrations` aplica as seguintes regras de seguranca:

- tabela em schema `public` criada por migration deve ter RLS habilitado;
- view publica concedida a `anon`/`authenticated` deve usar
  `security_invoker=true`;
- migration posterior ao hardening de `SECURITY DEFINER` nao pode criar funcao
  `SECURITY DEFINER` sem `SET search_path`;
- RPC mutante `SECURITY DEFINER` exposta a `anon`/`authenticated` precisa ter
  guarda de autenticacao/autorizacao;
- migration nova, a partir de `20260707000000`, que cria tabela publica precisa
  registrar decisao explicita de acesso Data API;
- migration nova, a partir de `20260707000000`, que concede RPC a `anon` ou
  `PUBLIC` precisa classificar a RPC como publica;
- migration nova, a partir de `20260707000000`, que cria listagem ampla em
  `storage.objects` para `anon` precisa classificar a excecao.
- migration nova, a partir de `20260708000032`, que toca
  `public.spatial_ref_sys` ou `public.st_estimatedextent` precisa declarar
  preflight de owner/plataforma vinculado a
  `EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE`.
- `verify:deploy` executa `validate:security-authority`, que cobre os
  marcadores da Security Authority com teste isolado e exige o gate remoto de
  recovery freshness.
- `verify:deploy` executa `validate:deps` e `validate:ssot`, bloqueando
  violacao de camadas, ciclos, imports legados e quebras de SSOT antes do
  release.
- `verify:deploy` executa `validate:taxonomy`,
  `validate:architecture:incremental` e `validate:architecture:governance`,
  bloqueando modulo fora da taxonomia, regressao de fronteiras arquiteturais e
  quebra de governanca.
- `verify:deploy` executa `validate:session-context`, bloqueando identificadores
  ambiguos como `driver_id` em codigo de runtime e regressao de simbolos legados
  de auth/profile.
- `verify:deploy` executa `validate:hardcodes` e `validate:upload:ssot`,
  bloqueando hardcodes operacionais e acesso direto a upload/otimizacao de
  imagem fora do SSOT.
- `security:validate` valida a fronteira `service_role` por
  `SERVICE_ROLE_BOUNDARY_POLICY.json`, bloqueando segredo ou env access em
  browser/public/API nao classificada.
- `verify:deploy` executa `security:config:validate`, bloqueando CSP,
  `vercel.json` ou hardcode de configuracao de seguranca fora do SSOT.

As classificacoes aceitas ficam no proprio arquivo SQL como comentarios:

```sql
-- security-authority: no-data-api public.nome_da_tabela
-- security-authority: internal-table public.nome_da_tabela
-- security-authority: public-rpc public.nome_da_funcao
-- security-authority: public-storage-listing storage.objects
-- security-authority: extension-owner-preflight EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE
```

O marcador `extension-owner-preflight` nao autoriza tentativa cega: ele so pode
ser usado depois de uma via de owner/plataforma ter sido aprovada e evidenciada
na excecao.

A cobertura de regressao dessas regras fica em:

- `tests/security/security-authority-migrations.test.ts`

Evidencia do piloto:

- [Security Authority Pilot - 2026-07-07](../../audits/SECURITY_AUTHORITY_PILOT_2026-07-07.md)

## Regra De Pronto

Uma alteracao sensivel so esta pronta quando:

- risco foi classificado;
- fonte canonica foi respeitada;
- evidencia obrigatoria foi executada ou excecao foi registrada;
- nao ha mock, fallback falso ou redirect escondendo autorizacao;
- migrations locais e remoto estao sem drift quando Supabase foi alterado;
- comportamento de autorizacao foi testado no nivel adequado.
