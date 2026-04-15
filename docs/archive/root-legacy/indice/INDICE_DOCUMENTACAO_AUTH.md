# 📚 Índice - Documentação de Autenticação

## 🎯 Início Rápido

**Problema:** Erro 400 ao fazer login

**Solução rápida:**
1. Execute: `.\diagnosticar-login.ps1`
2. Ou leia: `README_LOGIN.md`

---

## 📋 Documentos por Categoria

### 🚀 Guias de Solução

| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **README_LOGIN.md** | Guia rápido de solução | Primeiro arquivo a ler |
| **SOLUCAO_LOGIN_SSOT.md** | Guia completo passo a passo | Para entender o problema em detalhes |

### 🔧 Scripts de Diagnóstico

| Arquivo | Tipo | Descrição | Como Executar |
|---------|------|-----------|---------------|
| **diagnosticar-login.ps1** | PowerShell | Diagnóstico automatizado | `.\diagnosticar-login.ps1` |
| **diagnostico-auth.sql** | SQL | Queries de diagnóstico | SQL Editor do Supabase |
| **criar-usuario-teste.sql** | SQL | Criar usuário de teste | SQL Editor do Supabase |

### 📖 Documentação Técnica

| Arquivo | Descrição | Público |
|---------|-----------|---------|
| **SCHEMA_AUTH_SSOT.md** | Estrutura do banco de dados | Desenvolvedores |
| **comandos-supabase-auth.md** | Comandos úteis do CLI | DevOps/Desenvolvedores |
| **EXEMPLOS_PRATICOS_AUTH.md** | Casos de uso reais com soluções | Todos |

---

## 🎓 Fluxo de Aprendizado

### Para Resolver o Problema Agora
```
1. README_LOGIN.md (5 min)
   ↓
2. diagnosticar-login.ps1 (2 min)
   ↓
3. Criar usuário no painel Supabase (3 min)
   ↓
4. Testar login ✅
```

### Para Entender o Problema
```
1. SOLUCAO_LOGIN_SSOT.md (15 min)
   ↓
2. diagnostico-auth.sql (5 min)
   ↓
3. SCHEMA_AUTH_SSOT.md (20 min)
```

### Para Manutenção Futura
```
1. comandos-supabase-auth.md (10 min)
   ↓
2. SCHEMA_AUTH_SSOT.md (20 min)
   ↓
3. Criar seus próprios scripts
```

---

## 🔍 Busca Rápida

### "Como criar um usuário?"
→ `README_LOGIN.md` seção "Solução Rápida"
→ `criar-usuario-teste.sql`
→ `EXEMPLOS_PRATICOS_AUTH.md` Caso 2

### "Por que o login não funciona?"
→ `diagnosticar-login.ps1`
→ `SOLUCAO_LOGIN_SSOT.md` seção "Identificar a Causa Raiz"
→ `EXEMPLOS_PRATICOS_AUTH.md` Caso 1

### "Como verificar usuários no banco?"
→ `diagnostico-auth.sql`
→ `comandos-supabase-auth.md` seção "Diagnóstico via CLI"
→ `EXEMPLOS_PRATICOS_AUTH.md` Caso 6

### "Qual a estrutura do banco?"
→ `SCHEMA_AUTH_SSOT.md`

### "Como confirmar email de um usuário?"
→ `comandos-supabase-auth.md` seção "Correções via CLI"
→ `SOLUCAO_LOGIN_SSOT.md` seção "Causa A: Email não confirmado"
→ `EXEMPLOS_PRATICOS_AUTH.md` Caso 1

### "Esqueci minha senha"
→ `EXEMPLOS_PRATICOS_AUTH.md` Caso 3

### "Como desbanir um usuário?"
→ `EXEMPLOS_PRATICOS_AUTH.md` Caso 5

---

## 📊 Matriz de Decisão

| Situação | Arquivo Recomendado | Tempo |
|----------|---------------------|-------|
| Preciso resolver AGORA | `README_LOGIN.md` | 5 min |
| Quero entender o problema | `SOLUCAO_LOGIN_SSOT.md` | 15 min |
| Preciso diagnosticar | `diagnosticar-login.ps1` | 2 min |
| Quero ver o banco | `diagnostico-auth.sql` | 5 min |
| Preciso criar usuário | `criar-usuario-teste.sql` | 3 min |
| Quero comandos úteis | `comandos-supabase-auth.md` | 10 min |
| Preciso entender o schema | `SCHEMA_AUTH_SSOT.md` | 20 min |

---

## 🎯 Princípios SSOT

Todos os documentos seguem o princípio **Single Source of Truth**:

1. **Fonte de verdade para usuários:** `auth.users`
2. **Fonte de verdade para perfis:** `public.profiles`
3. **Fonte de verdade para configurações:** Painel do Supabase

**Regra de ouro:** Sempre consulte o banco de dados antes de assumir qualquer comportamento.

---

## 🔄 Manutenção dos Documentos

### Quando atualizar?

- **README_LOGIN.md**: Quando houver nova solução rápida
- **SOLUCAO_LOGIN_SSOT.md**: Quando houver nova causa identificada
- **SCHEMA_AUTH_SSOT.md**: Quando o schema do banco mudar
- **comandos-supabase-auth.md**: Quando houver novos comandos úteis

### Como atualizar?

1. Verifique o SSOT (banco de dados)
2. Atualize o documento
3. Teste as instruções
4. Atualize este índice se necessário

---

## 📞 Suporte

Se nenhum documento resolver seu problema:

1. Execute todos os scripts de diagnóstico
2. Colete os resultados
3. Verifique os logs do Supabase (Logs → Auth Logs)
4. Documente o novo problema encontrado
5. Atualize a documentação com a solução

---

## ✅ Checklist de Uso

- [ ] Li o `README_LOGIN.md`
- [ ] Executei `diagnosticar-login.ps1`
- [ ] Executei `diagnostico-auth.sql` no Supabase
- [ ] Verifiquei o status do usuário no painel
- [ ] Criei usuário de teste (se necessário)
- [ ] Testei o login
- [ ] Problema resolvido ✅

---

**Última atualização:** 2026-04-08
**Versão:** 1.0.0
