# FEED.P0.D.3.HARDENING REPORT

Data: 2026-07-27

Sprint: FEED.P0.D.3.HARDENING

Status: pronta para encerramento

## 1. Escopo

Implementado exclusivamente o hardening do bloqueador `P0D3-R1` identificado em `docs/feed/FEED-P0.D.3-REVIEW.md`.

Nao foram implementadas novas funcionalidades, novas regras de produto, nova arquitetura, comentarios, replies, reacoes, saves, realtime, notificacoes, moderacao, edicao ou exclusao.

## 2. Arquivos Alterados

- `src/core/feed/hooks/useShareFeedItem.ts`
- `src/core/feed/__tests__/useShareFeedItem.spec.tsx`
- `docs/feed/FEED-P0.D.3-HARDENING-REPORT.md`

## 3. Ajuste Implementado

### P0D3-H1

`useShareFeedItem()` nao aceita mais `/comunidade` como base territorial.

A base de compartilhamento agora passa por normalizacao e so e aceita quando:

- representa uma rota comunitaria com segmento real apos `/comunidade`; ou
- existe `canonicalFeedUrl` auditavel que tambem representa rota comunitaria valida.

Quando nao existe base valida:

- o hook falha fechado;
- nao chama `FeedService.shareItem()`;
- nao gera URL;
- nao abre Web Share;
- nao copia para clipboard;
- nao invalida cache.

O resultado retornado e `share_unavailable` quando o `FeedContext` esta pronto, ou `context_invalid` quando o proprio contexto tambem falha.

## 4. Testes Adicionados

### P0D3-H2

Adicionado teste para:

- `window.location.pathname = "/comunidade"`

Resultado validado:

- retorno fechado com `share_unavailable`;
- `FeedService.shareItem()` nao chamado;
- `navigator.share` nao chamado;
- `navigator.clipboard.writeText` nao chamado;
- nenhuma invalidacao de cache.

### P0D3-H3

Adicionado teste para rota territorial valida:

- `/comunidade/ba/salvador/pituba/feed`

Resultado validado:

- compartilhamento continua funcionando;
- base repassada ao Feed permanece territorial;
- Web Share recebe a URL esperada.

## 5. Aderencia A GOVERNANCE

Resultado: aderente ao hardening da P0.D.3.

- Compartilhamento publico continua passando pelo boundary do Feed em rotas validas.
- `/comunidade` puro nao e mais tratado como base territorial.
- Nao ha fallback global nominal.
- Nao ha Web Share/clipboard quando a base territorial nao e auditavel.
- `canonicalFeedUrl` so e usado pelo hook apos normalizacao como rota comunitaria valida.
- O bloqueador `P0D3-R1` foi eliminado sem alterar arquitetura.

## 6. Riscos

Risco baixo.

O comportamento fica mais restritivo apenas para superficies que tentem compartilhar post de Feed fora de uma rota comunitaria territorial e sem `canonicalFeedUrl` valida. Esse e o comportamento esperado pela GOVERNANCE.

Possivel impacto residual:

- paginas que renderizem post de Feed fora de `/comunidade/...` precisam fornecer `canonicalFeedUrl` valida para permitir share;
- caso contrario, o share falha fechado em vez de gerar URL nominal.

## 7. Rollback

Rollback tecnico:

1. Reverter apenas as alteracoes em `src/core/feed/hooks/useShareFeedItem.ts`.
2. Reverter os testes adicionados em `src/core/feed/__tests__/useShareFeedItem.spec.tsx`.
3. Manter proibido qualquer retorno a `sharePost()` publico, `postService.recordPostShare()` publico ou `LAUNCH_URLS.community` como fallback.

Rollback seguro nao pode reintroduzir:

- `/comunidade` como base valida de share;
- fallback global nominal;
- Web Share/clipboard sem base territorial auditavel;
- compartilhamento fora do `FeedService` em callers publicos.

## 8. Validacao

Executado:

- `npm run test -- src/core/feed` - passou: 12 arquivos, 129 testes.
- `npm run typecheck` - passou.
- `npm run lint` - passou com 13 warnings preexistentes de mapa fora do escopo.
- `npm run build` - passou.

Observacao operacional:

- duas primeiras execucoes de `npm run typecheck` foram encerradas por timeout operacional do runner antes de concluir;
- os processos remanescentes foram encerrados;
- a execucao final de `npm run typecheck` concluiu com exit code 0.

Warnings fora do escopo no lint:

- `src/app/pages/AchegueSeHomePage.tsx`
- `src/app/pages/AchegueSeHomePageMap.tsx`
- `src/app/pages/OnboardingPage.tsx`
- `src/app/pages/PreLaunchTerritoryMap.tsx`

Regra:

- `maps/no-manual-entity-projection`

## 9. Conclusao

O bloqueador `P0D3-R1` foi corrigido. A P0.D.3 agora preserva falha fechada quando a base de share nao e territorial ou auditavel, mantendo funcionamento normal em rota territorial valida.

Status final: A Sprint FEED.P0.D.3 esta pronta para encerramento.
