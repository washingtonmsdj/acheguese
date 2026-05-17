# Comandos - Benchmark de Circulacao Economica

## Objetivo

Executar benchmark SQL de staging com saida versionavel (antes/depois).

## SSOT operacional

Comandos de benchmark economico agora usam um executor canônico unico:

- `scripts/economic-benchmark-ssot.mjs`

## Script usado

- `docs/architecture/sql/economic-circulation-performance-check.sql`

## Opcao 1 - psql (recomendado)

Defina variaveis:

```powershell
$env:PGHOST="SEU_HOST"
$env:PGPORT="5432"
$env:PGDATABASE="postgres"
$env:PGUSER="SEU_USUARIO"
$env:PGPASSWORD="SUA_SENHA"
```

Executar benchmark e salvar log:

```powershell
New-Item -ItemType Directory -Force -Path ".tmp\bench" | Out-Null
psql -v ON_ERROR_STOP=1 `
  -f "docs/architecture/sql/economic-circulation-performance-check.sql" `
  > ".tmp/bench/economic-circulation-before.txt"
```

Depois de aplicar migration/otimizacao, rodar novamente:

```powershell
psql -v ON_ERROR_STOP=1 `
  -f "docs/architecture/sql/economic-circulation-performance-check.sql" `
  > ".tmp/bench/economic-circulation-after.txt"
```

Comparar before/after com resumo automatico:

```powershell
npm run bench:economic:compare
```

Saidas geradas:

- resumo no terminal
- arquivo Markdown: `.tmp/bench/economic-circulation-summary.md`

## Fluxo canonico (recomendado)

Depois de configurar variaveis de ambiente do banco (`PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`):

```powershell
npm run bench:economic:before
```

Aplicar migration/otimizacao e rodar:

```powershell
npm run bench:economic:after
```

O comando `after` ja dispara a comparacao automaticamente quando os dois arquivos existem.

Gerar rascunho do relatorio de staging:

```powershell
npm run bench:economic:report
```

Saida:

- `.tmp/bench/economic-circulation-staging-report-draft.md`

Validar se o pacote de benchmark ficou completo:

```powershell
npm run bench:economic:finalize
```

## Comandos auxiliares (mesmo SSOT)

```powershell
npm run bench:economic:compare
npm run bench:economic:report
```

## Opcao 2 - Supabase SQL Editor

1. Abrir `docs/architecture/sql/economic-circulation-performance-check.sql`
2. Executar no ambiente staging
3. Salvar resultado completo em:
- `.tmp/bench/economic-circulation-before.txt`
- `.tmp/bench/economic-circulation-after.txt`

## Checklist minimo de coleta

- `before` coletado
- `after` coletado
- p95 de logs aplicacao coletado
- template preenchido:
  - `docs/architecture/ECONOMIC_CIRCULATION_STAGING_REPORT_TEMPLATE.md`
