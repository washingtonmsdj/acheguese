# FEED-REVIEW — Sprint FEED.1

Auditoria do Territory Feed (`/comunidade/...` → `TerritoryFeedPage`) com base na régua estabelecida pela Territory Home (HOME.1 / HOME.1.5).

Sem mudanças de arquitetura, backend, banco, funcionalidades ou domínio. O objetivo é único: **o Feed deve parecer a continuação da Home, não um outro produto.**

## Diagnóstico atual

Hoje o Feed sofre de três problemas de percepção:

1. **Ruptura visual.** Home usa tokens semânticos por categoria, cards com respiro, tipografia editorial. O Feed ainda mistura gradientes teal/cyan hardcoded (`#4FD1C5 → #06B6D4`), fundos escuros arbitrários (`bg-[#12181B]`) e cores fora do design system.
2. **Ruído de controles.** Filtros de categoria, filtros de ordenação, filtros por tipo, seletor de escopo, seletor de sort, botão de criar post, ações rápidas, banner de verificação — tudo compete pela dobra.
3. **Copy de painel.** "Comunidade", "ORDENAR POR", "FILTRAR POR TIPO", "Nenhum post encontrado", "Criar Post". Não é vizinho conversando — é sistema administrativo.

O Feed responde bem à pergunta técnica ("me dê a timeline"), mas falha na pergunta humana: **o que está acontecendo no meu bairro agora?**

## Referência: régua da Home

| Dimensão | Home (referência) | Feed (hoje) | Ação |
|----------|-------------------|-------------|------|
| Título de tela | "Pituba" (herói) | "Comunidade" (genérico) | Trocar por território ativo |
| Fundo | `bg-background` semântico | `bg-[#12181B]` hardcoded | Migrar para token |
| Categorias | tokens semânticos (`content.alert`, `content.event`...) | `bg-blue-500/10`, `bg-emerald-500/10` etc. | Migrar para tokens |
| CTA principal | 1 por bloco | 3-4 competindo | Reduzir a 1 |
| Vocabulário | "Vale conferir", "Passear pelo bairro" | "ORDENAR POR", "FILTRAR POR TIPO" | Humanizar |
| Loading | "Ouvindo o bairro..." | skeleton mudo + "Carregando..." | Alinhar |
| Empty state | "Ainda está quieto por aqui." | "Nenhum post encontrado" | Alinhar |

## Análise por bloco

### 1. Header

**Hoje.** `CommunityHeader` mostra `<h1>Comunidade</h1>` fixo, com botão "Criar Post" ao lado, filtro de localização e sort selector empilhados. Em mobile ocupa ~3 alturas de bloco antes do primeiro post.

**Problema.** O usuário abre o Feed e não vê o bairro dele. Vê a palavra "Comunidade" — que já está no bottom nav, no breadcrumb, na URL.

**Correção (HOME.1 aplicada).**
- Título vira o nome do território ativo (`Pituba`), com subtítulo `Feed do bairro`.
- Ícone `MapPin` à esquerda, mesmo padrão do `TerritoryFeedHeader` já existente.
- Botão "Criar Post" some do header e vira **FAB único** (canto inferior direito), reaproveitando o padrão da Home.
- Filtros de localização/sort saem do header e viram uma **barra de filtro única, colapsável**, logo abaixo (ver bloco 5).

### 2. Composer / CTA de publicação

**Hoje.** `CreatePostButton` aparece em 2-3 lugares (header, sidebar, empty state, FAB), cada um com estilo próprio. Copy: "Criar Post".

**Problema.** CTA duplicada quebra hierarquia. "Criar Post" é linguagem de admin.

**Correção.**
- **Uma única CTA visual:** FAB fixo inferior-direito.
- Botão no header vira link fantasma opcional apenas em desktop (`text-primary hover:underline`).
- Copy: **"Publicar no bairro"** (desktop) / **"Publicar"** (mobile) / ícone `+` (FAB).
- Empty state ganha CTA própria e explícita — não conta como duplicação (é o único caminho quando a lista está vazia).

### 3. Cards

**Hoje.** `PostCard` mistura estilos: gradientes teal, cores hardcoded, badges CAPS, spacing inconsistente entre tipos (post, evento, alerta, enquete).

**Correção sem mudar arquitetura.**
- Aplicar `getCategoryTokens(...)` (já existente em `src/shared/design-system/contentCategories.ts`) para cor de borda, ícone e badge.
- Uniformizar `rounded-2xl`, `border border-border/60`, `bg-card` em todos os tipos.
- Substituir gradientes por `bg-primary` + `text-primary-foreground` nas ações primárias.
- Padding interno: `p-4` mobile, `p-5` desktop — mesmo ritmo dos cards da Home.
- Etiquetas de categoria mantêm o formato CAPS (carimbo semântico), mas usam `bg-[categoria]/10 text-[categoria] border-[categoria]/20`.

### 4. Comentários

**Hoje.** `CommentPreview` + `CommentsModal` funcionam, mas a copy é seca: "0 comentários", "Ver comentários", "Responder".

**Correção editorial.**
- "0 comentários" → **"Ninguém comentou ainda. Comenta você."**
- "N comentários" → **"N vizinhos comentaram"** (até 10) / **"N comentários"** (>10).
- "Responder" → **"Responder"** (mantido — já é natural).
- "Ver comentários" → **"Abrir a conversa"**.

### 5. Filtros

**Hoje.** Três controles paralelos:
- `FeedCategoryFilter` — 11 chips de categoria em wrap.
- `FeedFilters` — sort (Recentes/Populares/Próximos) + tipo (Todos/Discussão/Dicas/Enquetes).
- `LocationFilter` + `SortSelector` no header.

**Problema.** O usuário não sabe qual filtro tem efeito sobre qual, e a soma consome ~200px acima da dobra.

**Correção sem alterar dados.**
- **Uma barra única sticky, colapsável.**
- Linha 1 (sempre visível): chips de escopo — **Rua** · **Bairro** · **Cidade** (ordem crescente).
- Linha 2 (colapsável, revelada por "Mais filtros"): chips de categoria (mesmos IDs, mesma API).
- Sort vira ícone único no canto direito (menu dropdown), não chips.
- Remover títulos "ORDENAR POR" e "FILTRAR POR TIPO" (labels de admin).

### 6. Abas

**Hoje.** `?tab=grupos|feed|discussoes` navega entre `feed`, `groups`, `discussions` via `activeView` no `ComunidadePage`.

**Correção.**
- Manter as três abas, mas renomear:
  - `Feed` → **"Agora"** (o que está rolando)
  - `Discussões` → **"Conversas"** (mantido em fallback)
  - `Grupos` → **"Grupos"** (mantido — nome do domínio)
- Abas horizontais com underline (padrão shadcn `Tabs`), sem pílulas gradientes.

### 7. Hierarquia visual

**Hoje.** Header (sticky) + Banner de verificação + QuickActions + Filtros + Feed → total ~4 seções acima da dobra em mobile.

**Correção.**
- Ordem final: **Header territorial** → **Barra de filtro única** → **Feed** → **FAB**.
- Banner de verificação vira alerta inline discreto no topo do feed (não bloco separado).
- QuickActions saem da tela do Feed (já existem na Home — não duplicar).

### 8. CTA principal

Uma só: **FAB "Publicar no bairro"** (canto inferior direito, sombra elevada, cor `primary`).
Todas as outras CTAs viram links fantasma ou ícones.

### 9. Estados vazios

Alinhados com HOME-CONTENT.md.

| Contexto | Copy atual | Nova copy |
|----------|------------|-----------|
| Feed sem posts | "Nenhum post encontrado" | **"Ainda está quieto na [Bairro]. Publique o primeiro."** |
| Feed sem posts numa categoria | "Nenhum post na categoria X ainda." | **"Nada por aqui em [Categoria]. Que tal começar?"** |
| Feed sem posts perto | (não existe) | **"Ninguém publicou perto de você hoje. Ampliar para o bairro todo?"** |
| Feed vazio para visitante | (usa gate) | **"O bairro só aparece pra quem mora aqui. Entre para ver."** |

### 10. Loading

Alinhado com HOME.

- Skeleton silencioso nos primeiros 2s.
- Se demorar > 2s: **"Ouvindo o bairro..."**
- Se demorar > 6s: **"Está demorando mais que o normal. Tentar de novo?"**
- Erro: **"Não consegui ouvir o bairro agora."** + botão "Tentar de novo".

## O que NÃO muda

- Rotas, hooks, dados, gates de acesso (`CommunityPortalGate`).
- Filtros funcionais e sua API (`FeedCategory`, `FeedSortType`, `FeedPostType`, `locationScope`).
- Domínio (`Territory`, `Community`, `Group`, `Post`).
- Comportamento dos modais (`CreatePostModal`, `CommentsModal`, `DirectMessageModal`).
- SSOT de compartilhamento (`postShare.ts`).

## Ordem de aplicação (sem quebrar nada)

1. **FEED.1.a — Editorial (esta sprint).** Trocar copy visível: header, filtros, empty, loading, CTA. Zero mudança de componente. Ver FEED-CONTENT.md.
2. **FEED.1.b — Tokens.** Migrar cores hardcoded (`#12181B`, `#4FD1C5`, gradientes) para tokens semânticos e `getCategoryTokens`. Componentes iguais, estilos limpos.
3. **FEED.1.c — Hierarquia.** Consolidar filtros em uma barra única e mover o CTA para FAB único. Sem tocar em dados.

## Diagrama de continuidade Home → Feed

```text
Territory Home                     Territory Feed
────────────────                   ────────────────
Header: "Pituba"                   Header: "Pituba" · Feed do bairro
Busca                              Barra de filtro única
"Hoje na Pituba"          ─────►   Timeline "Agora"
"Vale conferir"                    Cards padronizados
"O que você quer fazer?"           FAB "Publicar no bairro"
"Passear pelo bairro"
```

Mesmo território. Mesmo tom. Mesma régua visual. O usuário passa de um bloco ao outro sem sentir que trocou de app.
