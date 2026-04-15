# Checklist de Go-Live — Multi-Perfil

**Classificação atual**: ⚠️ BACKEND HOMOLOGADO EM STAGING — UI NÃO HOMOLOGADA

Não classificar como "pronto para produção" até UI homologada manualmente.

---

## 1. Deploy banco (migrations)

- [ ] Confirmar que todas as 35 migrations estão aplicadas no ambiente de produção
  ```bash
  supabase db push --project-ref <ref-producao>
  ```
- [ ] Validar migration crítica do RPC seguro:
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_name = 'invite_profile_member_by_email';
  -- Esperado: 1 linha
  ```
- [ ] Confirmar RLS ativo nas tabelas críticas:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE tablename IN ('profiles','profile_members','profile_links');
  -- Esperado: rowsecurity = true em todas
  ```

## 2. Deploy edge functions

- [ ] `supabase functions deploy admin-suspend-profile`
- [ ] `supabase functions deploy admin-verify-profile`
- [ ] `supabase functions deploy territory-ai-content`
- [ ] Smoke test sem auth retorna 403 (ver DEPLOY_EDGE_FUNCTIONS.md)
- [ ] Logs sem erros de inicialização

## 3. Validação rápida pós-deploy

- [ ] Login funciona
- [ ] `/perfil` carrega sem erro 500
- [ ] `/p/:handle` de perfil público renderiza
- [ ] RPC `invite_profile_member_by_email` responde (não 404):
  ```bash
  curl -X POST https://<projeto>.supabase.co/rest/v1/rpc/invite_profile_member_by_email \
    -H "apikey: <anon-key>" \
    -H "Content-Type: application/json" \
    -d '{"p_profile_id":"00000000-0000-0000-0000-000000000000","p_email":"x@x.com","p_role":"member"}'
  # Esperado: {"success":false,"error":"Não autenticado"} — NÃO 404
  ```

## 4. Smoke test mínimo de UI (manual, 10 min)

- [ ] Criar 1 perfil business pelo formulário
- [ ] Abrir `/p/:handle` do perfil criado
- [ ] Alterar privacidade e confirmar efeito
- [ ] Adicionar membro por email e confirmar toast de sucesso

## 5. Rollback básico

| Componente | Rollback |
|------------|----------|
| Migration | Não há rollback automático. Reverter via migration manual de DROP/ALTER |
| Edge function | Re-deploy do commit anterior |
| Front-end | Re-deploy do build anterior (Vercel/Netlify: instant rollback) |
| RPC seguro | `DROP FUNCTION invite_profile_member_by_email` + re-deploy versão anterior |

---

## Riscos remanescentes

| Risco | Severidade | Status |
|-------|-----------|--------|
| UI não homologada manualmente | 🔴 ALTO | Pendente — 7 fluxos não testados em navegador real |
| Edge functions não deployadas | 🟡 MÉDIO | Código pronto, deploy pendente |
| `admin_users` pode não existir em produção | 🟡 MÉDIO | Verificar antes do deploy das edge functions |
| `profile_audit_log` pode não existir em produção | 🟡 MÉDIO | Verificar antes do deploy |
| `territory-ai-content` depende de `LOVABLE_API_KEY` | 🟡 MÉDIO | Funciona com mock se chave ausente |
| Testes E2E não executados em CI | 🟡 MÉDIO | Estrutura criada, execução pendente |

---

## O que impede chamar de "pronto para produção"

1. **UI não homologada**: os 7 fluxos multi-perfil nunca foram testados manualmente em navegador real. Código está implementado e compilando, mas comportamento real é desconhecido.

2. **Edge functions não deployadas**: `admin-suspend-profile` e `admin-verify-profile` existem como código mas não estão no ambiente remoto.

3. **Testes E2E não executados**: suíte criada em `e2e/multi-profile.spec.ts` mas não rodada contra ambiente real.

---

## Classificação honesta

| Camada | Status |
|--------|--------|
| Backend (banco, RLS, RPCs) | ✅ Homologado em staging (40 testes automatizados) |
| RPC seguro de membros | ✅ Aplicado e testado via Management API |
| Edge functions (código) | ✅ Revisado e corrigido |
| Edge functions (deploy) | ⚠️ Pendente |
| Front-end (código) | ✅ Implementado, 0 erros TypeScript |
| Front-end (UI manual) | ❌ Não homologado |
| Testes E2E | ⚠️ Estrutura criada, não executados |

**Classificação geral**: ⚠️ STAGING — não pronto para produção
