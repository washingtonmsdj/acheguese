# 🔧 Troubleshooting - Comunicação Territorial

## ❌ Erro: "Cannot convert object to primitive value"

### Causa
Erro de lazy loading após migração da V2 para rota principal. Geralmente causado por cache do Vite.

### ✅ Solução Rápida

#### 1. Limpar Cache do Vite
```bash
# Parar o servidor (Ctrl+C)

# Limpar cache
rm -rf node_modules/.vite

# Ou no Windows PowerShell:
Remove-Item -Recurse -Force node_modules/.vite

# Reiniciar
npm run dev
```

#### 2. Limpar Cache do Navegador
```
1. Abrir DevTools (F12)
2. Clicar com botão direito no botão Reload
3. Selecionar "Empty Cache and Hard Reload"
```

#### 3. Reiniciar Servidor
```bash
# Parar servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

### 🔍 Verificações

#### Verificar Arquivo Principal
```tsx
// src/modules/communication-territorial/pages/CommunicationLandingPage.tsx

// Deve ter export default
export default function CommunicationLandingPage() {
  return (
    <>
      {/* conteúdo */}
    </>
  );
}
```

#### Verificar LazyImports
```tsx
// src/app/routes/lazyImports.ts

export const CommunicationLandingPage = lazy(() => 
  import("@/modules/communication-territorial/pages/CommunicationLandingPage")
    .then(module => ({ default: module.default }))
);
```

#### Verificar Index
```tsx
// src/modules/communication-territorial/index.ts

export { default as CommunicationLandingPage } from "./pages/CommunicationLandingPage";
```

### 🚀 Solução Definitiva

Se o problema persistir, execute:

```bash
# 1. Parar servidor
Ctrl+C

# 2. Limpar tudo
rm -rf node_modules/.vite
rm -rf dist
rm -rf .tmp

# 3. Reinstalar dependências (opcional)
npm install

# 4. Reiniciar
npm run dev

# 5. Limpar cache do navegador
# DevTools > Application > Clear Storage > Clear site data
```

### 📝 Checklist de Diagnóstico

- [ ] Servidor parado e reiniciado
- [ ] Cache do Vite limpo (`node_modules/.vite`)
- [ ] Cache do navegador limpo (Hard Reload)
- [ ] Arquivo tem `export default`
- [ ] LazyImport está correto
- [ ] Index.ts está correto
- [ ] Sem erros de TypeScript
- [ ] Rota está correta em AppRoutes.tsx

### 🔄 Alternativa: Import Direto (Temporário)

Se o problema persistir, você pode temporariamente usar import direto:

```tsx
// src/app/routes/lazyImports.ts

// Comentar o lazy import
// export const CommunicationLandingPage = lazy(() => ...);

// Usar import direto
import CommunicationLandingPageDirect from "@/modules/communication-territorial/pages/CommunicationLandingPage";
export const CommunicationLandingPage = CommunicationLandingPageDirect;
```

**Nota**: Isso remove o code splitting, mas garante que funcione.

### 🐛 Outros Erros Comuns

#### Erro: "Module not found"
```bash
# Verificar se o arquivo existe
ls src/modules/communication-territorial/pages/CommunicationLandingPage.tsx

# Se não existir, restaurar do backup
cp .archive/CommunicationLandingPageV2.backup.tsx src/modules/communication-territorial/pages/CommunicationLandingPage.tsx
```

#### Erro: "Cannot read property 'default'"
```tsx
// Verificar se o export está correto
// Deve ser: export default function
// NÃO: export function
```

#### Erro: "Unexpected token"
```bash
# Limpar cache e reinstalar
rm -rf node_modules/.vite
npm run dev
```

### 📊 Logs Úteis

#### Verificar Console
```javascript
// No console do navegador
console.log('CommunicationLandingPage:', CommunicationLandingPage);
```

#### Verificar Network
```
1. DevTools > Network
2. Filtrar por "CommunicationLandingPage"
3. Verificar se o arquivo carrega (200 OK)
```

### ✅ Teste Final

Após aplicar as soluções:

```bash
# 1. Acessar
http://localhost:5173/comunicacao

# 2. Verificar console (F12)
# Não deve ter erros vermelhos

# 3. Verificar página
# Deve carregar completamente
```

### 🆘 Se Nada Funcionar

#### Rollback Temporário

```bash
# Restaurar V1 temporariamente
cp .archive/CommunicationLandingPage.v1.backup.tsx src/modules/communication-territorial/pages/CommunicationLandingPage.tsx

# Reiniciar
npm run dev

# Testar se funciona
# Se funcionar, o problema é com a nova página
```

#### Verificar Dependências

```bash
# Verificar se todas as dependências estão instaladas
npm list react react-dom react-router-dom

# Se houver problemas
npm install
```

### 📞 Suporte

Se o problema persistir:

1. Verificar logs completos do console
2. Verificar logs do terminal
3. Verificar se há conflitos de versão
4. Verificar se o build funciona: `npm run build`

### 🎯 Solução Mais Provável

**90% dos casos**: Limpar cache do Vite resolve

```bash
rm -rf node_modules/.vite
npm run dev
```

**9% dos casos**: Hard reload no navegador resolve

```
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

**1% dos casos**: Reinstalar dependências

```bash
rm -rf node_modules
npm install
npm run dev
```

---

**Dica**: Sempre limpe o cache do Vite após mudanças significativas em rotas ou lazy imports!
