# Testes — Achegue-se

Este diretório contém suites transversais que não pertencem naturalmente a um único arquivo de implementação.

## Estrutura canônica

- `tests/architecture/` — invariantes de arquitetura, ownership, SSOT e boundaries.
- `tests/architecture/fixtures/` — fixtures usadas por gates arquiteturais, inclusive casos propositalmente inválidos.
- `tests/security/` — regressões de autorização, exposição e contratos de segurança.
- `tests/e2e/` — fluxos Playwright de produto e release.
- `tests/scripts/` — testes dos scripts/gates de engenharia.
- `tests/fixtures/` e helpers — fixtures compartilhadas quando realmente necessárias.
- arquivos `tests/*.test.ts[x]` — somente regressões transversais ainda não classificadas; novos testes devem preferir uma categoria explícita.

## Testes co-localizados

Testes unitários de uma implementação específica podem permanecer ao lado do owner em `src/**`, usando `*.test.*`, `*.spec.*` ou `__tests__/` local ao domínio.

`src/test/setup.ts` **não é uma suite**: é o setup global carregado por `vitest.config.ts`.

Não existe mais um `src/__tests__/` top-level. Fixtures transversais de arquitetura pertencem a `tests/architecture/fixtures/`; testes realmente unitários devem ser co-localizados com seu owner.

## E2E

O owner principal dos fluxos end-to-end é `tests/e2e/`.

O diretório raiz `e2e/` é uma exceção legada atualmente usada pelo fluxo específico `test:e2e:network`. Nenhum novo teste de produto deve ser criado ali; a exceção deve ser removida quando a configuração de network for consolidada.

## Regras

1. Teste deve provar um contrato real, não apenas ausência de crash.
2. Placeholder, feature pausada, fallback de erro ou `test.skip` por falta de fixture não podem ser tratados como certificação funcional de release.
3. Invariantes de SSOT/ownership pertencem a `tests/architecture`.
4. Autorização negativa e exposição pertencem a `tests/security`.
5. Fluxos de usuário e rotas pertencem a `tests/e2e`.
6. Fixtures propositalmente inválidas usadas por gates devem ficar fora de `src`.
7. Não criar novas categorias de topo sem atualizar este contrato e os gates correspondentes.
8. Números de cobertura e contagem de testes não são documentados manualmente aqui; métricas devem vir do runner/CI para não envelhecerem silenciosamente.

## Comandos principais

```bash
npm run test
npm run typecheck
npm run lint
npm run validate:ssot
npm run audit:architecture
npm run validate:taxonomy
npm run test:e2e:operations
```

A lista completa e executável de suites permanece em `package.json`; este documento define ownership e organização, não duplica o catálogo de scripts.
