# Supabase Security Model

Status: ativo
Data: 2026-07-07

Este documento define como o projeto deve usar Supabase com seguranca. Ele nao
substitui migrations ou docs oficiais; ele traduz as regras operacionais para o
repositorio.

Referencias externas que devem ser verificadas em mudancas sensiveis:

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase Product Security](https://supabase.com/docs/guides/security/product-security)
- [Supabase Changelog](https://supabase.com/changelog)

## Principio

O browser pode chamar Supabase diretamente apenas quando a protecao real esta em
RLS, grants e policies. Guard de UI melhora experiencia, mas nao e controle de
seguranca.

## Camadas

1. Grants definem se uma role pode acessar o objeto.
2. RLS define quais linhas essa role pode acessar.
3. RPCs definem operacoes controladas quando acesso direto nao e adequado.
4. Backend/service role existe apenas para operacoes administrativas ou
   server-side.
5. Advisor, migrations e validadores confirmam que a decisao ficou auditavel.

RLS controla linhas, nao colunas. Uma policy publica em tabela com PII nunca e
suficiente por si so. Nesses casos o projeto deve combinar:

- `REVOKE SELECT` da tabela para roles de browser;
- `GRANT SELECT (colunas...)` com allowlist explicita e sem PII;
- view publica PII-free para leitura de descoberta;
- broker/RPC actor-bound para leitura privada ou contato com consentimento.

O contrato de referencia e `profiles`: `public_profiles` e a projecao publica,
enquanto `profile-rpc` concentra perfis acessiveis e contato condicionado por
`show_phone`/`show_contact_email`. Telefone, WhatsApp, e-mail, endereco exato e
estado operacional nao podem entrar em joins ou payloads genericos. IDs de
residencia e territorio exato tambem sao privados: a projecao publica deve
reduzi-los a cidade ou bairro somente quando `public_location_visibility`
autorizar, e retornar `NULL` quando a localizacao estiver oculta.
Quando uma view `security_invoker` precisar derivar essa informacao de uma
tabela privada, usar uma RPC `SECURITY DEFINER` minima e PII-free que reaplique
os filtros publicos. `profile_public_territory_projection` e o contrato de
referencia; conceder `SELECT` de `user_residences` a `anon` nao e aceitavel.
Leituras privadas devem exigir escopo delimitado (IDs ou usuario-alvo), impor
limite por lote e distinguir gestor (`owner`/`admin`) de membro comum.

## Admissao No Alpha Privado

Enquanto o produto estiver em alpha privado, esconder a rota de cadastro ou
nao divulgar a URL nao e controle de seguranca. A criacao de identidade em
`auth.users` falha antes dos triggers de perfil quando nao houver um convite
ativo para o e-mail normalizado, ainda valido e com uso disponivel. A regra
tambem vale para criacao administrativa; automacoes com `service_role` emitem
o convite restrito antes de criar a identidade.

`user_metadata` e `app_metadata` nao sao usados como bypass no `BEFORE INSERT`.
Os
convites vivem em `private.alpha_access_invites`, sem grants para browser, e o
consumo e atomico. Emissao, consumo e revogacao sao registrados em auditoria.
As funcoes de gestao aceitam somente `service_role`; os comandos locais tambem
exigem alvo `development` ou `staging`, project ref correspondente e
confirmacao explicita. O contrato executavel esta na migration
`20260718210000_enforce_private_alpha_access.sql` e no endurecimento
`20260718211000_require_alpha_invite_for_all_auth_identities.sql`.

## Data API E Grants Explicitos

O Supabase anunciou em 2026-04-28 uma mudanca nos defaults de grants para novas
tabelas no schema `public`. Desde 2026-05-30, novos projetos passam a exigir
grants explicitos para novas tabelas ficarem acessiveis via Data API por
padrao. Em 2026-10-30, a mudanca sera aplicada aos projetos existentes.

Regra do projeto:

- tabela nova em schema exposto deve declarar grants explicitamente;
- grants e RLS devem ser revisados juntos;
- ausencia de grant nao deve ser "corrigida" com service role no frontend;
- `anon` recebe apenas leitura publica deliberada;
- `authenticated` recebe apenas operacoes com policies reais;
- `service_role` fica restrita a backend, Edge Function segura ou script
  administrativo.

Desde a Security Authority, migrations novas a partir de `20260707000000` sao
validadas automaticamente: uma tabela publica nova deve ter `GRANT`/`REVOKE` no
mesmo arquivo ou um comentario explicito de nao exposicao:

```sql
-- security-authority: no-data-api public.nome_da_tabela
-- security-authority: internal-table public.nome_da_tabela
```

Migrations novas a partir de `20260708000032` que toquem objetos PostGIS
bloqueados por owner (`public.spatial_ref_sys` ou
`public.st_estimatedextent`) precisam declarar preflight de owner/plataforma:

```sql
-- security-authority: extension-owner-preflight EXC-2026-07-08-POSTGIS-EXTENSION-OWNER
```

Esse marcador nao substitui a evidencia. Ele apenas impede que uma migration
padrao repita uma acao que ja falhou sem ownership suficiente.

## RLS

Toda tabela em schema exposto deve ter RLS habilitado, exceto caso tecnicamente
justificado e registrado como excecao.

Policies devem refletir o modelo real:

- dados do usuario: comparar com `(select auth.uid())` ou profile derivado.
- dados de empresa: validar membership/ownership da empresa.
- dados de pedido: validar cliente, loja, motoboy/motorista ou admin conforme
  fluxo.
- dados territoriais: validar escopo publico, residencia, grupo ou permissao.
- dados publicos: policy `using (true)` so pode existir quando o dado for
  intencionalmente publico e documentado.

`TO authenticated` sozinho nao e autorizacao. Ele so prova que existe uma role
autenticada.

## RPC E SECURITY DEFINER

Preferir `SECURITY INVOKER`.

Usar `SECURITY DEFINER` apenas quando houver motivo tecnico claro, por exemplo:

- encapsular uma leitura publica limitada que precisa atravessar uma tabela
  interna;
- executar mutation transacional com validacao interna forte;
- registrar auditoria ou evento controlado sem abrir acesso direto a tabela.

Padrao obrigatorio para `SECURITY DEFINER`:

- `SET search_path` fixado;
- grants explicitos por role;
- revoke de `PUBLIC` quando aplicavel;
- `anon` proibido por default;
- checagem interna de identidade/escopo quando houver dado sensivel;
- retorno minimo, sem PII desnecessaria;
- evidencia do Advisor ou justificativa registrada.

Migrations novas a partir de `20260707000000` nao podem conceder RPC para
`anon` ou `PUBLIC` sem classificar a funcao no proprio SQL:

```sql
-- security-authority: public-rpc public.nome_da_funcao
```

## Edge Functions

Edge Functions que atuam como broker de RPC, operacao administrativa ou acesso
a `service_role` devem exigir JWT no gateway Supabase (`verify_jwt=true`) e
validar identidade/escopo dentro da funcao antes de chamar o banco.

Funcoes sem JWT sao excecao operacional, nao default. Toda Edge Function deve
ter `verify_jwt` declarado em `supabase/config.toml`; o gate `security:validate`
falha quando uma funcao fica dependente de default implicito. A allowlist
executavel sem JWT fica em
`docs/governance/security/EDGE_FUNCTION_AUTH_POLICY.json`. O gate
`security:validate` valida schema, categorias permitidas, regex obrigatorias e
conflito com nomes que sempre exigem JWT por meio de
`scripts/security/edge-function-auth-policy.mjs`; o contrato local
`[functions.*]` em `supabase/config.toml` e validado por
`scripts/security/edge-function-auth-config.mjs`.

Validadores de UUID em brokers devem aceitar somente a forma canonica completa
(`8-4-4-4-12`) e possuir teste de regressao. Validacao sintatica nunca substitui
a autorizacao actor-bound no RPC.

Toda Edge Function que usa `SUPABASE_SERVICE_ROLE_KEY` ou `SERVICE_ROLE` deve
estar classificada em
`docs/governance/security/EDGE_FUNCTION_AUTH_POLICY.json#serviceRoleAllowlist`.
Essa classificacao declara `kind`, `risk`, `label` e padroes obrigatorios que
o gate confere contra o arquivo real. Classificacao ausente, obsoleta ou sem o
controle obrigatorio falha em `security:validate`.

A allowlist atual de funcoes sem JWT e:

- `auth-username-login`: endpoint publico de login por username, com rate limit,
  resposta generica e uso server-side de `service_role` apenas para resolver a
  dependencia privada de Auth.
- `track-public-view`: endpoint publico de contagem de visualizacao, com rate
  limit, whitelist de entidade e chamada apenas para RPCs de contador restritas
  a `service_role`.
- `billing-webhook`: webhook Stripe sem JWT, protegido por assinatura
  `stripe-signature` e `STRIPE_WEBHOOK_SECRET`.
- `auto-dispatch-ride` e `process-timeouts`: jobs de cron sem JWT, protegidos
  por `CRON_SECRET`/segredo operacional via `requireCronSecret`.
- `media-assets-cleanup`: worker de orfaos sem JWT de usuario, protegido por
  `CRON_SECRET`, rate limit e grants `service_role` restritos ao lifecycle de
  MediaAsset.
- `get-push-config`, `nominatim-proxy` e `sitemap`: endpoints publicos de
  leitura/proxy sem dado sensivel, com rate limit e validacao de entrada.

Qualquer novo `verify_jwt=false` precisa de justificativa no plano/auditoria,
validacao de rate limit e atualizacao deliberada do gate
`validate:security-authority`. O gate `security:validate` tambem valida o
contrato local em `supabase/config.toml`. Funcoes configuradas como `admin-*`
ou `*-rpc` devem permanecer com `verify_jwt=true`.

## Storage

- Bucket publico so para asset realmente publico.
- Listagem publica e mais sensivel que leitura por path conhecido.
- Upload, update, delete e upsert exigem policies separadas e testadas.
- Paths devem carregar ownership ou escopo verificavel quando necessario.

Policy nova de `SELECT` em `storage.objects` para `anon` com `USING (true)` e
tratada como excecao. Se for realmente necessaria, deve ser classificada:

```sql
-- security-authority: public-storage-listing storage.objects
```

## Backup E Recuperacao

O backup gerenciado do banco e a fonte canonica para recuperar schema, dados,
Auth e metadados do Storage. Objetos binarios do Storage nao fazem parte desse
backup e exigem exportacao separada. Arquivos de configuracao e migrations sao
versionados no Git; nao devem ser copiados para uma segunda arvore de backup.

Gates operacionais:

```powershell
npm run backup:database:status
npm run alpha:backup:gate
npm run backup:storage
npm run restore:storage -- caminho-do-backup --verify-only
```

`alpha:backup:gate` falha quando o Supabase nao apresenta backup `COMPLETED`
com no maximo 36 horas nem PITR. Backup falho, antigo ou `walg_enabled` isolado
nao e evidencia de que o operador consegue restaurar. O status observado deve
ser registrado no plano da release, sem copiar tokens ou URLs com credenciais.
O mesmo gate e aplicado diretamente por `alpha:invite` e `alpha:resume` antes
da criacao do cliente `service_role`. Falha da CLI, da Management API ou da
evidencia de recuperacao mantem a admissao fechada. Comandos de contencao e
consulta (`alpha:pause`, `alpha:revoke` e `alpha:status`) nao dependem desse
gate e permanecem utilizaveis durante incidentes.

O exportador de Storage cria um inventario versionado, usa nomes locais
derivados por hash e registra tamanho e SHA-256 de cada objeto. O diretorio
mantem o marcador `INCOMPLETE` ate todos os downloads terminarem; o manifesto e
gravado por ultimo e o verificador recusa qualquer marcador remanescente. A
saida em `backups/` e ignorada pelo Git, contem dados sensiveis e deve
permanecer apenas em volume local criptografado ou cofre de backup aprovado.
Falha parcial nao e backup.

O restore de Storage:

- valida integralmente manifesto, tamanho e checksum antes da rede;
- aceita apenas `development` ou `staging` com a confirmacao operacional
  canonica;
- recusa restaurar no mesmo project ref da origem;
- exige que migrations/configuracao ja tenham criado buckets equivalentes;
- nao substitui objeto remoto divergente;
- verifica novamente o SHA-256 depois do upload.

Rehearsal de recuperacao deve usar um projeto Supabase descartavel. Nunca
executar teste destrutivo no projeto ativo. Sequencia canonica:

1. Pausar novas admissoes e preservar logs do incidente.
2. Selecionar um backup anterior ao incidente.
3. Restaurar ou clonar o banco para um novo projeto.
4. Aplicar e validar migrations, Edge Functions, Auth, Realtime e secrets.
5. Restaurar os objetos do Storage e validar checksums.
6. Executar migrations drift, Security Authority, RLS e smoke autenticado.
7. Trocar endpoints somente depois de aprovacao operacional; preservar a
   origem para investigacao.

Para alpha privado, backup diario acessivel e um rehearsal aprovado sao
obrigatorios antes de convidar pessoas reais. PITR reduz RPO, mas nao substitui
o rehearsal nem o backup separado de Storage.

## Secrets

Seguir [Workflow de secrets Supabase](../../SUPABASE_SECRETS.md).

Regras:

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` podem existir em env de
  frontend.
- `SUPABASE_SERVICE_ROLE_KEY` nunca entra em `VITE_*` ou browser.
- scripts administrativos carregam service role apenas do shell ou secret
  manager.
- qualquer vazamento suspeito exige rotacao.

A fronteira executavel de `service_role` fora das Edge Functions fica em
`docs/governance/security/SERVICE_ROLE_BOUNDARY_POLICY.json`. O gate
`security:validate` consome esse arquivo e falha quando `SUPABASE_SERVICE_ROLE_KEY`,
`SERVICE_ROLE_KEY` ou `VITE_SUPABASE_SERVICE_ROLE_KEY` aparecem em `src/`,
`public/` ou API runtime fora de caminho allowlistado. Cada excecao precisa
de `kind`, `risk`, `label`, `authority` e padroes permitidos. Caminho
documental pode conter literal; acesso runtime a env continua proibido salvo
em backend, Edge Function ou script operacional classificado.

Para scripts administrativos, o ponto unico de leitura runtime de
`SUPABASE_SERVICE_ROLE_KEY` e `scripts/lib/supabase-client.mjs`. O arquivo
`scripts/lib/supabase-client.ts` e apenas uma fachada tipada para scripts
TypeScript. Scripts operacionais migrados devem importar `createServiceRoleClient`
da fachada adequada ao runtime e nao acessar `process.env.SUPABASE_SERVICE_ROLE_KEY`
diretamente.
O mesmo helper tambem e o unico ponto permitido para chamar `createClient(...)`
em `scripts/`; scripts devem usar `createServiceRoleClient`, `createAnonClient`
ou `createSupabaseScriptClient`. Essa regra e validada por `security:validate`.

Para testes E2E/operacionais, o ponto unico de leitura runtime de
`SUPABASE_SERVICE_ROLE_KEY`, do alias legado `SUPABASE_SECRET_KEY`, de
`VITE_SUPABASE_URL` e da publishable/anon key e
`tests/helpers/operational-env.ts`. Specs em `tests/e2e/` podem citar o nome da
chave em mensagens de skip/setup, mas nao podem montar cliente admin ou anon
lendo env diretamente. Clientes operacionais tambem devem usar `storageKey`
isolada para evitar compartilhamento acidental de sessao entre specs.
Essa regra e executavel: `security:validate` bloqueia `process.env.VITE_SUPABASE_*`,
`readEnv('VITE_SUPABASE_*')` e `createClient(...)` em `tests/e2e/`,
`tests/helpers/` e `tests/operational/`, exceto no helper canonico.

O comando deterministico `npm test` exclui `tests/operational` e nao pode abrir
conexoes remotas. O runner `npm run test:operational` usa apenas essa pasta,
executa em serie e exige `OPERATIONAL_TEST_TARGET`, project ref correspondente e
a confirmacao literal `NON_PRODUCTION_REMOTE_CONFIRMED`. Producao nao e um alvo
valido. Mesmo em development ou staging, testes nao podem redefinir senha de
usuarios descobertos no banco: atores de fixture usam magic link efemero e
fluxos administrativos usam exclusivamente a conta `E2E_ADMIN_*` declarada.
O contrato detalhado fica em `tests/README.md` e e protegido por
`tests/architecture/test-execution-boundary.test.ts`.

No runtime do app, o unico cliente Supabase de browser deve nascer em
`src/integrations/supabase/supabase.ts`, usando `PUBLIC_SUPABASE_CONFIG` e
storage de auth cookie-only. O barrel `src/integrations/supabase/index.ts`
exporta o cliente, tipos e helpers, mas nao reexporta `createClient`. A mesma
fronteira e executavel: `security:validate` bloqueia import/export de
`createClient` vindo de `@supabase/supabase-js` em `src/`, exceto no helper
canonico. Em `api/`, a unica factory permitida e
`api/_shared/supabaseAdmin.ts`; novos endpoints serverless devem usar esse
helper ou uma Edge Function classificada, nao criar cliente paralelo.

Tipos publicos do `supabase-js` usados pelo runtime do app tambem devem entrar
pelo barrel `@/integrations/supabase`. Arquivos de modulo que nao sao boundary
de dados, como hooks, devem consumir contratos expostos pelo service do proprio
modulo em vez de importar o pacote Supabase diretamente. Essa regra tambem e
executavel: `security:validate` bloqueia import/export de `@supabase/supabase-js`
em `src/` fora de `src/integrations/supabase/supabase.ts`,
`src/integrations/supabase/index.ts` e
`src/integrations/supabase/cookieStorage.ts`.

Pages, components, hooks e contexts nao devem chamar `supabase.from`,
`supabase.rpc`, `supabase.storage` ou `supabase.auth` diretamente. A camada de
UI consome services, repositories ou hooks de dominio; esses boundaries podem
chamar Supabase quando a decisao de autorizacao estiver em RLS, RPC ou Edge
Function auditavel. Essa regra evita duplicar filtros de ownership/territorio
em telas e reduz risco de BOLA/IDOR por consulta improvisada. O gate
`security:validate` aplica essa fronteira por meio de
`scripts/security/supabase-access-boundary.mjs`.

Chamadas para Edge Functions no formato broker `{ action, params }` devem usar
o helper de infraestrutura
`src/core/infrastructure/edge-functions/edgeFunctionBroker.ts`. Esse helper
centraliza transporte, log e tratamento de envelope `{ data, error }`; cada
service de dominio continua responsavel por actions, tipos de payload e regras
de negocio. Nao mover queries de dominio para essa pasta: ela existe para
comportamento transversal do client Supabase, nao para concentrar modelos de
negocio. Em 2026-07-08, nao deve existir `body: { action, params }` fora desse
helper. Essa regra e executavel: `security:validate` bloqueia envelopes broker
fora do helper por meio de
`scripts/security/edge-function-broker-boundary.mjs`.

O transporte dos brokers deve encerrar em tempo finito. O helper canonico
aplica timeout padrao e permite que o service reduza esse prazo para dados
opcionais, como contato autenticado. Timeout ou falha de rede nunca autorizam
uma operacao, nao removem RLS e nao podem converter erro em resultado vazio nos
fluxos que decidem sessao ou permissao.

`ALLOWED_ORIGINS` e uma allowlist exata de origem, incluindo esquema, hostname
e porta. Wildcard e proibido. Em desenvolvimento, `localhost` e `127.0.0.1`
sao origens diferentes e cada porta usada pelo Vite ou Playwright deve ser
declarada explicitamente. O baseline local atual e:

```text
http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8099,http://127.0.0.1:8099
```

Esse baseline pertence apenas ao projeto remoto de development. Staging e
producao devem conter somente seus dominios HTTPS reais; origens de loopback
nao devem ser promovidas para producao.

## Advisor Remoto

Advisor nao e checklist cosmetico; ele e evidencia operacional.

Estado registrado em 2026-07-08:

- drift local/remoto reconciliado;
- `validate:migrations:remote` passando;
- Advisor remoto com 12 achados totais;
- achados residuais concentrados em `spatial_ref_sys`, overloads PostGIS
  `st_estimatedextent`, extensoes em `public` e leaked-password protection;
- excecoes formais registradas em
  [Excecoes](./EXCEPTIONS.md) para os itens que dependem de owner/plataforma ou
  Auth Settings.

Antes de reduzir ou ignorar achado residual, registrar:

- por que o achado existe;
- se e falso positivo, risco aceito ou correcao pendente;
- qual migration, dashboard setting ou decisao de produto resolve;
- qual comando foi executado depois.

Nao criar migration padrao para objeto de extensao sem preflight de ownership.
Em 2026-07-08, `alter table public.spatial_ref_sys enable row level security`
falhou no remoto com `must be owner of table spatial_ref_sys`.

Para verificar se surgiram achados novos fora dos residuais aceitos, use:

```powershell
npm run security:advisor:residuals
```

Esse comando depende do projeto Supabase linkado e de credencial remota valida;
por isso nao faz parte do `verify:deploy` local.

Para auditoria offline ou CI com artefato exportado:

```powershell
npm run security:advisor:residuals -- --advisor-json caminho/advisor.json
```

Os `cache_key` aceitos por esse comando ficam em
[SUPABASE_ADVISOR_RESIDUALS.json](./SUPABASE_ADVISOR_RESIDUALS.json), que deve
apontar cada residual para uma excecao formal.

## Comandos

```powershell
npm run validate:migrations
npm run validate:migrations:remote
npm run validate:security-authority
npm run security:validate
npm run verify:deploy
```
