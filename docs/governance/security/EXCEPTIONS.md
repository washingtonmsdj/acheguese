# Security Exceptions

Status: ativo
Data: 2026-07-08

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

### Contexto

### Regra Afetada

### Risco

### Mitigacao Temporaria

### Plano De Remocao

### Evidencias
```

## Excecoes Ativas

## EXC-2026-07-08-POSTGIS-EXTENSION-OWNER

Status: aberta
Risco: High
Area: Supabase
Responsavel: Tech/security owner
Criada em: 2026-07-08
Valida ate: 2026-08-08

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

## EXC-2026-07-08-AUTH-HIBP-DASHBOARD

Status: aberta
Risco: Medium
Area: Auth
Responsavel: Tech/security owner
Criada em: 2026-07-08
Valida ate: 2026-08-08

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

Achados residuais do Supabase Advisor tambem devem continuar registrados no
relatorio canonico:

- [Advisor remoto Supabase](../../audits/SUPABASE_REMOTE_SECURITY_ADVISOR_2026-07-06.md)
