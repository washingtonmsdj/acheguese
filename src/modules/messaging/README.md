# Messaging UI

`src/modules/messaging` é o owner horizontal de apresentação da Inbox/Chat privada.

**Status:** **ativo no MVP** (`messaging=true`).

Regras:

- a Inbox global não pertence a Community, Business, Classifieds, Mobility ou Comunicação Territorial;
- persistência específica de domínio permanece no agregado apropriado sob `src/core/messaging` (ou em outro owner quando a semântica é deliberadamente distinta, como chat de corrida);
- a UI recebe somente providers autorizados pela camada `app` e pelo lifecycle canônico;
- Business Direct Messaging participa enquanto Business estiver ativo, mas pausar Business remove somente esse provider e não pausa a Inbox;
- ativar Messaging não ativa implicitamente Community, Classificados ou qualquer outro domínio;
- não existe tabela universal nem `MessagingService` monolítico;
- `/mensagens` e `/mensagens/:providerId/:threadId` são rotas canônicas ativas;
- `AppLayoutRoutes.tsx` e `activeLazyImports.ts` montam a Inbox a partir da capability horizontal, nunca do status de uma vertical específica;
- novos providers devem ser implementados em core, registrados explicitamente e autorizados pelo composition root antes de aparecer na Inbox;
- pausar ou reativar uma vertical altera seus providers, não o lifecycle de Messaging.

Não criar redirect, alias, rota paralela ou acoplamento reverso entre capability e vertical.
