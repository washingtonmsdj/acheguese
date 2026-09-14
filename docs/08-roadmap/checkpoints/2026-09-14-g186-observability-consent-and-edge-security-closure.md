# G186 — observabilidade por consentimento e fechamento de segurança Edge

**Data:** 2026-09-14  
**Branch operacional:** `main`

## Escopo concluído

Esta rodada fechou dois débitos concretos já identificados, sem reabrir a `/` como frente de produto:

1. serialização das transições de Session Replay do Sentry quando o consentimento de analytics muda durante a sessão;
2. correção do contrato CORS de respostas `429`/auth nas Edge Functions, seguida de promoção e re-leitura dos endpoints GET/multimétodo afetados.

## 1. Sentry: erro operacional separado de telemetria opcional

`src/shared/config/sentry.config.ts` mantém inicialização de error monitoring independente do consentimento de analytics, mas tracing, Replay e reporter de Web Vitals permanecem opcionais.

A corrida `stop()` assíncrono versus novo `start()` foi removida:

- `optionalReplaySyncPromise` serializa transições;
- a fila consulta `optionalTelemetryEnabled` quando executa, não um booleano antigo capturado no agendamento;
- `replay.stop()`, `replay.start()` e `replay.startBuffering()` são aguardados;
- o estado local só marca Replay iniciado/parado depois de sucesso;
- o modo sorteado de Replay permanece estável durante o documento;
- `replaysSessionSampleRate` e `replaysOnErrorSampleRate` continuam `0` no `Sentry.init`, portanto não existe gravação automática antes do opt-in.

Ratchet criado em `tests/architecture/sentry-optional-telemetry-consent.test.ts`.

Commits principais:

- `681e2115cb8d67664762b359d988e5764928d150` — serialização de Replay;
- `4bc58869ccb7dd2060be48e7534040b34c1164c1` — ratchet arquitetural.

## 2. Rate limit: CORS deixa de fingir POST em endpoints GET

O owner `supabase/functions/_shared/security.ts` não hardcodeia mais `POST, OPTIONS` na resposta `429`.

Contrato atual:

- sem argumento explícito, `rateLimitMiddleware` deriva ``${req.method}, OPTIONS``;
- endpoint multimétodo pode informar a lista completa no quarto argumento;
- `get-push-config`, que aceita GET e POST, passa `ALLOWED_METHODS` explicitamente;
- `sitemap` e `health-check`, GET-only, usam o fallback derivado do request.

Commits principais:

- `72038c49d94ed6c84c5cdc2c656a39cc51ffc7bb` — middleware caller-aware;
- `1b617a6dad61c257a6606a81bd5749b8a3f64e20` — fallback derivado do método real;
- `46b601e8c073fb2968855f795c522fa5c5b0858b` — contrato multimétodo do push config;
- `9cceb20c8d9f29896de404e6514949deb0e69a69` — ratchet inicial de CORS do rate-limit.

## 3. Auth administrativo: respostas de falha também são request-aware

A inspeção do `health-check` mostrou que corrigir apenas `429` ainda deixaria `401/403/500` do `requireAdmin()` no default histórico de POST e sem o request para resolução de Origin.

`supabase/functions/_shared/adminAuth.ts` agora:

- deriva por padrão ``${req.method}, OPTIONS``;
- repassa `req` e `methods` para `errorResponse` em todos os caminhos de falha;
- permite lista explícita em callers multimétodo;
- preserva role SSOT e MFA server-side.

Commit:

- `3b4b5975525aca33562be2fbed29f2c8a134bc54`.

O ratchet `tests/architecture/edge-rate-limit-cors-methods.test.ts` foi ampliado para proteger também esse contrato e impedir retorno do `health-check` a CORS `*` ou ao bucket legado `avatars`.

Commit:

- `090da33ab4f968cf3da05c8346c9946ad1576f56`.

## 4. Estado remoto do Supabase após promoção

Projeto verificado: `acheguese` (`xhdowzacfujckjelqhtd`).

### `get-push-config`

- ACTIVE;
- versão `24`;
- `verify_jwt=false`, preservado;
- bundle re-lido após deploy;
- chamada ao rate limit recebe `GET, POST, OPTIONS`;
- shared bundle contém `responseMethods` e não usa POST hardcoded na resposta 429.

### `sitemap`

- ACTIVE;
- versão `18`;
- `verify_jwt=false`, preservado;
- lógica de geração de URLs, filtros públicos e cache preservada;
- bundle re-lido após deploy;
- `429` GET agora resolve `GET, OPTIONS` pelo owner compartilhado.

### `health-check`

Antes da promoção, o remoto v14 estava materialmente obsoleto: tinha CORS `*`, não usava `requireAdmin`, consultava o bucket `avatars` e podia devolver detalhes internos em erro.

Após a promoção:

- ACTIVE;
- versão `15`;
- `verify_jwt=true`, preservado;
- usa `requireAdmin` + policy MFA;
- usa headers de segurança compartilhados;
- rate limit GET é request-aware;
- verifica o bucket canônico `media-assets`;
- não devolve o erro interno bruto no envelope final;
- bundle re-lido após deploy confirmou esses invariantes.

## 5. O que foi e não foi validado

**Validado nesta rodada:**

- source gravado diretamente na `main`;
- documentação atual do Sentry para controle manual de Replay;
- documentação atual do Supabase sobre métodos/CORS de Edge Functions;
- estado remoto do projeto Supabase antes das promoções;
- versões, `verify_jwt` e arquivos empacotados re-lidos depois de cada deploy relevante.

**Ainda não certificado:**

- Vitest;
- typecheck/lint/build do frontend;
- E2E;
- chamada HTTP autenticada ao `health-check` com uma sessão admin+AAL2;
- cenário real de 429, que deliberadamente não foi provocado com rajada contra produção;
- GET público externo de `sitemap`/`get-push-config`: a ferramenta HTTP disponível nesta sessão recusou abrir diretamente o host Supabase, então não há alegação de smoke HTTP.

Criar dezenas/centenas de requests apenas para provar um 429 em produção não é um teste aceitável nesta etapa; o contrato foi verificado no bundle ativo.

## 6. Estado operacional

- `/` continua feature-complete no source para o MVP atual conforme G185;
- CSS legado físico da `/` continua dívida de manutenção e não deve ser mascarado com alias/override;
- error monitoring do Sentry permanece essencial e separado de analytics opcional;
- respostas Edge devem preservar método + Origin também em erro/rate-limit;
- Mobilidade continua pausada e não recebe mudança de launch gate sem E2E + security + build + deploy no mesmo SHA.
