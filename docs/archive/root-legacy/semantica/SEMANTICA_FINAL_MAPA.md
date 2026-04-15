# SEMÂNTICA FINAL DO MAPA CENTRAL

**Data**: 04/04/2026  
**Versão**: 1.0  
**Status**: ✅ CONSOLIDADO

---

## 🎯 VISÃO GERAL

O mapa central (`/mapa`) possui dois modos de operação distintos:

1. **Modo Normal**: Busca por viewport (área visível)
2. **Modo Raio**: Busca por distância (raio do usuário)

---

## 📍 MODO NORMAL

### Descrição

Mostra entidades dentro da área visível do mapa (viewport).

### Comportamento

- ✅ Atualiza ao mover/dar zoom no mapa
- ✅ Respeita filtros de camadas (layer control)
- ✅ Mostra todos os tipos disponíveis
- ✅ Não depende de localização do usuário

### Tipos Suportados

| Tipo | Status | Emoji | Fetcher |
|------|--------|-------|---------|
| Empresas | ✅ Ativo | 🏢 | `makeBusinessFetcher` |
| Eventos | ✅ Ativo | 📅 | `makeEventFetcher` |
| Alertas | ✅ Ativo | ⚠️ | `makeAlertFetcher` |
| Serviços | ❌ Desabilitado | - | Não implementado |

### Filtros de Camada

Usuário pode mostrar/ocultar tipos individualmente:

```
☑️ Empresas
☑️ Eventos
☐ Alertas  (oculto)
```

**Resultado**: Mapa mostra apenas empresas e eventos.

### Estados

#### Estado 1: Loading Inicial
- Mapa mostra bounds de Salvador
- Indicador de loading (⏳) no canto superior direito
- Aguarda primeiro fetch

#### Estado 2: Carregado
- Marcadores aparecem no mapa
- Atualiza ao mover/dar zoom
- Indicador de loading desaparece

#### Estado 3: Erro
- Marcadores não aparecem
- Console mostra erro
- Usuário pode recarregar página

---

## 📍 MODO RAIO

### Descrição

Mostra entidades dentro de um raio específico da localização do usuário.

### Comportamento

- ✅ Busca por distância (raio em km)
- ✅ Depende de localização do usuário
- ✅ NÃO atualiza ao mover/dar zoom
- ❌ IGNORA filtros de camadas (sempre mostra todos os tipos)

### Ativação

1. Usuário permite localização
2. Usuário arrasta slider de raio (1-50 km)
3. Modo raio é ativado automaticamente

### Desativação

1. Usuário clica em "Desativar filtro"
2. Modo raio é desativado
3. Volta para modo normal (viewport)

### Tipos Suportados

| Tipo | Status | Emoji | RPC |
|------|--------|-------|-----|
| Empresas | ✅ Ativo | 🏢 | `search_entities_by_radius` |
| Eventos | ✅ Ativo | 📅 | `search_entities_by_radius` |
| Alertas | ✅ Ativo | ⚠️ | `search_entities_by_radius` |
| Serviços | ❌ Não suportado | - | Sem coluna `point` |

### Indicadores Visuais

#### Badge "Ativo"
```
🔵 Ativo  (ponto pulsante azul)
```

#### Aviso de Tipos
```
📍 Mostrando empresas, eventos e alertas em 5 km
```

#### Botão de Desativar
```
[Desativar filtro]
```

### Estados

#### Estado 1: Loading
**Condição**: `radiusSearchEnabled === true && isLoadingRadius === true`

**Comportamento**:
- Mapa mostra ZERO marcadores (não volta para viewport)
- Indicador de loading aparece no centro
- Mensagem: "Buscando... Procurando empresas, eventos e alertas em X km"

**Justificativa**: Evitar confusão (usuário não vê marcadores incorretos temporariamente)

---

#### Estado 2: Erro
**Condição**: `radiusSearchEnabled === true && hasErrorRadius === true`

**Comportamento**:
- Mapa mostra ZERO marcadores (não volta para viewport)
- Indicador de erro aparece no centro
- Mensagem: "Erro na busca. Não foi possível buscar entidades próximas."
- Sugestão: "Tente novamente ou desative o filtro."

**Justificativa**: Erro explícito é melhor que fallback silencioso

---

#### Estado 3: Zero Resultados
**Condição**: `radiusSearchEnabled === true && todos os arrays vazios`

**Comportamento**:
- Mapa mostra ZERO marcadores
- Indicador de zero resultados aparece no centro
- Mensagem: "Nada encontrado. Não há empresas, eventos ou alertas em um raio de X km."
- Sugestão: "Tente aumentar o raio de busca ou desativar o filtro."

**Justificativa**: Usuário entende que filtro está ativo mas não encontrou nada

---

#### Estado 4: Sucesso com Resultados
**Condição**: `radiusSearchEnabled === true && pelo menos um array não vazio`

**Comportamento**:
- Mapa mostra marcadores de empresas, eventos e alertas
- Badge "Ativo" com ponto pulsante
- Aviso: "Mostrando empresas, eventos e alertas em X km"
- Botão "Desativar filtro"

**Justificativa**: Usuário vê resultados e sabe que filtro está ativo

---

## 🔄 COMPARAÇÃO: MODO NORMAL vs MODO RAIO

| Aspecto | Modo Normal | Modo Raio |
|---------|------------|-----------|
| **Busca** | Por viewport (área visível) | Por distância (raio) |
| **Atualização** | Ao mover/dar zoom | Não atualiza |
| **Localização** | Não depende | Depende (obrigatório) |
| **Filtros de camada** | ✅ Respeitados | ❌ Ignorados |
| **Tipos mostrados** | Apenas selecionados | Todos (empresas, eventos, alertas) |
| **Indicador visual** | Nenhum | Badge "Ativo" + aviso |
| **Desativação** | N/A | Botão "Desativar filtro" |

---

## 📊 TIPOS DE ENTIDADE

### Empresas (business)

**Status**: ✅ Suportado em ambos os modos

**Características**:
- Coluna `point` geoespacial: ✅ Sim
- RPC `search_entities_by_radius`: ✅ Sim
- Fetcher viewport: ✅ Sim
- Emoji: 🏢

**Dados Exibidos**:
- Nome
- Rating
- Status (premium, verificado)
- Slug (para URL)

---

### Eventos (event)

**Status**: ✅ Suportado em ambos os modos

**Características**:
- Coluna `point` geoespacial: ✅ Sim
- RPC `search_entities_by_radius`: ✅ Sim
- Fetcher viewport: ✅ Sim
- Emoji: 📅

**Dados Exibidos**:
- Título
- Data do evento
- Status
- Descrição

---

### Alertas (alert)

**Status**: ✅ Suportado em ambos os modos

**Características**:
- Coluna `point` geoespacial: ✅ Sim
- RPC `search_entities_by_radius`: ✅ Sim
- Fetcher viewport: ✅ Sim
- Emoji: ⚠️

**Dados Exibidos**:
- Título/Bairro
- Status
- Descrição
- Data de criação

---

### Serviços (service)

**Status**: ❌ NÃO suportado

**Características**:
- Coluna `point` geoespacial: ❌ Não
- RPC `search_entities_by_radius`: ❌ Não
- Fetcher viewport: ❌ Não
- Emoji: -

**Motivo**: Serviços não têm coordenadas geográficas (coluna `point` não existe).

**Trabalho Necessário**: Ver `DIVIDAS_TECNICAS_MAPA.md` → Dívida #2

---

## 🎛️ CONTROLES DO MAPA

### 1. Busca de Localização (top-left)

**Tipo**: Geocoding (Nominatim)

**Funcionalidade**:
- Buscar lugar ou endereço
- Centralizar mapa no resultado
- Não ativa modo raio

---

### 2. Localização do Usuário (top-right)

**Tipo**: Geolocalização GPS

**Funcionalidade**:
- Obter localização do usuário
- Centralizar mapa no usuário
- Mostrar marcador de usuário
- Não ativa modo raio (apenas obtém localização)

---

### 3. Controle de Raio (bottom-right)

**Tipo**: Slider + Badge + Botão

**Funcionalidade**:
- Ajustar raio de busca (1-50 km, passo 1 km)
- Ativar modo raio automaticamente
- Mostrar badge "Ativo" quando ativo
- Mostrar aviso de tipos filtrados
- Desativar modo raio via botão

---

### 4. Filtros de Camada (bottom-left)

**Tipo**: Checkboxes

**Funcionalidade**:
- Mostrar/ocultar tipos individualmente
- Apenas em modo normal
- Ignorado em modo raio

**Tipos Disponíveis**:
- ☑️ Empresas
- ☑️ Eventos
- ☑️ Alertas

---

### 5. Indicador Territorial (top-right)

**Tipo**: Badge + Seletor

**Funcionalidade**:
- Mostrar território ativo (cidade/bairro)
- Permitir trocar território
- Filtrar resultados por território

---

## 🔍 FORMATO DE DADOS

### RPC: `search_entities_by_radius`

**Retorno**:
```sql
RETURNS TABLE (
  id UUID,
  name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  distance_meters NUMERIC,
  location_id UUID
)
```

**Transformação Frontend**:
```typescript
const markers = mapEntityProjection.projectEntities(
  results.map((result) => ({
    id: result.id,
    name: result.name,
    latitude: result.latitude,
    longitude: result.longitude,
    status: 'active',
    location_id: result.location_id,
  })),
  entityType,
  options,
);
```

**Importante**: RPC retorna estrutura plana (não aninhada).

---

## 🎯 DECISÕES DE PRODUTO

### 1. Modo Raio Ignora Filtros de Camada

**Decisão**: Quando raio está ativo, filtros de camada são ignorados (sempre mostra todos os tipos).

**Justificativa**: Modo raio é busca espacial focada (usuário quer ver tudo próximo).

**Alternativa Futura**: Permitir usuário escolher quais tipos filtrar (se houver demanda).

---

### 2. Fallback de Loading/Erro: Mapa Vazio

**Decisão**: Durante loading ou erro, mapa fica vazio (não volta para marcadores normais).

**Justificativa**: Evita confusão, torna explícito que filtro está ativo.

**Alternativa Rejeitada**: Voltar para marcadores normais (confuso e inconsistente).

---

### 3. Intervalo do Slider: 1-50 km, Passo 1 km

**Decisão**: Slider permite apenas valores inteiros de 1 a 50 km.

**Justificativa**: Mais simples, evita valores fracionários confusos.

**Alternativa Rejeitada**: Passo de 0.5 km (complexidade desnecessária).

---

### 4. Serviços Não Aparecem no Mapa

**Decisão**: Serviços não aparecem no mapa (nem em modo normal, nem em modo raio).

**Justificativa**: Não têm coordenadas geográficas (coluna `point` não existe).

**Quando Adicionar**: Quando houver demanda real de usuários.

---

## 📚 REFERÊNCIAS

### Documentos Técnicos

1. `ETAPA_1_RELATORIO_FINAL.md` - Base geográfica completa
2. `ETAPA_1.1E_RELATORIO_FINAL.md` - Expansão funcional (eventos e alertas)
3. `ETAPA_1.1F_RELATORIO_FINAL.md` - Robustez e correção de inconsistências
4. `DIVIDAS_TECNICAS_MAPA.md` - Dívidas técnicas registradas

### Arquivos de Código

1. `src/core/maps/pages/MapaPageV4.tsx` - Página principal do mapa
2. `src/core/maps/components/v3/controls/MapRadiusControl.tsx` - Controle de raio
3. `src/core/geospatial/services/SpatialSearchService.ts` - Serviço de busca espacial
4. `src/core/geospatial/hooks/useSpatialSearch.ts` - Hooks de busca espacial

### Migrations

1. `supabase/migrations/20260404000001_add_spatial_search_foundation.sql` - Base espacial
2. `supabase/migrations/20260404000002_add_spatial_search_functions.sql` - RPCs
3. `supabase/migrations/20260404000003_add_coverage_system.sql` - Sistema de cobertura

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Versão**: 1.0  
**Status**: ✅ CONSOLIDADO
