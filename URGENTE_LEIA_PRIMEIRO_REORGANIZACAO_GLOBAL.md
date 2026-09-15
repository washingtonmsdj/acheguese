# URGENTE — ponteiro de compatibilidade

> **STATUS: SUBSTITUÍDO COMO AUTORIDADE.**
>
> Este arquivo existe apenas para preservar referências históricas, workflows e agentes antigos. Ele **não é o SSOT operacional** e deve permanecer curto. O histórico anterior continua disponível no Git.

## Leia nesta ordem

1. `docs/README.md` — índice documental canônico;
2. `docs/03-architecture/CURRENT_RULES.md` — regras arquiteturais vigentes;
3. `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md` — plano operacional ativo;
4. `docs/08-roadmap/checkpoints/2026-09-14-g191-routed-refresh-latency-and-profile-read-dedup.md` — checkpoint mais recente desta linha;
5. `SECURITY.md` — segurança e gates de release.

## Regras que não podem ser perdidas

- projeto real primeiro: código, owners, schema/migrations, runtime, testes e deploy prevalecem sobre docs antigas;
- não remover feature válida porque está quebrada, incompleta, `launch-paused` ou com teste falhando;
- remover somente legado/duplicação/bridge/owner substituído depois de censar callers, preservar capacidade e provar o substituto;
- corrigir causa raiz; não recriar wrappers, aliases, writers paralelos, hardcodes ou paliativos apenas para fazer build/test passar;
- `docs/03-architecture/COMPATIBILITY_BRIDGES.md` é o ledger dos facades ainda vivos; eles não podem ganhar callers novos e só podem ser aposentados migrando todos os consumidores atomicamente, sem alias substituto;
- a `/` está feature-complete no source para o contrato MVP atual; não abrir nova funcionalidade nela sem regressão, mudança de concept/SSOT ou evidência de viewport/runtime;
- otimização reutilizável de mapas pertence aos owners canônicos descritos em `CURRENT_RULES.md`; não copiar loaders/CSS/workers/providers por página;
- análise de bundle da `/` deve preservar runtime completo de MapLibre, boundary oficial, app roteado e Sentry fora dos closures críticos definidos no relatório de build;
- leitura HTTP/cache/abort de FeatureServer oficial pertence a `officialFeatureServerBoundary.ts`; `BoundaryService` não cria segundo parser/cache/fetch da mesma fonte;
- Browser Geolocation pertence a `src/shared/services/GeolocationService.ts`; não chamar `navigator.geolocation` diretamente em páginas/componentes/hooks de domínio;
- “usar minha localização” exige GPS preciso sem fallback IP silencioso; coordenada `0` continua válida;
- CEP/geocoding reconciliado pertence a `LocationGeocodingService`; UI não chama provider diretamente quando esse owner atende o contrato;
- contexto de lançamento da `/` vem de `TERRITORY_CONFIG`/`LAUNCH_URLS`; a página não cria fallback paralelo de estado/cidade/slug/nome;
- membros/bairros exibidos para o grupo de lançamento vêm do território resolvido; a `/` não mantém uma segunda lista local;
- `communityLaunch.ts` só projeta o grupo/config territorial de lançamento; não mantém slugs próprios nem alias `chapada`;
- waitlist envia slug/path territorial canônico da opção selecionada; label visual não é transformado em identidade por `slugify` no submit;
- nome geográfico canônico não é encurtado para satisfazer concept; rótulo/artigo público explícito podem existir em metadata de apresentação;
- `src/app/config/launchScope.ts` é o owner do rollout público e do `PRELAUNCH_LOCKDOWN_ENABLED`; consumidores não reinterpretam `VITE_PRELAUNCH_LOCKDOWN`;
- preferências persistidas de acessibilidade pertencem a `src/shared/accessibility/preferences.ts`; classes são aplicadas no `documentElement` para escalar `rem` sem achatar a hierarquia tipográfica;
- alto contraste precisa cobrir também os tokens `--territory-*`; superfícies Territory não podem ignorar a preferência global;
- metadata/PWA da raiz deve seguir o headline e a identidade visual aprovados; canonical da `/` não pode ser estático no `index.html`, que atende todas as rotas SPA;
- `src/shared/components/advertising/AdSense.tsx` é o owner do client/script AdSense; `main.tsx` não carrega provider global nem contém publisher ID hardcoded;
- consentimento local pertence a `ConsentService`; componentes não duplicam a chave `lgpd-consent`, parser ou mecanismo de notificação;
- `@vercel/analytics/react` só pode ser importado pelo owner consent-aware e não monta antes de `analytics=true`;
- tracing, Session Replay e reporter de Web Vitals do Sentry são telemetria opcional: acompanham `analytics=true`; error monitoring operacional permanece independente;
- transições manuais de Session Replay devem passar pela fila serializada do owner Sentry; não iniciar Replay em paralelo com `stop()` pendente;
- o shim legado `startSentryTransaction`/`startTransaction` permanece aposentado; novos spans não devem recriar essa API morta;
- overlays tardios da `/` permanecem router-free; pathname é passado explicitamente quando a superfície não precisa de React Router;
- Plus Jakarta Sans é a família aprovada; `tailwind.config.ts` é o owner executável do stack e do `--font-heading`/`--font-sans`; peso 800 é permitido onde o concept versionado exige e deve ser carregado de forma real;
- paths/query keys/classificação de callback de Auth vêm de `authFlow.ts`/`authCallback.ts`; âncora comum não é retorno OAuth;
- fallback geográfico reutilizável vem de `mapDefaults`; não reintroduzir coordenadas locais quando o SSOT compartilhado atende o caso;
- carregamento de boundary/polígono precisa ser limitado e não bloqueante; timeout não autoriza contorno aproximado;
- timeout terminal da entrada pública pertence a `publicRootReadiness.ts`; consumidores não duplicam o mesmo orçamento de 6000 ms;
- mídia decorativa de baixa prioridade da `/` não deve competir com mapa ainda dentro do orçamento terminal;
- fonte opcional da `/` não volta para `@import` remoto no CSS crítico nem para plugin de build que esconda esse import;
- timeout final de mapa precisa encerrar estado acessível de carregamento; fallback visual resolvido não permanece `aria-busy=true`;
- o `FullScreenLoader` genérico com “Preparando a casa para você se achegar...” está aposentado; o bootstrap roteado e os chunks de página usam `PassivePageFallback` sem spinner, timer ou copy; `fallback={null}` fica restrito a overlays/modais/analytics sobre uma página já visível;
- `RoutedAppRuntime` continua sendo o split que mantém sessão/perfis fora da `/`; `FullAppRuntimeShell` não deve recriar um segundo lazy universal para `SessionProfileRuntimeShell`;
- leituras concorrentes de perfis privados pelo `MultiProfileRuntimeService` compartilham somente a Promise em voo por usuário; não transformar esse owner em cache persistente/TTL de perfis;
- o primeiro paint usa `class="light"` como padrão e `/theme-init.js` same-origin no `<head>` para aplicar o tema persistido antes do React; não reintroduzir bootstrap inline nem relaxar `script-src` com `'unsafe-inline'`;
- a `/` mantém apenas o skeleton `TerritoryEntryMapArrival` antes do basemap e status próprios após o mapa ficar utilizável;
- regra exclusiva da `/` só permanece local quando depender de prioridade/UX específica da entrada pública;
- erro de bootstrap pode carregar observabilidade somente no caminho de falha; Sentry não volta a ser import estático do bootstrap normal;
- `rateLimitMiddleware` é o owner do CORS de respostas 429: por padrão deriva o método real + `OPTIONS`; endpoint multimétodo deve passar a lista completa explicitamente;
- respostas de `requireAdmin`/`requireSuperAdmin` devem permanecer request-aware para preservar Origin e métodos também em 401/403/500;
- o deploy canônico gera e valida sitemap antes do build e valida novamente `dist`; não publicar placeholder vazio como sitemap de produção;
- `supabase/functions/sitemap` é endpoint complementar `public-read`: `verify_jwt=false`, segurança no handler/shared owner e nenhuma superfície pausada/top-level alias inexistente pode ser anunciada;
- trabalhar na `main` sem force-push e preservar trabalhos concorrentes;
- GitHub Actions com `steps=[]`/`runner_id=0` é falha de execução do provider, não certificação do source;
- rate-limit Vercel não é build aprovado nem reprovado;
- tipos Supabase gerados devem vir do schema real; não editar `types.generated.ts` manualmente para esconder drift;
- Mobilidade permanece `PUBLIC_LAUNCH_SURFACES.mobility=false` até E2E + security + build + deploy do mesmo SHA.

## Política deste arquivo

Não voltar a acumular checkpoints aqui. Mudanças operacionais pertencem a `docs/08-roadmap/checkpoints/` e ao roadmap canônico. Quando toda referência ativa a este nome for migrada, este ponteiro poderá ser removido.
