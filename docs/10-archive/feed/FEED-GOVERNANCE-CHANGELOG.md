# FEED-GOVERNANCE-CHANGELOG.md

Data: 2026-07-26

Sprint: FEED.GOVERNANCE.CLARIFICATION

## Mudanca aplicada

`docs/feed/FEED-GOVERNANCE.md` recebeu a secao oficial:

- `3.10 Profile Activity Exception`

## Motivo

A decisao arquitetural registrada em `docs/feed/FEED-PROFILE-BOUNDARY-DECISION.md` concluiu que:

- `ActivityTimeline` pertence ao dominio Profile;
- `useUserActivity` e `useActivityStats` sao read models privados;
- historico pessoal por `userId` e `profileId` nao e superficie publica do Feed;
- migrar Profile para Feed aumentaria acoplamento e forcaria `ResolvedTerritory` em uma tela privada que nao possui contexto territorial natural.

## Boundary esclarecido

Profile pode consumir read models atomicos de Comments, Posts e Engagement para compor historico pessoal read-only, estatisticas por autor, exportacao de dados e atividade recente da conta.

Isso nao autoriza:

- criar, editar, excluir, reagir, denunciar ou compartilhar alvo de Feed fora do Feed;
- listar conversa publica de post por `post_id` como experiencia territorial;
- substituir timeline, detalhe ou comentarios publicos do Feed;
- usar Profile Activity como discovery global de posts ou comentarios.

Qualquer abertura de post, comentario ou alvo social a partir de Profile continua obrigatoriamente passando pelo Feed/Routing e pela validacao territorial do Feed.

## Arquitetura

Nenhuma arquitetura foi alterada.

## Roadmap

Nenhum item do roadmap foi alterado.

## Codigo

Nenhum codigo foi alterado.

## Governanca

Nenhuma regra existente foi removida ou enfraquecida. A mudanca apenas esclarece que Profile Activity e uma excecao privada de Profile e nao uma superficie publica de Feed.
