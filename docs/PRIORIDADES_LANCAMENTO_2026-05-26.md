# Prioridades de Lancamento - 2026-05-26

## Status Executivo

Status historico de 2026-05-26. O status operacional vigente fica em
`docs/STATUS_ATUAL.md`.

Atualizacao 2026-07-08: `npm run typecheck`, `npm run lint`,
`npm run security:validate`, `npm run validate:phase:core`,
`npm run verify:deploy` e `npm run build` passaram no ambiente local atual. No
Supabase remoto, `billing-webhook`,
`billing-create-checkout`, `billing-create-portal` e `billing-entitlements-rpc`
estao `ACTIVE`; as funcoes legadas `stripe-webhook`,
`gastronomy-upgrade-plan`, `gastronomy-cancel-subscription`,
`gastronomy-reactivate-subscription` e `gastronomy-add-payment-method` nao estao
presentes. As pendencias remotas restantes antes do lancamento sao as excecoes
ativas em `docs/governance/security/EXCEPTIONS.md`.

## P0 - Bloqueadores Antes Do Release

1. [Fechado em 2026-07-08] Rodar e corrigir tudo que falhar em:
   - `npm run typecheck`: passou.
   - `npm run lint`: passou.
   - `npm run security:validate`: passou.
   - `npm run validate:phase:core`: passou com E2E `53/53`.
   - `npm run verify:deploy`: passou com `PROJETO PRONTO PARA DEPLOY`.
2. Configurar variaveis reais fora do repositorio:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_PUBLIC_SITE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `ALLOWED_REDIRECT_DOMAINS`
3. [Fechado em 2026-07-08] Confirmar no Supabase que somente
   `billing-webhook`, `billing-create-checkout`, `billing-create-portal` e
   `billing-entitlements-rpc` estao ativos para billing. Funcoes antigas de
   gastronomia/Stripe foram removidas do repositorio e nao estao presentes no
   remoto.
4. [Fechado em 2026-07-08] Reexecutar E2E visual em browser para
   comunidade/feed, SEO territorial, central operacional, gastronomia,
   mobilidade e mobile. Resultado: `49/49` testes passaram em Chromium; o
   pacote focado de gastronomia/mobilidade tambem passou com `7/7`.

## P1 - Hardening Profissional

1. Aumentar rigor de TypeScript por modulo, reduzindo `any` e casts apenas onde houver contrato runtime claro.
2. Auditar migrations com `SECURITY DEFINER` e garantir `SET search_path` explicito em funcoes sensiveis.
3. Consolidar docs vivas e arquivar documentos historicos que contradizem o status atual.
4. Substituir confirmacoes nativas restantes por dialogs auditaveis nos fluxos destrutivos ainda nao cobertos.

## P2 - Pos-Lancamento Controlado

1. Criar observabilidade de checkout/webhook com alertas por falha de sincronizacao Stripe.
2. Medir Core Web Vitals e tamanho de bundles nas rotas publicas mais acessadas.
3. Revisar textos finais de SEO/social para campanhas por territorio.

## Fechado Nesta Auditoria

- Scripts de release deixaram de apontar para specs/testes ausentes.
- `.gitignore` deixou de ignorar testes versionaveis.
- Assets PWA e OG foram recriados e `manifest.json` foi adicionado.
- `.env` e `.env.production` viraram templates sem segredos.
- Billing legado de gastronomia foi removido do runtime.
- Acesso runtime a `business_subscriptions` tambem foi removido de `src`; o core billing, admin e mobilidade passaram a consultar `user_subscriptions`.
- `billing-create-checkout` passou a validar propriedade do negocio e enviar contexto de contrato ao Stripe.
- `billing-webhook` passou a resolver catalogo publicado, evitar upsert por conflito fraco e atualizar contratos por `stripe_subscription_id`.
- Gate `verify:deploy` passou a checar assets PWA e ausencia das edge functions antigas.
