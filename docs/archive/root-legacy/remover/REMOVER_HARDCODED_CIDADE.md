# Remoção de Dados Hardcoded - CidadeLandingPage

## 📋 Resumo

Identificadas **7 violações SSOT** na página `/cidade` com dados hardcoded que deveriam vir do banco de dados.

## ✅ Solução Implementada

### Migration Criada: `20250130000004_expand_city_metadata_jsonb.sql`

Expande a tabela `city_metadata` com campos JSONB para armazenar:

1. **emergency_contacts** - Contatos de emergência (SAMU, Bombeiros, etc.)
2. **utility_contacts** - Contatos de utilidade pública (Ouvidoria, Iluminação, etc.)
3. **tourist_attractions** - Pontos turísticos
4. **city_hall_info** - Informações da prefeitura
5. **elected_officials** - Políticos eleitos (executivo e legislativo)
6. **featured_districts** - Bairros em destaque

### Estrutura dos Dados

#### 1. Emergency Contacts
```json
[
  {
    "name": "SAMU",
    "phone": "192",
    "icon": "ambulance",
    "color": "red"
  }
]
```

#### 2. Utility Contacts
```json
[
  {
    "name": "Ouvidoria Municipal",
    "phone": "156",
    "type": "phone"
  }
]
```

#### 3. Tourist Attractions
```json
[
  {
    "name": "Pelourinho",
    "description": "Centro histórico...",
    "icon": "🏛️",
    "featured": true,
    "category": "historico"
  }
]
```

#### 4. City Hall Info
```json
{
  "name": "Prefeitura Municipal de Salvador",
  "address": "Praça Municipal...",
  "phone": "(71) 3202-6100",
  "email": "ouvidoria@salvador.ba.gov.br",
  "website": "https://www.salvador.ba.gov.br",
  "hours": "Seg a Sex, 8h às 17h",
  "social": {
    "instagram": "@prefeitura_ssa",
    "facebook": "PrefeituraDeSalvador",
    "twitter": "@prefeitura_ssa",
    "youtube": "PrefeituraDeSalvador"
  }
}
```

#### 5. Elected Officials
```json
{
  "executive": [
    {
      "name": "Bruno Reis",
      "position": "Prefeito",
      "party": "União Brasil",
      "term": "2025-2028",
      "photo_url": null
    }
  ],
  "legislative": {
    "president": {
      "name": "Carlos Muniz",
      "party": "PSDB",
      "term": "2025-2026"
    },
    "featured": [
      {"name": "Ireuda Silva", "party": "PSD"}
    ],
    "total_councilors": 43
  }
}
```

#### 6. Featured Districts
```json
[
  {
    "name": "Pituba",
    "description": "Centro empresarial...",
    "image_url": null,
    "residents_count": 15200,
    "posts_count": 89
  }
]
```

## 🔧 Funções Helper Criadas

A migration cria 6 funções SQL para facilitar queries:

```sql
-- Buscar contatos de emergência
SELECT get_emergency_contacts('salvador-ba');

-- Buscar contatos de utilidade
SELECT get_utility_contacts('salvador-ba');

-- Buscar pontos turísticos (todos ou apenas featured)
SELECT get_tourist_attractions('salvador-ba', false);
SELECT get_tourist_attractions('salvador-ba', true); -- apenas featured

-- Buscar info da prefeitura
SELECT get_city_hall_info('salvador-ba');

-- Buscar políticos eleitos
SELECT get_elected_officials('salvador-ba');

-- Buscar bairros em destaque
SELECT get_featured_districts('salvador-ba');
```

## 📝 Hook Atualizado

O hook `useCityMetadata` foi expandido para incluir os novos campos:

```typescript
export interface CityMetadata {
  // ... campos existentes
  emergency_contacts?: EmergencyContact[];
  utility_contacts?: UtilityContact[];
  tourist_attractions?: TouristAttraction[];
  city_hall_info?: CityHallInfo;
  elected_officials?: ElectedOfficials;
  featured_districts?: FeaturedDistrict[];
}
```

## 🚀 Como Aplicar

### 1. Aplicar Migration

```bash
supabase db push
```

Ou via Supabase Dashboard:
1. Acesse SQL Editor
2. Copie o conteúdo de `supabase/migrations/20250130000004_expand_city_metadata_jsonb.sql`
3. Execute

### 2. Atualizar CidadeLandingPage

Substituir as constantes hardcoded por dados do hook:

```typescript
// ANTES (hardcoded)
const CONTATOS_EMERGENCIA = [
  { nome: "SAMU", telefone: "192", ... },
];

// DEPOIS (do banco)
const { data: cityMetadata } = useCityMetadata(state, city);
const emergencyContacts = cityMetadata?.emergency_contacts ?? [];
```

### 3. Remover Constantes Hardcoded

Deletar do arquivo `CidadeLandingPage.tsx`:
- `BAIRROS_DESTAQUE`
- `PONTOS_TURISTICOS`
- `POLITICOS`
- `VEREADORES_DESTAQUE`
- `CONTATOS_EMERGENCIA`
- `CONTATOS_UTILIDADE`
- `PREFEITURA`

## 📊 Benefícios

### Antes (Hardcoded)
- ❌ Dados desatualizados
- ❌ Difícil manutenção
- ❌ Não escalável para outras cidades
- ❌ Sem gestão centralizada
- ❌ Viola SSOT

### Depois (Banco de Dados)
- ✅ Dados sempre atualizados
- ✅ Fácil manutenção via admin
- ✅ Escalável para múltiplas cidades
- ✅ Gestão centralizada
- ✅ Segue SSOT

## 🎯 Próximos Passos

### Curto Prazo
1. ✅ Aplicar migration
2. ⏳ Atualizar `CidadeLandingPage` para usar dados do banco
3. ⏳ Remover constantes hardcoded
4. ⏳ Testar página `/cidade`

### Médio Prazo
1. Adicionar página admin para gerenciar esses dados
2. Permitir upload de imagens para bairros e pontos turísticos
3. Adicionar validação de dados (telefones, URLs, etc.)

### Longo Prazo
1. Sistema de sugestões da IA para atualizar dados
2. Integração com APIs oficiais (dados de políticos, etc.)
3. Histórico de alterações
4. Versionamento de dados

## 🔍 Verificação

Após aplicar a migration, verificar:

```sql
-- Ver todos os dados de Salvador
SELECT * FROM city_metadata WHERE id = 'salvador-ba';

-- Ver apenas contatos de emergência
SELECT emergency_contacts FROM city_metadata WHERE id = 'salvador-ba';

-- Ver pontos turísticos em destaque
SELECT get_tourist_attractions('salvador-ba', true);

-- Contar quantos pontos turísticos existem
SELECT jsonb_array_length(tourist_attractions) as total
FROM city_metadata WHERE id = 'salvador-ba';
```

## 📚 Documentação Relacionada

- `ANALISE_SSOT_CIDADE_LANDING.md` - Análise completa das violações SSOT
- `CIDADE_LANDING_IMPLEMENTACAO.md` - Documentação da implementação original
- `supabase/migrations/20250130000004_expand_city_metadata_jsonb.sql` - Migration SQL

## ⚠️ Observações

1. **Vagas de Emprego** não foram incluídas nesta migration
   - Recomenda-se criar tabela dedicada `job_listings` no futuro
   - Ou integrar com API externa (LinkedIn, Indeed, etc.)

2. **Imagens dos Bairros** estão como `null` por enquanto
   - Adicionar URLs de imagens depois
   - Ou implementar upload de imagens

3. **Dados são específicos de Salvador**
   - Ao adicionar outras cidades, criar registros similares
   - Usar a mesma estrutura JSON

4. **Admin ainda não pode editar via interface**
   - Por enquanto, editar via SQL
   - Criar página admin depois
