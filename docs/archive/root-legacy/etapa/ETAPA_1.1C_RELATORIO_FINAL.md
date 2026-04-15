# ETAPA 1.1C - COERÊNCIA DO MAPA CENTRAL

**Data**: 04/04/2026  
**Status**: ✅ CONCLUÍDO

---

## 🎯 OBJETIVO

Resolver limitações restantes do filtro por raio e preparar o mapa central para comportamento consistente.

---

## ✅ IMPLEMENTAÇÕES

### 1. Correção do Fallback do Raio ✅

**Problema Identificado**:
```typescript
// ANTES (INCORRETO)
if (radiusSearchEnabled && nearbyBusinesses && nearbyBusinesses.length > 0) {
  return resultadosDaBusca;
}
// Se zero resultados, volta para marcadores normais ❌
return Object.values(layerData).flat();
```

**Comportamento Incorreto**:
- Usuário ativa filtro de raio de 1 km
- Não há empresas em 1 km
- Mapa mostra todas as empresas do viewport (comportamento confuso)
- Usuário não sabe se o filtro está funcionando

**Correção Aplicada**:
```typescript
// DEPOIS (CORRETO)
if (radiusSearchEnabled) {
  if (!nearbyBusinesses) {
    // Ainda carregando
    return Object.values(layerData).flat();
  }
  
  // Retornar apenas resultados da busca por raio, mesmo que seja array vazio
  return mapEntityProjection.projectEntities(nearbyBusinesses, ...);
}

// Busca por raio NÃO está ativa: usar marcadores normais
return Object.values(layerData).flat();
```

**Comportamento Correto**:
- Usuário ativa filtro de raio de 1 km
- Não há empresas em 1 km
- Mapa mostra ZERO marcadores ✅
- Mensagem explicativa aparece no centro ✅
- Usuário entende que o filtro está ativo e não encontrou nada ✅

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

---

### 2. Indicador Visual de Zero Resultados ✅

**Implementação**:
```typescript
{radiusSearchEnabled && nearbyBusinesses && nearbyBusinesses.length === 0 && (
  <div className="...">
    <div className="text-4xl">📍</div>
    <p className="text-lg font-semibold">Nenhuma empresa encontrada</p>
    <p className="text-sm">
      Não há empresas em um raio de {searchRadius} km da sua localização.
    </p>
    <p className="text-xs">
      Tente aumentar o raio de busca ou desativar o filtro.
    </p>
  </div>
)}
```

**Resultado**:
- Mensagem centralizada no mapa
- Informa o raio atual
- Sugere ações (aumentar raio ou desativar)
- Acessível (role="status", aria-live="polite")

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

---

### 3. Documentação da Semântica do Mapa ✅

**Documentação Inline**:
```typescript
// SEMÂNTICA DO MAPA COM RAIO ATIVO:
// Quando busca por raio está ativa, o mapa mostra APENAS resultados da busca espacial.
// Se não houver resultados, o mapa fica vazio (zero marcadores).
// Isso torna explícito ao usuário que o filtro está ativo e não encontrou nada.
// 
// TIPOS DE ENTIDADE AFETADOS PELO RAIO:
// - Empresas (business): ✅ Filtrado por raio
// - Eventos (event): ❌ Não filtrado (usa viewport)
// - Alertas (alert): ❌ Não filtrado (usa viewport)
// - Serviços (service): ❌ Não filtrado (usa viewport)
//
// DECISÃO DE PRODUTO: O raio filtra apenas empresas por enquanto.
```

**Arquivo**: `src/core/maps/pages/MapaPageV4.tsx`

---

## 📋 SEMÂNTICA OFICIAL DO MAPA CENTRAL

### Modo Normal (Raio Desativado)

**Comportamento**:
- Mapa busca entidades por viewport (bounds visíveis)
- Mostra todos os tipos: empresas, eventos, alertas, serviços
- Atualiza ao mover/dar zoom no mapa
- Respeita filtros de camadas (layer control)

**Tipos de Entidade**:
- ✅ Empresas (business)
- ✅ Eventos (event)
- ✅ Alertas (alert)
- ✅ Serviços (service)

---

### Modo Raio (Raio Ativado)

**Comportamento**:
- Mapa busca entidades por raio espacial (distância do usuário)
- Mostra APENAS empresas (decisão de produto)
- NÃO atualiza ao mover/dar zoom (fixo na localização do usuário)
- Se zero resultados, mapa fica vazio com mensagem explicativa

**Tipos de Entidade**:
- ✅ Empresas (business) - Filtrado por raio
- ❌ Eventos (event) - NÃO mostrado
- ❌ Alertas (alert) - NÃO mostrado
- ❌ Serviços (service) - NÃO mostrado

**Ativação**:
- Usuário permite localização GPS
- Usuário arrasta slider de raio
- `radiusSearchEnabled` é setado para `true`

**Desativação**:
- Usuário nega localização
- Usuário fecha/recarrega página
- Não há botão explícito de desativar (melhoria futura)

---

## 📊 TIPOS DE ENTIDADE AFETADOS PELO RAIO

| Tipo | Filtrado por Raio? | Motivo |
|------|-------------------|--------|
| Empresas (business) | ✅ SIM | Tem `spatial_data` no banco + RPC implementado |
| Eventos (event) | ❌ NÃO | Não tem `spatial_data` no banco |
| Alertas (alert) | ❌ NÃO | Não tem `spatial_data` no banco |
| Serviços (service) | ❌ NÃO | Não tem `spatial_data` no banco |
| Profissionais (professional) | ❌ NÃO | Não tem `spatial_data` no banco |
| Pontos Turísticos (tourist_point) | ❌ NÃO | Não tem `spatial_data` no banco |

---

## 🔧 COMO ADICIONAR OUTROS TIPOS AO FILTRO DE RAIO

### Pré-requisitos

1. **Adicionar `spatial_data` ao tipo no banco**:
```sql
ALTER TABLE events ADD COLUMN spatial_data geography(Point, 4326);
CREATE INDEX idx_events_spatial ON events USING GIST (spatial_data);
```

2. **Criar trigger para atualizar `spatial_data`**:
```sql
CREATE TRIGGER update_events_spatial_data
  BEFORE INSERT OR UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_spatial_data_from_coordinates();
```

3. **Criar RPC de busca espacial**:
```sql
CREATE OR REPLACE FUNCTION search_events_by_radius(...)
RETURNS TABLE (...) AS $$
  -- Similar a search_businesses_by_radius
$$ LANGUAGE plpgsql;
```

### Implementação no Frontend

1. **Adicionar hook de busca**:
```typescript
const { data: nearbyEvents } = useSpatialSearchByRadius({
  center: userLocation,
  radiusKm: searchRadius,
  entityType: 'event',
  enabled: radiusSearchEnabled && !!userLocation,
});
```

2. **Combinar resultados**:
```typescript
const markers = React.useMemo(() => {
  if (radiusSearchEnabled) {
    const businessMarkers = projectEntities(nearbyBusinesses, 'business');
    const eventMarkers = projectEntities(nearbyEvents, 'event');
    return [...businessMarkers, ...eventMarkers];
  }
  return Object.values(layerData).flat();
}, [radiusSearchEnabled, nearbyBusinesses, nearbyEvents, layerData]);
```

**Esforço Estimado**: 2-3 horas por tipo de entidade

---

## ⚠️ RISCOS OPERACIONAIS DO GEOCODINGSERVICE

### Arquitetura Atual

**GeocodingService no Cliente**:
```
Browser → GeocodingService.ts → nominatim.openstreetmap.org
```

**Características**:
- ✅ Simples de implementar
- ✅ Sem custo de infraestrutura
- ✅ Cache local (LocalStorage)
- ✅ Rate limiting client-side (1 req/s)
- ❌ IP do usuário exposto ao Nominatim
- ❌ Sem controle centralizado de uso
- ❌ Sem fallback se Nominatim cair
- ❌ Sem analytics de uso

---

### Riscos Identificados

#### 1. Dependência de Serviço Externo ⚠️

**Risco**: Nominatim pode ficar indisponível ou bloquear IPs.

**Impacto**: Busca de endereços para de funcionar.

**Probabilidade**: Baixa (Nominatim é estável)

**Mitigação Atual**: Cache local reduz chamadas

**Mitigação Futura**: Implementar fallback para outro provedor

---

#### 2. Ausência de Rate Limiting Centralizado ⚠️

**Risco**: Múltiplos usuários podem exceder limites do Nominatim.

**Impacto**: IPs podem ser bloqueados temporariamente.

**Probabilidade**: Média (depende do volume de usuários)

**Mitigação Atual**: Rate limiting client-side (1 req/s por usuário)

**Mitigação Futura**: Proxy backend com rate limiting global

---

#### 3. Falta de Analytics ⚠️

**Risco**: Não sabemos quantas buscas são feitas, quais falham, etc.

**Impacto**: Dificulta otimização e detecção de problemas.

**Probabilidade**: Alta (já está acontecendo)

**Mitigação Atual**: Nenhuma

**Mitigação Futura**: Logging no backend

---

#### 4. Privacidade do Usuário ⚠️

**Risco**: IP do usuário é exposto ao Nominatim.

**Impacto**: Nominatim pode rastrear buscas por IP.

**Probabilidade**: Alta (já está acontecendo)

**Mitigação Atual**: Nenhuma

**Mitigação Futura**: Proxy backend anonimiza IPs

---

### Estratégia Futura: Proxy Backend

**Arquitetura Proposta**:
```
Browser → GeocodingService.ts → Backend Proxy → Nominatim
                                      ↓
                                  Analytics
                                  Rate Limiting
                                  Cache Redis
                                  Fallback
```

**Vantagens**:
- ✅ Rate limiting centralizado
- ✅ Analytics de uso
- ✅ Cache compartilhado (Redis)
- ✅ Fallback para múltiplos provedores
- ✅ Privacidade do usuário (IP anonimizado)
- ✅ Controle de custos

**Desvantagens**:
- ❌ Mais complexo
- ❌ Custo de infraestrutura (servidor + Redis)
- ❌ Latência adicional (hop extra)

**Quando Implementar**:
- Volume de usuários > 1000/dia
- Taxa de erro > 5%
- Bloqueios de IP frequentes
- Necessidade de analytics

**Esforço Estimado**: 4-6 horas

---

### Implementação do Proxy Backend

**1. Criar Edge Function no Supabase**:
```typescript
// supabase/functions/geocoding-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';
const RATE_LIMIT = 1; // req/s

serve(async (req) => {
  const { query, countryCode } = await req.json();
  
  // Rate limiting (Redis)
  const allowed = await checkRateLimit(req.headers.get('x-forwarded-for'));
  if (!allowed) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  
  // Buscar no Nominatim
  const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&countrycodes=${countryCode}&format=json`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'AchegueSe/1.0' },
  });
  
  // Log analytics
  await logGeocoding({ query, countryCode, status: response.status });
  
  return response;
});
```

**2. Atualizar GeocodingService**:
```typescript
// src/core/geospatial/services/GeocodingService.ts
const GEOCODING_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/geocoding-proxy';

async geocode(query: string): Promise<GeocodingResult | null> {
  const response = await fetch(GEOCODING_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ query, countryCode: 'br' }),
  });
  
  // ...
}
```

**3. Adicionar Fallback**:
```typescript
const PROVIDERS = ['nominatim', 'google', 'mapbox'];

async geocode(query: string): Promise<GeocodingResult | null> {
  for (const provider of PROVIDERS) {
    try {
      const result = await this.geocodeWithProvider(provider, query);
      if (result) return result;
    } catch (error) {
      console.warn(`Provider ${provider} failed:`, error);
    }
  }
  return null;
}
```

---

## 📁 ARQUIVOS MODIFICADOS

1. `src/core/maps/pages/MapaPageV4.tsx`
   - Corrigido fallback do raio (linha ~225)
   - Adicionado indicador de zero resultados (linha ~320)
   - Documentado semântica do mapa (linha ~225)

**Total**: 1 arquivo modificado

---

## ✅ VALIDAÇÃO OBJETIVA

### Teste 1: Zero Resultados com Raio Ativo

**Pré-requisito**: Permitir localização GPS

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider de raio para 0.5 km (meio quilômetro)
4. Verificar que não há empresas tão perto

**Resultado Esperado**:
- ✅ Mapa mostra ZERO marcadores
- ✅ Mensagem aparece no centro: "Nenhuma empresa encontrada"
- ✅ Mensagem informa o raio atual (0.5 km)
- ✅ Mensagem sugere aumentar raio

**Resultado Anterior (INCORRETO)**:
- ❌ Mapa mostrava todas as empresas do viewport
- ❌ Usuário não sabia se o filtro estava funcionando

---

### Teste 2: Raio com Resultados

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider de raio para 5 km
4. Verificar que há empresas próximas

**Resultado Esperado**:
- ✅ Mapa mostra APENAS empresas em raio de 5 km
- ✅ Eventos/alertas NÃO aparecem
- ✅ Ao mover mapa, marcadores NÃO mudam (fixo na localização)

---

### Teste 3: Desativar Raio

**Passos**:
1. Abrir `http://localhost:5173/mapa`
2. Permitir localização
3. Arrastar slider de raio para 2 km
4. Recarregar página

**Resultado Esperado**:
- ✅ Raio é desativado (não persiste entre sessões)
- ✅ Mapa volta para modo normal (viewport)
- ✅ Todos os tipos de entidade aparecem

---

## 📊 RESUMO EXECUTIVO

| Item | Status |
|------|--------|
| Fallback do raio corrigido | ✅ |
| Indicador de zero resultados | ✅ |
| Semântica documentada | ✅ |
| Tipos afetados listados | ✅ |
| Riscos do GeocodingService documentados | ✅ |
| Estratégia futura proposta | ✅ |

**Total**: 6/6 itens concluídos (100%)

---

## 🎯 DECISÕES DE PRODUTO

### 1. Raio Filtra Apenas Empresas

**Decisão**: O filtro de raio afeta apenas empresas, não eventos/alertas.

**Justificativa**:
- Empresas são o tipo mais importante
- Outros tipos não têm `spatial_data` no banco
- Adicionar outros tipos requer trabalho adicional (2-3h cada)

**Alternativa Futura**: Adicionar outros tipos conforme demanda

---

### 2. Zero Resultados = Mapa Vazio

**Decisão**: Se busca por raio retornar zero resultados, mapa fica vazio.

**Justificativa**:
- Torna explícito que o filtro está ativo
- Evita confusão (usuário sabe que não há resultados)
- Mensagem explicativa orienta o usuário

**Alternativa Rejeitada**: Voltar para marcadores normais (confuso)

---

### 3. GeocodingService no Cliente (Por Enquanto)

**Decisão**: Manter GeocodingService no cliente, sem proxy backend.

**Justificativa**:
- Simples de implementar
- Sem custo de infraestrutura
- Volume de usuários ainda é baixo
- Cache local reduz chamadas

**Quando Reavaliar**: Volume > 1000 usuários/dia ou taxa de erro > 5%

---

## 🚀 PRÓXIMOS PASSOS (TRABALHO FUTURO)

### Curto Prazo (1-2 horas)

1. Adicionar botão para desativar filtro de raio
2. Persistir estado do raio no LocalStorage
3. Adicionar indicador visual de "raio ativo" no controle

### Médio Prazo (2-4 horas)

1. Adicionar eventos ao filtro de raio
2. Adicionar alertas ao filtro de raio
3. Permitir escolher quais tipos filtrar

### Longo Prazo (4-6 horas)

1. Implementar proxy backend para GeocodingService
2. Adicionar analytics de uso
3. Implementar fallback para múltiplos provedores

---

**Elaborado por**: Kiro AI Assistant  
**Data**: 04/04/2026  
**Status**: ✅ ETAPA 1.1C CONCLUÍDA
