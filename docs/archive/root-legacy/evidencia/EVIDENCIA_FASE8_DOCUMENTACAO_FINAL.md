# EVIDÊNCIA FASE 8 — DOCUMENTAÇÃO
**Sprint 2 - Posts (SSOT Territorial)**  
**Data**: 2026-04-05  
**Padrão**: AAA

---

## A. ARQUIVOS CRIADOS

1. `docs/posts/ARQUITETURA_POSTS_SSOT.md`
   — modelo de dados, FK canônica, trigger, RLS, camadas de responsabilidade, fluxos de criação e leitura, débitos técnicos

2. `docs/posts/GUIA_CRIACAO_POSTS.md`
   — como criar posts via UI e via service, erros esperados, regras inegociáveis, funções legadas deprecated

3. `docs/posts/GUIA_FILTROS_TERRITORIAIS.md`
   — expansão territorial, semântica de reach, uso via hook e service, ordenação por proximidade, restrições

---

## B. CONTEÚDO COBERTO

| Tópico | Documento |
|---|---|
| Modelo de dados e FK canônica | ARQUITETURA |
| Schema real introspectado (nullable, defaults) | ARQUITETURA |
| Trigger de validação | ARQUITETURA |
| RLS: leitura pública de publicados + ownership em escrita | ARQUITETURA |
| Camadas de responsabilidade | ARQUITETURA |
| Fluxo de criação (UI e service) | ARQUITETURA + GUIA_CRIACAO |
| Fluxo de leitura (feed + expansão) | ARQUITETURA + GUIA_FILTROS |
| Erros esperados e códigos | GUIA_CRIACAO |
| Funções legadas deprecated | GUIA_CRIACAO |
| reach como metadado de escopo intencional (não filtro, não restrição) | ARQUITETURA + GUIA_FILTROS |
| type sem CHECK constraint no banco | GUIA_CRIACAO |
| content nullable no banco | ARQUITETURA + GUIA_CRIACAO |
| Coluna real `verified` em profiles (não `is_verified`) | ARQUITETURA |
| Ordenação por location_id (sem texto) | GUIA_FILTROS |
| Débitos técnicos abertos | ARQUITETURA + GUIA_FILTROS |

---

## C. CORREÇÕES APLICADAS (pós-revisão)

| # | Problema | Correção |
|---|---|---|
| 1 | RLS descrita como "usuário só acessa posts próprios" | Corrigida: `posts_read_published` permite leitura pública; ownership só em escrita/edição/remoção |
| 2 | reach descrito como "visível apenas para moradores da rua" | Corrigido: reach é metadado de escopo intencional, não restrição de acesso; não filtra feed |
| 3 | content descrito como NOT NULL | Corrigido: `content` é nullable no banco (introspectado); validação é no service e na UI |
| 4 | type listado com valores garantidos pelo banco | Corrigido: `type` não tem CHECK constraint; valores são convenção de aplicação |
| 5 | JOIN de profiles pedia `is_verified` | Corrigido: coluna real em profiles é `verified` (boolean), não `is_verified` |

---

## D. DÉBITOS TÉCNICOS REGISTRADOS NA DOCUMENTAÇÃO

1. Validação de criação via usuário autenticado comum (RLS real) — pendente de evidência própria
2. Remoção de colunas legadas `city`, `neighborhood`, `street` do banco — aguarda migração completa
3. Remoção de `community_posts` — aguarda código não depender
4. Fallback visual residual em `usePostCard` — temporário, será removido com colunas legadas

---

**Status**: ✅ FASE 8 APROVADA — 3 documentos criados com schema real introspectado; 5 correções de precisão aplicadas; débitos técnicos registrados com precisão.
