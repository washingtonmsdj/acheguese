# 🔧 Troubleshooting - Tela Preta no Vercel

## 🐛 Problema: Tela Preta/Vazia

**URLs afetadas**:
- https://acheguese-qx8q3jdbo-jogo-brasils-projects.vercel.app/
- https://acheguese.com.br/

---

## 🔍 Diagnóstico Rápido

### Passo 1: Verificar Console do Navegador

1. Abra o site: https://acheguese-qx8q3jdbo-jogo-brasils-projects.vercel.app/
2. Pressione **F12** (ou Ctrl+Shift+I)
3. Vá na aba **Console**
4. Procure por erros em vermelho

**Erros comuns**:
- ❌ `Failed to load module` → Problema no build
- ❌ `CORS error` → Problema de CORS
- ❌ `Cannot find module` → Falta dependência
- ❌ `Uncaught ReferenceError` → Variável não definida

### Passo 2: Verificar Network

1. Ainda no DevTools (F12)
2. Vá na aba **Network**
3. Recarregue a página (F5)
4. Procure por arquivos em vermelho (404 ou 500)

**Arquivos importantes**:
- ✅ `index.html` (deve ser 200)
- ✅ `main-[hash].js` (deve ser 200)
- ✅ `vendor-[hash].js` (deve ser 200)

### Passo 3: Verificar Logs do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto "acheguese"
3. Clique em **"Deployments"**
4. Clique no último deployment
5. Veja **"Build Logs"**

**Procure por**:
- ❌ `Error: Build failed`
- ❌ `Module not found`
- ❌ `Cannot resolve`
- ✅ `Build completed` (deve aparecer no final)

---

## 🎯 Soluções Mais Comuns

### Solução 1: Variáveis de Ambiente Faltando

**Problema**: Build funciona mas app não inicializa

**Sintomas**:
- Tela preta
- Console mostra erro de Supabase
- "Cannot read property of undefined"

**Solução**:

1. Vá em **Settings** → **Environment Variables**
2. Verifique se TEM TODAS:

```
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_PUBLISHABLE_KEY
✅ VITE_SUPABASE_PROJECT_ID
```

3. Se faltar alguma, adicione
4. Faça **Redeploy**:
   - Deployments → 3 pontinhos → Redeploy

---

### Solução 2: Build Command Errado

**Problema**: Build falha ou gera arquivos errados

**Sintomas**:
- Build logs mostram erro
- Pasta `dist` vazia ou incorreta

**Solução**:

1. Vá em **Settings** → **General**
2. Verifique:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

3. Se estiver diferente, corrija
4. Salve e faça Redeploy

---

### Solução 3: Arquivo index.html Não Encontrado

**Problema**: Vercel não encontra o index.html

**Sintomas**:
- 404 na página principal
- Tela branca

**Solução**:

Verifique se `vercel.json` tem o rewrite correto:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Se não tiver, crie o arquivo `vercel.json` na raiz com o conteúdo acima.

---

### Solução 4: Erro de Importação de Módulos

**Problema**: Módulos não são encontrados

**Sintomas**:
- Console: "Failed to load module"
- Build funciona mas app não carrega

**Solução**:

1. Verifique se `package.json` tem todas as dependências
2. No Vercel, force reinstalação:
   - Settings → General
   - Install Command: `npm ci` (ao invés de `npm install`)
3. Redeploy

---

### Solução 5: Problema com Base Path

**Problema**: Assets não carregam

**Sintomas**:
- CSS não carrega
- Imagens não aparecem
- JS não executa

**Solução**:

Adicione `base` no `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/', // Certifique-se que está assim
  // ... resto da config
})
```

---

## 🔬 Diagnóstico Avançado

### Verificar Build Localmente

```bash
# 1. Limpar cache
rm -rf node_modules dist .vite

# 2. Reinstalar dependências
npm install

# 3. Build local
npm run build

# 4. Testar build
npm run preview

# 5. Abrir no navegador
# http://localhost:8080
```

Se funcionar localmente mas não no Vercel:
- Problema é com variáveis de ambiente
- Ou configuração do Vercel

Se NÃO funcionar localmente:
- Problema é no código
- Verifique erros no console

---

## 📋 Checklist de Verificação

### No Vercel Dashboard

- [ ] Build completou com sucesso (sem erros)
- [ ] Output Directory está como `dist`
- [ ] Build Command está como `npm run build`
- [ ] Framework Preset está como `Vite`
- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Variáveis estão marcadas para Production

### No Navegador

- [ ] Abriu DevTools (F12)
- [ ] Verificou Console (erros em vermelho?)
- [ ] Verificou Network (arquivos 404?)
- [ ] Tentou em modo anônimo (Ctrl+Shift+N)
- [ ] Limpou cache (Ctrl+Shift+Delete)

### No Código

- [ ] `index.html` existe na raiz
- [ ] `src/main.tsx` existe
- [ ] `package.json` tem script `build`
- [ ] `vite.config.ts` está correto
- [ ] `vercel.json` tem rewrites

---

## 🆘 Solução Rápida (Tente Primeiro)

### 1. Adicione TODAS as Variáveis

No Vercel → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://xhdowzacfujckjelqhtd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[ROTATED_KEY_REMOVED]
VITE_SUPABASE_PROJECT_ID=xhdowzacfujckjelqhtd
ALLOWED_ORIGINS=https://acheguese-qx8q3jdbo-jogo-brasils-projects.vercel.app,https://acheguese.com.br
VITE_FEATURE_COMMUNITY_ALERTS=false
VITE_FEATURE_MAPS_V4=true
```

### 2. Force Redeploy

1. Deployments → Último deploy
2. 3 pontinhos → **Redeploy**
3. Marque: ✅ **Use existing Build Cache** (desmarque!)
4. Clique em **Redeploy**

### 3. Verifique Logs

Enquanto faz redeploy:
1. Acompanhe os logs em tempo real
2. Procure por erros
3. Anote qualquer mensagem de erro

---

## 📊 Comandos de Debug

### Ver Logs do Vercel (CLI)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Ver logs
vercel logs https://acheguese-qx8q3jdbo-jogo-brasils-projects.vercel.app
```

### Testar Build Localmente

```bash
# Build
npm run build

# Ver tamanho dos arquivos
ls -lh dist/

# Testar preview
npm run preview
```

---

## 🎯 Próximos Passos

### Se ainda não funcionar:

1. **Copie os logs de build do Vercel**
   - Deployments → Último deploy → Build Logs
   - Copie TUDO

2. **Copie erros do console do navegador**
   - F12 → Console
   - Clique com botão direito → Save as...

3. **Me envie**:
   - Logs de build
   - Erros do console
   - Screenshot da tela preta

---

## 📞 Informações Úteis

**URLs do Projeto**:
- Deploy: https://acheguese-qx8q3jdbo-jogo-brasils-projects.vercel.app/
- Domínio: https://acheguese.com.br/
- Dashboard: https://vercel.com/jogo-brasils-projects/acheguese

**Comandos Rápidos**:
```bash
# Ver status
vercel ls

# Ver logs
vercel logs

# Deploy manual
vercel --prod
```

---

## ✅ Teste Rápido

Abra o console do navegador (F12) e cole:

```javascript
// Verificar se variáveis estão definidas
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

// Se aparecer "undefined", falta configurar no Vercel!
```

---

**Última Atualização**: 2026-04-15  
**Status**: Aguardando diagnóstico
