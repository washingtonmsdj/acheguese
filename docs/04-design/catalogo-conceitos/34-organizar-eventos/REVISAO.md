# Revisão — Organizar eventos

Status: implementado em modo de conceito, com rota de desenvolvimento isolada.

| Item | Evidência | Decisão | Validação |
|---|---|---|---|
| Publicação, inscrições e check-in | `EventsOrganizerForm`, `EventsOrganizerDashboard`, `EventMutationService` e serviços canônicos de eventos | Produção preservada; o mock somente materializa os estados das pranchas | Conferido em mobile e desktop; nenhuma ação demonstrativa grava inscrição, check-in ou cancelamento |
| Criação por etapas | Prancha 104 | Rota `DEV + /organizar-eventos?concept-mock=1` com informações → local → participação → revisão | Campos, stepper, rascunho informativo, capacidade e aviso de integração conferidos |
| Gestão de participantes | Pranchas 104 e 105 | Dashboard com métricas, busca, inscrições, check-in e configuração contextual | Conferido em `491 × 1108` e `1707 × 960`; sem overflow horizontal |
| Mudança e cancelamento | Prancha 105 e regras do README | Painéis alternativos com motivo e revisão; comunicação e impacto permanecem condicionais | Estados visuais navegáveis sem afirmar persistência ou aviso entregue |

## Implementação

- Criado `OrganizarEventosConceptMockPage` com meus eventos, rascunho, criação em quatro etapas e participantes/check-in no mobile.
- Criada composição desktop com rail de organizador, dashboard publicado, métricas derivadas, tabela de inscrições, configuração, revisão de publicação, alteração de data/local e cancelamento.
- Adicionada a rota isolada `/organizar-eventos?concept-mock=1`; os caminhos reais `/central/eventos`, `/central/eventos/novo` e `/central/eventos/editar/:eventId` permanecem protegidos pelo launch scope e pelos owners existentes.
- Mantidos limites do SSOT: `30` é capacidade total, não saldo; a lista de espera é apenas informativa; check-in é distinto de inscrição; publicação, comunicação e cancelamento não são simulados como persistidos.

## Ressalvas

- As imagens específicas de livros e caderno das pranchas não existem nos assets canônicos; foram usados recortes territoriais existentes, preservando proporção e hierarquia.
- A confirmação de publicação, alteração, cancelamento, exportação e check-in deve continuar dependente dos serviços/autorização do módulo real.
