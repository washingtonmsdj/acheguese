# Bounded context [Nome]

Este template representa a arquitetura física atual do Achegue-se.

## Owners

```text
src/core/[nome]/
  index.ts
  types/
  repositories/
  services/

src/modules/[nome]/
  index.ts
  hooks/
  components/        # opcional
  pages/             # opcional
```

### `core/[nome]`

Owner de contratos, regras de negócio, autorização de domínio, leitura/escrita e boundary de persistência.

Pode depender de adapters de `integrations` quando necessário. Essa dependência deve permanecer encapsulada em core.

### `modules/[nome]`

Owner de UI e aplicação. Pode consumir `@/core/[nome]`, `@/shared/*` e APIs de composição permitidas.

Não pode acessar Supabase, tabelas, RPCs de infraestrutura ou `@/integrations/*` diretamente.

## SSOT

- contratos do domínio: `src/core/[nome]/types`;
- repository contract: `src/core/[nome]/repositories`;
- services/regras: `src/core/[nome]/services`;
- hooks/UI: `src/modules/[nome]`;
- um segundo writer/read model para a mesma responsabilidade é proibido.

## Segurança

O template não presume `user_id`, roles ou policy. Antes de persistir dados, use os contracts de identidade/profile existentes e confirme RLS/grants no banco real.

## Uso

O hook de módulo recebe o service do bounded context como dependência. A composition layer pode expor uma instância canônica depois que o repository real estiver implementado.

```ts
import { use[Nome] } from "@/modules/[nome]";
import { create[Nome]Service } from "@/core/[nome]";

const service = create[Nome]Service(repository);
const query = use[Nome]({ service });
```

## Definition of done estrutural

- zero infraestrutura direta em `src/modules/[nome]`;
- contracts únicos em core;
- persistence boundary explícita;
- barrel público de core e module;
- architecture/regression guard;
- schema/RLS verificados quando houver persistência;
- nenhuma alegação de build/test/E2E sem execução real.
