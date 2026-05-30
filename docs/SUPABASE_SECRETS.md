# Supabase Secrets Local Workflow

## Objective

Keep public Supabase config in the repository-local environment files and keep the administrative secret outside the repository in an encrypted local store.

## Canonical Rules

- `VITE_SUPABASE_URL` may exist in `.env.local`, `.env`, or `.env.remote`.
- `VITE_SUPABASE_PUBLISHABLE_KEY` may exist in `.env.local`, `.env`, or `.env.remote`.
- Real `SUPABASE_SERVICE_ROLE_KEY` values must not be persisted in repository environment files. Templates may contain empty placeholders only.
- `SUPABASE_ANON_KEY` is required by Supabase Edge Functions and may use the same current public publishable/anon key value.
- `VITE_SUPABASE_SERVICE_ROLE_KEY` is deprecated and must not be introduced again.
- Frontend code must not depend on service-role credentials.
- Administrative scripts may consume `SUPABASE_SERVICE_ROLE_KEY` only from the current shell or a backend secret manager.
- Edge Function provider secrets are documented in `docs/EDGE_FUNCTION_SECRETS.md`.

## Current Local Workflow

### 1. Save secrets securely

Use the PowerShell helper to fetch project keys and store the admin secret encrypted with Windows DPAPI for the current user:

```powershell
.\scripts\security\Save-LocalSupabaseSecrets.ps1 -FetchFromSupabase
```

This stores the encrypted payload outside the repository at:

`%APPDATA%\AchegueSe\Secrets\<project-ref>\supabase-secrets.json.dpapi`

### 2. Load secrets into the current shell

When you need to run admin scripts:

```powershell
.\scripts\security\Import-LocalSupabaseSecrets.ps1
```

This loads these variables into the current PowerShell session:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Rewrite a public `.env.local` if needed

```powershell
.\scripts\security\Import-LocalSupabaseSecrets.ps1 -WritePublicEnvFile .env.local
```

This writes only public variables to `.env.local`. It does not persist the service-role secret.

## What Works From Now On

- Frontend runtime uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
- Edge Functions use `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Login, signup, public reads, and normal browser flows continue to work without admin secrets.
- Admin scripts work after the local import step loads `SUPABASE_SERVICE_ROLE_KEY` into the shell.

## Required Guidance For Humans And Agents

If another developer or another AI agent needs to operate this project, the expected procedure is:

1. Use `.env.local` only for public Supabase config.
2. Never write `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_SERVICE_ROLE_KEY` into repository env files.
3. Run `Import-LocalSupabaseSecrets.ps1` before executing admin scripts.
4. Prefer backend secrets or shell-only env vars for administrative operations.

## Rotation

If the admin key was ever stored in plaintext locally, rotate it in Supabase and save the new value again with the secure helper.
