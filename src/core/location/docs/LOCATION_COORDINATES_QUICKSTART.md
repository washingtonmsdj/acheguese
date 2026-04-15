# Location Coordinates - Quick Start

## TL;DR

Sistema profissional AAA que garante coordenadas em TODOS os locations (existentes e futuros).

## Setup Inicial (Uma Vez)

1. **Aplicar migração** (já aberto no navegador):
   - Cole o SQL no Supabase SQL Editor
   - Clique em "Run"
   - Verifique os logs

2. **Verificar cobertura**:
   ```sql
   SELECT * FROM locations_coordinates_status;
   ```

3. **Se houver locations sem coordenadas**:
   ```bash
   npm run geocode-locations
   ```

## Uso Diário

### Criar Novo Location COM Coordenadas (Recomendado)

```typescript
await supabase.from('locations').insert({
  parent_id: cityId,
  type: 'district',
  slug: 'novo-bairro',
  name: 'Novo Bairro',
  full_name: 'Novo Bairro, Salvador',
  metadata: {
    center_latitude: -12.9876,
    center_longitude: -38.4567
  }
});
```

### Criar Novo Location SEM Coordenadas (Auto-Herda)

```typescript
// Herda coordenadas do parent automaticamente
await supabase.from('locations').insert({
  parent_id: cityId,
  type: 'district',
  slug: 'novo-bairro',
  name: 'Novo Bairro',
  full_name: 'Novo Bairro, Salvador',
  metadata: {}
});

// Depois refinar via geocoding
// npm run geocode-locations -- --refine
```

## Comandos Úteis

```bash
# Geocodificar locations sem coordenadas
npm run geocode-locations

# Refinar coordenadas herdadas
npm run geocode-locations -- --refine
```

## Monitoramento

```sql
-- Status geral
SELECT * FROM locations_coordinates_status;

-- Locations que precisam refinamento
SELECT name, type FROM locations 
WHERE (metadata->>'coordinates_needs_refinement')::boolean = true;
```

## Garantias

✅ Todos os locations têm coordenadas  
✅ Novos locations herdam do parent  
✅ Validação automática no banco  
✅ Geocoding disponível via CLI  
✅ Monitoramento em tempo real  

## Documentação Completa

Ver: `./LOCATION_COORDINATES_SYSTEM.md`
