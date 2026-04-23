# 🚨 ALERTA CRÍTICO DE SEGURANÇA

**Data:** 2026-04-22  
**Severidade:** CRÍTICA  
**Status:** AÇÃO IMEDIATA NECESSÁRIA

---

## SECRETS EXPOSTOS DETECTADOS

### Arquivo: `.env.local`

**PROBLEMA:** Arquivo com secrets reais está presente no repositório e pode ter sido commitado.

### Secrets Identificados:

1. **Supabase Secret Key**
   ```
   SUPABASE_SECRET_KEY="sb_secret_zZwjHSP8h0j355Uu8EhH9Q_YdYjMmCa"
   ```
   - **Risco:** Acesso administrativo total ao banco de dados
   - **Impacto:** CRÍTICO

2. **Resend API Key**
   ```
   RESEND_API_KEY="re_XMFw8KUE_HcTKQLSDptEqNHXKrGho1cK1"
   ```
   - **Risco:** Envio de emails não autorizados
   - **Impacto:** ALTO

3. **Cron Secret**
   ```
   CRON_SECRET="db95e6cfb0ac35ea91a491d74628e6c3c4a79b8ca1f32e4e3eb886efa4ee0134"
   ```
   - **Risco:** Execução não autorizada de edge functions
   - **Impacto:** ALTO

4. **Sentry DSN**
   ```
   VITE_SENTRY_DSN=https://f2389d9a6539f834cacd17ca6c9e1a48@o4511245622378496...
   ```
   - **Risco:** Acesso a logs de erro
   - **Impacto:** MÉDIO

5. **Credenciais de Teste**
   - E2E_USER_PASSWORD
   - E2E_ADMIN_PASSWORD
   - TEST_DRIVER_PASSWORD
   - **Impacto:** MÉDIO (se ambiente de produção)

---

## AÇÕES IMEDIATAS NECESSÁRIAS

### 1. Verificar Histórico Git
```bash
git log --all --full-history -- .env.local
```

**Se o arquivo foi commitado:**
- ⚠️ TODOS os secrets devem ser rotacionados IMEDIATAMENTE
- Histórico Git deve ser limpo (requer force push)

### 2. Rotacionar Secrets (SE COMMITADO)

#### Supabase
1. Acessar: Supabase Dashboard > Settings > API
2. Gerar nova Service Role Key
3. Atualizar em ambiente seguro

#### Resend
1. Acessar: https://resend.com/api-keys
2. Revogar key: `re_XMFw8KUE_HcTKQLSDptEqNHXKrGho1cK1`
3. Gerar nova key

#### Cron Secret
1. Gerar novo secret: `openssl rand -hex 32`
2. Atualizar em Vercel Environment Variables
3. Atualizar edge functions

#### Sentry
1. Acessar: Sentry > Settings > Projects
2. Regenerar DSN se necessário

### 3. Remover do Repositório
```bash
# Remover do working directory
git rm --cached .env.local

# Adicionar ao .gitignore (já está)
# Verificar:
grep ".env.local" .gitignore

# Commit
git commit -m "security: remove .env.local from repository"
```

### 4. Limpar Histórico (SE NECESSÁRIO)
```bash
# ATENÇÃO: Requer force push
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (CUIDADO!)
git push origin --force --all
```

---

## ANÁLISE DOS DEMAIS ARQUIVOS .ENV

### ✅ `.env` - SEGURO
- Apenas placeholders
- Template público correto
- Pode ser commitado

### ✅ `.env.example` - SEGURO
- Template sem valores reais
- Já está no repositório

### ✅ `.env.local.example` - SEGURO
- Template sem valores reais
- Já está no repositório

### ⚠️ `.env.production` - REVISAR
- Apenas template com comentários
- **Status:** SEGURO (sem secrets reais)
- **Ação:** Pode permanecer como template

### ⚠️ `.env.remote` - REVISAR
- Apenas template com placeholders
- **Status:** SEGURO (sem secrets reais)
- **Ação:** Pode permanecer como template

### ⚠️ `.env.test` - REVISAR
- Apenas template com placeholders
- **Status:** SEGURO (sem secrets reais)
- **Ação:** Pode permanecer como template

### ⚠️ `.env.e2e.network` - REVISAR
- Contém IDs e credenciais de teste
- **Status:** MÉDIO RISCO (se IDs são de produção)
- **Ação:** Verificar se IDs são de ambiente de teste isolado

---

## VERIFICAÇÃO DO .gitignore

```gitignore
# Environment
# .env é o template público com placeholders — DEVE ser commitado
!.env
.env.local          ← CORRETO: está ignorado
.env.*.local        ← CORRETO: está ignorado
.env.staging
.env.test           ← ⚠️ PROBLEMA: .env.test NÃO está ignorado
.env.remote         ← ⚠️ PROBLEMA: .env.remote NÃO está ignorado
```

### Problemas Identificados:
1. `.env.test` não está no .gitignore
2. `.env.remote` não está no .gitignore
3. `.env.e2e.network` não está no .gitignore

---

## CORREÇÕES NECESSÁRIAS NO .gitignore

```gitignore
# Environment
# .env é o template público com placeholders — DEVE ser commitado
!.env
.env.local
.env.*.local
.env.staging
.env.test           # ← Já está (OK)
.env.remote         # ← Já está (OK)
.env.e2e.*          # ← ADICIONAR: ignora todos .env.e2e.*
.env.production     # ← ADICIONAR: nunca commitar produção com secrets

# Exceto templates
!.env.example
!.env.local.example
!.env.remote.example
!.env.production    # ← REMOVER esta exceção se houver
```

---

## POLÍTICA OFICIAL DE .ENV (ATUALIZADA)

### Arquivos que DEVEM ser commitados:
- `.env` - template público com placeholders
- `.env.example` - template completo
- `.env.local.example` - template local
- `.env.remote.example` - template remote

### Arquivos que NUNCA devem ser commitados:
- `.env.local` - secrets locais
- `.env.production` - secrets produção
- `.env.remote` - secrets remote (se tiver valores reais)
- `.env.test` - secrets teste (se tiver valores reais)
- `.env.e2e.*` - secrets e2e
- `.env.staging` - secrets staging
- Qualquer `.env.*` com secrets reais

### Regra de Ouro:
**Se o arquivo contém uma chave/senha/token real, NÃO DEVE ser commitado.**

---

## CHECKLIST DE AÇÃO IMEDIATA

- [ ] Verificar histórico Git de `.env.local`
- [ ] Se commitado: rotacionar TODOS os secrets
- [ ] Remover `.env.local` do repositório
- [ ] Atualizar `.gitignore` com regras corretas
- [ ] Verificar se `.env.test`, `.env.remote`, `.env.e2e.network` foram commitados
- [ ] Limpar histórico Git se necessário (force push)
- [ ] Atualizar documentação de segurança
- [ ] Notificar equipe sobre rotação de secrets
- [ ] Configurar secrets em ambiente seguro (Vercel, 1Password, etc.)
- [ ] Validar que build/deploy funcionam com novos secrets

---

## PRÓXIMOS PASSOS

1. **IMEDIATO:** Verificar histórico Git
2. **URGENTE:** Rotacionar secrets se necessário
3. **IMPORTANTE:** Atualizar .gitignore
4. **NECESSÁRIO:** Documentar política de secrets
5. **RECOMENDADO:** Implementar pre-commit hook para detectar secrets

---

**Status:** AGUARDANDO AÇÃO DO USUÁRIO
**Prioridade:** P0 - CRÍTICA
**Responsável:** Equipe de Segurança / DevOps
