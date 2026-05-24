# Interface Admin de Locations

## Acesso

URL: `/admin/locations`

Requer: Permissões de administrador

## Funcionalidades

### 1. Visualização Hierárquica

A interface mostra todos os locations organizados em hierarquia:
- 🌍 País
  - 📍 Estado
    - 🏙️ Cidade
      - 🏘️ Bairro

### 2. Indicadores Visuais

- **Verde** (📍): Location tem coordenadas precisas
- **Cinza** (📍): Location sem coordenadas
- **Badge amarelo**: "Precisa refinamento" - coordenadas herdadas que podem ser melhoradas

### 3. Adicionar Novo Location

Clique em "Adicionar Location" e preencha:

#### Campos Obrigatórios
- **Tipo**: País, Estado, Cidade ou Bairro
- **Nome**: Nome do location (ex: "Pituba")
- **Slug**: Identificador único (ex: "pituba")

#### Campos Opcionais
- **Parent ID**: UUID do location pai (ex: ID de Salvador para adicionar um bairro)
- **Latitude**: Coordenada de latitude (ex: -12.971111)
- **Longitude**: Coordenada de longitude (ex: -38.510833)

#### Comportamento

**Com coordenadas fornecidas:**
```typescript
// Location criado com coordenadas precisas
metadata: {
  center_latitude: -12.971111,
  center_longitude: -38.510833,
  coordinates_source: 'manual',
  coordinates_confidence: 'high'
}
```

**Sem coordenadas fornecidas:**
```typescript
// Sistema herda automaticamente do parent
metadata: {
  center_latitude: -12.971111, // herdado
  center_longitude: -38.510833, // herdado
  coordinates_source: 'inherited_from_parent',
  coordinates_needs_refinement: true
}
```

### 4. Ações Disponíveis

Para cada location (aparecem ao passar o mouse):

- **🔄 Refinar**: Geocodifica via Nominatim para obter coordenadas precisas
- **✏️ Editar**: Editar informações do location (em desenvolvimento)
- **🗺️ Ver no Mapa**: Visualizar location no mapa (em desenvolvimento)

### 5. Expandir/Recolher

Clique nas setas (▶️ / ▼) para expandir ou recolher a hierarquia de locations.

## Fluxo de Trabalho Recomendado

### Adicionar Nova Cidade

1. Acesse `/admin/locations`
2. Clique em "Adicionar Location"
3. Preencha:
   - Tipo: `city`
   - Parent ID: (ID do estado, ex: Bahia)
   - Nome: `Lauro de Freitas`
   - Slug: `lauro-de-freitas`
   - Latitude: `-12.89242` (opcional)
   - Longitude: `-38.3127691` (opcional)
4. Clique em "Adicionar"

### Adicionar Novo Bairro

1. Acesse `/admin/locations`
2. Clique em "Adicionar Location"
3. Preencha:
   - Tipo: `district`
   - Parent ID: (ID da cidade)
   - Nome: `Novo Bairro`
   - Slug: `novo-bairro`
   - Latitude: (opcional - herda da cidade se não fornecido)
   - Longitude: (opcional - herda da cidade se não fornecido)
4. Clique em "Adicionar"

### Refinar Coordenadas Herdadas

**Opção 1: Via Interface (em desenvolvimento)**
1. Encontre o location com badge "Precisa refinamento"
2. Clique no botão 🔄 Refinar
3. Aguarde o geocoding automático

**Opção 2: Via CLI (disponível agora)**
```bash
npm run geocode-locations -- --refine
```

## Como Obter Coordenadas

### Método 1: Google Maps
1. Abra [Google Maps](https://maps.google.com)
2. Busque o local
3. Clique com botão direito no centro do bairro/cidade
4. Clique em "Copiar coordenadas"
5. Cole no formato: `-12.971111, -38.510833`

### Método 2: OpenStreetMap
1. Abra [OpenStreetMap](https://www.openstreetmap.org)
2. Busque o local
3. Clique com botão direito
4. Veja as coordenadas na URL ou no painel lateral

### Método 3: Geocoding Automático
Deixe os campos de coordenadas vazios e use:
```bash
npm run geocode-locations -- --refine
```

## Validações Automáticas

O sistema valida automaticamente:

✅ **Slug único** dentro do mesmo parent
✅ **Coordenadas válidas** (lat: -90 a 90, lng: -180 a 180)
✅ **Tipo correto** (country, state, city, district)
✅ **Parent existe** (se fornecido)

## Estrutura de Dados

### Location Completo
```typescript
{
  id: "uuid",
  parent_id: "uuid-do-parent",
  type: "district",
  slug: "pituba",
  name: "Pituba",
  full_name: "Pituba, Salvador, Bahia",
  geographic_path: "/br/ba/salvador/pituba",
  metadata: {
    center_latitude: -13.0050,
    center_longitude: -38.4650,
    coordinates_source: "nominatim",
    coordinates_confidence: "high",
    coordinates_needs_refinement: false,
    coordinates_updated_at: "2026-04-05T10:30:00Z"
  }
}
```

## Integração com Sistema

Locations criados via admin:
- ✅ Aparecem automaticamente no seletor de território
- ✅ Funcionam com `useResolvedUserLocation`
- ✅ São usados no fallback do mapa quando GPS é negado
- ✅ Filtram conteúdo territorial (empresas, eventos, etc.)

## Troubleshooting

### "Erro ao adicionar location"
- Verifique se o slug já existe
- Verifique se o parent_id é válido
- Verifique se as coordenadas estão no formato correto

### "Location sem coordenadas"
- Normal se não forneceu coordenadas
- Sistema herda do parent automaticamente
- Use refinamento para obter coordenadas precisas

### "Precisa refinamento"
- Location tem coordenadas herdadas
- Funciona normalmente
- Recomendado refinar para maior precisão

## Próximas Funcionalidades

- [ ] Edição inline de locations
- [ ] Visualização no mapa integrada
- [ ] Geocoding via interface (sem CLI)
- [ ] Upload em batch via CSV
- [ ] Validação de duplicatas
- [ ] Histórico de alterações
- [ ] Suporte a polígonos de bairros

## Segurança

- ✅ Apenas admins podem acessar
- ✅ Validação no banco impede dados inválidos
- ✅ Logs de todas as operações
- ✅ Rollback automático em caso de erro

## Suporte

- Documentação completa: `../../../core/location/docs/LOCATION_COORDINATES_SYSTEM.md`
- Quick start: `../../../core/location/docs/LOCATION_COORDINATES_QUICKSTART.md`
- Status vigente: `../../../../docs/STATUS_ATUAL.md`
