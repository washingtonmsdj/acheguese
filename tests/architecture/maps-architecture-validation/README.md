# Testes de Validação de Arquitetura de Maps

Esta pasta contém arquivos com **violações intencionais** da arquitetura de maps, usados para validar que a blindagem arquitetural está funcionando corretamente.

## ⚠️ IMPORTANTE

Estes arquivos **devem falhar** no lint quando executados explicitamente pelo validator. Eles existem para garantir que:

1. O plugin ESLint customizado está detectando violações.
2. As regras de blindagem estão ativas.
3. A arquitetura está sendo protegida.
4. O harness comprova a **regra exata** que rejeitou cada violação, em vez de depender de texto de mensagem.

Os fixtures permanecem em `tests/architecture/` e o lint normal continua ignorando `tests/**/*.ts`. Para testar regras que dependem da camada do arquivo consumidor, o validator envia o conteúdo ao ESLint por `--stdin` e fornece um **filename virtual dentro de `src`**. Assim exercitamos a configuração real de produção sem manter código propositalmente inválido na árvore de source.

## Arquivos de Teste

### `test-violation-direct-provider.ts`

Testa a detecção de importação direta de providers.

- filename virtual: `src/core/maps/__architecture_validation__/test-violation-direct-provider.ts`
- regra esperada: `maps/no-direct-provider-import`

### `test-violation-cross-layer.ts`

Testa a detecção de importação `modules → integrations/maps`.

- filename virtual: `src/modules/__architecture_validation__/test-violation-cross-layer.ts`
- regra esperada: `maps/no-cross-layer-import`

O mesmo import também pode violar outras regras genéricas de fronteira. O contrato deste fixture exige especificamente que `maps/no-cross-layer-import` esteja presente no relatório ESLint.

## Como Validar

Execute o script de validação completo:

```bash
npm run validate:maps
```

Este script:

1. valida o lint do módulo maps;
2. executa os testes do módulo maps;
3. executa os fixtures negativos com a configuração ESLint canônica;
4. exige exit não-zero para cada fixture;
5. lê o relatório JSON do ESLint e confirma o `ruleId` exato esperado.

## Owner arquitetural

Estes arquivos pertencem a `tests/architecture/maps-architecture-validation/` porque são fixtures de validação arquitetural global, e não source de aplicação.

Nenhuma regra de produção é relaxada para acomodar os fixtures. O validator apenas fornece o contexto de filename necessário para exercitar as mesmas regras aplicadas a `src`.

## Manutenção

Se adicionar novas regras de blindagem:

1. crie um fixture de violação nesta pasta;
2. defina no validator o filename virtual que represente a camada a ser testada;
3. declare o `ruleId` esperado;
4. documente o contrato neste README.
