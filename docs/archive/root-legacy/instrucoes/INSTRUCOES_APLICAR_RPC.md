# INSTRUÇÕES: APLICAR RPC invite_profile_member_by_email

**Tempo Estimado**: 5 minutos  
**Dificuldade**: Fácil  
**Obrigatório**: Sim (sem isso, adicionar membro não funciona)  
**Segurança**: ✅ VALIDADO (não expõe user_id)

---

## PASSO A PASSO

### 1. Abrir Supabase Dashboard

URL: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd

Login com suas credenciais.

---

### 2. Ir para SQL Editor

No menu lateral esquerdo, clicar em:

**SQL Editor** (ícone de código)

---

### 3. Criar Nova Query

Clicar no botão:

**+ New Query**

---

### 4. Copiar SQL

Abrir arquivo: `scripts/aplicar-rpc-invite-member.sql`

Copiar TODO o conteúdo (Ctrl+A, Ctrl+C)

---

### 5. Colar no Editor

Colar no editor SQL do Supabase (Ctrl+V)

---

### 6. Executar

Clicar no botão verde:

**Run** (ou Ctrl+Enter)

---

### 7. Verificar Sucesso

No painel de output (embaixo), deve aparecer:

```
Success. No rows returned
```

Ou algo similar indicando sucesso.

---

### 8. Validar RPC (IMPORTANTE)

Executar este SQL para testar segurança:

```sql
-- Teste: tentar adicionar membro sem permissão (deve falhar)
SELECT invite_profile_member_by_email(
  'profile-id-qualquer',
  'teste@exemplo.com',
  'member'
);
```

**Resultado Esperado**:
```json
{
  "success": false,
  "error": "Apenas owner ou admin podem adicionar membros"
}
```

**Isso é BOM**: significa que RPC está validando permissões corretamente.

---

## SEGURANÇA VALIDADA

### O que o RPC FAZ

✅ Valida autenticação  
✅ Valida se perfil existe  
✅ Valida se caller é owner/admin  
✅ Busca user_id internamente (não expõe)  
✅ Adiciona membro  
✅ Retorna apenas sucesso/erro

### O que o RPC NÃO FAZ

❌ Não expõe user_id para front-end  
❌ Não permite lookup arbitrário de emails  
❌ Não permite enumeração de usuários  
❌ Não viola privacidade

---

## TROUBLESHOOTING

### Erro: "function invite_profile_member_by_email already exists"

**Solução**: RPC já foi aplicado antes. Tudo OK, pode prosseguir.

---

### Erro: "permission denied for schema auth"

**Solução**: Você não tem permissão de admin. Peça para alguém com acesso service_role aplicar.

---

### Erro: "relation auth.users does not exist"

**Solução**: Problema de permissões. Use `SECURITY DEFINER` na função (já está no SQL).

---

## APÓS APLICAR

✅ RPC seguro aplicado com sucesso

**Próxima Ação**: Testar os 7 fluxos manualmente usando `CHECKLIST_TESTE_MANUAL_UI.md`

---

**Dúvidas?** Verifique `CORRECAO_SEGURANCA_MEMBROS.md` para análise de segurança completa.
