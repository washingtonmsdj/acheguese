# Como usar o template de bounded context

Status: atual
Owner: tooling de arquitetura

Este template existe para criar novos domínios sem reintroduzir a arquitetura legada que a reorganização global está removendo.

## Regra principal

Um domínio novo é dividido em dois owners físicos:

- `src/core/[nome]`: contratos, regras de domínio, services e boundary de persistência.
- `src/modules/[nome]`: UI, hooks e composição de aplicação do produto.

`src/modules/[nome]` **não pode** importar `@/integrations/*`, Supabase ou tabelas diretamente.

## 1. Copiar o esqueleto

```bash
mkdir -p src/core/[nome] src/modules/[nome]
cp -r tools/templates/module-template/core/. src/core/[nome]/
cp -r tools/templates/module-template/module/. src/modules/[nome]/
```

## 2. Substituir placeholders

- `[Nome]`: PascalCase, por exemplo `Business`.
- `[nome]`: kebab/camel coerente com o diretório, por exemplo `business`.
- `[item]` / `[itens]`: nome de leitura para entidade/coleção.
- `[domínio]`: descrição humana do bounded context.

Não adicione `[tabela]` ou `user_id` ao template por padrão. Persistência, ownership e IDs dependem do domínio e devem seguir os contracts reais do projeto.

## 3. Definir contratos em core

Comece por `src/core/[nome]/types/[nome].types.ts` e pelo repository contract. O módulo deve consumir esses contratos pelo barrel de core, sem duplicar tipos.

## 4. Implementar persistência no owner correto

O template fornece apenas o **repository contract**. A implementação deve ficar no core e pode usar o adapter canônico necessário, por exemplo `@/integrations/supabase`, somente quando o domínio realmente precisar dele.

Antes de escrever persistência:

1. confirmar schema/migration real;
2. confirmar RLS/grants;
3. confirmar ownership/roles pelo SSOT existente;
4. evitar segundo writer/read model para a mesma entidade;
5. adicionar regression/architecture guard quando a boundary for crítica.

## 5. Implementar a camada de módulo

`src/modules/[nome]` recebe/consome a API de core. Hooks podem usar TanStack Query e estado de apresentação, mas não devem conhecer tabela, RPC de infraestrutura ou credenciais.

## 6. Wiring

A composição concreta do repository/service deve acontecer no owner de core ou na composition layer do app, conforme o domínio. Não crie um service paralelo dentro do módulo apenas para facilitar import.

## 7. Imports esperados

```ts
// UI / aplicação
import { use[Nome] } from "@/modules/[nome]";

// contratos ou services de domínio
import type { [Nome] } from "@/core/[nome]";
```

Evite deep imports públicos quando um barrel canônico existir.

## Checklist antes de considerar o novo domínio integrado

- [ ] `src/core/[nome]` é o único owner de contratos/regras/persistência.
- [ ] `src/modules/[nome]` contém somente UI/aplicação.
- [ ] zero import de `@/integrations/*` no módulo.
- [ ] zero acesso direto a Supabase no módulo.
- [ ] ownership/RLS foram verificados contra o banco real.
- [ ] não existe SSOT paralelo em `shared`, `features`, `services` genérico ou outro módulo.
- [ ] exports públicos têm barrels claros.
- [ ] architecture/regression tests protegem a boundary.
- [ ] typecheck/test/build só são marcados como PASS após execução real.

## Referências do repositório

- Plano permanente: `URGENTE_LEIA_PRIMEIRO_REORGANIZACAO_GLOBAL.md`
- Arquitetura: `docs/03-architecture/`
- Template: `tools/templates/module-template/`

Este template é um esqueleto arquitetural. Regras específicas de domínio devem ser derivadas do SSOT real, nunca inventadas pelo scaffolding.
