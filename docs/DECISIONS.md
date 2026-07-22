# DECISIONS (vigentes)

> Somente decisões **válidas hoje**. Decisões superadas não são listadas aqui — ficam em `10-archive/` para referência histórica.

---

## D-001 — Território é a entidade raiz
**Contexto:** o produto é hiperlocal. **Decisão:** `Territory` (country → state → city → neighborhood) é a raiz de toda navegação, feed e conteúdo. Cidade e bairro são **tipos** de Territory, não domínios separados. **Referência:** `02-domain/TERRITORY-DOMAIN.md`.

## D-002 — Home = Territory Home do bairro ativo
**Decisão:** a tela principal representa o **território ativo** (default: bairro). Não existe "home global". Visitante sem território cai em Splash → Onboarding. Cidade não é home; é `TerritoryExplorerPage`. **Referência:** `05-ux/HOME-REVIEW.md`.

## D-003 — Community-first
**Decisão:** o produto orbita a Comunidade Local. Módulos verticais (empresas, classificados, mobilidade) atendem à comunidade, não o contrário. **Referência:** `03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`.

## D-004 — Nomenclatura canônica de telas
`TerritorySelectorPage · TerritoryExplorerPage · TerritoryHomePage · TerritoryFeedPage · PostPage · TerritoryUnavailablePage`. Nomes antigos permanecem como aliases via re-export. **Ref.:** `06-navigation/NAVIGATION-MAPPING.md`.

## D-005 — Vozes editoriais unificadas (Home = Feed = Post)
**Decisão:** microcopy neighborly em pt-BR, primeira pessoa, sem jargão técnico ("Postar", "Publicar no bairro", "Conversa no post"). **Ref.:** `05-ux/HOME-CONTENT.md`, `FEED-CONTENT.md`, `POST-CONTENT.md`.

## D-006 — Design tokens são SSOT visual
**Decisão:** proibido `text-white`, `bg-black`, `bg-[#...]` em componentes. Toda cor vem de tokens semânticos em `index.css` + `contentCategories.ts`. **Ref.:** `04-design/DESIGN-TOKENS.md`.

## D-007 — BottomNav central = "Postar"
**Decisão:** o botão central da BottomNav vai para `/novo-post`. Substituiu o antigo "Bairro" porque o bairro já é o contexto ambiente.

## D-008 — Bairros `coming_soon` viram waitlist
**Decisão:** bairros sem cobertura redirecionam para `/interesse` (`CommunityInterestPage`) com Turnstile anti-spam. Painel admin em `/admin/community-interest`. **Ref.:** `docs/09-reference/migrations-pending/README.md`.

## D-009 — Rascunhos de post são criptografados
**Decisão:** rascunhos em `localStorage` usam AES-GCM com chave não-extraível em IndexedDB (`postDraftCrypto.ts`). Sync remoto com resolução last-write-wins.

## D-010 — Autenticação segue SSOT + Zod
**Decisão:** `RegisterFullSchema`/`user.schema.ts` são fonte única de validação. `PasswordInput` com barra de força; checklist só em cadastro. HIBP hash limpo da memória após verificação. Turnstile em cadastro/interesse.

## D-011 — Perfis: modelo multi-perfil por usuário
**Decisão:** um usuário pode ter vários perfis (pessoal / negócio / profissional). Hub `/perfil` é responsivo (mobile-first e desktop). Rotas `/conta/*` são aliases legados.

## D-012 — Cloud como backend padrão (Lovable Cloud / Supabase)
**Decisão:** persistência, auth, storage e edge functions usam Cloud gerenciado. Roles em tabela separada `user_roles` com `has_role()` security-definer. Nunca armazenar role em `profiles`.

## D-013 — Raiz do repo somente `README.md` e `SECURITY.md`
**Decisão:** validador `scripts/validate-docs-structure.ts`. Todo doc vive em `docs/`.

## D-014 — SSOT documental: `docs/README.md` é a porta de entrada
**Decisão (DOCS.1):** um único índice canônico. Estrutura numerada `01-product` … `10-archive`. Documentos fora dessa hierarquia são legado. Antes de criar novo doc, **consolidar**.

## D-015 — Não migrar para monorepo
**Decisão:** entrega mobile via Capacitor no mesmo repositório. **Ref.:** `08-roadmap/MONOREPO_MIGRATION_PLAN.md`.

## D-016 — Edge Functions: JWT + getClaims
**Decisão:** todas as functions críticas validam JWT server-side e usam `getClaims` para role checking. `verify_jwt=true` no `config.toml`.

## D-017 — Sitemap oficial gerado por script
**Decisão:** `scripts/generate-sitemap.ts` produz `public/sitemap.xml` a partir do território seed. Bairros `coming_soon` são incluídos apontando para `/interesse`.

## D-018 — Voz de estados vazios / loading
**Decisão:** nunca "Carregando..." genérico. Sempre neighborly ("Ouvindo o bairro...", "Ainda está quieto por aqui", "Preparando seu território..."). **Ref.:** `05-ux/FEED-CONTENT.md`.

## D-019 — Categorias de conteúdo têm cor semântica dedicada
**Decisão:** 15 tokens de categoria (alerta, evento, gastronomia, etc.) em vez de único accent. **Ref.:** `04-design/DESIGN-TOKENS.md`.

## D-020 — Documentos históricos ficam em `10-archive/`
**Decisão:** snapshots com palavras "FINAL", "100%", "COMPLETO", "PRONTO PARA PRODUÇÃO" não são fonte de decisão. Se conflitam com um doc numerado (`01-` … `09-`), o numerado vence.
