# Messaging UI

`src/modules/messaging` é o owner horizontal de apresentação da Inbox/Chat privada.

**Status:** preservado e **pausado no MVP** (`messaging=false`).

Regras:

- a Inbox global não pertence a Community, Business, Classifieds, Mobility ou Comunicação Territorial;
- persistência específica de domínio permanece no agregado apropriado sob `src/core/messaging` (ou em outro owner quando a semântica é deliberadamente distinta, como chat de corrida);
- a UI recebe somente providers autorizados pela camada `app` e pelo lifecycle canônico;
- Business Direct Messaging permanece implementado/versionado, mas não é montado na Inbox enquanto `messaging=false`;
- ativar Messaging não ativa implicitamente Community, Classificados ou qualquer outro domínio;
- não existe tabela universal nem `MessagingService` monolítico;
- `/mensagens` e `/mensagens/:providerId/:threadId` são rotas canônicas preservadas para futura reativação, **não rotas ativas do corte atual**;
- `AppLayoutRoutes.tsx` e `activeLazyImports.ts` não devem importar a Inbox enquanto a capability estiver pausada;
- novos providers devem ser implementados em core, registrados explicitamente e autorizados pelo composition root antes de aparecer na Inbox;
- reativação exige mudança no `platformCapabilityRegistry`, autorização, testes de isolamento, build e E2E same-SHA; não criar redirect, alias ou rota paralela como atalho.
