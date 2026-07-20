# Plano: Melhorias no fluxo /novo-post + destaque no feed

## 1. Destacar post recém-publicado no feed + scroll automático

**Onde:** `CreatePostModal.tsx`, `communityFeedQueryKeys`, componente do feed da comunidade (`CommunityOverviewSurface` / lista de posts).

- Após `handlePublish` bem-sucedido, gravar o ID do novo post em um contexto leve (novo `useNewPostHighlight` com Zustand ou React Context em `src/core/community/state/newPostHighlight.ts`).
- Feed passa a ler esse ID; quando o card correspondente monta:
  - Aplica classe `data-new-post="true"` com ring/glow animado (Tailwind + `animate-pulse` inicial + fade após 6s).
  - Faz `scrollIntoView({ behavior: 'smooth', block: 'center' })` em `useEffect`.
- Highlight expira após 8s (ou ao trocar de rota).
- Complementa o invalidate já existente de `communityFeedQueryKeys.root`.

## 2. Autosave enquanto escreve em /novo-post

**Onde:** `CreatePostModal.tsx` + `postDraft.ts`.

- Adicionar `useEffect` com debounce (400ms via helper local ou `use-debounce` existente) que chama `savePostDraft` sempre que qualquer campo textual muda e `hasMeaningfulDraft` retorna true.
- Mostrar rótulo discreto "Rascunho salvo às HH:MM" no header do modal, alimentado por estado `lastSavedAt`.
- Manter o botão "Salvar rascunho" para salvar/fechar manualmente.

## 3. Botão "Descartar rascunho" com confirmação

**Onde:** `CreatePostModal.tsx`.

- Botão discreto (variant ghost, texto destrutivo) visível apenas quando existe rascunho salvo (`loadPostDraft` retornou algo OU `hasMeaningfulDraft` atual).
- Ao clicar abre `AlertDialog` (shadcn) com "Descartar rascunho? Esta ação não pode ser desfeita.".
- Confirmação: `clearPostDraft(profileId)`, reseta todos os estados do formulário para os defaults e cancela autosave até nova digitação.

## 4. Sincronização de rascunhos no banco (multi-device)

**Backend (via migrações Cloud):**
- Nova tabela `public.community_post_drafts`:
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `profile_id uuid not null` (mesmo id usado no localStorage)
  - `payload jsonb not null` (snapshot do `PostDraftSnapshot`)
  - `updated_at timestamptz default now()`
  - unique `(user_id, profile_id)`
- RLS: `select/insert/update/delete` restritos a `auth.uid() = user_id`.
- GRANTs para `authenticated` e `service_role` (SSOT do projeto).

**Frontend:**
- Novo serviço `src/core/community/services/postDraftSync.ts` com `fetchRemoteDraft`, `upsertRemoteDraft`, `deleteRemoteDraft` usando `supabase.from('community_post_drafts')`.
- No mount do modal: em paralelo carrega local + remoto; se remoto for mais novo (`updated_at > localSavedAt`) usa remoto e sobrescreve local; caso contrário mantém local e faz upsert remoto.
- Autosave (item 2) também chama `upsertRemoteDraft` (debounce maior, 1.5s) com try/catch silencioso — offline nunca bloqueia a UX.
- Descartar (item 3) e publicar com sucesso chamam `deleteRemoteDraft`.
- Erros de rede caem em log apenas; localStorage continua sendo a fonte imediata.

## Detalhes técnicos

- Nova tabela: entregue como migração via ferramenta de Cloud (a mesma sessão executa).
- `PostDraftSnapshot` ganha `updatedAt` (renomeando `savedAt` para manter compat e comparações com remoto).
- Contexto de highlight vive em `src/core/community/state/newPostHighlight.tsx` (Provider já disponível em `AppLayoutRoutes`).
- Sem novos pacotes: debounce inline, `AlertDialog` já existente em `@/components/ui/alert-dialog`.
- Testes: adicionar caso rápido em `CreatePostModal.spec.ts` para autosave + descartar; smoke em `postDraftSync` mockando supabase.

## Fora do escopo

- Versionamento/histórico de rascunhos (apenas o mais recente por perfil).
- Upload de imagens no rascunho (segue apenas texto, como hoje).
