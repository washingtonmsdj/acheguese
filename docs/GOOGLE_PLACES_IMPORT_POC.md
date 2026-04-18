# Google Places Import POC (Salvador)

Este POC permite testar importacao de empresas para `business_data` com dois caminhos:

- CLI local (`scripts/import-google-places-salvador.ts`)
- Endpoint admin (`POST /api/admin/google-places-import`)

## Variaveis de ambiente

- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IMPORT_ADMIN_TOKEN` (apenas para endpoint)

Opcional para gerar o preview real:

- `GOOGLE_PLACES_API_KEY` ou `VITE_GOOGLE_MAPS_API_KEY`

## Fluxo recomendado

1. Gerar preview real
2. Rodar dry-run
3. Revisar plano
4. Rodar apply com owner definido

## CLI

Gerar preview:

```bash
npm run test:google-places:salvador -- --limit=20 --pages=1
```

Dry-run:

```bash
npm run import:google-places:salvador -- --mode=dry-run --limit=20
```

Apply:

```bash
npm run import:google-places:salvador -- --mode=apply --owner-user-id=UUID_DO_OWNER --limit=20
```

## Endpoint admin

URL:

```text
POST /api/admin/google-places-import
```

Auth header:

```text
x-import-admin-token: <IMPORT_ADMIN_TOKEN>
```

Body dry-run:

```json
{
  "mode": "dry-run",
  "limit": 20,
  "sample": false
}
```

Body apply:

```json
{
  "mode": "apply",
  "limit": 20,
  "ownerUserId": "UUID_DO_OWNER",
  "sample": false
}
```

## Seguranca e compliance

- O POC marca registros como `claim_status: "unclaimed"` no `metadata`.
- Dedupe por `metadata.google_place_id`.
- Slug e handle unicos.
- Nao importa fotos/reviews.
- Antes de producao, validar ToS/licenciamento dos campos usados.
