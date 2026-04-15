# Politica de Seguranca

## Reportar Vulnerabilidades

Se voce descobriu uma vulnerabilidade de seguranca, nao abra issue publica. Encaminhe os detalhes para o canal de seguranca do projeto.

## Documentacao Completa

- [docs/SECURITY.md](./docs/SECURITY.md)
- [docs/SUPABASE_SECRETS.md](./docs/SUPABASE_SECRETS.md)

## Validacao Rapida

```bash
npm run security:validate
```

## Configuracao Segura

`.env.local` deve conter apenas configuracao publica do frontend:

```env
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-publica"
```

A chave administrativa nao deve ser persistida no repositorio. Para operacoes admin, carregue no shell atual:

```powershell
.\scripts\security\Import-LocalSupabaseSecrets.ps1
```

## Regras Importantes

- Nunca persistir `SUPABASE_SERVICE_ROLE_KEY` em `.env`, `.env.local` ou `.env.remote`.
- Nunca introduzir `VITE_SUPABASE_SERVICE_ROLE_KEY` novamente.
- Frontend nao deve depender de credencial administrativa.
- Scripts administrativos devem usar segredo do shell atual ou backend.

Ultima atualizacao: 2026-04-14
