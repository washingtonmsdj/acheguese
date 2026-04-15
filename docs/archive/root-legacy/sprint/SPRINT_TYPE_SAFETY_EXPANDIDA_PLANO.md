# Sprint Type Safety Expandida — Plano

**Data:** 2026-04-06  
**Objetivo:** Reduzir ou eliminar @ts-nocheck nos 96 arquivos fora do escopo core

---

## Escopo

### Diretórios Alvo (96 arquivos)

**src/core/community/** (8 arquivos)
- communityBusinessLogic.ts
- types.ts
- CommunityService.ts
- CivicReportService.ts
- index.ts
- useCommunityProfile.ts
- useCommunityInteractions.ts
- useCommunityImageUpload.ts

**src/modules/community/** (52 arquivos)
- Páginas: 13 arquivos (RecomendacoesPage, EventosPage, ComunidadePage, etc.)
- Hooks: 35 arquivos (usePostActions, useGroups, useEventos, etc.)
- Services: 2 arquivos (CommunityRolloutService, CommunityLocationService)
- Types: 2 arquivos (types/index.ts, services/index.ts)

**src/shared/types/** (28 arquivos)
- Tipos compartilhados globais (community.ts, feed.ts, notification.ts, etc.)
- Tipos gerados (queries.generated.ts, core.generated.ts, etc.)
- Constantes (constants.ts, global.constants.ts, etc.)

**src/shared/validation/** (8 arquivos)
- Schemas não auditados: user.schema.ts, review.schema.ts, profile.schema.ts
- Validators: custom.validators.ts
- Messages: pt-BR.ts
- Helpers: error-handler.ts
- Index: index.ts, schemas/index.ts

---

## Estratégia

### Fase 1: Mapeamento (não executar código)
1. Listar todos os 96 arquivos com @ts-nocheck
2. Categorizar por tipo (service, hook, page, type, schema)
3. Identificar dependências entre arquivos
4. Mapear ocorrências de `as any` e justificar cada uma

### Fase 2: Correção Incremental
1. Começar por arquivos sem dependências (types, schemas)
2. Remover @ts-nocheck um por um
3. Corrigir erros TypeScript revelados
4. Executar diagnostics após cada correção
5. Se houver bloqueio estrutural, documentar e pular

### Fase 3: Validação
1. Executar diagnostics em todos os arquivos corrigidos
2. Executar testes relacionados (se existirem)
3. Grep final para confirmar remoções
4. Documentar bloqueios estruturais não resolvidos

---

## Regras

### Não Fazer
- ❌ Reabrir arquitetura
- ❌ Mexer em banco de dados
- ❌ Criar novas abstrações
- ❌ Refatorar lógica de negócio
- ❌ Alterar comportamento funcional

### Fazer
- ✅ Remover @ts-nocheck quando possível
- ✅ Adicionar tipos explícitos
- ✅ Corrigir imports quebrados
- ✅ Documentar `as any` aceitáveis (Supabase, etc.)
- ✅ Listar bloqueios estruturais reais

---

## Critérios de Aceite

### Por Arquivo Corrigido
- @ts-nocheck removido
- Zero erros de diagnóstico TypeScript
- Comportamento funcional mantido
- Testes relacionados passando (se existirem)

### Relatório Final
1. **Arquivos corrigidos:** lista completa com diffs
2. **Grep real:** prova de remoção de @ts-nocheck
3. **Diagnostics reais:** zero erros nos arquivos corrigidos
4. **Testes reais:** output de testes relacionados
5. **Bloqueios estruturais:** lista de arquivos não corrigidos com justificativa

### Formato do Bloqueio
```
Arquivo: src/path/to/file.ts
Bloqueio: Descrição objetiva do problema estrutural
Correção mínima: O que seria necessário para resolver
```

---

## Entrega

### Documento Final: EVIDENCIA_TYPE_SAFETY_EXPANDIDA.md

**Estrutura:**
1. Arquivos corrigidos (lista + total)
2. Grep real (output completo)
3. Diagnostics reais (output completo)
4. Testes reais (output completo, se aplicável)
5. Bloqueios estruturais (lista completa)
6. Conclusão honesta (proporcional à evidência)

**Wording:**
- Usar números reais provados
- Não usar "100% type-safe" se não for provado
- Não usar "eixo completo" se houver arquivos não corrigidos
- Exemplo: "X de 96 arquivos corrigidos, Y bloqueios estruturais documentados"

---

## Próximos Passos

1. Confirmar aprovação do plano
2. Executar Fase 1: Mapeamento
3. Executar Fase 2: Correção Incremental
4. Executar Fase 3: Validação
5. Entregar relatório final

---

**Status:** Aguardando aprovação para iniciar
