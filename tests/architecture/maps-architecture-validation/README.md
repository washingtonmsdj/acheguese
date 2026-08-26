# Testes de Validação de Arquitetura de Maps

Esta pasta contém arquivos com **violações intencionais** da arquitetura de maps, usados para validar que a blindagem arquitetural está funcionando corretamente.

## ⚠️ IMPORTANTE

Estes arquivos **devem falhar** no lint quando executados explicitamente pelo validator. Eles existem para garantir que:

1. O plugin ESLint customizado está detectando violações
2. As regras de blindagem estão ativas
3. A arquitetura está sendo protegida

## Arquivos de Teste

### `test-violation-direct-provider.ts`
Testa a detecção de importação direta de providers.

**Violação esperada**: `maps/no-direct-provider-import`

**Mensagem esperada**:
```text
❌ MAPS BLINDAGEM: Não importe '@/integrations/maps/providers/OSMTileProvider'
diretamente. Use providerRegistry de '@/core/maps'
```

### `test-violation-cross-layer.ts`
Testa a detecção de importação cross-layer (modules → integrations/maps).

**Violação esperada**: `maps/no-cross-layer-import`

**Mensagem esperada**:
```text
❌ MAPS BLINDAGEM: Modules não podem importar de integrations/maps.
Use '@/core/maps'
```

## Como Validar

Execute o script de validação completo:

```bash
npm run validate:maps
```

Este script:
1. Valida lint do módulo maps
2. Executa testes do módulo maps
3. Executa estes fixtures com `eslint --no-ignore` e confirma que as violações intencionais são detectadas

## Owner arquitetural

Estes arquivos pertencem a `tests/architecture/maps-architecture-validation/` porque são fixtures de validação arquitetural global, e não source de aplicação.

O lint normal já ignora `tests/**/*.ts`; o validator usa `--no-ignore` para executar explicitamente os fixtures de violação.

## Manutenção

Se adicionar novas regras de blindagem:

1. Crie um fixture de violação nesta pasta
2. Adicione a validação em `scripts/validate-maps-architecture.mjs`
3. Documente a violação esperada neste README
