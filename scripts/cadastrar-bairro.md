# Como Cadastrar Polígonos de Bairros Manualmente

## Pré-requisitos

1. Ser admin no sistema
2. Ter o ID do bairro (location_id)
3. Ter o GeoJSON do polígono

## Passo 1: Obter o ID do Bairro

No console do navegador (F12), na página do mapa:

```javascript
// Limpar cache para ver quais bairros falharam
clearNeighborhoodsCache()

// Recarregar e clicar em "Bairros"
// Ver no console a lista de bairros que falharam
```

Ou buscar direto no banco:

```sql
SELECT id, name, geographic_path
FROM locations
WHERE type = 'district'
  AND geographic_path LIKE '/br/ba/salvador/%'
  AND status = 'active'
ORDER BY name;
```

## Passo 2: Obter o GeoJSON do Polígono

### Opção A: Desenhar Manualmente

1. Ir para [geojson.io](https://geojson.io)
2. Navegar até Salvador no mapa
3. Usar ferramenta de polígono para desenhar o bairro
4. Copiar o GeoJSON gerado

### Opção B: Buscar Dados Oficiais

- Prefeitura de Salvador
- IBGE (malha de setores)
- Dados abertos governamentais

### Opção C: Extrair do OpenStreetMap

Se o bairro existe no OSM mas com nome diferente:

1. Ir para [overpass-turbo.eu](https://overpass-turbo.eu)
2. Buscar o bairro
3. Exportar como GeoJSON

## Passo 3: Cadastrar no Banco

### Via SQL (Supabase Dashboard)

```sql
-- Exemplo: Cadastrar bairro "Exemplo"
INSERT INTO neighborhood_boundaries (
  location_id,
  geometry,
  source,
  notes
) VALUES (
  'uuid-do-bairro-aqui',
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
  'Desenhado manualmente em geojson.io'
);
```

### Via Console do Navegador (se for admin)

```javascript
// Importar o serviço
const { NeighborhoodBoundaryService } = await import(
  './src/core/maps/services/NeighborhoodBoundaryService'
);

// Cadastrar
await NeighborhoodBoundaryService.upsert({
  location_id: 'uuid-do-bairro-aqui',
  geometry: {
    type: 'Polygon',
    coordinates: [[
      [-38.5123, -12.9876],
      [-38.5100, -12.9850],
      [-38.5150, -12.9800],
      [-38.5123, -12.9876]
    ]]
  },
  source: 'manual',
  notes: 'Desenhado manualmente'
});
```

## Passo 4: Testar

1. Limpar cache: `clearNeighborhoodsCache()`
2. Recarregar página
3. Navegar para o bairro: `/br/ba/salvador/nome-do-bairro`
4. Verificar se o polígono aparece no mapa

## Formato do GeoJSON

### Polygon (bairro simples)

```json
{
  "type": "Polygon",
  "coordinates": [[
    [-38.5123, -12.9876],
    [-38.5100, -12.9850],
    [-38.5150, -12.9800],
    [-38.5123, -12.9876]
  ]]
}
```

### MultiPolygon (bairro com múltiplas áreas)

```json
{
  "type": "MultiPolygon",
  "coordinates": [
    [[
      [-38.5123, -12.9876],
      [-38.5100, -12.9850],
      [-38.5150, -12.9800],
      [-38.5123, -12.9876]
    ]],
    [[
      [-38.5200, -12.9900],
      [-38.5180, -12.9880],
      [-38.5220, -12.9850],
      [-38.5200, -12.9900]
    ]]
  ]
}
```

## Dicas

1. **Coordenadas**: GeoJSON usa [longitude, latitude] (diferente do padrão interno)
2. **Fechar polígono**: Primeira e última coordenada devem ser iguais
3. **Sentido**: Coordenadas devem estar em sentido anti-horário
4. **Validar**: Use [geojson.io](https://geojson.io) para validar antes de cadastrar

## Listar Todos os Bairros Cadastrados

```sql
SELECT 
  nb.id,
  l.name as bairro,
  nb.source,
  nb.notes,
  nb.created_at
FROM neighborhood_boundaries nb
JOIN locations l ON l.id = nb.location_id
ORDER BY l.name;
```

## Atualizar um Polígono

```sql
UPDATE neighborhood_boundaries
SET 
  geometry = '{...novo geojson...}'::jsonb,
  notes = 'Atualizado com dados oficiais',
  updated_at = NOW()
WHERE location_id = 'uuid-do-bairro';
```

## Remover um Polígono

```sql
DELETE FROM neighborhood_boundaries
WHERE location_id = 'uuid-do-bairro';
```

---

## Próximos Passos

1. Rodar a migration: `supabase db push`
2. Identificar os 19 bairros que falharam
3. Conseguir os GeoJSON (desenhar ou buscar dados oficiais)
4. Cadastrar um por um
5. Testar cada um após cadastrar
