# Edge Function Runtime Secrets

This is the canonical checklist for Supabase Edge Function runtime
configuration. Templates live in `.env.example`, `.env.local.example`, and
`.env.production`; real values must live in the deploy provider or Supabase
secrets, never in committed files.

## Required Runtime Variables

Supabase:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Public origin, CORS, redirects, and cron:

- `BASE_URL`
- `ALLOWED_ORIGINS`
- `ALLOWED_REDIRECT_DOMAINS`
- `CRON_SECRET`

Push notifications:

- `VAPID_PUBLIC_KEY`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`

Email:

- `RESEND_API_KEY`
- `FROM_EMAIL`
- `EMAIL_FROM_DOMAIN`
- `EMAIL_FROM_NAME`

Billing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

AI:

- `LOVABLE_API_KEY`
- `REPLICATE_API_TOKEN`
- `TRYON_REPLICATE_MODEL_VERSION`
- `TRYON_REPLICATE_HUMAN_IMAGE_URL`

Geocoding proxy:

- `NOMINATIM_BASE_URL`
- `NOMINATIM_USER_AGENT`
- `NOMINATIM_ACCEPT_LANGUAGE`
- `NOMINATIM_DEFAULT_COUNTRY`
- `NOMINATIM_DEFAULT_COUNTRY_CODES`
- `NOMINATIM_DEFAULT_FORMAT`
- `NOMINATIM_DEFAULT_ADDRESSDETAILS`
- `NOMINATIM_DEFAULT_LIMIT`

If gender-specific try-on reference images are required, configure all of:

- `TRYON_REPLICATE_HUMAN_IMAGE_MALE_URL`
- `TRYON_REPLICATE_HUMAN_IMAGE_FEMALE_URL`
- `TRYON_REPLICATE_HUMAN_IMAGE_NEUTRAL_URL`

## Security Rules

- Never use `SUPABASE_SERVICE_ROLE_KEY` as an HTTP authorization token.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, Firebase service
  account JSON, Resend keys, Replicate tokens, or Lovable keys to browser code.
- `SUPABASE_ANON_KEY` is the server-side env name expected by Edge Functions;
  its value can be the current public publishable/anon Supabase key.
- Missing required runtime secrets must fail closed. Do not add fallback domains,
  fallback sender emails, fallback model versions, or fake provider responses.
- CORS and redirect allowlists must come from `ALLOWED_ORIGINS` and
  `ALLOWED_REDIRECT_DOMAINS`.
- `ALLOWED_ORIGINS` matches the full origin exactly. Scheme, hostname, and port
  are significant; wildcards are forbidden.
- Development must list each Vite/Playwright loopback origin explicitly. The
  repository baseline is the value documented in `.env.example`; production
  must contain only real HTTPS origins.

## Supabase Setup

Set secrets with the Supabase CLI or dashboard. Example shape:

```powershell
supabase secrets set SUPABASE_URL="https://your-project.supabase.co"
supabase secrets set SUPABASE_ANON_KEY="[public publishable or anon key]"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="[service role key]"
supabase secrets set BASE_URL="https://your-public-domain.example"
supabase secrets set ALLOWED_ORIGINS="https://your-public-domain.example"
supabase secrets set ALLOWED_REDIRECT_DOMAINS="your-public-domain.example"
supabase secrets set CRON_SECRET="[random high-entropy value]"
```

Use the same pattern for provider-specific secrets listed above.

Development example:

```powershell
supabase secrets set ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:8080,http://127.0.0.1:8080,http://localhost:8099,http://127.0.0.1:8099"
```

## Verification

Before launch, run:

```powershell
npm run security:validate
node scripts/verify-deploy-ready.mjs
```

`scripts/verify-deploy-ready.mjs` intentionally fails when required runtime
variables are missing or still contain placeholders.
