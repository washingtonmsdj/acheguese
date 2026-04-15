# Opção B: Cadastro Manual de Polígonos - Detalhado

## O que acontece?

Você cria uma tabela no banco de dados Supabase para armazenar os polígonos dos bairros que não existem no OpenStreetMap.

## Passo a Passo

### 1. Criar Tabela no Supabase

```sql
-- Migration: create neighborhood_boundaries table
CREATE TABLE neighborhood_boundaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  geometry JSONB NOT NULL, -- GeoJSON do polígono
  source TEXT NOT NULL, -- 'manual', 'prefeitura', 'ibge', etc
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  
  UNIQUE(location_id)
);

-- Índice para busca rápida
CREATE INDEX idx_neighborhood_boundaries_location 
  ON neighborhood_boundaries(location_id);

-- Comentários
COMMENT ON TABLE neighborhood_boundaries IS 
  'Polígonos customizados de bairros não disponíveis no OSM';
COMMENT ON COLUMN neighborhood_boundaries.geometry IS 
  'GeoJSON Polygon ou MultiPolygon';
```

### 2. Obter os Dados GeoJSON

Você precisa conseguir os polígonos dos 19 bairros. Fontes possíveis:

#### Opção 2.1: Prefeitura de Salvador
- Site oficial da prefeitura
- Secretaria de Urbanismo
- Dados abertos (se disponível)

#### Opção 2.2: IBGE
- Malha de setores censitários
- Pode não ter divisão exata por bairro

#### Opção 2.3: Desenhar Manualmente
- Usar ferramenta como [geojson.io](https://geojson.io)
- Desenhar os limites no mapa
- Exportar GeoJSON

#### Opção 2.4: Contribuir no OpenStreetMap
- Cadastrar os bairros no OSM
- Esperar sincronização (pode demorar dias)
- Depois funcionará automaticamente

### 3. Formato dos Dados

Cada bairro precisa de um GeoJSON assim:

```json
{
  "type": "Polygon",
  "coordinates": [
    [
      [-38.5123, -12.9876],
      [-38.5100, -12.9850],
      [-38.5150, -12.9800],
      [-38.5123, -12.9876]
    ]
  ]
}
```

Ou MultiPolygon:

```json
{
  "type": "MultiPolygon",
  "coordinates": [
    [
      [
        [-38.5123, -12.9876],
        [-38.5100, -12.9850],
        [-38.5150, -12.9800],
        [-38.5123, -12.9876]
      ]
    ],
    [
      [
        [-38.5200, -12.9900],
        [-38.5180, -12.9880],
        [-38.5220, -12.9850],
        [-38.5200, -12.9900]
      ]
    ]
  ]
}
```

### 4. Inserir no Banco

Para cada um dos 19 bairros:

```sql
-- Exemplo: Bairro "Exemplo"
INSERT INTO neighborhood_boundaries (location_id, geometry, source, created_by)
VALUES (
  '63c41c29-adce-40f5-a552-e52d176123c3', -- ID do bairro
  '{
    "type": "Polygon",
    "coordinates": [[
      [-38.5123, -12.9876],
      [-38.5100, -12.9850],
      [-38.5150, -12.9800],
      [-38.5123, -12.9876]
    ]]
  }'::jsonb,
  'manual',
  'a3ea040f-6f7a-44dd-b778-10eff4295303' -- Seu user ID
);
```

### 5. Modificar o Código

Atualizar `GeocodingService.ts` para buscar no banco primeiro:

```typescript
static async getNeighborhoodBounds(
  neighborhood: string,
  city: string,
  state: string,
  locationId?: string, // Novo parâmetro
): Promise<{ rings: [number, number][][]; center: [number, number] }> {
  
  // 1. Tenta buscar no banco (se tiver locationId)
  if (locationId) {
    const customBoundary = await this.getCustomBoundary(locationId);
    if (customBoundary) {
      return customBoundary;
    }
  }
  
  // 2. Se não encontrar, busca no Nominatim (OSM)
  // ... código atual ...
}

private static async getCustomBoundary(
  locationId: string
): Promise<{ rings: [number, number][][]; center: [number, number] } | null> {
  try {
    const { data } = await supabase
      .from('neighborhood_boundaries')
      .select('geometry')
      .eq('location_id', locationId)
      .single();
    
    if (!data) return null;
    
    const rings = this.extractRingsFromGeoJSON(data.geometry);
    const center = this.calculateCenter(rings[0] || []);
    
    return { rings, center };
  } catch {
    return null;
  }
}
```

### 6. Atualizar Hook

Passar `locationId` para o `GeocodingService`:

```typescript
const batchResults = await Promise.allSettled(
  batch.map((n: Location) =>
    GeocodingService.getNeighborhoodBounds(
      n.name,
      parsed.city,
      parsed.state,
      n.id, // Adicionar ID
    ).then((r) => ({ neighborhood: n, result: r })),
  ),
);
```

## Vantagens

✅ **Controle total** - Você define os limites exatos
✅ **Dados precisos** - Pode usar fontes oficiais
✅ **Não depende de API externa** - Funciona offline
✅ **Performance** - Busca no banco é mais rápida que API
✅ **Customizável** - Pode ajustar limites conforme necessário

## Desvantagens

❌ **Trabalho manual** - Precisa cadastrar 19 bairros
❌ **Precisa dos dados** - Tem que conseguir os GeoJSON
❌ **Manutenção** - Se limites mudarem, precisa atualizar
❌ **Tempo** - 2-3 horas de implementação + tempo de cadastro
❌ **Duplicação** - Dados que já existem no OSM (para outros bairros)

## Tempo Estimado

- **Criar tabela**: 15 minutos
- **Modificar código**: 1 hora
- **Testar**: 30 minutos
- **Conseguir dados GeoJSON**: ??? (depende da fonte)
- **Cadastrar 19 bairros**: 2-5 horas (depende se tem os dados prontos)

**Total**: 4-7 horas (se tiver os dados prontos)

## Quando Vale a Pena?

✅ Você tem acesso aos dados oficiais da prefeitura
✅ Precisa de limites precisos (não aproximados)
✅ Vai usar isso para outras cidades também
✅ Quer controle total sobre os dados

❌ Não tem os dados GeoJSON
❌ Precisa de solução rápida
❌ Só vai usar para Salvador
❌ Limites aproximados são suficientes

## Alternativa Híbrida

Combinar com Opção A (círculo fallback):

1. Busca no banco (polígonos manuais)
2. Se não encontrar, busca no OSM
3. Se não encontrar, desenha círculo

Assim você pode cadastrar os 19 bairros **gradualmente**:
- Hoje: círculo para todos
- Amanhã: cadastra 5 bairros importantes
- Semana que vem: cadastra mais 5
- Etc.

## Minha Recomendação

**Se você tem os dados GeoJSON prontos**: Opção B é excelente!

**Se não tem os dados**: Comece com Opção A (círculo) e migre para B gradualmente.

---

**Você tem acesso aos dados GeoJSON dos bairros de Salvador?**
- Prefeitura?
- IBGE?
- Outra fonte?

Se sim, posso implementar a Opção B completa agora.
Se não, recomendo Opção A (círculo fallback) que resolve imediatamente.
