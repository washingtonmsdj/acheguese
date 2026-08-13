# DECISIONS (vigentes)

> Somente decisões **válidas hoje**. Decisões superadas não são listadas aqui — ficam em `10-archive/` para referência histórica.

---

## D-001 — Território é a entidade raiz

**Contexto:** o produto é hiperlocal. **Decisão:** `Territory` (country → state → city → neighborhood) é a raiz de toda navegação, feed e conteúdo. Cidade e bairro são **tipos** de Territory, não domínios separados. **Referência:** `02-domain/TERRITORY-DOMAIN.md`.

## D-002 — `/` é entrada territorial; Home exige território resolvido

**Decisão:** `/` resolve ou seleciona território e não é Home de conteúdo. `/:uf/:cidade` é a Home territorial ampla da cidade e `/:uf/:cidade/:territorio` é a Home prioritária de bairro ou grupo resolvido. Visitantes podem explorar conteúdo público sem onboarding obrigatório. **Referência:** `05-ux/HOME-SPEC.md`.

## D-003 — Community-first

**Decisão:** o produto orbita a Comunidade Local. Módulos verticais (empresas, classificados, mobilidade) atendem à comunidade, não o contrário. **Referência:** `03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`.

## D-004 — Nomenclatura canônica de telas

`TerritorySelectorPage · TerritoryExplorerPage · TerritoryHomePage · TerritoryFeedPage · PostPage · TerritoryUnavailablePage`. Nomes antigos permanecem como aliases via re-export. **Ref.:** `06-navigation/NAVIGATION-MAPPING.md`.

## D-005 — Vozes editoriais unificadas (Home = Feed = Post)

**Decisão:** microcopy neighborly em pt-BR, primeira pessoa, sem jargão técnico ("Postar", "Publicar no bairro", "Conversa no post"). **Ref.:** `05-ux/HOME-CONTENT.md`, `FEED-CONTENT.md`, `POST-CONTENT.md`.

## D-006 — Design tokens são SSOT visual

**Decisão:** proibido `text-white`, `bg-black`, `bg-[#...]` em componentes. Toda cor vem de tokens semânticos em `index.css` + `contentCategories.ts`. **Ref.:** `04-design/DESIGN-TOKENS.md`.

## D-007 — Publicação é ação contextual, não tab global

**Decisão:** a navegação primária territorial começa por `Hoje` e preserva o território atual. `Publicar`/`Postar` só aparece quando `CommunityAccessPolicy` autoriza `create_post`; não é destino global permanente para visitante ou perfil inelegível. **Referência:** `05-ux/HOME-SPEC.md`.

## D-008 — Bairros `coming_soon` viram waitlist

**Decisão:** bairros `coming_soon` com Community persistida e identidade territorial inequívoca redirecionam para `/interesse` (`CommunityInterestPage`) com Turnstile anti-spam. O frontend não fabrica Community nem permite escrita a partir de perfil sintético. Uma rota municipal sem Community persistida permanece fail-closed e direciona o visitante ao explorador para escolher um bairro; `community_id = null` não autoriza, por si só, um contrato genérico de interesse por cidade ou território. Suporte futuro a city/territory interest exige decisão e modelo próprios, e nenhuma Community municipal deve ser criada apenas para satisfazer uma rota. O frontend novo registra exclusivamente por `register-community-interest`; durante a migration ADDITIVE, o frontend legado conserva um writer direto mínimo, por colunas, até o CUTOVER evidence-gated. O painel admin fica em `/admin/community-interest`. **Ref.:** `supabase/migrations/20260809184409_create_authoritative_community_interest_registration.sql`.

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

## D-021 — Cobertura do produto é independente do rollout da Community

**Contexto:** abrir a camada social simultaneamente em todos os bairros dilui atividade e faz comunidades locais parecerem vazias. **Decisão:** o Achegue-se pode oferecer Home, busca, empresas, serviços, classificados, vagas, eventos e demais módulos públicos em toda Salvador enquanto a Community é ativada de forma territorial e gradual. O primeiro cluster oficial de lançamento da Community é o **Complexo do Nordeste de Amaralina**, inicialmente concentrando Nordeste de Amaralina, Santa Cruz, Vale das Pedrinhas e Chapada, preservando a identidade canônica de cada Territory. Os demais bairros continuam utilizáveis no produto; quando a Community não estiver ativa, a Home deve permanecer útil e mostrar estado `coming_soon`/waitlist apenas para a camada comunitária. A expansão da Community deve ocorrer por evidência operacional e de demanda — interesse local, capacidade de moderação, atividade e condições de lançamento — e não por calendário automático. **Referências:** `03-architecture/COMMUNITY_FIRST_ARCHITECTURE_SSOT.md`, `05-ux/HOME-SPEC.md`.
