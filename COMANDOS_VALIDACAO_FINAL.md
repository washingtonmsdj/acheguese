# ⚡ COMANDOS RÁPIDOS - VALIDAÇÃO FINAL

**Objetivo:** Resolver schema cache e validar Fase 1 completa

---

## 1️⃣ RECARREGAR SCHEMA CACHE

**Abra Supabase Dashboard → SQL Editor e execute:**

```sql
NOTIFY pgrst, 'reload schema';
SELECT pg_notification_queue_usage();
```

---

## 2️⃣ ADICIONAR ENCANADOR (se não existir)

**No SQL Editor:**

```sql
-- Verificar se existe
SELECT professional_name, slug FROM professional_data 
WHERE slug LIKE '%encanador%' AND location_id = '384add59-4e53-489d-a7b5-97dea2b3f442';

-- Se não existir, criar
INSERT INTO professional_data (
  id, profile_id, professional_name, slug, service_category,
  location_id, is_accepting_clients, phone, metadata, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  (SELECT id FROM profiles WHERE username LIKE '%encanador%' LIMIT 1),
  'Carlos Santos - Encanador',
  'encanador-carlos-ai-seed',
  'Encanador',
  '384add59-4e53-489d-a7b5-97dea2b3f442',
  true,
  '(71) 9999-7777',
  jsonb_build_object('latitude', -12.9978, 'longitude', -38.4503),
  NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM professional_data WHERE slug = 'encanador-carlos-ai-seed'
);
```

---

## 3️⃣ VALIDAR PROGRAMATICAMENTE

**No terminal:**

```bash
node scripts/validate-ai-phase1.mjs
```

**Resultado esperado:**
```
✅ RPC Geoespacial: ✅
✅ Busca de Profissionais: ✅
✅ Busca de Empresas: ✅
✅ Perfis Gastronômicos: ✅
```

---

## 4️⃣ TESTAR EM /BUSCAR

**Acessar `/buscar` e testar:**

1. "pizzaria barata com delivery"
2. "restaurante aberto agora"
3. "eletricista perto de mim"
4. "encanador urgente"
5. "empresa no meu bairro"
6. "me conte uma piada"

**Registrar para cada:**
- Quantidade de resultados
- URLs geradas
- Se abriu corretamente

---

## 5️⃣ GATES FINAIS

**No terminal:**

```bash
npm run lint -- --max-warnings=0
npm run typecheck
npm run build
```

---

## ✅ CRITÉRIO DE APROVAÇÃO

**APROVADA COMO PRODUTO se:**
- ✅ Pelo menos 4/6 queries retornam resultados
- ✅ URLs corretas
- ✅ URLs abrem
- ✅ Gates passando

---

**Documentação completa:** Ver `RESOLVER_SCHEMA_CACHE.md`
