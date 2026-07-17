# Comandos De Denuncias Sensiveis

## Decisao

Classificados, Vagas, Avaliacoes e Corridas mantem tabelas canonicas proprias.
Elas possuem lifecycle, motivos, status e RLS diferentes. Nao existe uma
tabela polimorfica universal de denuncias.

O que e compartilhado e o protocolo de comando server-owned:

1. o browser envia somente alvo, motivo e conteudo permitido;
2. o banco deriva o perfil ativo e o moderador autenticado;
3. trigger valida alvo, impede auto-denuncia e torna identidade imutavel;
4. limite por ator e deduplicacao protegem o comando;
5. escrita direta e revogada para `authenticated`;
6. auditoria append-only registra metadados, nunca texto livre ou evidencias.

## SSOT

| Dominio | Tabela | Comando de criacao | Comando de moderacao |
| --- | --- | --- | --- |
| Classificados | `classified_reports` | `create_classified_report` | `moderate_classified_report` |
| Vagas | `vaga_reports` | `create_vaga_report` | `moderate_vaga_report` |
| Avaliacoes | `review_reports` | `create_review_report` | `moderate_review_report` |
| Corridas | `ride_reports` | `create_ride_report` | `moderate_ride_report` |

Schema, grants, triggers e RPCs pertencem a
`20260714118000_harden_sensitive_report_commands.sql`. O frontend usa os
adapters dos dominios; nenhum componente escreve as tabelas diretamente.

## Enforcement

- RPC publico: `SECURITY INVOKER`, apenas `authenticated`.
- Funcao privada: `SECURITY DEFINER`, `search_path` fixo e identidade obtida
  de `auth.uid()` + perfil ativo.
- RLS: denunciante atual ou admin para leitura; admin para revisao.
- Grants: `INSERT`, `UPDATE` e `DELETE` revogados do role `authenticated`.
- Corridas: o ator precisa ser passageiro, motorista ou admin da corrida.
- Estados terminais nao podem ser reabertos pelo comando atual.
- O audit envelope privado nao replica descricao, notas nem URLs.

## Evidencias

- teste estatico: `tests/security/sensitive-report-commands-security.test.ts`;
- preflight remoto: `tests/security/sensitive-report-preflight-remote-audit.sql`;
- catalogo remoto: `tests/security/sensitive-report-commands-remote-audit.sql`;
- ownership: `docs/architecture/core-platform-ownership.json`.

## Residual Separado

`trust_events` continua sendo o SSOT de confianca operacional e nao deve ser
fundido com as quatro tabelas acima. Incidentes estao documentados em
`TRUST_MESSAGING_COMMANDS.md`; feedback operacional, late cancellation,
politica e admin actions estao em `TRUST_OPERATIONAL_COMMANDS.md`. CP-014 foi
fechado sem criar tabela paralela.
