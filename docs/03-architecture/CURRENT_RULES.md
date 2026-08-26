# Regras Vigentes do Sistema

Data-base: 2026-08-26  
Status: ATIVO / CANONICO  
Versao documental: 4.7

Este documento define regras arquiteturais globais. Contratos detalhados de domínio permanecem nos owners executáveis e nos documentos específicos listados em `docs/README.md`; este arquivo não deve duplicar implementação.

## 1. Precedência e SSOT

Quando fontes divergirem, prevalece:

1. contrato executável/versionado (`src/`, migrations, manifests e validators);
2. documento SSOT vivo listado em `docs/README.md`;
3. plano operacional atual em `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
4. referência técnica;
5. histórico em `docs/10-archive/`.

Regras:

- uma responsabilidade possui um owner canônico;
- wrapper/facade só existe com motivo de compatibilidade explícito e prazo de remoção;
- documento arquivado ou substituído nunca reabre uma segunda autoridade;
- `supabase/migrations/` é a única fonte versionada de evolução permanente de schema;
- merge/commit não equivale a runtime/produção validada.

## 2. Identidade e ownership

- `user_id` representa autenticação e identidade administrativa quando o contrato exigir User.
- `profile_id` representa a entidade operacional do usuário no ecossistema.
- ownership social usa colunas explícitas `*_profile_id`.
- ownership administrativo usa colunas explícitas `*_user_id`.
- username, handle e slug não podem representar conceitos diferentes sob o mesmo contrato de rota.
- identidade privilegiada deve ser derivada no backend sempre que possível; a UI não envia `user_id`, `profile_id`, `admin_id`, tabela, bucket ou coluna para escolher autoridade.

## 3. Fronteiras arquiteturais

- `src/app` contém shell, rotas, providers e fluxos de aplicação.
- `src/app/features` contém fluxos/landings que não são bounded contexts.
- `src/modules` contém bounded contexts de produto; a lista oficial está em `src/modules/README.md`.
- `src/core` contém contratos/capacidades transversais e não importa nem reexporta implementação de `src/modules`.
- `src/integrations` contém adapters de infraestrutura/provedores.
- `src/shared` contém UI/utilitários realmente compartilhados, sem absorver regra de domínio.
- `src/features` é namespace aposentado; não deve existir nem ser recriado. Eventos pertence a `src/modules/community-events`.
- módulos não importam implementação interna de outros módulos; integração cruzada passa por `core`, adapter formal ou contrato compartilhado.
- páginas/componentes não acessam Supabase diretamente; acesso fica em services/repositories, migrations, scripts e Edge Functions conforme o boundary aplicável.
- páginas e hooks orquestram estado/fetch/render; regra de negócio pertence ao owner de domínio.
- cada tabela mutável possui owner de escrita único. Read models adicionais devem ser declarados e não criam writer paralelo.
- tipos canônicos não são duplicados entre `shared`, `core` e `modules`.
- `index.ts` vazio (`export {};`) não é facade válida.

## 4. Taxonomia de produto

### 4.1 Empresas e verticais

- `business`/Empresas é domínio horizontal base; **não é vertical**.
- vertical empresarial oficial existe somente quando declarada em `src/core/verticals/config.ts`.
- Estado oficial atual: `gastronomy` e `education`.
- capacidade implementada em outro namespace não se torna vertical por conveniência documental.
- Eventos é bounded context comunitário, não vertical empresarial.

### 4.2 Owners de módulo

- base empresarial e derivados ficam sob `src/modules/business`;
- comunidade usa bounded contexts explícitos (`community-feed`, `community-groups`, `community-issues`, `community-events`, `community-lost-found`, `community-recommendations`);
- mobilidade e delivery ficam em `src/modules/mobility`;
- oportunidades rápidas ficam em `src/modules/work-opportunities`;
- vagas classificadas ficam em `src/modules/classifieds/jobs`;
- serviços/profissionais ficam em `src/modules/professionals`.

## 5. Autoridade de segurança

- decisão de autorização no browser é somente hint de UX.
- toda escrita sensível é autorizada por RLS, RPC segura, Edge Function ou backend confiável.
- `SECURITY DEFINER` é excepcional: exige autorização explícita, `search_path` fixo, grants intencionais e teste negativo.
- navegador não escolhe ator privilegiado, owner, tabela, coluna, bucket ou path quando o backend pode derivar.
- dados privados não ganham policy pública artificial apenas para silenciar advisor.
- logs/auditoria privados e tabelas broker-only permanecem default-deny quando esse for o contrato.
- mudanças manuais de produção devem ser reconciliadas em Git antes do release normal seguinte.
- regras detalhadas: `SECURITY.md`, `docs/09-reference/SECURITY.md` e `docs/09-reference/governance/security/SECURITY_AUTHORITY.md`.

## 6. Contratos transversais

Os contratos detalhados vivem em `docs/07-modules/` e nos owners executáveis correspondentes. Entre os SSOTs ativos estão:

- Posts/Feed;
- Social Engagement;
- Business Favorites;
- Search;
- Media Asset;
- Notification Preferences;
- Classified Messaging;
- Community Direct Messaging;
- Realtime;
- Reviews;
- Audit/Moderation;
- Entity Private Data;
- Gastronomy;
- Coverage/Mobility.

Regra: este documento não replica lifecycle, tabelas, RPCs ou allowlists desses contratos. Mudanças devem ocorrer no owner técnico e em seu teste/validator.

## 7. Roteamento e território

- Território é contexto raiz da experiência pública/community-first.
- entidade pública possui namespace canônico único; alias legado não cria segunda superfície oficial.
- contexto `/comunidade/...` é explícito e não deve sequestrar automaticamente uma URL pública de entidade.
- ações comunitárias mutáveis exigem autenticação/Profile e autorização territorial conforme o backend.
- residência/endereço privado nunca é projetado para superfície pública apenas para resolver contexto.
- rotas e telas públicas devem ser reconciliadas com `docs/SCREEN-MAP.md` e `docs/FEATURE-MAP.md`.

## 8. Realtime, mídia, mensageria e auditoria

- Realtime é transporte, nunca segunda persistência/SSOT.
- upload público passa pelo owner de Media Asset; browser não escolhe bucket/path nem persiste URL arbitrária quando o contrato exige referência canônica.
- documentos/evidências privadas usam contratos/buckets privados separados.
- agregados de mensageria não compartilham tabela/lifecycle apenas por reutilizarem transporte.
- auditoria sensível é append-only/backend-owned; projeções administrativas devem ser limitadas e autorizadas.
- cross-user notification/mutation usa comando server-owned/outbox/RPC confiável, nunca self-service client-side com destinatário arbitrário.

## 9. Documentação e arquivos

- índice canônico: `docs/README.md`.
- execução operacional: `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`.
- histórico: `docs/10-archive/` ou histórico do Git.
- planos, handoffs, screenshots e outputs de ferramenta não são autoridade por estarem versionados.
- documento marcado `SUBSTITUIDO` não pode continuar listado como status canônico.
- não criar relatório/índice novo quando um owner vivo já existir.

## 10. Gates mínimos

Antes de consolidação estrutural ou release, conforme o escopo:

```bash
npm run security:validate
npm run validate:ssot
npm run validate:architecture:incremental -- --json
npm run validate:architecture:governance -- --json
npm run validate:taxonomy
npm run validate:docs-structure
npm run typecheck
npm run build
```

Mudanças de segurança/schema executam adicionalmente os gates indicados em `SECURITY.md`.

## 11. Proibições explícitas

- não criar service paralelo para responsabilidade que já possui owner;
- não recriar `src/features`;
- não importar implementação interna entre módulos;
- não colocar regra de negócio em page/hook por conveniência;
- não criar rota pública concorrente para a mesma identidade;
- não usar placeholder, `paused`, fallback vazio ou retorno antecipado como prova de módulo funcional;
- não declarar `MVP READY` sem cumprir o DoD de `docs/08-roadmap/EXECUCAO_MAIN_ONLY.md`;
- não reduzir gate de segurança/CI para obter status verde.

## 12. Prioridade de blindagem

1. restaurar gates confiáveis e proteção da `main`;
2. continuar hardening de RLS/RPC/grants e fechar LGPD antes de rollout;
3. remover drift documental e namespaces concorrentes;
4. reduzir o namespace histórico `src/core/verticals/events` sem reabrir owner paralelo de Eventos;
5. certificar módulos por fluxo funcional real;
6. somente então executar refatoração visual ampla/performance não comprovada.
