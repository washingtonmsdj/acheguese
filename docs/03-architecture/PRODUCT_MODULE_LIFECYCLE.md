# Product Module Lifecycle

> Contrato arquitetural do lifecycle dos módulos de produto.
>
> **Owner executável:** `src/app/config/productModuleRegistry.ts`.
> Este documento explica as regras; não substitui o registry.

## Escopo do MVP

O MVP público atual possui somente três módulos de produto:

- `business` — Empresas;
- `map` — Mapa;
- `nearby` — Perto de mim.

`nearby` depende formalmente de `map + business`.

Home/Território, autenticação, Conta, sessão, localização, roteamento,
segurança, storage, observabilidade e notificações de infraestrutura não contam
como módulos adicionais de produto.

## Estados

### active

O módulo pode participar da superfície pública.

Estar `active` não é suficiente quando há dependências: todas as entradas de
`dependsOn` também precisam estar efetivamente ativas.

### paused

O código pode continuar versionado para evolução pós-MVP, mas o módulo não pode:

- aparecer na navegação pública;
- renderizar rota pública funcional;
- executar prefetch/warmup;
- alimentar Home ou discovery público;
- executar provider de busca pública;
- registrar layer público no Mapa;
- consultar dados somente para montar preview de UI escondida;
- ser reaberto por alias, fallback ou redirect.

O comportamento é **fail-closed**.

## Dependências

A direção da dependência deve seguir o domínio base para a extensão:

- permitido: `nearby -> business`;
- permitido: `map -> business public port`;
- permitido no futuro: `gastronomy -> business`;
- proibido: `business -> gastronomy`;
- proibido: um módulo ativo depender de implementação de módulo pausado.

Quando um módulo precisa de dados de outro domínio, o domínio proprietário expõe
um port/facade. O consumidor não acessa tabelas, views ou detalhes internos do
outro módulo.

Exemplo atual:

`Map -> businessMapQueryService -> public_business_search`

O schema de Business pertence a Business; Maps apenas projeta o resultado.

## Ativar um módulo

Uma reativação deve ser uma mudança explícita e pequena:

1. certificar o módulo isoladamente;
2. conferir `dependsOn`;
3. alterar o status no `PRODUCT_MODULE_REGISTRY`;
4. validar rotas, navegação, prefetch, discovery e eventuais layers;
5. executar os ratchets e E2E do módulo;
6. atualizar Feature Map e Screen Map.

Não adicionar exceções locais para “forçar” a ativação.

## Pausar um módulo

A pausa deve exigir, idealmente, somente o registry.

Qualquer tela, query ou loader que continue ativo após `status: "paused"` é
uma falha arquitetural e deve ser corrigida no owner, não escondida na UI.

## Remover um módulo

“Removido” não é um terceiro estado runtime.

Quando um módulo deixar definitivamente o produto:

1. primeiro pausá-lo e provar zero dependência ativa;
2. remover implementação, rotas/manifests, imports e assets pertencentes a ele;
3. remover sua entrada do registry;
4. remover testes/documentação exclusivos;
5. manter migrations/histórico de banco apenas quando necessários para
   integridade/provenance;
6. provar ausência de imports e referências runtime órfãs.

Não manter um módulo fantasma no registry apenas para preservar legado.

## Adicionar um módulo

Novo módulo nasce isolado e `paused`.

Ele deve declarar:

- owner de domínio;
- contrato público;
- dependências;
- rotas;
- integração opcional com navegação/discovery/mapa;
- testes de fronteira.

Somente depois da certificação passa a `active`.

## Redirects

Redirect é permitido quando existe uma mudança legítima de URL pública e uma
origem externa antiga precisa continuar resolvendo para a URL canônica.

Redirect é proibido para:

- esconder registro inválido;
- compensar slug ausente;
- mascarar módulo pausado/removido;
- manter rota abandonada sem consumidor real;
- evitar corrigir o owner.

Módulo pausado deve renderizar isolamento de lançamento ou não possuir rota,
conforme o contrato da superfície.

## Guardrails atuais

Os principais ratchets são:

- `src/app/config/__tests__/productModuleRegistry.spec.ts`;
- `src/app/config/__tests__/launchScope.spec.ts`;
- `tests/architecture/mvp-core-module-boundary.test.ts`;
- `tests/architecture/map-business-bounded-read.test.ts`;
- `tests/architecture/nearby-proximity-truthfulness.test.ts`;
- `tests/e2e/launch-scope-public.spec.ts`.

A regra central é simples: **módulo pausado pode existir no repositório, mas não
pode existir no produto ativo.**
