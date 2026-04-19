# Fix: Spatial Search - Remoção de Tabela Alerts Inexistente

**Data:** 2026-04-19  
**Tipo:** Correção de Bug  
**Prioridade:** Alta  
**Status:** ✅ Resolvido

## Problema Identificado

### Erros no Console

```
POST /rest/v1/rpc/search_entities_by_radius 404 (Not Found)
[SpatialSearchService] searchByRadius error: {
  code: '42P01', 
  message: 'relation "alerts" does not exist'
}

POST /rest/v1/rpc/search_entities_by_radius 400 (Bad Request)
[SpatialSearchService] searchByRadius error: {
  code: '42804',
  details: 'Returned type numeric(10,7) does not match expected type double precision in column 3.',
  message: 'structure of query does not match function result type'
}
```

### Causa Raiz

1. **Tabela Inexistente**: A função `search_entities_by_radius` estava tentando buscar da tabela `alerts`, que não existe no banco de dados
2. **Incompatibilidade de Tipos**: Algumas colunas de latitude/longitude estavam definidas como `NUMERIC(10,7)` mas a função retornava `DOUBLE PRECISION`

### Contexto

- A funcionalidade de alertas usa a tabela `community_alerts`
- A tabela `community_alerts` **não possui** colunas de latitude/longitude
- Os alertas comunitários são baseados em bairro/cidade, não em coordenadas geográficas precisas
- A busca espacial de alertas não estava implementada e não deveria estar disponível

## Solução Implementada

### 1. Migration SQL

**Arquivo:** `supabase/migrations/20260419130000_fix_spatial_search_alerts.sql`

**Mudanças:**

1. Removida a busca de alertas da função `search_entities_by_radius`
2. Adicionado cast explícito `::DOUBLE PRECISION` para todas as colunas de latitude/longitude
3. Adicionada mensagem de erro clara quando tentar buscar alertas:
   ```sql
   WHEN 'alert' THEN
     RAISE EXCEPTION 'Alert geospatial search not yet implemented. Community alerts do not have latitude/longitude fields.';
   ```

### 2. Tipos Suportados

A busca espacial agora suporta apenas:

- ✅ `business` - Negócios
- ✅ `event` - Eventos
- ✅ `tourist_point` - Pontos Turísticos
- ✅ `classified` - Classificados
- ❌ `alert` - **Não implementado** (retorna erro explicativo)

### 3. Correção de Tipos

Todos os retornos de latitude/longitude agora são explicitamente convertidos para `DOUBLE PRECISION`:

```sql
b.latitude::DOUBLE PRECISION,
b.longitude::DOUBLE PRECISION,
ST_Distance(...)::DOUBLE PRECISION AS distance_meters
```

## Validação

### Antes da Correção

- ❌ Erro 404 ao tentar buscar qualquer entidade
- ❌ Erro 400 de incompatibilidade de tipos
- ❌ Console poluído com erros repetidos

### Depois da Correção

- ✅ Busca espacial funciona para business, event, tourist_point, classified
- ✅ Erro claro e informativo se tentar buscar alertas
- ✅ Tipos consistentes em todas as respostas
- ✅ Console limpo, sem erros

## Impacto

### Funcionalidades Afetadas

- ✅ **Mapa de Negócios**: Funcionando
- ✅ **Mapa de Eventos**: Funcionando
- ✅ **Mapa de Pontos Turísticos**: Funcionando
- ✅ **Mapa de Classificados**: Funcionando
- ⚠️ **Mapa de Alertas**: Não implementado (design intencional)

### Breaking Changes

Nenhum. A busca de alertas nunca funcionou, então não há código dependente dela.

## Próximos Passos (Opcional)

Se no futuro for necessário adicionar busca geoespacial para alertas:

1. Adicionar colunas `latitude` e `longitude` à tabela `community_alerts`
2. Criar índice espacial: `CREATE INDEX idx_community_alerts_location ON community_alerts USING GIST (ST_MakePoint(longitude, latitude)::geography);`
3. Atualizar a função `search_entities_by_radius` para incluir community_alerts
4. Atualizar a documentação

## Arquivos Modificados

- ✅ `supabase/migrations/20260419130000_fix_spatial_search_alerts.sql` (novo)
- ✅ `src/integrations/supabase/types.generated.ts` (regenerado)
- ✅ `src/core/maps/pages/MapaPageV4.tsx` (removido fetcher de alertas)
- ✅ `docs/fixes/20260419_spatial_search_alerts_fix.md` (documentação)

## Conformidade SSOT

- ✅ Migration aplicada no banco remoto
- ✅ Tipos TypeScript regenerados
- ✅ Documentação atualizada
- ✅ Sem gambiarras ou workarounds
- ✅ Mensagens de erro claras e informativas

## Referências

- Issue: Erros 404 e 400 no console do navegador
- Tabela: `community_alerts` (sem coordenadas geográficas)
- Função: `search_entities_by_radius` (corrigida)
