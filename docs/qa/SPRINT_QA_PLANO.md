# Sprint Q&A — Fechamento Final
**Status**: ✅ Concluído estruturalmente  
**Última atualização**: 2026-04-05

---

## Frase de fechamento

> Sprint Q&A concluída estruturalmente. Perguntas em `community_questions`, respostas em `question_answers`, likes em `question_answer_likes`. Zero dependência de `comments` no fluxo Q&A. `comments` pertence exclusivamente a Posts Sociais.

---

## Estado final — separação explícita

| Módulo | Tabela(s) | Status |
|---|---|---|
| Posts Sociais | `posts`, `comments` | ✅ Concluído estruturalmente |
| Polls | `community_polls` (FK → `posts.id`) | ✅ Concluído |
| Q&A Perguntas | `community_questions` | ✅ Concluído — territorial, NOT NULL, FK |
| Q&A Respostas | `question_answers`, `question_answer_likes` | ✅ Concluído — canônico, sem comments |

---

## O que foi feito

| Item | Migration / Arquivo |
|---|---|
| Rename `community_posts` → `community_questions` | 000033 |
| `community_posts.location_id` NOT NULL + FK (antes do rename; efeito final em `community_questions`) | 000032 |
| `question_answers` com FK → `community_questions` | 000035 |
| `question_answer_likes` com UNIQUE(answer_id, user_id) | 000035 |
| Triggers de sincronização `likes_count` e `answers_count` | 000035 |
| RPC `mark_best_answer` atualizada para `question_answers` | 000035 |
| `CommunityQAService` sem dependência de `comments` | CommunityQAService.ts |
| `useNovaRecomendacao` com `location_id` obrigatório | useNovaRecomendacao.ts |
| `useRecomendacoes` com `useTerritoryFilter` | useRecomendacoes.ts |
| Polls migradas para `posts.id` | 000031 |

---

## Testes

| Suite | Resultado |
|---|---|
| `tests/qa-answers-regression.test.ts` | 27/27 ✅ |
| `tests/sprint-qa-regression.test.ts` | 26/26 ✅ |
| `tests/cleanup-legacy-posts-regression.test.ts` | 14/14 ✅ |
| `tests/fase6-ssot-posts-runtime.test.ts` | 13/13 ✅ |
| **Total** | **83/83 ✅** |

---

## Incompatibilidades operacionais

Nenhuma incompatibilidade real encontrada.

---

## Próxima sprint (futura)

- Remoção de `@ts-nocheck` (exige tipagem completa — escopo maior)
