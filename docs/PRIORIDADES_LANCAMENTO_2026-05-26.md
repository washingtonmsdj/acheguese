# Prioridades de Lancamento - 2026-05-26

## Status Executivo

O projeto ainda nao deve ser marcado como 100% pronto para lancamento enquanto o gate completo nao rodar em um ambiente com Node/npm, Git e variaveis reais de producao. A auditoria desta data removeu bloqueios estruturais de release, mas a aprovacao final depende de CI verde.

## P0 - Bloqueadores Antes Do Release

1. Rodar e corrigir tudo que falhar em:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run security:validate`
   - `npm run validate:phase:core`
   - `npm run verify:deploy`
2. Configurar variaveis reais fora do repositorio:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_PUBLIC_SITE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `ALLOWED_REDIRECT_DOMAINS`
3. Confirmar no Supabase que somente `billing-webhook`, `billing-create-checkout` e `billing-create-portal` estao ativos para billing. Funcoes antigas de gastronomia/Stripe foram removidas do repositorio e nao devem permanecer deployadas.
4. Reexecutar E2E visual em browser para comunidade/feed, SEO territorial, central operacional, gastronomia, mobilidade e mobile.

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
