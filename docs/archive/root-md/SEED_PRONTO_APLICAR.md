# ✅ SEED FINAL - PRONTO PARA APLICAR

**Data:** 2026-05-03  
**Status:** ✅ Todas as correções aplicadas

---

## 🎯 Solução Final

O seed agora:
1. ✅ Desabilita triggers temporariamente para inserir profiles de teste
2. ✅ Cria profiles sem `user_id` (não precisa de usuários em `auth.users`)
3. ✅ Usa schema correto (`name`, `display_name`, `username`)
4. ✅ Reabilita triggers após inserção

---

## 🚀 APLICAR AGORA

### Passo 1: Copiar SQL

Abra o arquivo `scripts/seed-ai-phase1-sql.sql` e copie **TODO** o conteúdo.

### Passo 2: Executar no Dashboard

1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. Vá em **SQL Editor**
4. Cole o SQL completo
5. Clique em **Run**

### Passo 3: Verificar Resultados

As queries de verificação no final do SQL devem retornar:

**Empresas (3):**
```
Consultoria Premium Salvador | consultoria-premium-test | Serviços | true
Mercadinho da Pituba | mercadinho-pituba-test | Comércio | false
Pizzaria Bella Napoli | pizzaria-bella-test | Gastronomia | false
```

**Perfil Gastronômico (1):**
```
Pizzaria Bella Napoli | {Italiana,Pizza} | moderate | true | true | true
```

**Profissionais (2):**
```
Carlos Santos - Encanador | encanador-carlos-test | Encanador | true
João Silva - Eletricista | eletricista-joao-test | Eletricista | true
```

---

## 📊 Dados Criados

### 5 Profiles
- 3 donos de empresas (business)
- 2 profissionais (professional)

### 3 Empresas
- **Mercadinho da Pituba** (comum)
  - URL: `/empresas/ba/salvador/pituba/mercadinho-pituba-test`
- **Consultoria Premium Salvador** (premium)
  - URL: `/p/consultoria-premium-test`
- **Pizzaria Bella Napoli** (gastronômica)
  - URL: `/gastronomia/ba/salvador/pituba/pizzaria-bella-test`
  - Perfil gastronômico ativo
  - Delivery disponível

### 2 Profissionais
- **João Silva - Eletricista**
  - URL: `/profissionais/eletricista-joao-test`
- **Carlos Santos - Encanador**
  - URL: `/profissionais/encanador-carlos-test`

Todos na **Pituba** com coordenadas válidas.

---

## 🧪 Próximos Passos

Após aplicar o seed com sucesso:

### 1. Testar 6 Queries em `/buscar`

1. "pizzaria barata com delivery" → Deve retornar Pizzaria Bella Napoli
2. "restaurante aberto agora" → Pode retornar 0-1 resultados
3. "eletricista perto de mim" → Deve retornar João Silva
4. "encanador urgente" → Deve retornar Carlos Santos
5. "empresa no meu bairro" → Deve retornar as 3 empresas
6. "me conte uma piada" → Deve retornar mensagem amigável (0 resultados)

### 2. Validar URLs

Confirme que as URLs seguem as regras:
- ✅ Premium → `/p/:slug`
- ✅ Gastronômica → `/gastronomia/ba/salvador/pituba/:slug`
- ✅ Comum → `/empresas/ba/salvador/pituba/:slug`

### 3. Enviar Resultados

Me envie:
- Screenshot ou log textual
- Quais queries funcionaram
- URLs geradas
- Problemas encontrados

---

## 📁 Arquivo

**`scripts/seed-ai-phase1-sql.sql`** ✅ VERSÃO FINAL

**Correções aplicadas:**
1. ✅ Profiles sem `user_id` (não precisa de auth.users)
2. ✅ Triggers desabilitados temporariamente
3. ✅ Schema correto (name, display_name, username)
4. ✅ profile_type correto (business/professional)

---

## ✅ Critério de Aprovação

**Aprovada para produto se:**
- Seed aplicado com sucesso
- Pelo menos 4/6 queries retornaram resultados
- URLs gastronômicas corretas
- URLs abrem corretamente

---

**Status:** ✅ **PRONTO PARA APLICAR**

**Próximo passo:** Aplicar o SQL no Supabase Dashboard
