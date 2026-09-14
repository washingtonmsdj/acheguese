# G181 — Public Root Bundle, AdSense, Accessibility and Bootstrap Hardening

Data: 2026-09-14  
Status: implementado em `main`; runner/build/deploy ainda não certificados

## Objetivo

Continuar o endurecimento da entrada pública `/` sem micro-otimizações isoladas, removendo trabalho global desnecessário, consolidando owners e transformando separações de performance em invariantes verificáveis no build pesado.

Baseline: G180.

## 1. Bundle do primeiro mapa ganhou invariantes executáveis

`tools/performance/report-root-bundle.mjs` já media bootstrap, primeiro mapa, runtime passivo, MapLibre, boundary e Sentry, mas não falhava quando uma dependência pesada entrava cedo demais.

Agora o relatório calcula closures estáticos do manifest e verifica:

- `MapLibreAdapterRuntime.tsx` completo fora do closure do primeiro mapa;
- `officialFeatureServerBoundary.ts` fora do closure do primeiro mapa;
- `RoutedAppRuntime.tsx` fora do bootstrap inicial;
- vendor Sentry fora do bootstrap inicial.

Os resultados aparecem no JSON/Markdown como `PASS`, `FAIL` ou `NOT FOUND`. Invariante explicitamente falsa define `process.exitCode = 1`, fazendo a certificação pesada falhar por regressão estrutural, sem inventar orçamento arbitrário de KiB antes de haver baseline certificado.

`tests/regression/public/root-entry-build-analysis.test.ts` protege o contrato e também confirma no source que boundary, full MapLibre runtime, full routed runtime e observabilidade continuam atrás de imports/agendamento diferidos.

Commits:

- `7d39bda6b4bb688ddc5267250cf70b229fe461e2` — invariantes de separação no relatório;
- `8dcdf7b6d4b0b53980e860a10fa92682a69390cf` — regressões da análise de bundle.

## 2. AdSense saiu completamente do bootstrap global

`src/main.tsx` ainda carregava AdSense em toda navegação, inclusive `/`, mesmo quando não havia slot de anúncio. Esse caminho também continha publisher ID hardcoded e duplicava a responsabilidade já documentada em `AdSense.tsx`.

O bootstrap global foi removido.

Agora:

- `/` não solicita AdSense só por abrir a página;
- páginas sem slot não pagam rede/CPU do provider;
- `VITE_ADSENSE_CLIENT_ID` continua sendo a configuração do publisher;
- `src/shared/components/advertising/AdSense.tsx` é o único owner runtime do script.

Commit:

- `ff324c72590e453c491cddfd6537c68fc5385dc0` — remoção do bootstrap global.

## 3. Loader de AdSense deixou de depender de timeout de 100 ms

O owner anterior montava o script em um effect e, em outro, tentava inicializar o slot depois de apenas 100 ms. Em rede lenta o timer podia disparar antes do provider estar disponível e o slot não receber nova tentativa.

`AdSense.tsx` agora usa:

- `Map<string, Promise<void>>` para deduplicar a carga por client ID;
- evento real `load` do script;
- evento `error` com limpeza da Promise para permitir retry posterior;
- `window.adsbygoogle.push({})` somente após a Promise resolver e o slot ainda estar montado.

Não existe publisher ID numérico hardcoded no source.

Commits:

- `c54df166e91cdca943518e30ee9648c3b1452ee2` — loader robusto e slot-driven;
- `fec244c1017a4b8836e8c4f7f66498dbb83d0cd2` — regressão do bootstrap;
- `c4cd861f6b0ecf8596f8b3b77ce689c650c6a495` — ratchet de owner AdSense.

## 4. Escala de fonte acessível preserva a hierarquia visual

`accessibility-core.css` aplicava:

```css
.accessibility-font-large * {
  font-size: inherit !important;
}
```

O mesmo existia para extra-large. Isso fazia todos os descendentes herdarem um único tamanho e podia achatar a hierarquia entre heading, body, labels e microcopy — exatamente o oposto da intenção de uma preferência de escala.

A estratégia foi corrigida:

- classes de acessibilidade passam a ser aplicadas em `document.documentElement`;
- `118%` e `136%` escalam o root font-size;
- unidades `rem` do design system crescem proporcionalmente;
- regras `* { font-size: inherit !important }` foram removidas;
- alto contraste continua funcionando no mesmo elemento raiz por herança de custom properties.

Lean root e `AccessibilityProvider` usam o mesmo owner `applyAccessibilityPreferences()` e o mesmo target.

Commits:

- `f451376de299288bb3c102163e19fd9e56b4235a` — CSS sem achatamento tipográfico;
- `436956cd30f55ec84efa43ecf7757b18453efdd6` — lean runtime no `documentElement`;
- `44b43fd0442ccdbac27a429fa083ddb951e88c7f` — Provider no `documentElement`;
- `a406b43159b1a725173fb399e338f5a681e3df0f` — ratchet da escala acessível.

## 5. Bootstrap failure ficou acessível e observável sem pesar o caminho feliz

`BootstrapErrorBoundary` agora:

- corrige a copy para `Não foi possível...` / `Recarregue a página...`;
- usa `<main role="alert" aria-live="assertive">`;
- mantém botão explícito de recarga;
- em desenvolvimento continua usando `console.error`;
- em produção importa `sentry.config` apenas após uma falha e chama `captureSentryException()` com `surface: "bootstrap"` e component stack.

Não foi criado import estático de Sentry no bootstrap normal.

Commits:

- `3bdbbe2796f884e864be802404c33985868f299b` — fallback e reporting;
- `66f741a05ad7af600f022f6f5e9f58d54afa7102` — ratchet da fronteira.

## Concorrência preservada

Após o bloco acima, a `main` avançou com trabalho concorrente de Auth, incluindo:

- `01e6e5d6afbb1a5d6f4bab503033698d29f99748` — `Guard auth mobile safe areas and custom chevrons`.

Esse commit é descendente dos commits G181 observados até aqui; nenhum force-push foi usado e o trabalho concorrente não foi revertido.

## Validação disponível

Não há checkout/runner local autenticado nesta conversa para executar o SHA final.

Portanto este checkpoint **não** declara Vitest, typecheck, build, E2E, bundle report, captura visual ou deploy aprovados. Os testes/ratchets estão versionados e aguardam execução no runner.

Vercel com `build-rate-limit` continua sendo condição externa do provider e não certificação positiva nem negativa de compilação.

## Próximos cortes

1. continuar o censo do caminho crítico da `/`, preservando mapa como superfície prioritária;
2. migrar `SALVADOR_COMMUNITY_LAUNCH_*` para nomenclatura genérica somente quando os callers grandes puderem ser atualizados integralmente, sem alias permanente nem replace cego;
3. remover fisicamente CSS legado da entrada com transformação source-aware verificável e só então aposentar `strip-dead-entry-legacy-selectors`;
4. remover os literais redundantes de Plus Jakarta Sans durante a mesma limpeza de CSS;
5. executar regressões, typecheck, build/analyze, E2E e captura visual no mesmo SHA quando houver runner;
6. manter `PUBLIC_LAUNCH_SURFACES.mobility=false` até cumprir o DoD real do mesmo SHA.
