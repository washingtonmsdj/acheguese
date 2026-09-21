# DECISIONS (vigentes)

> Somente decisões **válidas hoje**. Decisões superadas não são listadas aqui — ficam em `10-archive/` para referência histórica.

---

## D-001 — Território é a entidade raiz

**Contexto:** o produto é hiperlocal. **Decisão:** `Territory` (country → state → city → neighborhood) é a raiz de toda navegação, feed e conteúdo. Cidade e bairro são **tipos** de Territory, não domínios separados. **Referência:** `02-domain/TERRITORY-DOMAIN.md`.

## D-002 — `/` é entrada territorial; Home exige território resolvido

**Decisão:** `/` resolve ou seleciona território e não é Home de conteúdo. `/:uf/:cidade` é a Home territorial ampla da cidade e `/:uf/:cidade/:territorio` é a Home prioritária de bairro ou grupo resolvido. Visitantes podem explorar conteúdo público sem onboarding obrigatório. **Referência:** `05-ux/HOME-SPEC.md`.

## D-003 — Produto territory-first e modular

**Decisão:** o Achegue-se é **territory-first**. Território é o contexto raiz e os módulos de produto são capacidades independentes com lifecycle explícito. No MVP vigente, somente **Empresas + Mapa + Perto de mim** estão ativos; Community e demais módulos permanecem `paused`. A visão comunitária continua preservada para pós-MVP, mas não é pré-requisito arquitetural nem superfície implícita do núcleo atual. **Referências:** `03-architecture/PRODUCT_MODULE_LIFECYCLE.md`, `05-ux/HOME-SPEC.md`.

## D-004 — Nomenclatura canônica de telas

`TerritoryEntryPage · TerritoryHomePage · BuscaPage · ComunidadePage · PostPage · CommunityInterestPage`. “Territory Feed” permanece o conceito de produto; o owner técnico é `ComunidadePage` em `core/community-feed`, sem um segundo arquivo de página. O alias `TerritoryExplorerPage` foi aposentado em 2026-09-09; descoberta ampla pertence a Busca/Mapa, não a uma segunda Home. `LaunchPausedPage` é uma superfície app-level de kill-switch, não uma tela territorial. **Ref.:** `06-navigation/NAVIGATION-MAPPING.md`.

## D-005 — Voz editorial consistente por superfície ativa

**Decisão:** microcopy em pt-BR deve permanecer consistente e sem jargão técnico. Contratos de Feed/Post continuam preservados para o módulo Community pós-MVP, mas não ativam essas superfícies nem obrigam a Home atual a compô-las. **Ref.:** `05-ux/HOME-SPEC.md`, `FEED-CONTENT.md`, `POST-CONTENT.md`.

## D-006 — Design tokens são SSOT visual

**Decisão:** proibido `text-white`, `bg-black`, `bg-[#...]` em componentes. Toda cor vem de tokens semânticos em `index.css` + `contentCategories.ts`. **Ref.:** `04-design/DESIGN-TOKENS.md`.

## D-007 — Publicação é ação contextual do módulo Community

**Decisão:** enquanto Community estiver `paused`, `Publicar`/`Postar` não pertence à navegação do MVP. Quando o módulo for reativado, a ação continua contextual e só aparece quando `CommunityAccessPolicy` autorizar `create_post`; nunca volta como tab global por conveniência. **Referência:** `05-ux/HOME-SPEC.md`.

## D-008 — Waitlist de Community permanece contrato pós-MVP

**Decisão:** o fluxo de interesse/waitlist não integra o MVP enquanto Community estiver `paused`. Quando reativado, bairros `coming_soon` só podem usar o contrato persistido e anti-spam já definido; o frontend não fabrica Community, não cria identidade sintética e não usa redirect para simular disponibilidade. O backend/rollout continua fail-closed. **Ref.:** `supabase/migrations/20260809184409_create_authoritative_community_interest_registration.sql`.

## D-009 — Rascunhos de post são criptografados

**Decisão:** rascunhos de post são locais ao dispositivo e criptografados com AES-GCM, usando chave não-extraível persistida em IndexedDB (`core/community-feed/drafts/postDraftCrypto.ts`). O contrato atual não possui sincronização remota de rascunhos nem tabela `community_post_drafts`; uma futura sincronização entre dispositivos exigirá nova decisão arquitetural e authority própria.

## D-010 — Autenticação segue SSOT + Zod

**Decisão:** `RegisterFullSchema`/`user.schema.ts` são fonte única de validação. `PasswordInput` com barra de força; checklist só em cadastro. HIBP hash limpo da memória após verificação. Turnstile em cadastro/interesse.

## D-011 — Perfis: modelo multi-perfil por usuário

**Decisão:** um usuário pode ter vários perfis (pessoal / negócio / profissional). A superfície privada canônica é `/conta` e participa do shell global Território Vivo. Rotas `/perfil/*` são aliases legados preservados por compatibilidade. A apresentação pública pessoal permanece exclusiva em `/u/:username`, sem expor dados privados da conta.

## D-012 — Cloud como backend padrão (Lovable Cloud / Supabase)

**Decisão:** persistência, auth, storage e edge functions usam Cloud gerenciado. Roles em tabela separada `user_roles` com `has_role()` security-definer. Nunca armazenar role em `profiles`.

## D-013 — Raiz do repo é mínima e governada

**Decisão atual:** a raiz documental permanente contém `README.md` e `SECURITY.md`. `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md` é somente um ponteiro temporário de compatibilidade, sem autoridade própria, permitido pelo validador enquanto callers históricos ainda dependem do nome. Novos documentos vivem em `docs/`; o ponteiro deve ser removido quando esses callers forem migrados. O validador canônico é `tools/architecture/validate-docs-structure.ts`.

## D-014 — SSOT documental: `docs/README.md` é a porta de entrada

**Decisão (DOCS.1):** um único índice canônico. Estrutura numerada `01-product` … `10-archive`. Documentos fora dessa hierarquia são legado. Antes de criar novo doc, **consolidar**.

## D-015 — Não migrar para monorepo

**Decisão:** entrega mobile via Capacitor no mesmo repositório. **Ref.:** `08-roadmap/MONOREPO_MIGRATION_PLAN.md`.

## D-016 — Edge Functions: JWT + getClaims

**Decisão:** todas as functions críticas validam JWT server-side e usam `getClaims` para role checking. `verify_jwt=true` no `config.toml`.

## D-017 — Sitemap oficial gerado por tooling canônico

**Decisão:** `tools/release/generate-sitemap.ts` produz `public/sitemap.xml` a partir do território seed. Bairros `coming_soon` são incluídos apontando para `/interesse`.

## D-018 — Voz de estados vazios / loading

**Decisão:** nunca "Carregando..." genérico. Sempre neighborly ("Ouvindo o bairro...", "Ainda está quieto por aqui", "Preparando seu território..."). **Ref.:** `05-ux/FEED-CONTENT.md`.

## D-019 — Categorias de conteúdo têm cor semântica dedicada

**Decisão:** 15 tokens de categoria (alerta, evento, gastronomia, etc.) em vez de único accent. **Ref.:** `04-design/DESIGN-TOKENS.md`.

## D-020 — Documentos históricos ficam em `10-archive/`

**Decisão:** snapshots com palavras "FINAL", "100%", "COMPLETO", "PRONTO PARA PRODUÇÃO" não são fonte de decisão. Se conflitam com um doc numerado (`01-` … `09-`), o numerado vence.

## D-021 — Lifecycle público do MVP é independente da visão pós-MVP

**Decisão:** o conjunto público ativo é determinado exclusivamente por `src/app/config/productModuleRegistry.ts`. No MVP atual, os únicos módulos de produto ativos são **Business, Map e Nearby**, com `nearby -> [map, business]`. Busca, Community, Serviços, Classificados, Eventos, Vagas e demais capacidades permanecem `paused` e fail-closed. Cobertura técnica, código preservado ou dados existentes não autorizam exposição pública. **Referências:** `03-architecture/PRODUCT_MODULE_LIFECYCLE.md`, `FEATURE-MAP.md`, `SCREEN-MAP.md`.

## D-022 — Community permanece fail-closed até reativação formal

**Decisão:** Community está fora do MVP atual. Seu contrato interno continua preservado: `territory_communities.status` define identidade/estado e `module_rollouts` participa da habilitação operacional, mas nenhum deles pode contornar o `productModuleRegistry`. Somente após Community passar a `active` no lifecycle, com certificação própria, um perfil persistido `active` combinado com rollout efetivo poderá abrir overview/Feed. Até lá, rotas públicas, prefetch, navegação e queries do módulo permanecem isolados. **Referência:** `03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`.
