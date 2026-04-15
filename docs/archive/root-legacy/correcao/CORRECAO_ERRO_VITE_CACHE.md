# Correção: Erro de Cache do Vite

## 🔴 Erro Identificado

```
GET http://localhost:8080/node_modules/.vite/deps/react-hook-form.js?v=500e24bc 
net::ERR_ABORTED 504 (Outdated Optimize Dep)

Failed to fetch dynamically imported module: 
http://localhost:8080/src/app/pages/EmpresasLandingPage.tsx
```

## 🎯 Causa Raiz

O Vite mantém um cache de dependências otimizadas em `node_modules/.vite`. Quando fazemos mudanças significativas nos imports (como alteramos de lazy para direct import e vice-versa), o cache pode ficar desatualizado.

## ✅ Solução

### Opção 1: Limpar Cache e Reiniciar (RECOMENDADO)

Execute os seguintes comandos no terminal:

**Windows PowerShell:**
```powershell
# 1. Parar o servidor de desenvolvimento (Ctrl+C)

# 2. Limpar o cache do Vite
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# 3. Reiniciar o servidor
npm run dev
```

**Linux/Mac:**
```bash
# 1. Parar o servidor de desenvolvimento (Ctrl+C)

# 2. Limpar o cache do Vite
rm -rf node_modules/.vite

# 3. Reiniciar o servidor
npm run dev
```

### Opção 2: Forçar Re-otimização

Se a Opção 1 não funcionar, tente:

**Windows PowerShell:**
```powershell
# 1. Parar o servidor

# 2. Limpar cache completo
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# 3. Reinstalar dependências (opcional, só se necessário)
npm install

# 4. Reiniciar
npm run dev
```

**Linux/Mac:**
```bash
# 1. Parar o servidor

# 2. Limpar cache completo
rm -rf node_modules/.vite
rm -rf dist

# 3. Reinstalar dependências (opcional, só se necessário)
npm install

# 4. Reiniciar
npm run dev
```

### Opção 3: Hard Refresh no Navegador

Após reiniciar o servidor:

1. Abra o DevTools (F12)
2. Clique com botão direito no botão de reload
3. Selecione "Empty Cache and Hard Reload"

## 🔍 Por Que Isso Aconteceu?

Fizemos as seguintes mudanças que podem ter causado o problema:

1. **NeighborhoodMap.tsx**: 
   - Mantivemos lazy import do MapLibreMap
   - Mudamos import de `@/lib/utils` para `@/shared/utils/cn`
   - Adicionamos novos imports (useRobustGeolocation)

2. **MapLibreMap.tsx**:
   - Adicionamos novo useEffect para câmera dinâmica

3. **EmpresasLandingPage.tsx**:
   - Mudamos de lazy para direct import do NeighborhoodMap (na correção anterior)
   - Depois voltamos para lazy import

Essas mudanças podem confundir o cache do Vite, especialmente quando há lazy imports envolvidos.

## 🛡️ Prevenção Futura

### 1. Configurar Vite para Auto-Reload

Adicione ao `vite.config.ts`:

```typescript
export default defineConfig({
  // ... outras configs
  optimizeDeps: {
    force: true, // Força re-otimização sempre que necessário
  },
  server: {
    hmr: {
      overlay: true, // Mostra erros de HMR na tela
    },
  },
});
```

### 2. Script de Limpeza

Adicione ao `package.json`:

```json
{
  "scripts": {
    "clean": "rm -rf node_modules/.vite dist",
    "dev:clean": "npm run clean && npm run dev"
  }
}
```

Uso:
```bash
npm run dev:clean
```

## 📊 Status das Mudanças

### Arquivos Modificados (Funcionando)
- ✅ `src/modules/business/components/NeighborhoodMap.tsx`
- ✅ `src/core/maps/components/MapLibreMap.tsx`
- ✅ `src/shared/hooks/useRobustGeolocation.ts`

### Diagnósticos
- ✅ Sem erros de TypeScript
- ✅ Imports corretos
- ✅ Tipos corretos
- ⚠️ Cache do Vite desatualizado (precisa limpar)

## 🎯 Próximos Passos

1. **AGORA**: Limpar cache e reiniciar servidor
2. **DEPOIS**: Testar funcionalidades:
   - Busca de empresas
   - Botão de localização
   - Marcador de usuário
   - Indicador de precisão
   - Animação de câmera

## 💡 Dica

Se o erro persistir após limpar o cache, pode ser um problema de:
- **Porta ocupada**: Tente mudar a porta no vite.config.ts
- **Permissões**: Execute como administrador (Windows) ou com sudo (Linux/Mac)
- **Antivírus**: Pode estar bloqueando o Vite, adicione exceção

## 🔗 Referências

- [Vite Dependency Pre-Bundling](https://vitejs.dev/guide/dep-pre-bundling.html)
- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)
- [Troubleshooting Vite](https://vitejs.dev/guide/troubleshooting.html)
