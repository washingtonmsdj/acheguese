# G184 — root deferred runtime and consent boundary

Data: 2026-09-14

## Escopo

Continuação da entrada pública `/` após G183, concentrada em reduzir trabalho tardio desnecessário, manter mídia não crítica atrás do mapa e alinhar telemetria ao contrato explícito de consentimento do produto.

## Implementado no source

### Timeout terminal da raiz como SSOT

- `src/shared/utils/publicRootReadiness.ts` agora exporta `PUBLIC_ROOT_MAP_TERMINAL_TIMEOUT_MS = 6000`.
- `TerritoryEntryMapRuntime.tsx` consome esse owner em vez de manter `MAP_TIMEOUT_MS = 6000` local.
- a recuperação tardia do mapa continua sem reapresentar o skeleton depois do fallback terminal.
- `territory-entry-map-progressive-performance.test.ts` protege o owner compartilhado e proíbe o timeout local duplicado.

### Mídia realmente posterior à prioridade do mapa

- a foto `complexo-cultura.jpg` continua fora do módulo inicial da `/` e é resolvida por `import()` somente em desktop.
- o escape de segurança da foto deixou de ocorrer em 3 s, quando o mapa ainda podia estar legitimamente dentro de seu orçamento de 6 s.
- a mídia agora espera `PUBLIC_ROOT_MAP_TERMINAL_TIMEOUT_MS + 500 ms` antes de poder avançar sem o evento de map-ready, e ainda passa pelo agendamento idle.
- `root-entry-community-first.test.ts` protege import dinâmico, breakpoint, timeout compartilhado e margem de settle.

### Overlays da `/` sem React Router

- `ConsentBannerContent.tsx` passou a ser o núcleo reutilizável do banner e recebe `pathname` explicitamente.
- `ConsentBanner.tsx` ficou como adapter mínimo para o app roteado: lê `useLocation()` e delega ao núcleo.
- `PublicRootOverlays.tsx` consome `ConsentBannerContent` diretamente e não importa `BrowserRouter` nem `react-router-dom`.
- a raiz continua fora do provider tree completo também depois que seus overlays tardios são montados.
- `root-entry-bootstrap-performance.test.ts` e `public-launch-scope-ssot.test.ts` foram alinhados ao novo owner.

### Analytics condicionado ao consentimento explícito

- foi removida a montagem incondicional de `@vercel/analytics/react` de `GlobalOverlays.tsx` e `PublicRootOverlays.tsx`.
- `ConsentService` passou a ser também o owner observável do consentimento local:
  - `LOCAL_CONSENT_STORAGE_KEY` centraliza `lgpd-consent`;
  - leitura tolera JSON inválido e registros malformados sem quebrar a UI;
  - `CONSENT_PREFERENCES_CHANGED_EVENT` notifica mudanças na mesma aba;
  - evento nativo `storage` cobre mudanças em outras abas;
  - `hasGrantedLocalConsent()` expõe leitura de permissão sem duplicar parsing.
- `useAnalyticsConsent()` projeta esse owner via `useSyncExternalStore`.
- `ConsentAwareVercelAnalytics.tsx` é o único importador de `@vercel/analytics/react` e só renderiza/importa a integração quando `analytics=true` e o ambiente é produção não-local.
- tanto `PublicRootOverlays` quanto `GlobalOverlays` usam esse mesmo owner; não existe segundo gate de analytics.
- `tests/architecture/analytics-consent-boundary.test.ts` protege o import único, o subscription model e o uso pelos dois overlays.

## Semântica de privacidade

O Achegue-se possui uma preferência explícita `analytics`. Por isso, a integração de analytics não deve ser carregada antes do opt-in, mesmo quando o fornecedor use um modelo first-party/privacy-friendly.

Revogar a preferência atualiza o estado observável e remove a integração React. Código de terceiro que o navegador já tenha baixado anteriormente não pode ser retroativamente "descarregado"; o contrato protegido aqui é principalmente **não importar/montar antes de consentimento** e não manter uma segunda montagem fora desse gate.

## Validação desta sessão

### Verificado no source

- censo dos consumidores de `scheduleAfterPublicRootMap` e consolidação do timeout terminal;
- `TerritoryEntryPage.tsx` sem import estático do JPG;
- `PublicRootOverlays.tsx` sem Router;
- `ConsentBanner.tsx` reduzido a adapter roteado;
- `ConsentBannerContent.tsx` sem dependência de `react-router-dom`;
- `@vercel/analytics/react` centralizado no owner consent-aware;
- preservação de commits concorrentes de Conta/Auth/Privacidade na `main`.

### Status remoto observado

No SHA `cc6fe01751c102469542108ba92b1fa1e220c02e`, o único status retornado pelo GitHub foi Vercel `failure` apontando para `upgradeToPro=build-rate-limit`.

Isso é limite do provider e **não certifica nem reprova o build do source**.

### Não certificado nesta sessão

- Vitest;
- typecheck;
- lint;
- build Vite/Vercel real;
- E2E;
- captura visual lado a lado da `/` neste SHA.

## Dívida conscientemente mantida

- `src/index.css` continua com duas gerações de regras da entrada e ainda precisa de limpeza source-aware.
- no mobile, `100dvh` + `overflow:hidden` no owner atual ainda pode produzir clipping em viewports baixos; não foi criado `!important`, alias ou override paralelo para mascarar o problema.
- referências antigas a `var(--territory-raised)` continuam aguardando remoção física; não criar `--territory-raised` como alias, pois a utility Tailwind válida já mapeia `territory-raised` para `--territory-surface-raised`.
- o plugin `strip-dead-entry-legacy-selectors` continua necessário até a remoção física segura dos seletores mortos.

## Regra operacional após G184

- timeout terminal da entrada pública pertence a `publicRootReadiness.ts`; consumidores não duplicam `6000` localmente para representar o mesmo contrato.
- mídia decorativa de baixa prioridade da `/` não compete com um mapa ainda dentro do orçamento terminal.
- overlays da raiz permanecem router-free; necessidades de pathname recebem o valor diretamente quando a superfície não é roteada.
- `@vercel/analytics/react` só pode ser importado pelo owner consent-aware e não deve montar antes de `analytics=true`.
- mudanças de consentimento local devem passar pelo owner observável; não recriar parsing/evento/storage key em componentes.
