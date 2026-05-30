# Supabase Auth Storage

## Status atual

O frontend Vite usa `StrictBrowserAuthStorage` como storage do Supabase Auth.

Contrato de producao:

- cookies de browser com `SameSite=Strict`
- `Secure` quando a pagina esta em HTTPS
- armazenamento em chunks quando a sessao excede o limite de um cookie
- nenhuma persistencia de token de auth em `localStorage`
- limpeza de chaves legadas conhecidas em `localStorage`
- fluxo Supabase `pkce`

## Limite arquitetural

Cookies criados por JavaScript nao podem ser `HttpOnly`. Portanto este projeto nao trata o storage do SPA como protecao HttpOnly.

Para obter HttpOnly real, a autenticacao precisa migrar para uma fronteira server-side, por exemplo uma camada SSR/BFF que use `Set-Cookie` no servidor e troque sessoes com o Supabase fora do JavaScript do navegador.

## SSOT

As configuracoes ficam centralizadas em `src/config/security.config.ts`:

- `SECURE_COOKIE_CONFIG`
- `AUTH_COOKIE_PREFIX`
- `AUTH_STORAGE_KEY`
- `AUTH_BROWSER_STORAGE_CONFIG`

O cliente Supabase consome esse contrato em `src/integrations/supabase/supabase.ts`, e a implementacao do storage fica em `src/integrations/supabase/cookieStorage.ts`.

## Regras de manutencao

- Nao reintroduzir fallback de auth para `localStorage`.
- Nao afirmar HttpOnly no cliente Vite.
- Nao criar outra chave de storage fora do SSOT.
- Nao alterar limites de chunking fora de `AUTH_BROWSER_STORAGE_CONFIG`.
- Preferir PKCE para novos fluxos de autenticacao.
