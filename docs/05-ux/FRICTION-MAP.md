# FRICTION MAP — Sprint JOURNEY.1

Classificação dos pontos de atrito extraídos do `USER-JOURNEY-REVIEW.md`.
Escala: **Crítico · Alto · Médio · Baixo**.

Escopo de correção: **apenas jornada** — copy, rotas de retorno, nomes de CTA, continuidade visual. Sem alterar arquitetura, backend, banco, tokens ou funcionalidades.

---

## Crítico

| # | Atrito | Jornada | Correção |
|---|---|---|---|
| C1 | `/busca` usa voz admin ("Busca inteligente / linguagem natural") e gradiente próprio, quebrando a continuidade com a Home. | 11 | Reescrever hero em voz editorial e alinhar à estética Home. |
| C2 | Retorno ao app leva sempre para `/` (Selector), ignorando bairro salvo. | 13 | Se houver `activeLocation`, redirecionar `/` para a Territory Home. |
| C3 | Três nomes coexistem para a mesma coisa: **bairro / comunidade / território**. | Todas | Padronizar user-facing em "bairro" (ou "cidade" quando cidade). |
| C4 | Módulo Eventos leva a `LaunchPausedPage` sem contexto de continuidade. | 9 | Copy da página pausada deve soar como continuação do bairro, não como erro. |

## Alto

| # | Atrito | Jornada | Correção |
|---|---|---|---|
| A1 | Após publicar, usuário volta para `/comunidade` genérico em vez do Feed do bairro atual. | 6 | Redirecionar para o Feed do território ativo. |
| A2 | Após login, ignora `?redirect=` — sempre cai no root. | 2 | Preservar redirect param. |
| A3 | Empresas usa CTAs variados ("Ver detalhes" / "Abrir" / "Ver empresa"). | 7, 8 | Padronizar para "Ver no bairro" ou "Abrir empresa". |
| A4 | Título "Empresas" em voz admin. | 7 | Renomear em superfícies user-facing para "Comércios do bairro". |
| A5 | Selector fala "Ver cidade / Ver meu bairro" que não bate com "Abrir o bairro" da Home. | 1, 3 | Unificar em "Abrir o bairro" / "Explorar a cidade". |

## Médio

| # | Atrito | Jornada | Correção |
|---|---|---|---|
| M1 | Header do Feed e do Modal de Post não espelham o header da Home. | 4, 5 | Uniformizar título/subtítulo com o padrão "no bairro". |
| M2 | Notificações misturam voz formal e editorial nos títulos. | 12 | Revisar copy dos templates user-facing. |
| M3 | Loading/Empty em `/busca` e Empresas usam microcopy neutra. | 7, 11 | Trocar por copy de vizinho ("Procurando no bairro..."). |
| M4 | Trocador de bairro no header não sinaliza "visitante em viagem". | 10 | Rotular bairro atual quando difere do bairro cadastrado. |

## Baixo

| # | Atrito | Jornada | Correção |
|---|---|---|---|
| B1 | Splash usa CTAs longos ("Ver cidade" / "Ver meu bairro"). | 1 | Deixar apenas um caminho primário. |
| B2 | Post modal ocasionalmente perde scroll ao fechar. | 5 | Preservar scroll ao dispensar. |
| B3 | Lista de bairros longa sem âncoras alfabéticas. | 3 | Sticky com primeira letra. |

---

## Plano de correção nesta sprint (apenas jornada)

Aplicar somente estes itens agora, sem tocar em arquitetura:

- **C1** — Reescrever hero de `/busca` na voz do bairro.
- **C2** — Splash/Root redireciona para a Home do bairro ativo.
- **C3** — Substituir "comunidade/território" por "bairro" em superfícies user-facing tocadas nesta sprint.
- **C4** — Ajustar `LaunchPausedPage` para soar como continuidade.
- **A5** — Unificar CTAs do Splash.

Demais itens ficam mapeados como backlog priorizado — não são alterações de jornada isoladas de arquitetura.
