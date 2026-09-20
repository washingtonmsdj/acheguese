# Revisão — Inscrição e check-in

Status: implementada em mock visual de desenvolvimento.

| Item | Evidência | Decisão | Validação |
|---|---|---|---|
| Validação e política de auto check-in | `EventRuntimeService`, `EventCheckin.tsx` e regras do README | A interface separa inscrição, credencial e entrada; auto check-in/câmera não foram inventados como integração produtiva | Conferido no mobile e desktop; nenhum estado de sucesso é atribuído ao usuário final sem a linguagem de validação do servidor |

## Decisões de implementação

- A referência foi isolada em `DEV + /inscricoes-checkin?concept-mock=1`; as telas e serviços canônicos de inscrição/check-in não foram substituídos.
- O mobile cobre inscrições próximas, credencial demonstrativa, presença confirmada e indisponibilidade de consulta. O desktop cobre leitura de credencial, código manual, contexto do evento e os três resultados ilustrativos da prancha.
- O QR é explicitamente marcado como `DEMONSTRATIVO`, o código é `EXEMPLO` e o certificado informa que depende de oferta e critérios do organizador. Nenhum desses elementos representa credencial válida ou certificado emitido.
- A indisponibilidade usa a mensagem de incerteza recomendada: não declara que o check-in falhou ou não ocorreu sem consultar o servidor.
- A barra inferior mobile permanece fixa no viewport, com espaço inferior reservado no conteúdo; a grade desktop mantém as duas colunas e os resultados abaixo sem overflow horizontal.

## Validação visual e técnica

- Navegador interno mantido aberto em duas abas durante a revisão: mobile `491 × 1108` e desktop `1707 × 960`, ambas apontando para o conceito 35.
- Foram comparados lado a lado: inscrições, credencial, entrada registrada, sem conexão e a tela desktop de validação. `body.scrollWidth` permaneceu dentro do viewport (`491` no mobile; `1687` dentro da área útil de `1707` no desktop).
- ESLint direcionado passou e o typecheck dos projetos `app` e `node` foi executado após o ajuste de layout.

## Git

- Commit restrito ao mock de inscrição/check-in, aos desvios de rota/layout de desenvolvimento e a esta documentação; alterações staged/unstaged preexistentes permanecem fora do commit.
