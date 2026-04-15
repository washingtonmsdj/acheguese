# Testes de Validação de Arquitetura de Maps

Esta pasta contém arquivos com **violações intencionais** da arquitetura de maps, usados para validar que a blindagem arquitetural está funcionando corretamente.

## ⚠️ IMPORTANTE

Estes arquivos **devem falhar** no lint. Eles existem para garantir que:

1. O plugin ESLint customizado está detectando violações
2. As regras de blindagem estão ativas
3. A arquitetura está sendo protegida

## Arquivos de Teste

### `test-violation-direct-provider.ts`
Testa a detecção de importação direta de providers.

**Violação esperada**: `maps/no-direct-provider-import`

**Mensagem esperada**: 
```
❌ MAPS BLINDAGEM: Não importe '@/integrations/maps/providers/OSMTileProvider' 
diretamente. Use providerRegistry de '@/core/maps'
```

### `test-violation-cross-layer.ts`
Testa a detecção de importação cross-layer (modules → integrations/maps).

**Violação esperada**: `maps/no-cross-layer-import`

**Mensagem esperada**:
```
❌ MAPS BLINDAGEM: Modules não podem importar de integrations/maps. 
Use '@/core/maps'
```

## Como Validar

Execute o script de validação completo:

```bash
npm run validate:maps
```

Este script:
1. Valida lint do módulo maps (deve passar)
2. Executa testes do módulo maps (deve passar)
3. Valida que violações intencionais são detectadas (deve falhar corretamente)

## Configuração

Estes arquivos são **ignorados** no lint normal via `eslint.config.js`:

```javascript
ignores: [
  // ...
  "src/__tests__/maps-architecture-validation/**/*.ts",
]
```

Isso evita poluir o lint geral do repositório com violações intencionais.

## Manutenção

Se adicionar novas regras de blindagem:

1. Crie um arquivo de teste de violação aqui
2. Adicione validação no script `validate-maps-architecture.mjs`
3. Documente a violação esperada neste README
