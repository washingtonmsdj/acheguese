# G182 — Root Accessibility, Metadata, Mobile Navigation and SEO Hardening

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Continuar o endurecimento da entrada pública `/` no owner correto, sem criar overrides paralelos para o CSS legado que ainda precisa de uma limpeza source-aware.

Baseline: G181.

## 1. Alto contraste agora cobre Territory Vivo

A preferência `accessibility-high-contrast` sobrescrevia apenas tokens genéricos (`--background`, `--foreground`, `--card`, etc.). A entrada pública e muitas telas atuais usam `--territory-*`, então o modo de alto contraste podia estar ativo sem alterar efetivamente a superfície Territory.

`src/styles/accessibility-core.css` agora define, dentro do mesmo owner de alto contraste, uma paleta territorial completa e coerente:

- canvas/surface brancos;
- ink/brand pretos;
- amarelo solar preservado;
- border/focus/semantic colors com contraste forte;
- `territory-on-image` branco para superfícies brand pretas.

A escolha de uma paleta Territory clara evita quebrar pares já usados em larga escala como `bg-territory-sun text-territory-ink` e `bg-territory-brand text-white`.

O ratchet `tests/architecture/accessibility-font-scale-boundary.test.ts` passou a validar também a presença dos principais tokens Territory no contrato de alto contraste.

Commits:

- `d2f71d84c12dd0bc371b755e072aa1c131bf3f9c` — cobertura Territory em alto contraste;
- `7b30de0d64d8a62ca628c9474ddfe4aa4089ab39` — ratchet de apresentação acessível.

## 2. Metadata da raiz reconciliada com o concept e a identidade

A `/` lean roda fora do `HelmetProvider`, então o metadata inicial em `index.html` é a fonte efetiva para a entrada pública.

O HTML agora usa:

- title `Achegue-se | Seu lugar, mais perto.`;
- description coerente com descoberta de negócios, serviços e histórias da comunidade;
- Open Graph e Twitter com o mesmo headline/copy;
- `theme-color=#123E3D`.

A mudança usa copy genérica de marca e não hardcoda a comunidade de lançamento no HTML. O launch territorial continua pertencendo a `TERRITORY_CONFIG`/runtime.

Commit inicial de metadata:

- `48c222829de3def12e2d4dcff717307b643285ee`.

## 3. PWA reconciliado com a identidade visual canônica

`public/manifest.json` ainda usava:

- `theme_color: #0f766e`;
- `background_color: #ffffff`;
- descrição antiga sem acentos.

A identidade vigente documenta:

- petróleo `#123E3D`;
- superfície `#FAFBF7`.

O manifest agora usa esses valores e a mesma proposta de valor da entrada. O shortcut `Serviços` também recuperou a grafia correta em português.

Commit:

- `99b21a6a0f7b59dc4a7339af7a9d1a3e7528ff4`.

## 4. Canonical da raiz ficou restrito à raiz

Uma primeira versão adicionou `<link rel="canonical">` diretamente em `index.html`. A revisão do fluxo detectou que esse arquivo é servido para todas as rotas do SPA; manter canonical estático para `/` poderia canonicalizar páginas internas incorretamente.

A correção final é:

- `index.html` **não** publica canonical estático;
- `og:url` continua sendo `https://acheguese.com.br/`;
- `src/main.tsx`, somente quando `window.location.pathname === "/"`, lê `meta[property="og:url"]` e cria o canonical;
- a URL não foi duplicada em código;
- rotas internas carregadas diretamente não recebem canonical da raiz.

Commits finais:

- `847a6fc2223ff3e2ff7709d67118a1555ebf3cf6` — remove canonical global do HTML;
- `a226e55b66487ad6b0b2405bc57a287763af271a` — canonical runtime apenas na `/`;
- `fc3b42c7b58340ee6d3addda969916be8c6be098` — regressão do contrato.

O teste de metadata/PWA foi criado inicialmente em `31780c107c2716d3e9c41f933c4e602b2a54bd05` e depois reconciliado com o canonical root-scoped.

## 5. Privacidade voltou a ser alcançável no mobile da raiz

O footer institucional é ocultado no breakpoint móvel do concept. Como o menu mobile continha apenas `Como funciona` e `Entrar`, o link de `Privacidade` desaparecia da navegação visível da `/` em mobile.

`TerritoryEntryPage.tsx` agora inclui `Privacidade` no popover móvel, mantendo o footer desktop inalterado.

O regression exige pelo menos duas ocorrências de `/privacidade` na página: menu mobile + footer institucional.

Commits:

- `690408d77d990c506850c7698dd887e7a1de3d32` — link no menu móvel;
- `25e9422cbe1cd3ce773eaa7506f3d2ea97380c6b` — regressão.

## 6. Sitemap de produção foi auditado e blindado

`public/sitemap.xml` versionado é um placeholder vazio. Isso parecia inicialmente um possível erro de deploy, mas a cadeia oficial de Vercel já possui o fluxo correto:

1. `generate:sitemap`;
2. validação de `public`;
3. `build:vercel`;
4. validação de `dist`.

`vercel.json` aponta para `tools/release/run-vercel-production-build.mjs`, portanto o deploy canônico não deve publicar o placeholder vazio sem antes gerar e validar o sitemap.

Foi adicionado `tests/architecture/production-sitemap-release-boundary.test.ts` para impedir que esse encadeamento seja removido ou reordenado sem evidência.

Commit:

- `02f5930a4dd0c5c914635eee895bc97c6fb9fbf8`.

## 7. Preloads do mapa foram revisados e preservados

Os preloads de style JSON e TileJSON em `src/main.tsx` foram revisados contra os regressions existentes.

Eles foram preservados porque:

- só existem no boot da `/`;
- derivam de `DEFAULT_TILE_STYLE` e `OPENFREEMAP_TILEJSON_URL`;
- usam o SSOT de `mapDefaults`;
- possuem guards contra duplicação;
- há regressão específica cobrindo descoberta antecipada e `fetchpriority=high`.

Não houve alteração especulativa nesses hints.

## Dívida aberta: clipping mobile da entrada

A auditoria de `src/index.css` confirmou que o breakpoint **novo** da entrada ainda usa:

- `height: 100dvh` na página;
- `overflow: hidden` no `territory-entry-main`;
- mapa com altura mínima fixa;
- indicação dentro do `main`;
- footer em track separada.

Isso pode cortar conteúdo em viewports móveis baixos ou com escala de fonte ampliada.

Não foi aplicado `!important` em JSX nem criado segundo arquivo de override, porque isso abriria um segundo owner de layout. A correção deve ocorrer diretamente no CSS-fonte durante a limpeza source-aware que também removerá as regras antigas da entrada.

O mesmo censo confirmou que `src/index.css` ainda contém regras legadas que usam `var(--territory-raised)`, enquanto o token canônico é `--territory-surface-raised`; os elementos ativos da raiz já possuem classes Tailwind canônicas, mas a dívida de fonte deve ser removida junto com o CSS legado, não por alias.

## Validação disponível

Não há checkout/runner local autenticado nesta conversa para executar o SHA final.

Portanto este checkpoint **não** declara Vitest, typecheck, build, E2E, Lighthouse, captura visual, bundle report ou deploy aprovados. Os testes/ratchets estão versionados e aguardam execução em runner.

O status Vercel `build-rate-limit`, quando presente, continua sendo condição externa do provider e não resultado de compilação.

## Próximos cortes

1. continuar a auditoria da `/` em owners editáveis sem criar overrides de CSS;
2. executar a limpeza source-aware de `src/index.css` assim que houver uma forma segura de substituir o arquivo completo: remover CSS morto, `var(--territory-raised)`, literais redundantes de fonte e aposentar `strip-dead-entry-legacy-selectors`;
3. nessa mesma limpeza, corrigir scroll/safe-area mobile no owner real do layout;
4. migrar a nomenclatura residual `SALVADOR_COMMUNITY_LAUNCH_*` somente quando callers grandes puderem ser editados integralmente;
5. executar regressões, typecheck, build/analyze, E2E e captura visual no mesmo SHA quando houver runner;
6. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até cumprir o DoD real do mesmo SHA.
