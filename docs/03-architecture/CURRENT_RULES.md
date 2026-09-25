# Regras Vigentes do Sistema

Data-base: 2026-09-21  
Status: ATIVO / CANONICO  
Versao documental: 5.6

Este documento define regras arquiteturais globais. Contratos detalhados de domínio permanecem nos owners executáveis e nos documentos específicos listados em `docs/README.md`; este arquivo não deve duplicar implementação.

## 1. Precedência e SSOT

Quando fontes divergirem, prevalece:

1. contrato executável/versionado (`src/`, migrations, manifests e validators);
2. documento SSOT vivo listado em `docs/README.md`;
3. plano operacional atual em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
4. referência técnica;
5. histórico em `docs/10-archive/`.

Regras:

- uma responsabilidade possui um owner canônico;
- wrapper/facade só existe com motivo de compatibilidade explícito e prazo de remoção;
- documento arquivado ou substituído nunca reabre uma segunda autoridade;
- `supabase/migrations/` é a única fonte versionada de evolução permanente de schema;
- merge/commit não equivale a runtime/produção validada.

## 2. Identidade e ownership

- `user_id` representa autenticação e identidade administrativa quando o contrato exigir User.
- `profile_id` representa a entidade operacional do usuário no ecossistema.
- ownership social usa colunas explícitas `*_profile_id`.
- ownership administrativo usa colunas explícitas `*_user_id`.
- username, handle e slug não podem representar conceitos diferentes sob o mesmo contrato de rota.
- identidade privilegiada deve ser derivada no backend sempre que possível; a UI não envia `user_id`, `profile_id`, `admin_id`, tabela, bucket ou coluna para escolher autoridade.

## 3. Fronteiras arquiteturais

- `src/app` contém shell, rotas, providers e fluxos de aplicação.
- `src/app/features` contém fluxos/landings que não são bounded contexts.
- `src/modules` contém bounded contexts de produto; a lista oficial está em `src/modules/README.md`.
- `src/core` contém contratos/capacidades transversais e não importa nem reexporta implementação de `src/modules`.
- `src/integrations` contém adapters de infraestrutura/provedores.
- `src/shared` contém UI/utilitários realmente compartilhados, sem absorver regra de domínio.
- `src/features` é namespace aposentado; não deve existir nem ser recriado. Eventos pertence a `src/modules/community-events`.
- módulos não importam implementação interna de outros módulos; integração cruzada passa por `core`, adapter formal ou contrato compartilhado.
- `src/app/config/productModuleRegistry.ts` é o owner do lifecycle de **domínios de produto**.
- `src/app/config/platformCapabilityRegistry.ts` é o owner do lifecycle de **capabilities horizontais** como Map, Nearby, Search e Messaging.
- `src/app/config/lifecycleRegistry.ts` é o único avaliador das dependências cruzadas domínio ↔ capability.
- `src/app/config/launchScope.ts` é projeção/compatibilidade de superfície derivada desses owners; não mantém uma segunda decisão independente de lifecycle.
- `src/app/config/releaseMode.ts` é o owner da interpretação de flags globais de release como `VITE_PRELAUNCH_LOCKDOWN`; lifecycle de módulo não deve absorver configuração de release.
- módulo `paused` falha fechado: não participa de navegação pública, rota funcional, prefetch/warmup, discovery, provider público ou layer de Mapa. Reativação ocorre pelo owner de lifecycle após certificação; exceção local, alias ou redirect não substituem esse contrato.
- páginas/componentes não acessam Supabase diretamente; acesso fica em services/repositories, migrations, scripts e Edge Functions conforme o boundary aplicável.
- páginas e hooks orquestram estado/fetch/render; regra de negócio pertence ao owner de domínio.
- cada tabela mutável possui owner de escrita único. Read models adicionais devem ser declarados e não criam writer paralelo.
- `ride_requests` é o agregado canônico de corrida/entrega e é **server-owned para toda mutação**: browser não possui `INSERT`, `UPDATE` ou `DELETE` direto; criação, transições, dispatch, comandos de entrega e intervenções administrativas passam por broker autenticado + RPCs service-role-only específicas.
- `ride_state_audit` é append-only/backend-owned; o browser não grava eventos de auditoria diretamente e o ator deve ser derivado/revalidado pelo backend.
- entrega com origem `gastronomy` usa contrato `sourceId=orders.id` + `authorizationSourceId` da empresa/restaurante; o backend deve comprovar que o pedido pertence ao `merchant_profile_id` da empresa autorizada antes de criar o ride e deve impedir duas entregas ativas para o mesmo pedido.
- tipos canônicos não são duplicados entre `shared`, `core` e `modules`.
- `index.ts` vazio (`export {};`) não é facade válida.

## 4. Taxonomia de produto

### 4.1 Empresas e verticais

- `business`/Empresas é domínio horizontal base; **não é vertical**.
- vertical empresarial oficial existe somente quando declarada em `src/core/verticals/config.ts`.
- Estado oficial atual: `gastronomy` e `education`.
- capacidade implementada em outro namespace não se torna vertical por conveniência documental.
- Eventos é bounded context comunitário, não vertical empresarial.

### 4.2 Owners de módulo

- base empresarial e derivados ficam sob `src/modules/business`;
- comunidade usa bounded contexts explícitos (`community-feed`, `community-groups`, `community-issues`, `community-events`, `community-lost-found`, `community-recommendations`);
- mobilidade e delivery ficam em `src/modules/mobility`;
- oportunidades rápidas ficam em `src/modules/work-opportunities`;
- vagas classificadas ficam em `src/modules/classifieds/jobs`;
- serviços/profissionais ficam em `src/modules/professionals`.

## 5. Autoridade de segurança

- decisão de autorização no browser é somente hint de UX.
- toda escrita sensível é autorizada por RLS, RPC segura, Edge Function ou backend confiável.
- `SECURITY DEFINER` é excepcional: exige autorização explícita, `search_path` fixo, grants intencionais e teste negativo.
- navegador não escolhe ator privilegiado, owner, tabela, coluna, bucket ou path quando o backend pode derivar.
- dados privados não ganham policy pública artificial apenas para silenciar advisor.
- logs/auditoria privados e tabelas broker-only permanecem default-deny quando esse for o contrato.
- mudanças manuais de produção devem ser reconciliadas em Git antes do release normal seguinte.
- regras detalhadas: `SECURITY.md`, `docs/09-reference/SECURITY.md` e `docs/09-reference/governance/security/SECURITY_AUTHORITY.md`.

## 6. Contratos transversais

Os contratos detalhados vivem em `docs/07-modules/` e nos owners executáveis correspondentes. Entre os SSOTs ativos estão:

- Posts/Feed;
- Social Engagement;
- Business Favorites;
- Search;
- Media Asset;
- Notification Preferences;
- Classified Messaging;
- Community Direct Messaging;
- Realtime;
- Reviews;
- Audit/Moderation;
- Entity Private Data;
- Gastronomy;
- Coverage/Mobility;
- Maps/MapLibre runtime;
- Geolocation/Location resolution;
- Auth flow/callback classification;
- Accessibility preferences;
- Public launch rollout/prelaunch.

### 6.1 Maps / MapLibre runtime e boundaries

- `src/core/maps/runtime/loadMapLibreRuntime.ts` é o owner canônico de engine, CSS e configuração de worker do MapLibre.
- `src/core/maps/components/v3/MapLibreAdapter.tsx` é o owner público canônico para superfícies React que cabem no contrato do adapter; ele decide runtime passivo versus completo sem criar um segundo provider.
- `src/shared/config/mapDefaults.ts` é o SSOT de URLs/configuração base de tiles **e dos fallbacks geográficos genéricos**; `src/core/maps/providers/MapProvider.ts` somente projeta esse contrato para o domínio de mapas.
- services/hooks genéricos de mapa/boundary não embutem coordenadas de uma cidade específica como fallback universal. `BoundaryService`, `useNeighborhoodBounds` e o runtime MapLibre passivo derivam seus fallbacks de `mapDefaults`.
- `src/core/geospatial/data/officialFeatureServerBoundary.ts` é o owner único, no runtime web, para interpretar metadata oficial de FeatureServer e executar/deduplicar/cachear/cancelar as respectivas leituras HTTP. `BoundaryService` orquestra precedência de fontes e consome esse owner; não recria parser de `source_url`/`source_object_id`, cache paralelo nem `fetch()` próprio para a mesma fonte.
- CSS do MapLibre entra pelo owner `src/core/maps/runtime/maplibreRuntimeCss.ts`; páginas e módulos não importam `maplibre-gl/dist/maplibre-gl.css` diretamente.
- consumidores imperativos fora do núcleo podem importar **tipos** de `maplibre-gl`, mas carregam a engine por `loadMapLibreRuntime()`; não criam loader, worker config, preload de CSS ou provider paralelo.
- `src/core/maps/hooks/useTerritoryPolygon.ts` possui espera limitada para a chain de boundary. Consumidor não pode ficar indefinidamente em `isLoading` por fonte oficial externa travada.
- ausência/timeout de boundary oficial não autoriza geometria aproximada. Superfícies podem degradar para basemap/centro canônico e continuar úteis, mantendo a busca oficial não bloqueante quando fizer sentido.
- otimização reutilizável de mapa deve ser implementada no owner canônico para beneficiar todas as páginas. Agendamento específico da `/` pode continuar em `publicRootReadiness` somente quando a regra depende da prioridade exclusiva da entrada pública.
- `prewarmMapLibreWorkers()` é opt-in para superfícies que montarão mapa imediatamente; não deve virar warmup global em rotas sem mapa.
- regressões de arquitetura devem impedir novos imports runtime/CSS diretos, fallbacks geográficos paralelos, segundo owner de rede de boundary oficial e waits infinitos fora dos owners canônicos.

### 6.2 Geolocation / Location resolution

- `src/shared/services/GeolocationService.ts` é o owner único da Browser Geolocation API no web: GPS one-shot, cache, permissão, retry, watch e fallback IP pertencem a esse service.
- `src/shared/config/geolocation.ts` é o owner da política e dos tempos de geolocalização; consumidores não replicam timeout, retry ou semântica de fallback quando o contrato compartilhado atende o caso.
- `src/shared/hooks/useRobustGeolocation.ts` é camada React sobre o service, não um segundo owner de infraestrutura.
- `src/core/location/services/LocationGeocodingService.ts` é o owner de geocoding, reverse geocoding e lookup de CEP reconciliados com o SSOT territorial `locations`; UI não chama provider de CEP/geocoding diretamente quando esse owner atende o caso.
- páginas, componentes e hooks de domínio não chamam `navigator.geolocation` diretamente. O ratchet em `tests/architecture/geolocation-ssot-boundary.test.ts` protege essa fronteira.
- ação explícita “usar minha localização” exige GPS preciso e não pode degradar silenciosamente para localização por IP; cache/IP também não equivalem a permissão GPS concedida.
- coordenada `0` é válida. Presença de latitude/longitude deve usar validação finita/nullish, nunca truthiness (`lat && lng`, `value || fallback`) que converta zero em ausente.
- fallback IP é aproximação e só pode ser usado em fluxos cujo contrato aceite explicitamente baixa precisão.
- geolocalização de leitura/cache não deve disparar prompt GPS escondido quando o contrato do consumidor é apenas hidratação passiva.

### 6.3 Auth flow / callback classification

- `src/core/auth/constants/authFlow.ts` é o owner dos paths públicos de autenticação, query keys/values, chaves de storage e TTLs do fluxo; páginas não duplicam esses literais quando o contrato canônico atende o caso.
- `src/core/auth/utils/authCallback.ts` é o owner puro de classificação de callback OAuth/PKCE/recovery/erro.
- `hasAuthCallbackMarker(search, hash)` diferencia marcadores reais de autenticação de âncoras ordinárias de página. Um hash como `#main-content` não é motivo para carregar runtime autenticado/completo.
- bootstrap público enxuto pode consumir constants/utilitários puros de Auth, mas não importa `AuthService`, Supabase ou `SessionService` apenas para classificar URL.
- `AppRuntime` delega classificação de callback ao owner de `core/auth`; não mantém parser/classificador concorrente.

### 6.4 Accessibility preferences

- `src/shared/accessibility/preferences.ts` é o owner puro de chaves de persistência, normalização, leitura/escrita e aplicação das classes de alto contraste/tamanho de fonte.
- `AppRuntime` pode aplicar essas preferências em `useLayoutEffect` para preservar o primeiro paint da `/`, mas não duplica literais de `localStorage`, parser nem mapeamento de classes.
- `AccessibilityProvider` consome o mesmo owner para inicialização, persistência e classes; o Provider continua sendo owner do contexto/ações React, não do formato persistido.
- o owner de preferências permanece dependency-light e não importa React, Provider, router, query runtime ou Supabase.
- o ratchet `tests/architecture/accessibility-preferences-ssot.test.ts` impede novas chaves de storage concorrentes em `.ts/.tsx`.

Regra: este documento não replica lifecycle, tabelas, RPCs ou allowlists desses contratos. Mudanças devem ocorrer no owner técnico e em seu teste/validator.

## 7. Roteamento, rollout e território

- Território é contexto geográfico raiz da experiência pública. No MVP vigente, **Business/Empresas** é o domínio ativo; Mapa, Perto de mim, Busca e Mensagens são capabilities horizontais. Isso não implica ativação de Community ou de qualquer outro domínio pausado.
- entidade pública possui namespace canônico único; alias legado não cria segunda superfície oficial.
- contexto `/comunidade/...` é explícito e não deve sequestrar automaticamente uma URL pública de entidade.
- contexto de lançamento da `/` vem de `TERRITORY_CONFIG`/`LAUNCH_URLS`; a entrada não cria segundo owner local de estado, cidade, slug ou nome do território de launch.
- `src/app/config/productModuleRegistry.ts` é o owner do lifecycle de produto e dependências. `src/app/config/launchScope.ts` projeta esse lifecycle para superfícies públicas. `src/app/config/releaseMode.ts` interpreta `VITE_PRELAUNCH_LOCKDOWN`; consumidores usam `PRELAUNCH_LOCKDOWN_ENABLED` e não reinterpretam a env.
- `src/core/community/config/communityLaunch.ts` é somente projeção do rollout Community sobre o território/configuração de lançamento; não mantém lista própria de bairros, slug paralelo de grupo ou alias territorial escondido.
- membros de grupo e slugs territoriais vêm do owner territorial. Rótulo público curto pode existir como metadata de apresentação sem alterar nome/slug geográfico canônico.
- ações comunitárias mutáveis exigem autenticação/Profile e autorização territorial conforme o backend.
- residência/endereço privado nunca é projetado para superfície pública apenas para resolver contexto.
- rotas e telas públicas devem ser reconciliadas com `docs/SCREEN-MAP.md` e `docs/FEATURE-MAP.md`.

## 8. Realtime, mídia, mensageria e auditoria

- Realtime é transporte, nunca segunda persistência/SSOT.
- upload público passa pelo owner de Media Asset; browser não escolhe bucket/path nem persiste URL arbitrária quando o contrato exige referência canônica.
- documentos/evidências privadas usam contratos/buckets privados separados.
- agregados de mensageria não compartilham tabela/lifecycle apenas por reutilizarem transporte.
- auditoria sensível é append-only/backend-owned; projeções administrativas devem ser limitadas e autorizadas.
- cross-user notification/mutation usa comando server-owned/outbox/RPC confiável, nunca self-service client-side com destinatário arbitrário.

## 9. Documentação e arquivos

- índice canônico: `docs/README.md`.
- execução operacional: `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.
- histórico: `docs/10-archive/` ou histórico do Git.
- planos, handoffs, screenshots e outputs de ferramenta não são autoridade por estarem versionados.
- documento marcado `SUBSTITUIDO` não pode continuar listado como status canônico.
- não criar relatório/índice novo quando um owner vivo já existir.

## 10. Gates mínimos

Antes de consolidação estrutural ou release, conforme o escopo:

```bash
npm run security:validate
npm run validate:ssot
npm run validate:architecture:incremental -- --json
npm run validate:architecture:governance -- --json
npm run validate:taxonomy
npm run validate:docs-structure
npm run typecheck
npm run build
```

Mudanças de segurança/schema executam adicionalmente os gates indicados em `SECURITY.md`.

## 11. Proibições explícitas

- não criar service paralelo para responsabilidade que já possui owner;
- não recriar `src/features`;
- não importar implementação interna entre módulos;
- não colocar regra de negócio em page/hook por conveniência;
- não criar rota pública concorrente para a mesma identidade;
- não importar runtime ou CSS de MapLibre diretamente em páginas/módulos quando o loader/adapter canônico atende o caso;
- não criar segundo worker configurator, segundo tile provider default ou warmup global paralelo;
- não embutir fallback universal de Salvador/outra cidade em service/hook genérico quando `mapDefaults` já é o owner;
- não recriar leitura HTTP/cache/parser paralelo de FeatureServer oficial dentro de `BoundaryService` ou outro consumidor quando `officialFeatureServerBoundary.ts` atende o contrato;
- não deixar carregamento de boundary/polígono compartilhado pendente indefinidamente; timeout não autoriza boundary aproximado;
- não chamar `navigator.geolocation` fora do owner compartilhado nem criar novo hook/service paralelo para contornar esse boundary;
- não chamar ViaCEP/provider de geocoding diretamente na UI quando `LocationGeocodingService` atende o contrato;
- não tratar coordenada `0` como valor ausente;
- não duplicar paths/query keys/classificação de callback de Auth em páginas/bootstrap quando `authFlow.ts`/`authCallback.ts` atendem o caso;
- não tratar hash/âncora ordinária como retorno de autenticação apenas por ser não vazio;
- não duplicar chaves/parser/aplicação de preferências de acessibilidade fora de `src/shared/accessibility/preferences.ts`;
- não reinterpretar `VITE_PRELAUNCH_LOCKDOWN` fora de `releaseMode.ts` nem recriar listas/slugs de rollout Community paralelos ao território resolvido;
- não usar placeholder, `paused`, fallback vazio ou retorno antecipado como prova de módulo funcional;
- não declarar `MVP READY` sem cumprir o DoD de `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
- não reduzir gate de segurança/CI para obter status verde.

## 12. Prioridade de blindagem

1. restaurar gates confiáveis e proteção da `main`;
2. continuar hardening de RLS/RPC/grants e fechar LGPD antes de rollout;
3. remover drift documental e namespaces concorrentes;
4. reconciliar registries/owners com paths realmente existentes e reduzir bridges genéricos remanescentes sem reabrir namespaces aposentados;
5. certificar módulos por fluxo funcional real;
6. somente então executar refatoração visual ampla/performance não comprovada.
