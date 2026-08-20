# Fixtures de Validação da Arquitetura de Maps

Esta pasta contém arquivos com **violações intencionais** da arquitetura de Maps. Eles existem para provar que a blindagem arquitetural realmente detecta imports proibidos.

## Importante

Estes arquivos **devem falhar quando executados pelo validador de Maps**. Eles não são código de produto e, por isso, ficam em `tests/architecture/fixtures/`, fora de `src`.

### `test-violation-direct-provider.ts`

Testa a detecção de importação direta de provider.

Violação esperada: `maps/no-direct-provider-import`.

### `test-violation-cross-layer.ts`

Testa a detecção de importação cross-layer (`modules` → `integrations/maps`).

Violação esperada: `maps/no-cross-layer-import`.

## Como validar

```bash
npm run validate:maps
```

O script:

1. valida o lint dos owners canônicos de Maps;
2. executa os testes do módulo;
3. executa estas fixtures com `eslint --no-ignore` e exige que as violações sejam detectadas com a mensagem de blindagem.

## Integração com ESLint

`tests/**/*.ts` já fica fora do lint normal do repositório. O validador arquitetural usa `--no-ignore` especificamente para estas fixtures, portanto mover os casos negativos para `tests/architecture/fixtures/` não enfraquece o gate.

## Manutenção

Ao adicionar uma nova regra de blindagem:

1. crie uma fixture negativa nesta pasta;
2. registre o arquivo em `scripts/validate-maps-architecture.mjs`;
3. documente aqui a violação esperada;
4. mantenha fixtures negativas fora de `src`.
