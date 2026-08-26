# Testes

Este diretório reúne as suítes de teste não co-localizadas do Achegue-se.

A organização é por **responsabilidade**, não por fase histórica de implementação. Testes unitários que pertencem diretamente a um módulo/service podem continuar co-localizados em `src/**`.

## Estrutura canônica

```text
tests/
├── architecture/   # boundaries, SSOT, ownership e ratchets estruturais
├── e2e/            # Playwright e contratos end-to-end versionados
├── fixtures/       # fixtures reutilizáveis
├── helpers/        # helpers compartilhados entre suítes
├── integration/    # banco, Supabase e integração entre componentes/services
├── operational/    # gates e verificações operacionais
├── regression/     # regressões funcionais/estruturais já corrigidas
├── scripts/        # testes de scripts e tooling
├── security/       # autorização, LGPD, secrets e hardening
├── setup.ts        # setup global do Vitest
└── README.md
```

## Regra para a raiz de `tests/`

Novos arquivos `*.test.*` ou `*.spec.*` **não devem ser criados diretamente em `tests/`**.

O guard `tests/architecture/test-root-layout-ratchet.test.ts` bloqueia novas implementações na raiz. Os poucos arquivos ainda tolerados ali são dívida histórica explícita e devem apenas diminuir.

Legados atualmente tolerados:

- `mobility-integration.test.ts` — vários imports relativos; requer normalização coordenada antes do move.
- `posts-community-posts-ssot.test.ts` — citado pelo plano Community First ativo.
- `public-search-route-regression.test.ts` — possui documentação/contrato de status associado.
- `public-shell-admin-boundary-regression.test.ts` — possui documentação ativa associada.
- `public-territorial-copy-regression.test.ts` — path consumido por comando versionado.
- `regression-tourist-points.test.ts` — preservado até um move byte-safe do arquivo completo.

Nenhum desses arquivos deve servir como precedente para novos testes na raiz.

## Convenções

- `architecture/`: prova regras de dependência, ownership, SSOT e ausência de superfícies legadas.
- `integration/`: pode depender de serviços, banco ou ambiente integrado; deve deixar a dependência explícita.
- `regression/`: protege comportamento que já quebrou ou uma dívida que já foi corrigida.
- `security/`: protege autorização, identidade, RLS/RPC, exposição de secrets, LGPD e segurança operacional.
- `e2e/`: fluxos end-to-end; fixtures mutáveis devem ser identificáveis como fixtures técnicas e nunca depender implicitamente de dados reais de produção.

Prefira imports por alias `@/` para código em `src/`. Imports relativos que dependem da profundidade física do teste dificultam reorganização e devem ser removidos progressivamente.

## Execução

A autoridade dos comandos é o `package.json`. Para a suíte Vitest geral:

```bash
npm run test
```

Para um arquivo ou diretório específico:

```bash
npx vitest run tests/architecture/
npx vitest run tests/security/
npx vitest run caminho/do/teste.test.ts
```

Playwright e gates especializados devem ser executados pelos scripts versionados do `package.json`, sem inventar comandos paralelos.

## Critério de organização

Um move de teste só é considerado concluído quando:

1. o arquivo está no diretório owner correto;
2. imports relativos quebráveis foram normalizados quando necessário;
3. scripts/docs que usam path literal foram atualizados no mesmo corte;
4. o path antigo foi removido;
5. nenhum segundo SSOT ou wrapper desnecessário ficou para trás.

> Estado estrutural atualizado em 2026-08-26. Este documento descreve organização; não certifica que CI, E2E, banco ou deploy passaram para o SHA atual.
