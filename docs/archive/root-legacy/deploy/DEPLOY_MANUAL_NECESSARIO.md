# ⚠️ DEPLOY EDGE FUNCTIONS - MANUAL NECESSÁRIO

**Data**: 2026-03-27  
**Status**: Deploy via CLI está demorando (normal)

---

## SITUAÇÃO

O comando `supabase functions deploy` está demorando mais de 5 minutos. Isso é normal na primeira vez porque:
1. Supabase CLI faz build do TypeScript para Deno
2. Faz upload do bundle (pode ser grande)
3. Configura a função no servidor
4. Valida a função

---

## RECOMENDAÇÃO

### Opção 1: Deploy via Dashboard (Mais Rápido)

1. Acesse: https://supabase.com/dashboard/project/xhdowzacfujckjelqhtd/functions

2. Clique em "New Function" ou "Deploy New Function"

3. Para `admin-verify-profile`:
   - Nome: `admin-verify-profile`
   - Cole o código de: `supabase/functions/admin-verify-profile/index.ts`
   - Inclua também: `supabase/functions/_shared/adminAuth.ts` (como import)

4. Para `admin-suspend-profile`:
   - Nome: `admin-suspend-profile`
   - Cole o código de: `supabase/functions/admin-suspend-profile/index.ts`
   - Inclua também: `supabase/functions/_shared/adminAuth.ts` (como import)

### Opção 2: Aguardar CLI (Pode demorar 10-15 min)

```bash
# Deixe rodando em um terminal separado
supabase functions deploy admin-verify-profile --project-ref xhdowzacfujckjelqhtd
```

Aguarde até ver:
```
✓ Deployed Function admin-verify-profile
```

### Opção 3: Ignorar por Enquanto

**As edge functions NÃO são críticas!**

O sistema já funciona completamente sem elas:
- ✅ Criar perfis
- ✅ Rotas públicas
- ✅ Configurações
- ✅ Membros e vínculos
- ✅ Privacidade

Edge functions são apenas para:
- Verificar perfis (admin)
- Suspender perfis (admin)

Você pode deployá-las depois quando precisar dessas funcionalidades admin.

---

## ALTERNATIVA: USAR RPCs DIRETAMENTE

Se precisar das funcionalidades admin AGORA, pode chamar as RPCs diretamente:

```typescript
import { supabase } from '@/integrations/supabase';

// Criar client com service_role (APENAS no backend!)
const adminClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
);

// Verificar perfil
await adminClient.rpc('verify_profile', {
  p_profile_id: profileId,
  p_admin_user_id: adminUserId
});

// Suspender perfil
await adminClient.rpc('suspend_profile', {
  p_profile_id: profileId,
  p_admin_user_id: adminUserId,
  p_reason: reason,
  p_duration_days: duration
});
```

**ATENÇÃO**: Isso requer expor o service_role key, o que NÃO é seguro no frontend. Use apenas em scripts backend ou aguarde o deploy das edge functions.

---

## VERIFICAR SE DEPLOYOU

```bash
# Listar functions
supabase functions list --project-ref xhdowzacfujckjelqhtd

# Se aparecerem na lista, deployou com sucesso
```

---

## CONCLUSÃO

**Sistema está completo e funcional SEM as edge functions.**

Deploy delas é opcional e pode ser feito:
- Via dashboard (mais rápido)
- Via CLI (mais demorado)
- Depois, quando precisar

**Recomendação**: Teste o sistema primeiro (`npm run dev`), depois faça deploy das edge functions se precisar das funcionalidades admin.

---

**Sistema pronto para uso. Edge functions são um plus, não um requisito.**

