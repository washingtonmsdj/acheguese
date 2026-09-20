# Revisão — Grupos da comunidade

Status: implementado em modo de conceito, com rota de desenvolvimento isolada.

| Item | Evidência | Decisão | Validação |
|---|---|---|---|
| Privacidade, entrada e papéis | `GruposPage`, `GrupoDetailPage`, hooks e serviços canônicos | Preservados em produção; mock visual não autoaprova nem persiste | Conferido nos estados de descoberta, detalhe, conversa, pendência, criação, solicitações, funções e arquivamento |
| Descoberta e participação | Pranchas 097 e 098 | Rota `DEV + /grupos?concept-mock=1` com mobile/desktop separados | Comparação lado a lado em `425 × 1108` e `1707 × 960`; sem overflow horizontal |
| Criação e gestão | Pranchas 099 e 100 | Fluxo identidade → regras → revisão; solicitações/funções/arquivamento como estados demonstrativos | Navegação percorrida no navegador interno; regras de aprovação e transferência permanecem condicionais |

## Implementação

- Criado `GruposComunidadeConceptMockPage` com as quatro superfícies mobile (descobrir, detalhe, conversa e solicitação pendente) e a composição desktop em três colunas (grupos, conversa e informações).
- Incluídos os estados de criação, regras, revisão, solicitações de entrada, membros/funções e grupo arquivado, sem substituir as telas reais do módulo de grupos.
- A rota de conceito só existe em desenvolvimento e não altera o caminho territorial de produção (`/comunidade/.../grupos`).
- O reset visual da folha de acessibilidade é neutralizado apenas dentro desta composição, para manter os espaçamentos do concept sem alterar outras telas.

## Ressalvas

- As imagens de livros, horta e placa das pranchas não existem como assets canônicos no repositório; foram usados os assets demonstrativos comunitários já existentes, preservando proporção, recorte e hierarquia visual.
- O estado “Meio ambiente” é ilustrativo conforme o README do concept e não cria uma categoria canônica nova.
