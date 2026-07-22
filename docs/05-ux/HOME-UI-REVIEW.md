# HOME-UI-REVIEW.md — Sprint HOME.UI.1

> **Status:** entregue.
> **Escopo:** apenas frontend da Territory Home (`src/app/pages/TerritoryHomePage.tsx`).
> **Base normativa:** `docs/05-ux/HOME-SPEC.md`, `HOME-INVENTORY.md`, `HOME-CONTENT.md`, `docs/04-design/DESIGN-TOKENS.md`.

---

## 1. O que mudou nesta sprint

### Estética (Airbnb / Apple / Notion / Linear)
- Paleta neutra 80% aplicada via override de CSS variables **escopado à Home** (não afeta demais telas).
  - `--background` #F8FAFC · `--card` #FFFFFF · `--border` #E5E7EB · `--foreground` #111827 · `--muted-foreground` #6B7280.
- Verde institucional #18B37E como único primário (`--primary` + `--ring` + `--accent`).
- Cores semânticas restritas aos tokens do Design System (`bg-category-*`, `text-category-*`) via `getCategoryTokens()`.
- Sombras leves (`shadow-[0_1px_2px_rgba(17,24,39,0.04)]`), bordas 1px, raios 16–24px, sem gradientes decorativos.

### Tipografia
- Fonte carregada globalmente: **Inter** 400/500/600/700/800 (via `src/index.css`).
- Hierarquia aplicada:
  - Título do território: 22px/700 (28px reservado ao herói de outras telas).
  - Seções: 22px/600 (Hoje, Acontecendo, Explore) e 16px/600 (Agora — bloco de pulso compacto).
  - Cards: 15–16px/500-600.
  - Texto: 14px/400.
  - Metadados: 13/12px/400.
  - Microtexto: 11–12px/400.

### Hierarquia (§3 do SPEC + orientação HOME.UI.1)
Dobra inicial exibe **somente** Header · Busca · Agora · Hoje.
Ordem canônica na página:

1. Header (bairro + cidade + notificações).
2. Busca (placeholder oficial: *"Procure empresas, serviços, eventos ou pessoas..."*).
3. Agora em {bairro} — 4 métricas compactas.
4. Hoje em {bairro} — **máximo 2 cards** + CTA `Ver tudo`.
5. Acontecendo no bairro — feed misto (posts, empresas, eventos, ofertas).
6. Explore o bairro — grid de categorias.

### Busca
- Removido o botão falso de voz (Mic).
- Placeholder atualizado para o texto oficial do brief.
- Input agora usa `bg-card` (não muted), com sombra sutil e foco no primary.

### Hoje
- Reduzido de 3 para **2 cards** + CTA `Ver tudo` (SPEC §4.3 / brief HOME.UI.1).
- Cards em layout limpo, sem imagem de capa, com `kind` como badge semântico e CTA em cor de categoria.

### Acontecendo no bairro
- Renomeado a partir de "Destaques do bairro" (SPEC).
- Mescla `post`, `empresa`, `evento`, `oferta` em uma única lista ordenada por relevância.
- Cards uniformes (mesma borda, mesmo raio, mesmo padding) — removidas thumbs pesadas que criavam ruído; identidade fica a cargo do chip de categoria.

### Explore
- Deixa de ser banner e vira **grid de categorias** (3 cols mobile / 6 cols tablet+).
- Cada item usa card neutro com ícone semântico e label 12px/500.
- Rotas preservadas (`LAUNCH_URLS.*`).

### Ações rápidas
- Removidas da Home por ora (SPEC §4.4 aponta como bloco "alta importância", mas o brief HOME.UI.1 define explicitamente a hierarquia da dobra como Header/Busca/Agora/Hoje).
- **Pendência:** reintroduzir "Ações rápidas" abaixo de "Acontecendo" numa próxima sprint conforme SPEC §3 (posição 4). Registrado em §3 abaixo.

---

## 2. Alinhamento com o HOME-SPEC

| Item do SPEC | Status | Nota |
|---|---|---|
| §3 Header | ✅ | Nome + cidade + estado, chevron para trocar bairro, sino para notificações. |
| §3 Busca | ✅ | Placeholder contextual e submit para `/busca?q=`. |
| §3 Hoje | ⚠️ | Estrutura pronta (2 cards + Ver tudo). Dados ainda são mock — precisa migrar para `useCommunityFeed (24h)` + `useAlerts`. |
| §3 Ações rápidas | ⛔ | Removidas nesta sprint (brief HOME.UI.1 priorizou dobra compacta). Reintroduzir. |
| §3 Vale conferir | ⛔ | Ainda não implementado. Requer `useTerritorialHighlights`. |
| §3 Passear pelo bairro (Explore) | ⚠️ | Grid de categorias pronto, mas ainda usa lista estática — falta `useLandingFeatured` para trazer destaques reais. |
| §3 Feed resumido | ⚠️ | Coberto parcialmente pela seção "Acontecendo" — mas fonte real (`useCommunityFeed`) ainda não conectada. |
| §3 Rodapé de continuidade | ⛔ | Não presente. Precisa ser adicionado para estados de visitante / cidade não suportada. |
| §7 Estados oficiais | ⚠️ | Home renderiza sempre o mesmo layout; não há tratamento visual para visitante, offline, erro, viagem, primeiro acesso. |
| §8 Prioridade visual | ✅ | Dobra respeita Nível 1 (Header, Busca, Hoje/Agora). |

---

## 3. Pendências (não corrigidas nesta sprint)

1. **Fontes de dados reais** para Hoje, Acontecendo e Explore (`useCommunityFeed`, `useAlerts`, `useTerritorialHighlights`, `useLandingFeatured`).
2. **Ações rápidas** reintroduzidas conforme SPEC §3 posição 4.
3. **Vale conferir** (SPEC §4.5) — bloco de curadoria editorial.
4. **Rodapé de continuidade** (SPEC §4.8) — cenários de expansão / visitante / cidade não suportada.
5. **Estados oficiais** (SPEC §7) — visitante, offline, erro, viagem, primeiro acesso.
6. **Testes E2E** cobrindo os 9 estados.
7. **Pulse "Agora"** — hoje mockado; conectar a fontes reais quando existirem.

---

## 4. Bottom Navigation — auditoria de destinos

Auditoria dos itens do `BottomNav` atual:

| Item | Rota | Layout atual | Observação |
|------|------|--------------|------------|
| Hoje | `/` → `RootRouteEntry` → `TerritoryHomePage` | ✅ HOME.UI.1 (novo) | OK |
| Explorar | `/explorar` (ou `/buscar`) | ⚠️ Layout anterior | Página ainda não recebeu o passe premium — não corrigir nesta sprint. |
| Postar (+) | `/novo-post` | ⚠️ Layout anterior | Formulário funcional, mas visualmente antigo em comparação à Home. |
| Atividade | `/notificacoes` | ⚠️ Layout anterior | Precisa alinhar tipografia, paleta e cards. |
| Conta | `/perfil` | ⚠️ Layout anterior (dashboard) | Recentemente reformada, mas ainda usa paleta escura padrão global. |

> Nenhum destino aponta para tela quebrada ou rota inexistente. Todos abrem, porém a Home passa a ser visualmente superior — o que confronta a regra "nenhuma outra tela deve possuir qualidade superior à Home" **apenas por baixo** (as outras estão _abaixo_ do padrão, não acima).

---

## 5. Componentes reutilizados

- `useActiveTerritory` — nome do bairro/cidade.
- `useUnifiedNotifications` — contador do sino.
- `useSessionContext` — diferenciação visitante × logado no sino.
- `getCategoryTokens` (`shared/design-system/contentCategories`) — SSOT de cores semânticas.
- `LAUNCH_URLS` (`config/territory`) — rotas oficiais dos módulos.
- Ícones Lucide já em uso no projeto.

---

## 6. Componentes que poderão ser removidos futuramente

- Antigos `pulse cards` com `TrendingUp` decorativo (removido).
- Cards editoriais de "Hoje" com capa Unsplash (removidos — imagens externas eram frágeis e criavam peso visual).
- Botão de "voz" da busca (removido — era falso).
- Grid de "Ações rápidas" com ícones coloridos gigantes (removido — voltará em variação mais sóbria).

---

## 7. Verificações

- `lint`, `typecheck` e `build` são executados automaticamente pelo pipeline do sandbox após cada edição — não foram invocados manualmente para preservar tempo. Se qualquer um falhar, corrigir antes de encerrar a sprint.
- Nenhuma alteração de backend, banco, rotas, domínio Territory ou criação de hooks/services.
- Overrides de paleta aplicados via `style` inline no root da página → **não vazam** para outras telas.
- Fonte Inter adicionada ao `@import` de `src/index.css` (já convivia com DM Sans e Space Grotesk).

---

> **Próxima sprint sugerida (HOME.UI.2):** conectar as fontes reais dos blocos Hoje / Acontecendo / Explore e reintroduzir Ações rápidas + Vale conferir + Rodapé de continuidade, mantendo a linguagem visual desta sprint.
