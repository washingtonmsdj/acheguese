# Security Exceptions

Status: ativo
Data: 2026-08-11

Excecao de seguranca e um desvio temporario, visivel e justificado. Ela nao e
atalho permanente nem permissao para gambiarra.

## Quando Abrir

Abrir excecao quando:

- uma regra obrigatoria nao pode ser cumprida agora;
- um achado do Advisor precisa ficar pendente;
- uma RPC precisa continuar exposta enquanto produto/arquitetura decide o
  contrato publico;
- uma configuracao depende de dashboard externo e nao de migration;
- uma validacao falhou por limitacao conhecida, nao por regressao ignorada.

## Quando Nao Abrir

Nao abrir excecao para:

- esconder falta de teste;
- manter mock ou fallback falso em runtime final;
- liberar service role no frontend;
- contornar RLS por conveniencia;
- aceitar BOLA/IDOR conhecido;
- preservar redirect como correcao de autorizacao.

## Formato Obrigatorio

```md
## EXC-YYYY-MM-DD-NOME-CURTO

Status: aberta | fechada
Risco: Critical | High | Medium | Low
Area: Supabase | Auth | Storage | Routes | PII | Other
Responsavel:
Criada em:
Valida ate:
Validacao: local | remota

### Contexto

### Regra Afetada

### Risco

### Mitigacao Temporaria

### Plano De Remocao

### Evidencias
```

## Excecoes Ativas

## EXC-2026-07-15-POSTGREST-SECURITY-DEFINER-COMMANDS

Status: aberta
Risco: Medium
Area: Supabase
Responsavel: Tech/security owner
Criada em: 2026-07-15
Valida ate: 2026-10-15
Validacao: remota

### Contexto

O Advisor passou a reportar toda funcao `SECURITY DEFINER` executavel via
PostgREST. Os RPCs registrados nesta excecao sao fronteiras publicas
intencionais: comandos server-owned, read models privados/admin ou agregados
publicos que precisam consultar tabelas sem conceder acesso direto ao browser.

### Regra Afetada

Funcoes `SECURITY DEFINER` expostas devem ser removidas ou ter contrato,
autorizacao interna, grants minimos e evidencia negativa explicitos.

### Risco

Uma falha de validacao interna poderia transformar privilegio do owner em
BOLA/IDOR, leitura privada ou escrita cross-user. O risco nao e o uso de
`SECURITY DEFINER` isoladamente, mas uma assinatura executavel sem derivacao de
identidade e verificacao do recurso.

### Mitigacao Temporaria

As assinaturas allowlisted possuem `search_path` fixo, grants por papel,
limites de lote/texto/timeout e validacao interna de `auth.uid()`, Profile
ativo, participante ou admin conforme o caso. Tabelas sensiveis continuam sem
grant direto. Probes remotos cobrem anonymous, usuario comum, admin, identidade
forjada e contexto inexistente nos dominios Trust, Reviews, Messaging,
Community, Moderation, Favorites, Notifications e Safety.

Somente quatro RPCs sao anonimos: dois agregados publicos sem eventos/linhas
privadas, a leitura Safety por token aleatorio e a projecao territorial
consentida de Profile. O registro usa cache keys exatas; nao existe wildcard
para novas funcoes.

Os quatro mappings de Poll abaixo sao excecoes individualizadas e nao usam
esta excecao como wildcard: cada role, assinatura, fingerprint, grant,
justificativa e trigger de revalidacao esta registrado em
`POLL_RPC_ADVISOR_MAPPINGS.json`.

### Plano De Remocao

Revisar trimestralmente cada assinatura. Converter para `SECURITY INVOKER`
quando RLS/grants forem suficientes; mover para Edge broker quando a
autorizacao nao puder ser provada integralmente no banco; revogar funcoes sem
consumidor. Uma nova cache key continua falhando ate possuir contrato, teste
negativo remoto e ownership declarado.

### Evidencias

- `npm run security:trust:authz-probe`: 20 casos remotos aprovados em
  2026-07-15;
- `npm run security:reviews:authz-probe`: probes de Reviews existentes;
- probes remotos de Classified Messaging, Community Direct Messaging,
  Moderation/Audit, Notification Preferences e Business Favorites;
- `npm run validate:security-authority` e manifest de ownership aprovados;
- migrations `20260714113000` a `20260715110000`, com marcadores da Security
  Authority, grants explicitos e `search_path` fixo.
- `npm run security:profiles:pii-probe` em 2026-07-18: 11 verificacoes remotas
  aprovadas, incluindo perfil oculto e rejeicao de territorio bruto;
- testes de Coverage, Profile Verification e fronteira de PII em 2026-07-18:
  18 casos aprovados; comandos derivam ator/ownership no servidor e a projecao
  publica nao retorna PII.

## EXC-2026-08-12-POLL-GET-ANON-SECURITY-DEFINER

Status: aberta
Risco: Medium
Area: Community Poll
Responsavel: washingto silva (@washingtonmsdj)
Criada em: 2026-08-12
Valida ate: 2026-09-11
Validacao: remota

### Contexto

O Advisor identifica `anon` executando
`public.get_community_poll_for_post(p_post_id uuid)` como `SECURITY DEFINER`.
Esta e uma leitura publica intencional de DTO agregado.

### Regra Afetada

O read model agregado de Poll permanece exposto por RPC sem linhas privadas.

### Risco

Uma alteracao de visibilidade ou DTO poderia expor dados alem do contrato.

### Mitigacao Temporaria

Owner `postgres`, `STABLE`, `search_path=""`, `PUBLIC=NO`,
`anon=YES`, `authenticated=YES`, fingerprint
`373bef417572dfebb6cd84bbe26cc93b`. O RPC valida Post visivel e nao retorna
linhas de voto, `profile_id` ou `user_id`; os testes anon/authenticated e Post
invisivel passaram na transacao rollback-only.

### Triggers

Fingerprint, grants, DTO/visibilidade ou cache key Advisor novos exigem nova
certificacao individual.

### Plano De Remocao

Converter para invoker quando as politicas RLS e os grants permitirem manter o
mesmo contrato sem privilegio do owner.

### Evidencias

Fingerprint remoto, GET anon/authenticated e Post invisivel passaram; o
mapping detalhado esta em `POLL_RPC_ADVISOR_MAPPINGS.json`.

## EXC-2026-08-12-POLL-GET-AUTH-SECURITY-DEFINER

Status: aberta
Risco: Medium
Area: Community Poll
Responsavel: washingto silva (@washingtonmsdj)
Criada em: 2026-08-12
Valida ate: 2026-09-11
Validacao: remota

### Contexto

O Advisor identifica `authenticated` executando
`public.get_community_poll_for_post(p_post_id uuid)` como `SECURITY DEFINER`.
O contrato e o mesmo read model agregado e sem identidade privada do mapping
anonimo, com assinatura e fingerprint certificados separadamente.

### Regra Afetada

O read model agregado de Poll deve permanecer sem linhas de voto ou identidade.

### Risco

Uma alteracao de DTO ou visibilidade poderia ampliar a leitura autenticada.

### Mitigacao Temporaria

Owner `postgres`, `STABLE`, `search_path=""`, `PUBLIC=NO`,
`anon=YES`, `authenticated=YES`, fingerprint
`373bef417572dfebb6cd84bbe26cc93b`. Os testes authenticated e de Post
invisivel passaram em transacao com rollback.

### Triggers

Fingerprint, grants, DTO/visibilidade ou cache key Advisor novos exigem nova
certificacao individual.

### Plano De Remocao

Converter para invoker quando RLS e grants puderem sustentar a mesma leitura.

### Evidencias

Fingerprint remoto, GET authenticated e Post invisivel passaram; o mapping
detalhado esta em `POLL_RPC_ADVISOR_MAPPINGS.json`.

## EXC-2026-08-12-POLL-CREATE-AUTH-SECURITY-DEFINER

Status: aberta
Risco: Medium
Area: Community Poll
Responsavel: washingto silva (@washingtonmsdj)
Criada em: 2026-08-12
Valida ate: 2026-09-11
Validacao: remota

### Contexto

O Advisor identifica `authenticated` executando
`public.create_post_with_poll(payload jsonb)` como `SECURITY DEFINER`.
O RPC e o comando atomico server-owned de criacao de Post, Poll, options e
projection legada.

### Regra Afetada

Criacao de Post/Poll exige ownership, residencia verificada e atomicidade.

### Risco

Uma falha no broker SQL poderia criar recurso em nome de outro usuario ou
deixar projection parcial.

### Mitigacao Temporaria

Owner `postgres`, `VOLATILE`, `search_path=""`, `PUBLIC=NO`, `anon=NO`,
`authenticated=YES`, fingerprint
`220205a5d9c6d953ae8bee1076629b51`. O comando deriva `auth.uid()`, exige
ownership de Profile e residencia verificada; authenticated create passou,
anon create e payload invalido falharam, todos em transacao rollback-only.

### Triggers

Fingerprint, grants, ownership/residence/payload contract ou cache key Advisor
novos exigem nova certificacao individual.

### Plano De Remocao

Reavaliar invoker somente quando a mesma atomicidade e autorizacao server-owned
forem garantidas pelas politicas RLS.

### Evidencias

CREATE autenticado, CREATE anon e payload invalido passaram na transacao
rollback-only; o mapping detalhado esta em `POLL_RPC_ADVISOR_MAPPINGS.json`.

## EXC-2026-08-12-POLL-VOTE-AUTH-SECURITY-DEFINER

Status: aberta
Risco: High
Area: Community Poll
Responsavel: washingto silva (@washingtonmsdj)
Criada em: 2026-08-12
Valida ate: 2026-09-11
Validacao: remota

### Contexto

O Advisor identifica `authenticated` executando
`public.cast_community_poll_vote(p_poll_id uuid, p_option_id uuid,
p_profile_id uuid)` como `SECURITY DEFINER`. O grant de EXECUTE permite a
invocacao do RPC, mas nao autoriza qualquer authenticated a votar.

### Regra Afetada

VOTE_POLL exige vinculo territorial/comunitario server-side e rollout ativo.

### Risco

Uma regressao poderia permitir voto apenas por autenticacao, spoof de profile
ou territorio, ou escrita fora do contexto da Poll.

### Mitigacao Temporaria

Politica normativa:
`POLL_VOTE_TERRITORY_POLICY=TERRITORIAL_ENGAGEMENT_MEMBER_ALLOWED`.
Owner `postgres`, `VOLATILE`, `search_path=""`, `PUBLIC=NO`, `anon=NO`,
`authenticated=YES`, fingerprint
`e460952f1cdcf85235c6c7779ab841e7`. A migration
`20260812061500_harden_community_poll_vote_territorial_authorization.sql`
deriva o territorio do Poll -> Post -> location, exige Profile ativo
pertencente a `auth.uid()`, residencia ou membership territorial valido e
rollout Community ativo; residencia verificada nao e requisito para o allow.
Authenticated puro, spoof de Profile/territorio/community, ausencia de link,
rollout negado, Post invisivel e option cruzada falharam. Resident,
verified_resident, community_member e verified_community_member passaram;
single-choice e idempotencia passaram; o ROLLBACK deixou zero persistencia.

### Triggers

Fingerprint, grants, politica territorial, rollout, allow indevido de
authenticated puro ou cache key Advisor novo exigem nova certificacao
individual e bloqueiam release.

### Plano De Remocao

Reavaliar invoker apenas se o mesmo controle territorial, atomicidade e
projection puderem ser garantidos sem privilegio do owner.

### Evidencias

A migration, fingerprints, matriz ALLOW/DENY e rollback/no-persistence estao
registrados no mapping detalhado em `POLL_RPC_ADVISOR_MAPPINGS.json`.

## EXC-2026-08-11-AUTH-HIBP-FREE-PLAN

Status: aberta
Risco: High
Area: Auth
Responsavel: washingto silva (@washingtonmsdj)
Criada em: 2026-08-11
Valida ate: 2026-09-10
Validacao: remota

### Contexto

O projeto permanece temporariamente no Supabase Free. O controle HIBP nativo do
Auth esta indisponivel nesse plano; portanto o estado real e
`HIBP_UNAVAILABLE_ON_PLAN`, nao `CONTROL_IMPLEMENTED`.

### Regra Afetada

Cadastro e troca de senha deveriam ser bloqueados pelo proprio provider quando
a senha estiver presente em vazamentos conhecidos.

### Risco

Senhas ja comprometidas aumentam a probabilidade de credential stuffing e
account takeover. A verificacao no app pode falhar aberta por indisponibilidade
de rede e nao cobre chamadas que contornem as superficies do aplicativo.

### Mitigacao Temporaria

- minimo de 12 caracteres e requisitos de complexidade compartilhados;
- secure password change habilitado;
- consulta HIBP por k-anonymity em cadastro, reset e troca de senha;
- a consulta local e explicitamente fail-open;
- a mitigacao nao equivale a leaked-password protection no Auth provider.

### Plano De Remocao

Encerrar imediatamente no primeiro evento aplicavel: upgrade para plano com
HIBP nativo; expiracao; abertura de cadastro/trafego acima do risco aceito; ou
incidente de credential stuffing/account takeover. Habilitar o controle nativo,
reexecutar o Advisor e fechar a excecao. Nao renovar automaticamente.

### Evidencias

- Advisor remoto em 2026-08-11: `auth_leaked_password_protection` permanece;
- `supabase/config.toml` e o SSOT do app exigem comprimento e complexidade;
- `checkPasswordCompromise` cobre as superficies de senha e permanece
  classificado como fail-open;
- SSOT executavel:
  `docs/09-reference/governance/security/FREE_RELEASE_GOVERNANCE.json`.

## EXC-2026-08-11-POSTGIS-PUBLIC-SURFACE

Status: aberta
Risco: High
Area: Supabase
Responsavel: washingto silva (@washingtonmsdj)
Criada em: 2026-08-11
Valida ate: 2026-09-10
Validacao: remota

### Contexto

O preflight read-only de 2026-08-11 reconfirmou o estado material anterior:
PostGIS `3.3.7` em `public`, objetos owned por `supabase_admin`,
`spatial_ref_sys` sem RLS e tres overloads `st_estimatedextent` executaveis por
roles do aplicativo. `citext`, `pg_trgm` e `unaccent` tambem permanecem em
`public` sob o mesmo owner de plataforma.

### Regra Afetada

Extensoes e objetos auxiliares nao deveriam ampliar a superficie do schema
exposto. Funcoes `SECURITY DEFINER` publicas e tabelas sem RLS exigem remocao ou
contrato temporario explicito.

### Risco

A superficie residual inclui leitura de `spatial_ref_sys` por roles do app e
EXECUTE dos tres overloads `st_estimatedextent`. O sistema possui consumidores
reais de tipos geometry/geography, entao mover a extensao sem janela dedicada
pode quebrar colunas, funcoes, indexes e queries geoespaciais.

### Mitigacao Temporaria

- preflight e Advisor remotos permanecem fail-closed;
- nenhuma tentativa cega de owner/schema/grant e autorizada;
- as quatro migrations de release (`20260719122000`, `20260720100000`,
  `20260809184409`, `20260810151941`) nao possuem dependencia PostGIS direta;
- o fingerprint do estado observado e validado; mudanca material bloqueia;
- novos achados, grants ou consumidores exigem reavaliacao.

### Plano De Remocao

Executar janela dedicada e suportada pelo Supabase para revisar schema,
ownership, grants, RLS e dependencias da extensao. Encerrar por remediation,
mudanca de superficie/grants, novo Advisor relevante, exploracao/incidente ou
expiracao. Nao renovar automaticamente.

### Evidencias

- `npm run security:postgis:preflight` em `2026-08-11T22:48:56.498Z`:
  `status=blocked` por ownership, oito achados equivalentes ao baseline;
- Advisor remoto: `extension_in_public`, `rls_disabled_in_public` e seis
  achados dos overloads `st_estimatedextent` permanecem;
- inventario remoto encontrou 11 colunas geometry/geography de produto;
- busca local confirmou zero referencia PostGIS direta nas quatro migrations;
- SSOT executavel e fingerprint:
  `docs/09-reference/governance/security/FREE_RELEASE_GOVERNANCE.json`.

## Excecoes Historicas Expiradas

## EXC-2026-07-08-POSTGIS-EXTENSION-OWNER

Status: fechada
Risco: High
Area: Supabase
Responsavel: Tech/security owner
Criada em: 2026-07-08
Valida ate: 2026-08-08
Validacao: remota
Estado de encerramento: EXPIRED_EXCEPTION
Encerrada em: 2026-08-08

### Contexto

O Advisor remoto ainda reporta `public.spatial_ref_sys` sem RLS, extensoes
instaladas em `public` (`postgis`, `unaccent`, `pg_trgm`, `citext`) e tres
overloads PostGIS `st_estimatedextent` executaveis por `anon` e
`authenticated`.

### Regra Afetada

Schemas expostos nao devem manter tabelas sem RLS, extensoes em `public` ou
funcoes `SECURITY DEFINER` publicas sem contrato explicito.

### Risco

O risco principal e superficie publica herdada de extensao, nao uma RPC de
produto. Ainda assim, o achado e externo e deve sair antes do lancamento quando
houver via suportada para alterar ownership/schema da extensao sem quebrar
dependencias PostGIS.

### Mitigacao Temporaria

O runtime da aplicacao nao chama `st_estimatedextent`; as RPCs de produto foram
movidas para brokers server-side ou convertidas para `SECURITY INVOKER` quando
cabivel. O Advisor remoto esta em 12 achados totais e os unicos achados
`SECURITY DEFINER` restantes sao os tres overloads PostGIS.

### Plano De Remocao

Executar uma janela dedicada de plataforma para mover/reinstalar as extensoes
fora de `public` ou ajustar grants/RLS com o owner correto (`supabase_admin`) via
caminho suportado pelo Supabase. Nao criar migration padrao como `postgres` para
esse item sem preflight bem-sucedido, porque ela nao tem ownership suficiente.

Comando operacional preparado:

```powershell
npm run security:postgis:preflight
```

Esse comando executa apenas `SELECT` no catalogo remoto linkado e gera status
JSON sobre owner/schema/RLS/grants dos objetos residuais. Ele nao altera
extensoes, grants, RLS ou migrations; se retornar `blocked`, o marcador
`extension-owner-preflight` continua proibido para novas migrations.

### Evidencias

- `supabase db advisors --linked --type security --fail-on none --output json`
  em 2026-07-08: 12 achados totais.
- Preflight remoto em 2026-07-08 para `alter table public.spatial_ref_sys enable
row level security` falhou com `ERROR: 42501: must be owner of table
spatial_ref_sys`.
- `npm run security:postgis:preflight` em 2026-07-08 retornou `status=blocked`
  para extensoes `citext`, `pg_trgm`, `postgis`, `unaccent`,
  `public.spatial_ref_sys` e tres overloads `public.st_estimatedextent`, todos
  com owner `supabase_admin` e `ready=false`.
- Nova execucao em 2026-07-08 confirmou o mesmo `status=blocked`, sem alteracao
  remota e sem habilitar o marcador `extension-owner-preflight`.
- Execucao em 2026-07-08T18:13Z de `npm run security:postgis:preflight`
  confirmou novamente `status=blocked`: extensoes `citext`, `pg_trgm`,
  `postgis`, `unaccent`, `public.spatial_ref_sys` e tres overloads
  `public.st_estimatedextent` continuam com owner `supabase_admin` e
  `ready=false`.
- `npm run security:advisor:residuals` em 2026-07-08 validou 12 achados
  remotos, todos dentro dos residuais mapeados.
- Execucao em 2026-07-08T18:13Z de `npm run security:advisor:residuals`
  reconfirmou 12 achados remotos, todos dentro da allowlist canonica.
- `supabase/migrations/20260707124929_revoke_public_postgis_estimatedextent_execute.sql`
  tentou revogar os overloads, mas os grants permaneceram por ownership/grantor
  da extensao.
- Execucao em 2026-07-09T20:35Z de `npm run security:postgis:preflight`
  confirmou `status=blocked`, com extensoes `citext`, `pg_trgm`, `postgis`,
  `unaccent`, `public.spatial_ref_sys` e tres overloads
  `public.st_estimatedextent` ainda owned por `supabase_admin` e
  `ready=false`.
- Execucao em 2026-07-09 de `npm run security:advisor:residuals` validou 12
  achados remotos, todos dentro da allowlist canonica.
- Execucao em 2026-07-13 de `npm run security:postgis:preflight` retornou
  novamente `status=blocked`: extensoes `citext`, `pg_trgm`, `postgis`,
  `unaccent`, `public.spatial_ref_sys` e tres overloads
  `public.st_estimatedextent` permanecem owned por `supabase_admin` e sem
  preflight aprovado.
- Execucao em 2026-07-13 de `npm run security:advisor:residuals` validou os
  mesmos 12 achados remotos, todos dentro da allowlist canonica.
- Auditoria local em 2026-08-09 confirmou que a excecao venceu e que nenhuma
  evidencia local prova o owner/estado atual dos objetos. Encerramento ou nova
  vigencia exige preflight e Advisor remotos; a data nao foi renovada.

## EXC-2026-07-08-AUTH-HIBP-DASHBOARD

Status: fechada
Risco: Medium
Area: Auth
Responsavel: Tech/security owner
Criada em: 2026-07-08
Valida ate: 2026-08-08
Validacao: remota
Estado de encerramento: EXPIRED_EXCEPTION
Encerrada em: 2026-08-08

### Contexto

O Advisor remoto ainda reporta `auth_leaked_password_protection`. A
documentacao oficial indica que a protecao usa a API Pwned Passwords do
HaveIBeenPwned e fica disponivel no plano Pro ou superior.

### Regra Afetada

Projetos com login por senha devem bloquear senhas conhecidas em vazamentos
quando o plano Supabase permitir.

### Risco

Sem HIBP, usuarios podem cadastrar ou trocar para senhas ja vazadas, aumentando
risco de credential stuffing e takeover.

### Mitigacao Temporaria

`supabase/config.toml` ja exige `minimum_password_length = 12`,
`password_requirements = "lower_upper_letters_digits_symbols"` e
`secure_password_change = true`. A politica compartilhada do app usa o mesmo
minimo de 12 caracteres e exige maiuscula, minuscula, numero e caractere
especial. A mitigacao local `checkPasswordCompromise` consulta HIBP por
k-anonymity e cobre cadastro, redefinicao e troca de senha; a Security
Authority bloqueia chamada direta a `HibpService` nessas superficies. Essa
mitigacao reduz risco, mas nao substitui a verificacao do provedor de Auth.

### Plano De Remocao

Habilitar leaked-password protection no dashboard Supabase Auth Settings ou via
Management API `PATCH /v1/projects/{ref}/config/auth` com
`password_hibp_enabled = true`, usando PAT valido com `auth_config_write` e
`project_admin_write`. Depois, reexecutar o Advisor remoto e fechar esta
excecao se o achado desaparecer.

Comando operacional preparado:

```powershell
npm run security:auth:hibp -- --apply
npm run security:auth:hibp -- --json
```

Esse comando usa `SUPABASE_ACCESS_TOKEN` ou `SUPABASE_MANAGEMENT_API_TOKEN` e o
project ref linkado em `supabase/.temp/project-ref`. Ele nao entra no
`verify:deploy` porque depende de PAT, plano Supabase compativel e acesso remoto
ao Management API. A opcao `--json` imprime apenas status, project ref e nome da
env var usada, nunca o valor do token.

### Evidencias

- Documentacao oficial de password security:
  https://supabase.com/docs/guides/auth/password-security
- Documentacao oficial da Management API:
  https://supabase.com/docs/reference/api/introduction
- CLI local `supabase config` na versao 2.98.2 nao oferece subcomando granular
  para esse ajuste; a tentativa de chamar a Management API com o token local em
  arquivo retornou 401, portanto nao foi feita alteracao cega.
- `npm run security:auth:hibp -- --json` em 2026-07-08 retornou JSON
  estruturado com `status=blocked` e `blocker=missing_pat`, sem imprimir valor
  de token. A correcao remota continua dependente de PAT valido e plano
  Supabase compativel.
- Execucao em 2026-07-08T18:13Z de `npm run security:auth:hibp -- --json`
  retornou novamente `status=blocked`, `blocker=missing_pat`, project ref
  `xhdowzacfujckjelqhtd` e nome das env vars esperadas, sem imprimir segredo e
  sem aplicar alteracao remota.
- Execucao em 2026-07-09T20:34Z de `npm run security:auth:hibp -- --json`
  retornou `status=blocked`, `blocker=missing_pat`, project ref
  `xhdowzacfujckjelqhtd` e nome das env vars esperadas, sem imprimir segredo e
  sem aplicar alteracao remota.
- Execucao em 2026-07-13 de `npm run security:auth:hibp --check` confirmou
  novamente ausencia de `SUPABASE_ACCESS_TOKEN` ou
  `SUPABASE_MANAGEMENT_API_TOKEN` com os escopos necessarios. Nenhum token
  implicito foi lido e nenhuma configuracao remota foi alterada.
- Auditoria local em 2026-08-09 confirmou que a excecao venceu sem evidencia
  nova do Dashboard/Advisor remoto. A data nao foi renovada; fechamento ou
  nova vigencia exige prova remota de `password_hibp_enabled`.

Achados residuais do Supabase Advisor tambem devem continuar registrados no
relatorio canonico:

- [Advisor remoto Supabase](../../audits/SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md)
