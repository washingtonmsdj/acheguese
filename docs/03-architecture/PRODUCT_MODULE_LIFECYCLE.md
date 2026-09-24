# Product & Platform Lifecycle

> Contrato arquitetural para ativação/pausa do Achegue-se.
>
> **Owners executáveis:**
> - domínios: `src/app/config/productModuleRegistry.ts`;
> - capabilities horizontais: `src/app/config/platformCapabilityRegistry.ts`;
> - avaliação cruzada de dependências: `src/app/config/lifecycleRegistry.ts`.
>
> Este documento explica as regras; os registries são a autoridade runtime.

## Escopo do MVP

### Domínio de produto ativo

- `business` — Empresas.

Business é o único domínio/vertical de produto ativo no primeiro release.

### Capabilities horizontais ativas

- `auth`;
- `profiles`;
- `account`;
- `territory`;
- `location`;
- `notifications`;
- `central`;
- `map`;
- `nearby`;
- `search`;
- `messaging`.

Essas capabilities não são domínios de negócio. Elas podem atender Business hoje
e outros domínios quando forem certificados.

Dependências importantes:

- `nearby -> map + location + business`;
- `messaging -> auth + profiles`; providers individuais continuam condicionados ao lifecycle de seus domínios;
- Search só executa providers de domínios/capabilities habilitados;
- Map só projeta layers de domínios habilitados.

No MVP, Messaging registra somente o provider **Business Direct Messaging**.

## Por que separar domínio de capability

Não tratar Search, Messaging, Notifications, Map ou Nearby como “módulos verticais”.

A disponibilidade de uma capability horizontal não deve ser usada como proxy para o lifecycle de um provider. Pausar Gastronomy, Mobility ou Classifieds pausa seus adapters/produtores/providers, não a Inbox de Notificações, o mecanismo de Mensagens ou a infraestrutura comum.

Exemplos:

- Search pode pesquisar Business hoje e Classificados no futuro;
- Messaging pode reunir Business, Classificados e Community sem pertencer a
  nenhum desses domínios;
- Map pode projetar Business hoje e Turismo/Serviços depois;
- Nearby pode descobrir diferentes entidades no futuro.

O lifecycle horizontal permite ativar a infraestrutura sem reativar
implicitamente domínios pausados.

## Estados

### active

O domínio/capability pode participar do runtime quando todas as suas dependências
também estiverem efetivamente habilitadas.

### paused

O código pode permanecer versionado, mas a unidade pausada não pode:

- expor rota pública funcional;
- aparecer em navegação como funcionalidade disponível;
- executar prefetch/warmup;
- consultar dados apenas para preview oculto;
- registrar provider Search/Messaging;
- registrar layer público no Map;
- ser reaberta por alias, fallback ou redirect.

O comportamento é **fail-closed**.

## Dependências

Dependências são declaradas nos registries, nunca em exceções locais.

Exemplos atuais:

- `nearby` depende de `map`, `location` e `business`;
- `messaging` depende de `auth`, `profiles` e `business`;
- Gastronomy pode depender de Business quando for reativada;
- Mobility pode depender de Map sem transformar Map em domínio Mobility.

Quando uma capability precisa de dados de um domínio, o owner do domínio expõe
um port/facade/read model. O consumidor não acessa tabelas privadas do owner.

Exemplo:

`Map -> businessMapQueryService -> public_business_search`

## Search

Search é capability horizontal.

Regras:

- providers são registrados/avaliados pelo lifecycle;
- Business é o provider público ativo no MVP;
- payload stale de domínio pausado deve ser descartado também na apresentação;
- Search não vira owner dos dados pesquisados.

## Messaging

Messaging é capability horizontal. Seu lifecycle depende de Auth + Profiles; a presença de Business, Classifieds ou Community é resolvida no registry de providers.

No MVP:

- Inbox canônica: `/mensagens`;
- thread Business: `/mensagens/business/:threadId`;
- provider ativo: Business Direct Messaging;
- Community e Classifieds mantêm agregados próprios, mas sem provider ativo;
- compartilhar Inbox não obriga compartilhar tabela;
- writes Business passam por RPCs server-owned, com RLS e realtime do agregado.

## Notifications

Notifications é capability horizontal ativa.

- Inbox canônica: `/notificacoes`;
- preferências canônicas: `/conta/notificacoes`;
- eventos de sistema/conta e Business podem alimentar a mesma Inbox;
- uma vertical pausada não pode executar seu produtor de notificações nem criar links para rotas pausadas;
- ativar uma nova vertical adiciona seu produtor/adapter após certificação, sem reativar a capability base.

## Ativar um domínio

1. certificar owner e contratos;
2. declarar dependências;
3. mudar o status no `PRODUCT_MODULE_REGISTRY`;
4. habilitar providers/layers somente pelo lifecycle;
5. executar testes de fronteira, segurança e E2E;
6. atualizar Feature Map e Screen Map.

## Ativar uma capability

1. provar que o contrato é horizontal e não pertence a um domínio;
2. declarar dependências em capabilities/domínios;
3. certificar adapters/providers ativos;
4. mudar o status no `PLATFORM_CAPABILITY_REGISTRY`;
5. provar fail-closed para providers/domínios pausados;
6. executar ratchets/E2E da capability.

## Pausar

A pausa deve ocorrer no registry correto.

Qualquer tela/query/loader que continue operacional após `paused` é falha
arquitetural e deve ser corrigida no owner, não escondida na UI.

## Remover

“Removido” não é estado runtime.

1. pausar;
2. provar zero dependência ativa;
3. remover implementação, imports, rotas e assets;
4. remover entrada do registry;
5. manter migrations/histórico somente quando necessários para integridade;
6. provar ausência de referências órfãs.

## Redirects

Redirect só é permitido por compatibilidade pública legítima.

É proibido para:

- esconder registro inválido;
- mascarar domínio/capability pausada;
- compensar slug ausente;
- manter rota abandonada sem consumidor real;
- evitar corrigir o owner.

## Guardrails

- `src/app/config/__tests__/productModuleRegistry.spec.ts`;
- `src/app/config/__tests__/platformCapabilityRegistry.spec.ts`;
- `src/app/config/__tests__/launchScope.spec.ts`;
- `tests/architecture/mvp-core-module-boundary.test.ts`;
- `tests/architecture/business-messaging-mvp.test.ts`;
- `tests/architecture/map-business-bounded-read.test.ts`;
- `tests/architecture/nearby-proximity-truthfulness.test.ts`;
- `tests/e2e/launch-scope-public.spec.ts`.

Regra central:

> **Domínio pausado pode existir no repositório, mas não no produto ativo.
> Capability horizontal ativa só pode consumir providers/layers de owners
> efetivamente habilitados.**
