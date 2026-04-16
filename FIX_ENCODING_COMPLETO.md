# 🔧 Fix: Problemas de Encoding UTF-8

## 🎯 Problema Identificado

Vários arquivos do projeto estão com encoding incorreto, mostrando caracteres como:
- `Ã³` ao invés de `ó`
- `Ã§` ao invés de `ç`
- `Ã£` ao invés de `ã`
- `Ã¡` ao invés de `á`
- `Ã©` ao invés de `é`
- `Ãª` ao invés de `ê`

### Exemplo Visível
Na página de passageiro, as tabs aparecem como:
- ❌ "AtivasHistÃ³ricoSOS"
- ✅ "Ativas Histórico SOS"

## ✅ Correção Aplicada

**Arquivo:** `src/modules/mobility/pages/PassageiroPage.tsx`

```typescript
// ❌ ANTES
{ id: "historico", label: "HistÃ³rico", icon: History },

// ✅ DEPOIS
{ id: "historico", label: "Histórico", icon: History },
```

## 📋 Outros Arquivos Afetados

Encontrei problemas de encoding em:

1. **`src/modules/services/hooks/useProfessionalCreateMultiProfile.ts`**
   - "TerritÃ³rio ativo Ã© obrigatÃ³rio"
   - "Slug profissional invÃ¡lido"
   - "nÃ£o estÃ¡ disponÃ­vel"

2. **`src/modules/profile/pages/PerfilEditarPage.tsx`**
   - "RazÃ£o social"
   - "EndereÃ§o comercial"
   - "HabilitaÃ§Ã£o"
   - "InformaÃ§Ãµes bÃ¡sicas"
   - E muitos outros...

## 🔍 Causa Raiz

O problema ocorre quando:
1. Arquivo é salvo com encoding errado (não UTF-8)
2. Editor de texto não está configurado para UTF-8
3. Copiar/colar de fontes com encoding diferente

## 🛠️ Como Corrigir Manualmente

### Opção 1: VS Code (Recomendado)

1. Abra o arquivo com problema
2. Clique no encoding no canto inferior direito (geralmente mostra "UTF-8")
3. Selecione "Reopen with Encoding"
4. Escolha "Western (Windows 1252)" ou "ISO 8859-1"
5. O texto deve aparecer correto
6. Clique novamente no encoding
7. Selecione "Save with Encoding" → "UTF-8"

### Opção 2: Buscar e Substituir

Use o Find & Replace do VS Code:

```
Buscar: Ã³  →  Substituir: ó
Buscar: Ã§  →  Substituir: ç
Buscar: Ã£  →  Substituir: ã
Buscar: Ã¡  →  Substituir: á
Buscar: Ã©  →  Substituir: é
Buscar: Ãª  →  Substituir: ê
Buscar: Ã­  →  Substituir: í
Buscar: Ãº  →  Substituir: ú
Buscar: Ã   →  Substituir: à
Buscar: Ã´  →  Substituir: ô
Buscar: Ãµ  →  Substituir: õ
```

## 🎯 Prioridade de Correção

### Alta Prioridade (UI visível ao usuário)
- ✅ `src/modules/mobility/pages/PassageiroPage.tsx` - **CORRIGIDO**
- ⚠️ `src/modules/profile/pages/PerfilEditarPage.tsx` - Labels de formulário
- ⚠️ `src/modules/services/hooks/useProfessionalCreateMultiProfile.ts` - Mensagens de erro

### Média Prioridade (Mensagens de erro)
- Outros arquivos com mensagens de erro

### Baixa Prioridade (Comentários e docs)
- Comentários em código
- Documentação interna

## 🚀 Prevenção

### Configurar VS Code

Adicione ao `.vscode/settings.json`:

```json
{
  "files.encoding": "utf8",
  "files.autoGuessEncoding": false,
  "[typescript]": {
    "files.encoding": "utf8"
  },
  "[typescriptreact]": {
    "files.encoding": "utf8"
  }
}
```

### Configurar EditorConfig

Adicione ao `.editorconfig`:

```ini
[*]
charset = utf-8
```

### Git Attributes

Adicione ao `.gitattributes`:

```
*.ts text eol=lf encoding=utf-8
*.tsx text eol=lf encoding=utf-8
*.js text eol=lf encoding=utf-8
*.jsx text eol=lf encoding=utf-8
*.json text eol=lf encoding=utf-8
```

## 📝 Checklist de Validação

- [x] PassageiroPage.tsx corrigido
- [ ] PerfilEditarPage.tsx precisa correção
- [ ] useProfessionalCreateMultiProfile.ts precisa correção
- [ ] Configurar VS Code para UTF-8
- [ ] Adicionar .editorconfig
- [ ] Adicionar .gitattributes

## 🎯 Teste Agora

1. **Recarregue a aplicação** (Ctrl+F5)
2. **Vá para a página de passageiro**
3. **Verifique as tabs:**
   - ✅ Deve mostrar "Histórico" (não "HistÃ³rico")
   - ✅ Deve mostrar "SOS" corretamente

## 💡 Nota Importante

Este é um problema de **encoding de arquivo**, não de código. A correção é simples mas precisa ser feita arquivo por arquivo, ou usando um script de conversão em massa.

## 🔧 Script de Correção em Massa (Opcional)

Se quiser corrigir todos os arquivos de uma vez, pode usar este comando no terminal:

```bash
# Linux/Mac
find src -name "*.ts" -o -name "*.tsx" | xargs -I {} sh -c 'iconv -f ISO-8859-1 -t UTF-8 {} > {}.tmp && mv {}.tmp {}'

# Windows (PowerShell)
Get-ChildItem -Path src -Include *.ts,*.tsx -Recurse | ForEach-Object {
  $content = Get-Content $_.FullName -Encoding Latin1
  Set-Content $_.FullName -Value $content -Encoding UTF8
}
```

**⚠️ ATENÇÃO:** Faça backup antes de executar scripts de conversão em massa!

## 📚 Referências

- [VS Code Encoding](https://code.visualstudio.com/docs/editor/codebasics#_file-encoding-support)
- [EditorConfig](https://editorconfig.org/)
- [Git Attributes](https://git-scm.com/docs/gitattributes)
