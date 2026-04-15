# Correção SSOT Territorial - Pontos Turísticos

**Data:** 2026-04-05  
**Status:** ✅ Concluído

## Problema Identificado

O formulário de criação/edição de pontos turísticos permitia digitar texto arbitrário no campo "bairro" (ex: "sss"), quebrando o SSOT (Single Source of Truth) territorial do projeto.

### Comportamento Anterior (Incorreto)
- Campo de bairro era um `<Input>` de texto livre
- Usuário podia digitar qualquer string (ex: "sss", "xyz", "teste")
- Dados salvos como string solta na coluna `neighborhood`
- Não havia validação contra o catálogo territorial
- Quebrava a integridade referencial do SSOT

## Solução Implementada

### 1. Novo Componente: `TerritorialSelector`

Criado componente de seleção hierárquica que:
- Carrega estados da tabela `locations` (type='state')
- Carrega cidades em cascata quando estado selecionado (type='city')
- Carrega bairros em cascata quando cidade selecionada (type='district')
- Usa hook `useLocationCascade` que consulta o repositório canônico
- Retorna `location_id` (UUID) do bairro selecionado
- Impede entrada de texto livre

**Arquivo:** `src/shared/components/TerritorialSelector.tsx`

### 2. Atualização do Formulário

**Arquivo:** `src/modules/admin/pages/AdminPontosTuristicos.tsx`

Mudanças:
- Removido campo `<Input id="neighborhood">` de texto livre
- Adicionado `<TerritorialSelector>` no formulário
- Função `handleSubmit` agora recebe `locationData` com IDs e nomes
- Payload salva `location_id` (UUID) ao invés de `neighborhood` (string)
- Campos legados (`neighborhood`, `address_text`) explicitamente removidos do payload

### 3. Validação no Service

**Arquivo:** `src/core/tourist-points/services/TouristPointService.ts`

Validações adicionadas em `create()` e `update()`:

```typescript
// 1. location_id obrigatório
if (!input.location_id) {
  throw new Error('location_id é obrigatório. Use o seletor territorial.');
}

// 2. Rejeitar campos legados
if (input.neighborhood || input.address_text) {
  throw new Error('Campos legados não são mais aceitos. Use location_id.');
}

// 3. Validar que location_id existe e é um bairro ativo
const { data: locationExists } = await supabase
  .from('locations')
  .select('id')
  .eq('id', input.location_id)
  .eq('type', 'district')
  .eq('status', 'active')
  .single();

if (!locationExists) {
  throw new Error('location_id inválido: não existe ou não é um bairro ativo.');
}
```

### 4. Migração SQL

**Arquivo:** `supabase/migrations/20260405000005_enforce_tourist_points_ssot.sql`

Aplicada com sucesso usando:
```bash
npx supabase db query --linked -f supabase/migrations/20260405000005_enforce_tourist_points_ssot.sql
```

Mudanças no banco:
- ✅ Foreign key `tourist_points_location_id_fkey` → `locations(id)` com `ON DELETE RESTRICT`
- ✅ Índice `idx_tourist_points_location_id` para performance
- ✅ Comentários nas colunas documentando campos legados como `DEPRECATED`
- ⚠️ Coluna `location_id` ainda permite NULL (para compatibilidade com dados existentes)
  - Próximo passo: corrigir registros existentes e tornar NOT NULL

## Resultado

### Antes
```typescript
// Usuário digitava texto livre
<Input id="neighborhood" name="neighborhood" />

// Salvo como string solta
{ neighborhood: "sss" } // ❌ Qualquer texto aceito
```

### Depois
```typescript
// Usuário seleciona de catálogo hierárquico
<TerritorialSelector onLocationChange={(id, data) => ...} />

// Salvo como FK para locations
{ location_id: "uuid-do-bairro" } // ✅ Apenas IDs válidos do catálogo
```

## Validações Implementadas

### Camada de UI
- ✅ Seleção controlada (Select) ao invés de Input livre
- ✅ Cascata hierárquica: Estado → Cidade → Bairro
- ✅ Carregamento dinâmico da tabela `locations`

### Camada de Service
- ✅ Rejeita criação/edição sem `location_id`
- ✅ Rejeita campos legados (`neighborhood`, `address_text`)
- ✅ Valida que `location_id` existe na tabela `locations`
- ✅ Valida que `location_id` é um bairro (`type='district'`)
- ✅ Valida que bairro está ativo (`status='active'`)

### Camada de Banco
- ✅ Foreign key constraint garante integridade referencial
- ✅ Índice otimiza queries por `location_id`
- ✅ Documentação inline via COMMENT ON COLUMN

## Impacto

### Dados Existentes
- Registros antigos com `neighborhood` string ainda funcionam (campos legados mantidos)
- Novos registros DEVEM usar `location_id`
- Edição de registros antigos força migração para SSOT

### UI/UX
- Usuário agora vê lista de bairros reais do catálogo
- Impossível digitar texto arbitrário
- Experiência mais guiada e consistente

### Escalabilidade
- Adicionar nova cidade/bairro: apenas INSERT na tabela `locations`
- Zero código necessário para expandir catálogo territorial
- SSOT mantido em um único lugar

## Arquivos Modificados

1. `src/shared/components/TerritorialSelector.tsx` (novo)
2. `src/modules/admin/pages/AdminPontosTuristicos.tsx` (atualizado)
3. `src/core/tourist-points/services/TouristPointService.ts` (validações)
4. `supabase/migrations/20260405000005_enforce_tourist_points_ssot.sql` (novo)

## Próximos Passos (Opcional)

1. Migrar registros existentes: atualizar `location_id` para registros com `neighborhood` string
2. Tornar `location_id` NOT NULL após migração de dados
3. Remover colunas legadas (`neighborhood`, `address`, `latitude`, `longitude`) após período de transição
4. Implementar seleção de endereço estruturado via `address_id` (FK para tabela `addresses`)

## Verificação

Para testar a correção:
1. Abrir página de admin de pontos turísticos
2. Clicar em "Novo Ponto"
3. Verificar que campo de bairro agora é um seletor hierárquico
4. Tentar criar ponto sem selecionar bairro → erro de validação
5. Selecionar Estado → Cidade → Bairro → sucesso
6. Verificar no banco que `location_id` foi salvo corretamente

---

**Método de Migração Usado (SSOT):**
```bash
npx supabase db query --linked -f supabase/migrations/<arquivo>.sql
```

Sempre verificar estrutura real do banco antes de criar migrações usando:
```bash
npx supabase db query --linked -f temp_check.sql
```
