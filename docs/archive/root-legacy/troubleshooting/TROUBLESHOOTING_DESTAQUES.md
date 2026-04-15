# Troubleshooting - Destaques não Atualizando

## 🔍 Problema

As mudanças no código não estão aparecendo no navegador.

## ✅ Soluções

### 1. Limpar Cache do Navegador

#### Chrome/Edge
1. Abra DevTools (F12)
2. Clique com botão direito no ícone de reload
3. Selecione "Limpar cache e recarregar forçado" (Hard Reload)
4. Ou use: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)

#### Firefox
1. `Ctrl + Shift + Delete`
2. Selecione "Cache"
3. Clique em "Limpar agora"
4. Recarregue a página com `Ctrl + F5`

### 2. Reiniciar o Servidor de Desenvolvimento

```bash
# Parar o servidor (Ctrl + C)
# Depois iniciar novamente
npm run dev
# ou
yarn dev
```

### 3. Limpar Build e Cache do Vite

```bash
# Deletar pasta de cache
rm -rf node_modules/.vite

# Ou no Windows PowerShell
Remove-Item -Recurse -Force node_modules/.vite

# Reiniciar o servidor
npm run dev
```

### 4. Verificar se o Arquivo Foi Salvo

1. Verifique se há um ponto (•) no nome da aba do editor
2. Se houver, o arquivo não foi salvo
3. Salve com `Ctrl + S`

### 5. Verificar Console por Erros

1. Abra DevTools (F12)
2. Vá para a aba "Console"
3. Procure por erros em vermelho
4. Se houver erros, corrija-os primeiro

### 6. Verificar Network

1. Abra DevTools (F12)
2. Vá para a aba "Network"
3. Recarregue a página
4. Verifique se `ClassificadosLandingPage.tsx` está sendo carregado
5. Se estiver em cache (304), force reload

## 🎯 Verificação Rápida

Execute este checklist:

- [ ] Arquivo salvo (sem • na aba)
- [ ] Sem erros no console
- [ ] Cache limpo (Hard Reload)
- [ ] Servidor rodando
- [ ] URL correta: `/classificados-landing`
- [ ] Componente correto sendo renderizado

## 📝 Código Atual Correto

O componente `FeaturedCard` deve estar assim:

```typescript
function FeaturedCard({ ad, onClick, index }: { 
  ad: ClassificadoWithVendedor; 
  index?: number;
  onClick: () => void 
}) {
  return (
    <motion.button className="flex-shrink-0 w-52 bg-card border border-border rounded-2xl overflow-hidden ...">
      {/* Imagem */}
      <div className="relative h-32 overflow-hidden bg-secondary">
        <img src={ad.fotos[0]} className="w-full h-full object-cover ..." />
        <span className="absolute top-2 left-2 text-xl">⭐</span>
      </div>
      
      {/* Conteúdo ABAIXO da imagem */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-bold line-clamp-2">{ad.titulo}</p>
        <p className="text-xs text-muted-foreground">{ad.categoria}</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-primary">R$ {ad.preco}</span>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span className="text-xs">{ad.bairro}</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
```

## 🔧 Mudanças Aplicadas

1. ✅ Imagem: 128px de altura, limpa (sem gradiente)
2. ✅ Estrela: Apenas na imagem
3. ✅ Conteúdo: Separado em div com `p-3`
4. ✅ Título: 2 linhas, `text-sm`
5. ✅ Categoria: 1 linha, `text-xs`
6. ✅ Preço: `text-sm font-bold text-primary`
7. ✅ Bairro: Com ícone MapPin

## 🎨 Resultado Esperado

```
┌──────────────────────┐
│                      │
│   [Imagem Limpa]     │ ← 128px altura
│                      │
│   ⭐                 │
├──────────────────────┤
│ iPhone 14 Pro Max    │ ← Texto ABAIXO
│ 256GB - Seminovo     │
│ eletrônicos          │
│ R$ 4.500  📍 Pituba  │
└──────────────────────┘
```

## 🚨 Se Ainda Não Funcionar

1. Feche completamente o navegador
2. Pare o servidor de desenvolvimento
3. Delete `node_modules/.vite`
4. Reinicie o servidor
5. Abra o navegador em modo anônimo
6. Acesse `/classificados-landing`

## 📞 Informações para Debug

Se precisar de ajuda, forneça:
- [ ] Screenshot do console (F12 → Console)
- [ ] Screenshot da aba Network (F12 → Network)
- [ ] Versão do navegador
- [ ] Sistema operacional
- [ ] Comando usado para iniciar o servidor
- [ ] Mensagens de erro (se houver)

## ✅ Confirmação Visual

Quando funcionar, você deve ver:
- Cards com 208px de largura
- Imagem de 128px de altura no topo
- Estrela ⭐ no canto superior esquerdo DA IMAGEM
- Título, categoria e preço ABAIXO da imagem
- Ícone de pin 📍 antes do bairro
- Fundo branco/escuro (dependendo do tema)
