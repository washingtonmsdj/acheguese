# ⚠️ URGENTE - ROTACIONAR RESEND_API_KEY

## AÇÃO IMEDIATA NECESSÁRIA

A key `re_BuiczoKX_JcXfVQpZLA4q5xW8oCPSh5z4` foi exposta publicamente e precisa ser rotacionada AGORA.

## 1. REVOGAR KEY ANTIGA

```
1. Acesse: https://resend.com/api-keys
2. Localize a key: re_BuiczoKX_JcXfVQpZLA4q5xW8oCPSh5z4
3. Clique em "Delete" ou "Revoke"
4. Confirme a revogação
```

## 2. GERAR NOVA KEY

```
1. Na mesma página: https://resend.com/api-keys
2. Clique em "Create API Key"
3. Nome: "Emergency Email - Production"
4. Copie a nova key (formato: re_...)
```

## 3. ATUALIZAR SECRET NO SUPABASE

```bash
supabase secrets set RESEND_API_KEY=re_SUA_NOVA_KEY_AQUI --project-ref xhdowzacfujckjelqhtd
```

## 4. VALIDAR NOVA KEY

```bash
node testar_envio_real.mjs
```

**Resultado esperado:**
```json
{
  "success": true,
  "status": "sent",
  "emailId": "novo-id-aqui"
}
```

## APÓS ROTAÇÃO

Execute o fechamento final conforme `FECHAMENTO_FINAL_ENTREGA_EXTERNA.md`
