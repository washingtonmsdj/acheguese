# 🔧 CORREÇÃO DO SEED - profile_id NOT NULL

**Data:** 2026-05-03  
**Problema:** Coluna `profile_id` em `businesses` é NOT NULL

---

## ❌ Erro Original

```
ERROR: 23502: null value in column "profile_id" of relation "businesses" 
violates not-null constraint
```

---

## ✅ Correção Aplicada

### O Que Foi Corrigido

1. **Criação de profiles para donos de empresas**
   - 3 profiles adicionados antes de criar as empresas
   - IDs fixos para facilitar limpeza

2. **Empresas agora têm profile_id**
   - Cada empresa vinculada a um profile válido

3. **Limpeza atualizada**
   - Remove profiles de donos de empresas também

---

## 📋 Profiles Criados

| ID | Nome | Username |
|----|------|----------|
| `00000000-0000-0000-0000-000000000010` | Dono Mercadinho | mercadinho-owner-test |
| `00000000-0000-0000-0000-000000000011` | Dono Consultoria | consultoria-owner-test |
| `00000000-0000-0000-0000-000000000012` | Dono Pizzaria | pizzaria-owner-test |

---

## 🚀 Como Aplicar Agora

1. Abra Supabase Dashboard
2. Vá em SQL Editor
3. Copie TODO o conteúdo ATUALIZADO de `scripts/seed-ai-phase1-sql.sql`
4. Execute
5. Verifique que retornou dados

**Resultado esperado:**
```
✅ 3 profiles de donos criados
✅ 3 empresas criadas (com profile_id)
✅ 1 perfil gastronômico criado
✅ 2 profiles de profissionais criados
✅ 2 profissionais criados
```

---

## 📊 Estrutura Final

```
profiles (5 total)
├── 00000000-0000-0000-0000-000000000010 (Dono Mercadinho)
├── 00000000-0000-0000-0000-000000000011 (Dono Consultoria)
├── 00000000-0000-0000-0000-000000000012 (Dono Pizzaria)
├── 00000000-0000-0000-0000-000000000001 (João Silva)
└── 00000000-0000-0000-0000-000000000002 (Carlos Santos)

businesses (3 total)
├── Mercadinho da Pituba (profile_id: ...0010)
├── Consultoria Premium (profile_id: ...0011)
└── Pizzaria Bella Napoli (profile_id: ...0012)

gastronomy_profiles (1 total)
└── Pizzaria Bella Napoli

professional_data (2 total)
├── João Silva - Eletricista (profile_id: ...0001)
└── Carlos Santos - Encanador (profile_id: ...0002)
```

---

## ✅ Status

**Arquivo corrigido:** `scripts/seed-ai-phase1-sql.sql`

**Próximo passo:** Aplicar o SQL atualizado no Supabase Dashboard

---

**Última atualização:** 2026-05-03
