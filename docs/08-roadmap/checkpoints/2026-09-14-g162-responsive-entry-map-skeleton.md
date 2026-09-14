# G162 — Responsive entry map skeleton

Data: 2026-09-14
Branch: `main`

## Objetivo

Garantir que a entrada pública nunca apresente uma área vazia durante o carregamento do mapa e que o skeleton represente corretamente a área final tanto no mobile quanto no desktop, sem desenhar ou aproximar fronteiras territoriais.

## Implementação

- criado `TerritoryEntryMapSkeleton.tsx` como owner único do estado visual de carregamento do mapa;
- wrapper e runtime passaram a usar o mesmo skeleton;
- wrapper e runtime preservam `h-full min-h-full w-full`, ocupando toda a área reservada ao mapa;
- composição mobile compacta com card de status em largura total;
- composição desktop adaptada à coluna ampla do mapa, com blocos neutros adicionais, vias abstratas e status contextual;
- skeleton desktop continua preenchendo a célula direita da grade, que representa aproximadamente 57% da largura principal;
- nenhum SVG, path, coordenada, ring ou geometria aproximada é usado no skeleton;
- skeleton permanece visível até MapLibre estar pronto e o carregamento da geometria territorial terminar;
- timeout preserva saída de falha em vez de skeleton infinito;
- `prefers-reduced-motion` continua respeitado;
- classes Tailwind e `calc()` do skeleton foram normalizados para evitar estilos descartados no build.

## Regressão

`tests/regression/public/territory-entry-map-skeleton.test.ts` agora exige:

- um único skeleton compartilhado;
- ocupação de área completa;
- variantes responsivas mobile/desktop;
- permanência até mapa + boundary estarem prontos;
- timeout de falha;
- ausência de `fallback_boundary_rings`;
- suporte a reduced motion.

## Estado de validação

As regressões foram atualizadas no repositório, mas não devem ser declaradas como executadas enquanto não houver runner verde. O status externo do Vercel segue sujeito ao `build-rate-limit` observado nesta linha.

## Próximo passo

Medir em browser real, quando houver runner/deploy disponível:

- CLS durante skeleton → mapa;
- LCP da entrada;
- INP durante carregamento do mapa;
- comportamento em 320–359 px;
- comportamento desktop em 1366×768 e 1920×1080;
- transição visual em conexão lenta/CPU reduzida.
