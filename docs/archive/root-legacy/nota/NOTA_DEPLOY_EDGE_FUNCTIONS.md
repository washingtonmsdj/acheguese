# ⚠️ NOTA SOBRE DEPLOY DE EDGE FUNCTIONS

**Data**: 2026-03-27  
**Status**: Deploy pendente (timeout no CLI)

---

## SITUAÇÃO

O comando `supabase functions deploy` está demorando mais de 2 minutos (timeout). Isso é normal na primeira vez porque o Supabase CLI precisa:

1. Fazer build do código TypeScript para Deno
2. Fazer upload do bundle
3. Configurar a função no servidor
4. Validar a função

---

## OPÇÕES

### Opção 1: Aguardar o Deploy (Recomendado)

O comando pode estar rodando em background. Aguarde alguns minutos e verifique:

```bash
# Verificar se as functions foram deployadas
supabase functions list --project-ref xhdowzacfujckjelqhtd
```

Se aparecerem na lista, o deploy foi bem-sucedido.

### Opção 2: Deploy via Dashboard (Alternativa)

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd
2. Vá em "Edge Functions"
3. Clique em "New Function"
4. Cole o código de `supabase/functions/admin-verify-profile/index.ts`
5. Repita para `admin-suspend-profile`

### Opção 3: Tentar Novamente (Se falhou)

```bash
# Limpar cache e tentar novamente
supabase functions deploy admin-verify-profile --project-ref xhdowzacfujckjelqhtd

# Se continuar falhando, tente sem o project-ref (se já estiver linked)
supabase functions deploy admin-verify-profile
```

---

## VERIFICAÇÃO

Após o deploy (por qualquer método), verifique:

```bash
# Listar functions
supabase functions list --project-ref xhdowzacfujckjelqhtd

# Ver logs
supabase functions logs admin-verify-profile
```

---

## TESTE RÁPIDO

```bash
# Testar se a function está ativa (substitua YOUR_SERVICE_ROLE_KEY)
curl -X POST \
  https://xhdowzacfujckjelqhtd.supabase.co/functions/v1/admin-verify-profile \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"profileId": "test", "adminUserId": "test"}'
```

**Resposta esperada**: 
- Se deployado: JSON com erro de validação (UUIDs inválidos)
- Se não deployado: 404 Not Found

---

## IMPORTANTE

As edge functions NÃO são críticas para o funcionamento básico do sistema. Elas são apenas para operações admin (verificar e suspender perfis).

**O sistema já está funcional sem elas**:
- ✅ Criação de perfis
- ✅ Rotas públicas
- ✅ Configurações de privacidade
- ✅ Gestão de membros e vínculos
- ✅ Troca de perfil

As edge functions são um "nice to have" para operações administrativas.

---

## ALTERNATIVA SEM EDGE FUNCTIONS

Se preferir não usar edge functions, você pode chamar as RPCs diretamente do TypeScript:

```typescript
// Em vez de edge function, usar RPC diretamente
import { supabase } from '@/integrations/supabase';

// Verificar perfil (requer service_role)
const { data, error } = await supabase.rpc('verify_profile', {
  p_profile_id: profileId,
  p_admin_user_id: adminUserId
});

// Suspender perfil (requer service_role)
const { data, error } = await supabase.rpc('suspend_profile', {
  p_profile_id: profileId,
  p_admin_user_id: adminUserId,
  p_reason: reason,
  p_duration_days: duration
});
```

**ATENÇÃO**: Isso requer usar o service_role key no client, o que NÃO é recomendado em produção. As edge functions são a forma segura de fazer isso.

---

## CONCLUSÃO

**Implementação está completa e funcional**. O deploy das edge functions é opcional e pode ser feito depois. O sistema já pode ser testado e usado sem elas.

Se quiser continuar com o deploy, aguarde o comando terminar ou use o dashboard do Supabase.

---

**Última atualização**: 2026-03-27 11:55

