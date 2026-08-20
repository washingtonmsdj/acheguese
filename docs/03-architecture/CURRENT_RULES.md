# Regras Vigentes do Sistema

Data-base: 2026-08-20  
Status: ativo  
Versão documental: 5.0

Este documento contém somente **invariantes globais**. Regras detalhadas de um domínio pertencem ao owner de código e ao SSOT correspondente em `docs/07-modules/`. Não duplicar contratos inteiros aqui.

A navegação documental oficial começa em [`docs/README.md`](../README.md). O mapa de ownership fica em [`CANONICAL_MAP.md`](./CANONICAL_MAP.md), e a arquitetura transversal em [`CORE_PLATFORM_ARCHITECTURE_SSOT.md`](./CORE_PLATFORM_ARCHITECTURE_SSOT.md).

## 1. Identidade e ownership

- `user_id` identifica autenticação/conta e contexto administrativo.
- `profile_id` identifica a entidade operacional do usuário no ecossistema.
- Ownership social usa colunas explícitas `*_profile_id`; ownership administrativo usa `*_user_id` quando a conta é realmente o ator.
- Username, handle e slug só podem coexistir quando houver semântica e rota canônicas claras.
- O navegador não escolhe identidade privilegiada (`user_id`, `profile_id`, `admin_id`) quando o backend puder derivá-la do JWT/contexto.

## 2. Topologia de código

A autoridade executável da topologia é `src/modules/README.md` + gates em `tests/architecture/`.

- `src/app`: composição da aplicação, providers, router e shells.
- `src/app/features`: fluxos/landings de aplicação, não bounded contexts.
- `src/modules`: superfícies e API pública dos bounded contexts de produto.
- `src/core`: regras, contratos, state machines e serviços reutilizáveis.
- `src/integrations`: adapters de serviços externos.
- `src/shared`: primitives realmente transversais.
- `src/config`: configuração de runtime do frontend.
- `src/assets` e `src/styles`: assets/estilos transversais, sem ownership de regra de negócio.
- `src/test`: setup de runner, não suite de produto.

Namespaces legados (`src/features`, `src/__tests__` top-level e outros explicitamente allowlisted) existem apenas durante migração controlada e **não podem crescer**.

Não criar novo eixo top-level em `src/` sem atualizar primeiro o SSOT e os testes arquiteturais.

## 3. Fronteiras arquiteturais

- Page/component não acessa persistência diretamente. Escrita/leitura remota passa pelo owner canônico (`service`, `repository`, RPC/Edge adapter ou contrato equivalente).
- Hooks orquestram estado e lifecycle; regra de negócio persistente pertence ao domínio.
- Cada responsabilidade mutável tem um owner de escrita. Read models adicionais não autorizam writer paralelo.
- Módulos não importam implementação interna de outro módulo. Integração cruzada passa por API pública, `core`, adapter ou contrato compartilhado.
- `src/core` não importa/reexporta UI interna de `src/modules` para contornar ownership.
- Tipo ou constante canônica não deve ser duplicada em `shared/core/modules` quando já existir owner oficial.
- Compatibilidade é temporária e deve ter destino e critério de remoção documentados.

## 4. Banco, segurança e autorização

- `supabase/migrations/` é a fonte versionada do schema. Toda mudança estrutural remota precisa de migration equivalente e provenance verificável.
- Decisão de autorização no browser é apenas hint de UI. RLS, RPC e/ou Edge Function são a autoridade obrigatória para escrita e leitura sensível.
- Não enviar pelo browser IDs privilegiados, tabela, coluna, bucket/path ou papel quando o backend puder derivar o alvo/ator.
- Escrita cross-user (notificações, mensagens, auditoria, moderação, trust etc.) exige comando server-owned ou produtor confiável; client self-service não é autoridade.
- Agregados de auditoria/trust e dados privados devem falhar fechado e obedecer aos contratos de segurança do domínio.
- `SECURITY DEFINER`, grants, RLS e superfícies públicas seguem menor privilégio e são rastreados pelo plano em `docs/08-roadmap/AUDITORIA_E_PLANO_IMPLEMENTACAO.md`.
- O mapa executável de enforcement é [`authorization-enforcement-map.json`](./authorization-enforcement-map.json).
- Mudança Critical/High de segurança deve respeitar [`SECURITY_AUTHORITY.md`](../09-reference/governance/security/SECURITY_AUTHORITY.md).

## 5. SSOT por domínio

Contratos específicos ficam em `docs/07-modules/` e no owner de código. Exemplos: Posts/Feed, Messaging, Reviews, Realtime, Media Asset, Notifications, Audit/Moderation, Entity Private Data, Gastronomy e Mobility.

Regras globais:

- Post/Feed: persistência e lifecycle pertencem ao owner canônico; composição não cria writer paralelo.
- Messaging: agregados distintos não compartilham tabela/lifecycle só porque compartilham UI ou Realtime.
- Realtime: subscriptions passam pelo owner/registry canônico; filtro não substitui RLS.
- Media pública: upload/path/metadata são server-owned; UI trabalha com referências do contrato.
- Reviews/Reports/Trust/Moderation: ator, alvo e autoridade são derivados server-side; filas federadas são read models, não segundo estado mestre.
- Notifications: preferência e entrega cross-user seguem owners canônicos; browser não cria notificação para outro usuário diretamente.

Ao alterar um desses domínios, leia o arquivo SSOT correspondente em `docs/07-modules/` antes de criar novo service, tabela, RPC ou writer.

## 6. Taxonomia empresarial

- `business`/`empresas` é domínio horizontal base; não é vertical.
- Vertical empresarial oficial existe somente quando declarada em `src/core/verticals/config.ts`.
- Estado oficial atual: `gastronomy` e `education`.
- Estar fisicamente em `src/core/verticals/` não transforma um domínio em vertical. `events`, `guide` e `jobs` são dívida de compatibilidade em migração e não novas verticais.

## 7. Território, rotas e superfícies

- Território é contexto estrutural do produto; filtros/ownership territorial usam IDs canônicos, não apenas texto de bairro/cidade.
- Entidade pública deve ter namespace canônico único. Alias legado não cria segunda superfície oficial.
- Contexto comunitário pode incorporar entidade pública, mas não muda o owner da entidade.
- Ações locais sensíveis devem validar identidade/perfil/território no backend quando aplicável.
- Rotas e telas oficiais são inventariadas em `docs/SCREEN-MAP.md`; funcionalidades em `docs/FEATURE-MAP.md`.

## 8. Testes e certificação funcional

- Unit/integration específicos podem ficar co-localizados com o owner.
- Invariantes de arquitetura/SSOT ficam em `tests/architecture/`.
- Segurança negativa/autorização fica em `tests/security/`.
- Fluxos de produto/release ficam em `tests/e2e/`.
- Placeholder, feature pausada, fallback de erro ou `test.skip` por ausência de fixture **não contam como certificação funcional**.
- Um módulo só é saudável quando owner/SSOT + banco + autorização + runtime + fluxo real concordam.

## 9. Documentação e artifacts

- `docs/README.md` é a porta de entrada operacional da documentação viva.
- `docs/DOCUMENTATION-INDEX.md` é inventário/classificação, não um segundo SSOT de arquitetura.
- Documento técnico específico pode ficar junto do owner de código quando isso reduz duplicação.
- Histórico, snapshots, handoffs e relatórios encerrados não definem decisão atual.
- `.kiro/`, `.lovable/`, screenshots e outputs de QA são artifacts de ferramenta/processo; não são autoridade arquitetural.
- Git preserva histórico; documento substituído/arquivado não precisa permanecer indefinidamente na árvore ativa.

## 10. Gates obrigatórios

Antes de consolidar mudança estrutural:

```bash
npm run audit:architecture
npm run validate:architecture:governance
npm run validate:architecture:core-platform
npm run validate:taxonomy
npm run validate:ssot
npm run validate:docs-structure
npm run validate:docs-live-links
npm run typecheck
npm run lint
```

Gates especializados do domínio também são obrigatórios quando o escopo os toca.

## 11. Proibições explícitas

- Não criar service paralelo porque o owner existente parece inconveniente.
- Não acessar Supabase diretamente em page/component ou hook de UI fora de boundary explicitamente permitido.
- Não colocar regra de negócio em shell/layout.
- Não criar nova rota pública sem namespace/owner definidos.
- Não criar pasta top-level em `src` para “organizar depois”.
- Não tratar documentação, plano, spec de ferramenta ou screenshot como prova de runtime.
- Não enfraquecer gate para fazer PR ficar verde; corrigir a causa ou registrar bloqueio de infraestrutura.

## 12. Ordem estrutural atual

1. estabilizar owners, topologia, documentação e gates;
2. migrar namespaces legados e remover configuração/artifacts sem caller;
3. certificar módulos funcionalmente contra contratos reais;
4. inventariar shells/layouts duplicados;
5. consolidar primitives e shell responsivo;
6. redesenhar Home/Comunidade/Central e módulos sobre rotas/owners estáveis.

Layout novo não deve cristalizar uma arquitetura que ainda está sendo removida.
