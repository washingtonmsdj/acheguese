# Revisão — Entrada do site

Status: implementada nesta branch em 18/09/2026.

## Referências utilizadas

- `GUIA-PARA-IMPLEMENTAR.md` e `README.md` do catálogo.
- `02-entrada-do-site/README.md`.
- `02-entrada-do-site/pranchas/059-entrada-mvp-complexo.png` como referência principal.
- `src/app/pages/TerritoryEntryPage.tsx`.
- `src/app/components/territory-vivo/TerritoryEntryMap.tsx` e `TerritoryEntryMapRuntime.tsx`.
- `src/core/routing/config/territory.ts`, `publicTerritoryFallbacks.ts` e `src/index.css`.

## Auditoria e decisões

| Requisito | Situação | Decisão |
|---|---|---|
| Entrada community-first no MVP | Atende | Mantida em `/`, sem busca de cidade ou geolocalização na primeira tela. |
| Complexo e bairros | Atende | Nome, slug, cidade, estado e bairros continuam derivados das fontes canônicas de lançamento. |
| Exploração sem cadastro | Atende | Mantido o CTA público para `LAUNCH_URLS.community` e o aviso de que cadastro não é necessário. |
| Convite para expansão | Atende | Mantido o fluxo real de `/indicar-comunidade`, separado da comunidade ativa. |
| Mapa | Atende | Mantido o mapa real, carregamento progressivo, limite oficial e estados de indisponibilidade sem contorno aproximado. |
| Identidade visual | Ajustado | A composição foi alinhada à prancha usando tokens `territory-*`, Plus Jakarta Sans e superfícies compartilhadas. |
| Legibilidade e toque | Ajustado | Chips, textos secundários, CTA, menu e indicação receberam tamanhos mais confortáveis; alvos principais móveis ficam com pelo menos 44 px. |
| Semântica | Ajustado | O bloco da comunidade passou a anunciar também a nota que explica a exploração sem exigência de residência. |
| Sessão | Preservado | O cabeçalho continua refletindo a sessão real carregada sob demanda, sem transformar a entrada pública em área autenticada. |

## Alterações implementadas

- Refinamento responsivo da Entrada do site em `src/index.css` para 390 px, tablet e desktop.
- Aumento da legibilidade dos bairros, CTA, conta, nota de residência, indicação e rodapé.
- Aumento dos alvos de menu, conta e indicação para interação móvel confortável.
- Relação acessível entre o título do território e a explicação de participação sem exigência de residência.
- Ajuste do texto final para continuar derivado do rótulo público do território, sem hardcode do bairro.

## Verificações e evidências

- Contratos regressivos da entrada: 24 testes passaram.
- TypeScript da aplicação: passou.
- ESLint de `TerritoryEntryPage.tsx`: passou.
- Capturas no navegador: `test-results/entry-updated-mobile.png` em 390×844 e `test-results/entry-current.png` em 1440×900.
- Verificado visualmente: mapa real e seu estado de carregamento, CTA de exploração, menu móvel, ausência de rolagem horizontal e composição da faixa de indicação.
- Smoke browser em 360, 390, 768, 1024 e 1440 px: título e exploração visíveis, sem overflow horizontal; menu abre, mostra Privacidade e fecha com Escape.

## Pendências reais

- A checagem de Prettier acusa formatação anterior nos arquivos completos `src/app/pages/TerritoryEntryPage.tsx` e `src/index.css`; não foi executado `--write` para evitar reformatar estilos compartilhados fora deste fluxo.
- O e2e autenticado permanece condicionado às credenciais/fixtures do ambiente; nenhum dado de usuário foi inventado.

## Git

- Branch: `codex/reformulacao-entrada-comunidade`.
- Base de comparação: `main` alinhada a `origin/main` no início do trabalho.
- Commit visual publicado no branch remoto `codex/reformulacao-entrada-comunidade`; a separação das alterações preexistentes foi preservada com commits por caminho.
