# 🔧 CORREÇÃO FINAL DO SEED - Schema de Profiles

**Data:** 2026-05-03  
**Problema:** Colunas incorretas na tabela `profiles`

---

## ❌ Erros Corrigidos

### Erro 1: `profile_id` NOT NULL em `businesses`
```
ERROR: null value in column "profile_id" violates not-null constraint
```
**Solução:** Criar profiles para donos de empresas

### Erro 2: Coluna `full_name` não existe em `profiles`
```
ERROR: column "full_name" of relation "profiles" does not exist
```
**Solução:** Usar `name`, `display_name` e `username`

---

## ✅ Schema Correto de Profiles

A tabela `profiles` tem as seguintes colunas principais:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK para auth.users |
| `name` | TEXT | Nome completo |
| `display_name` | TEXT | Nome de exibição |
| `username` | TEXT | Username único (opcional) |
| `profile_type` | TEXT | Tipo: personal, business, professional, driver |
| `is_active` | BOOLEAN | Se está ativo |
| `slug` | TEXT | URL-friendly identifier |

---

## 📋 Profiles Criados no Seed

### Donos de Empresas (3)

| ID | Nome | Username | Tipo |
|----|------|----------|------|
| `...0010` | Dono Mercadinho | mercadinho-owner-test | business |
| `...0011` | Dono Consultoria | consultoria-owner-test | business |
| `...0012` | Dono Pizzaria | pizzaria-owner-test | business |

### Profissionais (2)

| ID | Nome | Username | Tipo |
|----|------|----------|------|
| `...0001` | João Silva | eletricista-joao-test | professional |
| `...0002` | Carlos Santos | encanador-carlos-test | professional |

---

## 🚀 Como Aplicar Agora

1. Abra Supabase Dashboard
2. Vá em SQL Editor
3. Copie TODO o conteúdo **ATUALIZADO** de `scripts/seed-ai-phase1-sql.sql`
4. Execute
5. Verifique que retornou dados

**Resultado esperado:**
```
✅ 5 profiles criados (3 business + 2 professional)
✅ 3 empresas criadas (com profile_id)
✅ 1 perfil gastronômico criado
✅ 2 profissionais criados
```

---

## 📊 Estrutura Final

```
profiles (5 total)
├── 00000000-0000-0000-0000-000000000010 (Dono Mercadinho - business)
├── 00000000-0000-0000-0000-000000000011 (Dono Consultoria - business)
├── 00000000-0000-0000-0000-000000000012 (Dono Pizzaria - business)
├── 00000000-0000-0000-0000-000000000001 (João Silva - professional)
└── 00000000-0000-0000-0000-000000000002 (Carlos Santos - professional)

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

**Correções aplicadas:**
1. ✅ Profiles com `name`, `display_name`, `username` (não `full_name`)
2. ✅ Profiles com `user_id` (mesmo valor do `id`)
3. ✅ Profiles com `profile_type` correto (business/professional)
4. ✅ Profiles com `is_active = true`

**Próximo passo:** Aplicar o SQL atualizado no Supabase Dashboard

---

**Última atualização:** 2026-05-03 (correção final de schema)
