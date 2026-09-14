# G183 — root navigation and sitemap runtime hardening

Data: 2026-09-14

## Escopo

Continuação da linha da entrada pública `/`, consolidando navegação institucional, responsividade do menu móvel, recuperação progressiva do mapa e projeção SEO/sitemap no source e no runtime Supabase sem reabrir bridges ou aliases antigos.

## Implementado no source

### Entrada pública

- `TerritoryEntryPage.tsx` passou a consumir `PRIVACY_POLICY_PATH` de `src/shared/constants/legal.ts` no menu móvel e no footer; a página não mantém mais `href="/privacidade"` paralelo.
- o menu móvel fecha automaticamente ao cruzar o breakpoint para desktop, evitando que um popover oculto permaneça aberto e reapareça ao reduzir o viewport novamente.
- `root-entry-community-first.test.ts` protege o path legal canônico e o reset responsivo do menu.
- `TerritoryEntryMapRuntime.tsx` agora registra quando o fallback terminal de 6 s foi exibido. Se o MapLibre carregar depois desse timeout, a recuperação revela o canvas real diretamente e não revive o skeleton por mais um crossfade de 160 ms.
- o carregamento normal, sem timeout, preserva o crossfade existente do arrival skeleton.
- `territory-entry-map-progressive-performance.test.ts` protege a distinção entre carregamento normal e recuperação tardia.

### Sitemap de release

- `src/core/routing/seo/generateSitemap.ts` reutiliza `SUPPORT_PATH`, `TERMS_OF_SERVICE_PATH` e `PRIVACY_POLICY_PATH` em vez de redefinir `/contato`, `/termos` e `/privacidade`.
- o pipeline canônico continua sendo `run-vercel-production-build.mjs`: gera sitemap, valida `public`, executa o build Vercel e valida `dist`.

### Sitemap Edge

- `supabase/functions/sitemap/index.ts` não anuncia mais Mobilidade enquanto `PUBLIC_LAUNCH_SURFACES.mobility=false`.
- foram removidas duas URLs estáticas sem rota canônica: `/comunidade` e `/cookies`.
- `/comunidade` é explicitamente proibida como top-level route pelo contrato `communityRoutesCanonical.spec.ts`; comunidade pública usa a arquitetura territorial/aliases vigentes.
- o Edge sitemap continua usando `_shared/security.ts`, `_shared/url_validation.ts`, `business_data`, aliases públicos de comunidade e URLs territoriais/classificados atuais.
- `_shared/security.ts` ampliou `errorResponse` de forma retrocompatível para aceitar opcionalmente o `Request` e a lista de métodos, preservando a política CORS real também em respostas de erro.
- o sitemap usa `errorResponse(..., req, "GET, OPTIONS")`, alinhando sucesso, preflight, método inválido e falha interna à mesma política HTTP/CORS.
- `production-sitemap-release-boundary.test.ts` agora protege rollout de Mobilidade, paths legais, ausência de `/comunidade`/`/cookies` e CORS request-aware no erro do sitemap.

## Drift remoto encontrado e corrigido

A inspeção do projeto Supabase `xhdowzacfujckjelqhtd` encontrou `sitemap` remoto em versão 14 com drift relevante em relação à `main`:

- `verify_jwt=true`, embora `supabase/config.toml` e a política `public-read` exijam `false` para crawlers sem credenciais;
- CORS legado permissivo;
- fallback antigo para domínio `ordax.com.br`;
- tabela/rotas antigas (`businesses`, `/negocios/...`);
- Mobilidade anunciada apesar do rollout pausado.

O runtime foi promovido de forma incremental até o estado atual:

- função: `sitemap`;
- status: `ACTIVE`;
- versão remota: **17**;
- `verify_jwt=false`;
- entrypoint atual da `main`;
- `_shared/security.ts` integral da `main`, incluindo `errorResponse` request-aware;
- `_shared/url_validation.ts` integral da `main`;
- sem `/mobilidade`, `/comunidade` ou `/cookies` no inventário estático;
- falhas do handler preservam o request e `GET, OPTIONS` ao montar headers CORS.

A releitura via API de gerenciamento do Supabase confirmou a versão 17, `ACTIVE`, `verify_jwt=false`, SHA remoto `ee3be3ff0edea6081de0cc498f1c013c53870af1619464191e613b1d0839b46f` e o conteúdo implantado.

## Validação — o que foi e o que não foi provado

### Verificado nesta sessão

- conteúdo atual dos arquivos na `main`;
- configuração local/política de `verify_jwt=false` para `sitemap`;
- metadata remota da Edge Function depois do deploy (`ACTIVE`, v17, `verify_jwt=false`);
- source remoto reconsultado depois do deploy, incluindo inventário estático e `errorResponse(..., req, "GET, OPTIONS")`;
- preservação de commits concorrentes da linha de Conta/Auth/Notificações na `main`.

### Não certificado nesta sessão

- GET HTTP público real do endpoint Edge sem credenciais: o container não resolveu DNS do host Supabase e o navegador de pesquisa recusou abrir diretamente a URL de função;
- presença/valor efetivo do secret `BASE_URL`: a ferramenta disponível não expõe secrets e o acesso Postgres remoto estava em timeout;
- Vitest, typecheck, lint, build Vite/Vercel, E2E ou captura visual no SHA deste checkpoint.

Portanto, **deploy/config/source remoto estão verificados; resposta HTTP do endpoint ainda não está certificada**.

## Dívidas mantidas abertas conscientemente

- `src/index.css` ainda contém duas gerações de regras da entrada e o bloco novo mobile mantém risco de clipping por `100dvh` + `overflow:hidden`; não foi criado override paralelo/`!important` para esconder o problema.
- referências CSS antigas a `var(--territory-raised)` ainda aguardam limpeza source-aware; classes Tailwind `bg-territory-raised` continuam válidas porque mapeiam para `--territory-surface-raised`.
- nomes `SALVADOR_COMMUNITY_LAUNCH_*` continuam em callers grandes; não foi criado alias genérico parcial apenas para reduzir ocorrências.

## Regra operacional após G183

- sitemap público não pode anunciar superfície pausada nem top-level alias sem rota canônica;
- `sitemap` Edge permanece endpoint `public-read`, com `verify_jwt=false` e segurança dentro do handler/shared owner;
- erros de Edge Function que dependem de CORS por origem devem repassar o `Request` ao owner compartilhado, não recriar headers locais;
- o sitemap de release continua sendo o artefato canônico servido no deploy frontend; a Edge Function é um endpoint complementar e deve permanecer coerente com rotas/rollout atuais;
- mudanças remotas Supabase só contam como verificadas quando a configuração/source remoto forem relidos; smoke HTTP deve ser registrado separadamente quando houver conectividade;
- recuperação tardia do mapa após fallback terminal não deve reapresentar skeleton de arrival já resolvido.