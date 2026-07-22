# HOME-REVIEW — Sprint HOME.1

Status: revisão da Territory Home. Sem alteração de arquitetura, backend ou tokens.

Meta: transmitir em ≤5s "este é meu território · o que acontece · qual a próxima ação". Reduzir ~30% da carga visível acima da dobra.

## Blocos revisados

| # | Bloco | Estado anterior | Decisão | Motivo |
|---|-------|-----------------|---------|--------|
| 1 | Header territorial | Chip território + ícone busca + ícone sino | **Mantido, enxugado** — remove ícone de busca (duplicava a barra logo abaixo) | Reduz ruído no topo; sino é o único CTA global remanescente. |
| 2 | Busca | Input alto (h-14) com botão de voz | **Reduzida** — altura h-12, remove botão de voz (não implementado). | Ganho de ~20px acima da dobra; elimina affordance falsa. |
| 3 | Hoje | Grid 3 cards coloridos altos (168px min) | **Reduzido a 1 destaque + 2 chips compactos** | Antes ocupava toda a dobra. Vira "o que importa agora" com um destaque + rápida referência aos demais. |
| 4 | Ações rápidas | 4 pílulas 64px coloridas em bloco separado | **Movidas para abaixo da dobra**, reduzidas para chips 40px | Ações rápidas competiam visualmente com Hoje. Chips ainda oferecem acesso sem dominar. |
| 5 | Destaques | 4 cards mistos com paleta arbitrária (violeta/emerald/orange/pink) | **Mantido em posição, cores agora vêm dos tokens semânticos por categoria** | Consistência com DESIGN-TOKENS.md; deixa de ser catálogo colorido aleatório. |
| 6 | Explore | Card gradiente CTA + chip row de 7 verticais | **Card gradiente removido; mantém só o chip row** | Card duplicava a intenção do chip "Buscar" e parecia banner de marketplace. |
| 7 | FAB | Não presente nesta página | **Sem alteração** (Bottom Nav já cobre "Postar"). | Evita duas CTAs primárias competindo. |
| 8 | Bottom Nav | Já existe globalmente | **Sem alteração** | Fora do escopo desta sprint. |

## Redução da dobra (mobile 393×852)

Antes (aprox.): Header 72 · Busca 56 · Hoje (3 cards 168+margens) ≈ 220 · gap 28 · Ações rápidas parciais. Total dobra ≈ 570px + Ações rápidas empurradas para topo do scroll = usuário via ~5 blocos.

Depois: Header 60 · Busca 48 · Hoje (1 destaque 112 + 2 chips 44) ≈ 172 · início Destaques. Total dobra ≈ 400px = **~30% menos densidade**, usuário vê 3 blocos claros (território, busca, hoje).

## Regras aplicadas

- **CTA única por tela**: "Ver tudo" em Hoje continua sendo o destino de escape. Explore vira descoberta, não venda.
- **Consistência de cor**: `alert / event / discussion / business / gastronomy / mobility` agora referenciam `--category-*` (tokens congelados). Nenhuma cor Tailwind arbitrária (violet-500, emerald-500…) permanece.
- **Ritmo vertical**: espaçamento entre seções padronizado em `mt-6` (24px), títulos em `mt-6 mb-3`.
- **Tipografia**: título de seção 16px semibold, corpo 14px, meta 12px — 3 tamanhos, alinhado ao DESIGN-TOKENS.md.
- **Estados vazios**: Hoje passa a ter um fallback textual quando não há destaque (não é este PR, é ponto para HOME.2 com dados reais).

## O que NÃO mudou

- Rotas, hooks, `useActiveTerritory`, `useUnifiedNotifications`, `useSessionContext`.
- Componente Bottom Nav / FAB global.
- Layout desktop (`max-w-2xl` mantido — é mobile-first com respiro em telas grandes).
- Mocks de conteúdo (Hoje, Destaques) — continuam sendo estáticos até HOME.2 conectar dados reais.

## Próximos passos (HOME.2, fora desta sprint)

1. Conectar Hoje a alertas/eventos reais do território ativo.
2. Empty state real quando território não tem atividade nas últimas 24h.
3. Personalizar Destaques por interesses do usuário logado.
