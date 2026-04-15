# 🚀 Como Fazer Push para o GitHub

## ⚠️ Problema Atual

O comando `git push origin main` está falhando com erro:
```
remote: Repository not found.
```

Isso acontece porque você precisa de autenticação para fazer push.

---

## ✅ Solução: Usar Personal Access Token (PAT)

### **Passo 1: Criar Token no GitHub**

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Note**: "Deploy Acheguese"
   - **Expiration**: 90 days (ou No expiration)
   - **Scopes**: Marque ✅ **repo** (acesso completo ao repositório)
4. Clique em **"Generate token"**
5. **⚠️ COPIE O TOKEN AGORA!** (você não verá novamente)
   - Formato: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### **Passo 2: Fazer Push com o Token**

#### **Opção A: Usar o Script Automático** (Recomendado)

```powershell
.\push-to-github.ps1
```

Quando solicitado, cole o token que você copiou.

#### **Opção B: Comando Manual**

```powershell
git push https://SEU_TOKEN_AQUI@github.com/washingtonmsdj/acheguese.git main
```

Substitua `SEU_TOKEN_AQUI` pelo token que você copiou.

#### **Opção C: Configurar Permanentemente**

```powershell
# Configurar para salvar credenciais
git config credential.helper store

# Fazer push (vai pedir usuário e senha)
git push origin main

# Quando pedir:
# Username: washingtonmsdj
# Password: COLE_SEU_TOKEN_AQUI
```

---

## 🎯 Após o Push

1. ✅ O push será concluído
2. ✅ A Vercel detectará automaticamente a mudança
3. ✅ Um novo deploy será iniciado
4. ✅ Você pode acompanhar em: https://vercel.com/dashboard

---

## 🔍 Verificar se Funcionou

```powershell
git log --oneline -3
```

Você deve ver:
```
57932fc (HEAD -> main, origin/main) fix: export CoverageService no index e corrigir imports
e81c738 fix: remove prebuild script para permitir deploy na Vercel
4182cf4 a
```

Se `origin/main` estiver no mesmo commit que `HEAD`, funcionou! 🎉

---

## ❓ Problemas?

### Token não funciona?
- Verifique se marcou a opção **repo** ao criar
- Verifique se copiou o token completo
- Tente criar um novo token

### Ainda não consegue?
- Verifique se você é o dono do repositório
- Verifique se o repositório não foi renomeado
- Acesse https://github.com/washingtonmsdj/acheguese no navegador

---

## 🚀 Alternativa: Deploy via Vercel CLI

Se não conseguir fazer push, você pode fazer deploy direto:

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Isso fará deploy sem precisar do Git push.
