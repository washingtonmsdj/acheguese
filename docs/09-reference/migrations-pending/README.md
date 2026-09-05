# Migrações Pendentes (para aplicar no Supabase)

Esta pasta reúne migrações e ajustes SQL que **ainda não foram aplicados** no projeto Supabase de produção. O objetivo é permitir que outro agente (Codex, Cursor, ou humano com acesso ao Supabase CLI/SQL Editor) faça o review e aplique com segurança.

## Como aplicar

Duas formas equivalentes:

### Opção A — Supabase CLI (recomendado)

1. Copie os arquivos `.sql` desta pasta para `supabase/migrations/` mantendo o prefixo `YYYYMMDDHHMMSS_`.
2. Rode:
   ```bash
   npm run validate:migrations
   npm run validate:migrations:remote
   supabase db push --linked --dry-run
   supabase db push --linked
   ```
3. Rode `npm run validate:security-authority` para garantir que o SSOT de segurança continua verde.

### Opção B — SQL Editor do Supabase

1. Abra o SQL Editor do projeto (`https://supabase.com/dashboard/project/<ref>/sql`).
2. Cole o conteúdo de cada arquivo desta pasta **na ordem numérica** (menor timestamp primeiro).
3. Execute um por vez, conferindo o resultado antes de seguir para o próximo.

> Não pule a ordem. Cada arquivo pode depender do anterior (tabela → grants → RLS → policies → dados).

## Checklist obrigatório antes de aplicar

Para cada arquivo desta pasta, siga o [AI Agent Rules](../governance/security/AI_AGENT_RULES.md):

- [ ] Classificar risco (baixo / médio / alto).
- [ ] Confirmar que `GRANT` explícito existe para toda tabela pública nova.
- [ ] Confirmar `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` quando aplicável.
- [ ] Revisar todas as `POLICY` — nenhuma deve usar `TO authenticated USING (true)` para dados por usuário.
- [ ] Se houver `SECURITY DEFINER`, checar `SET search_path = public` e checagem interna de identidade.
- [ ] Rodar `npm run validate:migrations` e `npm run validate:security-authority` após copiar.

## Arquivos nesta pasta

| Ordem | Arquivo                                                  | Descrição                                                                                                                                                 | Risco     |
| ----- | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1     | `20260810152013_finalize_community_poll_cutover.sql`     | CUTOVER Poll deliberadamente fora da fila ativa; promover com timestamp novo somente apos preflight e janela de observacao.                               | Alto      |
| 2     | `20260810152014_finalize_community_interest_cutover.sql` | CUTOVER Community Interest fora da fila ativa; exige Edge, Turnstile, origins, frontend broker e smoke test comprovados antes de remover o writer legacy. | Alto      |

## Depois de aplicar

1. Confirme no Supabase que o objeto criado pela migration existe.
2. Teste o fluxo correspondente em ambiente controlado.
3. Mova os arquivos aplicados de `docs/migrations-pending/` para `supabase/migrations/` (se ainda não estiverem lá) e commit.
4. Atualize esta tabela removendo os arquivos aplicados.
