# Análise SSOT - CidadeLandingPage

## ❌ Dados Hardcoded que Violam SSOT

### 1. **BAIRROS_DESTAQUE** (Linha 77)
```typescript
const BAIRROS_DESTAQUE = [
  { name: "Pituba", image: pituba, residents: "15.2k", posts: "89", ... },
  { name: "Rio Vermelho", image: riovermelho, residents: "9.8k", posts: "124", ... },
  // ... 6 bairros hardcoded
];
```

**Problema:**
- Dados de bairros deveriam vir da tabela `locations` (geographic_path)
- Número de moradores e posts deveriam ser calculados dinamicamente
- Imagens deveriam estar no banco ou CDN

**Solução:**
- Criar serviço `LocationService.getFeaturedDistricts(state, city)`
- Buscar bairros da cidade com mais atividade (posts, usuários)
- Armazenar imagens em `location_metadata` ou usar URLs

---

### 2. **VAGAS_EMPREGO** (Linha 157)
```typescript
const VAGAS_EMPREGO = [
  { titulo: "Desenvolvedor Full Stack", empresa: "TechBa Solutions", ... },
  // ... 6 vagas hardcoded
];
```

**Problema:**
- Não existe tabela `jobs` ou `job_listings` no banco
- Dados completamente mockados, sem fonte real
- Não há sistema de vagas implementado

**Solução:**
- Criar tabela `job_listings` no banco
- Criar serviço `JobService.getFeaturedJobs(filter)`
- Ou integrar com API externa de vagas (LinkedIn, Indeed, etc.)

---

### 3. **PONTOS_TURISTICOS** (Linha 166)
```typescript
const PONTOS_TURISTICOS = [
  { nome: "Pelourinho", descricao: "...", icone: "🏛️", destaque: true },
  // ... 6 pontos hardcoded
];
```

**Problema:**
- Dados turísticos deveriam estar no banco
- Não há tabela `tourist_attractions` ou similar
- Informações podem ficar desatualizadas

**Solução:**
- Criar tabela `tourist_attractions` ou `city_points_of_interest`
- Adicionar campos: nome, descrição, categoria, coordenadas, fotos
- Criar serviço `TourismService.getFeaturedAttractions(city)`

---

### 4. **POLITICOS** (Linha 175)
```typescript
const POLITICOS = [
  { nome: "Bruno Reis", cargo: "Prefeito", partido: "União Brasil", ... },
  // ... 3 políticos hardcoded
];

const VEREADORES_DESTAQUE = [
  { nome: "Ireuda Silva", partido: "PSD" },
  // ... 6 vereadores hardcoded
];
```

**Problema:**
- Dados políticos deveriam estar no banco
- Informações podem mudar (eleições, renúncias)
- Não há fonte oficial de dados

**Solução:**
- Criar tabela `elected_officials` ou adicionar a `city_metadata`
- Campos: nome, cargo, partido, mandato, foto_url
- Criar serviço `PoliticsService.getElectedOfficials(city)`
- Ou adicionar JSON em `city_metadata.elected_officials`

---

### 5. **CONTATOS_EMERGENCIA** (Linha 190)
```typescript
const CONTATOS_EMERGENCIA = [
  { nome: "SAMU", telefone: "192", icone: Ambulance, ... },
  // ... 4 contatos hardcoded
];
```

**Problema:**
- Telefones de emergência são nacionais (192, 193, 190)
- Mas podem variar por cidade/estado
- Deveriam estar em configuração do sistema

**Solução:**
- Adicionar a `city_metadata.emergency_contacts` (JSON)
- Ou criar tabela `emergency_contacts` com scope por cidade
- Permitir admin atualizar via painel

---

### 6. **CONTATOS_UTILIDADE** (Linha 197)
```typescript
const CONTATOS_UTILIDADE = [
  { nome: "Ouvidoria Municipal", telefone: "156", ... },
  // ... 4 contatos hardcoded
];
```

**Problema:**
- Telefones de utilidade pública variam por cidade
- Dados podem mudar (novos serviços, números atualizados)
- Não há fonte dinâmica

**Solução:**
- Adicionar a `city_metadata.utility_contacts` (JSON)
- Permitir admin gerenciar via painel
- Validar números periodicamente

---

### 7. **PREFEITURA** (Linha 204)
```typescript
const PREFEITURA = {
  nome: "Prefeitura Municipal de Salvador",
  endereco: "Praça Municipal, s/n - Centro, Salvador - BA, 40020-010",
  telefone: "(71) 3202-6100",
  email: "ouvidoria@salvador.ba.gov.br",
  site: "https://www.salvador.ba.gov.br",
  instagram: "@prefeitura_ssa",
  // ... mais dados hardcoded
};
```

**Problema:**
- Dados da prefeitura deveriam estar no banco
- Informações podem mudar (novo site, novos contatos)
- Não há gestão centralizada

**Solução:**
- Adicionar a `city_metadata.city_hall_info` (JSON)
- Ou criar tabela `city_hall_contacts`
- Permitir admin atualizar via painel

---

## ✅ O Que JÁ Está Seguindo SSOT

### 1. **Metadados da Cidade**
```typescript
const { data: cityMetadata } = useCityMetadata(state, city);
// ✅ Vem do banco via hook
```

### 2. **Empresas em Destaque**
```typescript
const { businesses } = useCityFeatured(state, city);
// ✅ Vem do banco via LandingFeaturedService
```

### 3. **Serviços em Destaque**
```typescript
const { services } = useCityFeatured(state, city);
// ✅ Vem do banco via LandingFeaturedService
```

### 4. **Classificados em Destaque**
```typescript
const { classifieds } = useCityFeatured(state, city);
// ✅ Vem do banco via LandingFeaturedService
```

---

## 📋 Plano de Ação para Conformidade SSOT

### Fase 1: Estrutura no Banco (Curto Prazo)

#### 1.1. Expandir `city_metadata`
```sql
ALTER TABLE city_metadata
ADD COLUMN emergency_contacts JSONB,
ADD COLUMN utility_contacts JSONB,
ADD COLUMN city_hall_info JSONB,
ADD COLUMN elected_officials JSONB;
```

#### 1.2. Criar Tabela de Pontos Turísticos
```sql
CREATE TABLE tourist_attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT REFERENCES city_metadata(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- historico, praia, cultural, religioso
  icon TEXT,
  is_featured BOOLEAN DEFAULT false,
  photos TEXT[],
  coordinates POINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 1.3. Criar Tabela de Vagas (Opcional)
```sql
CREATE TABLE job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  employment_type TEXT, -- CLT, PJ, Estagio, Autonomo
  salary_range TEXT,
  location_id UUID REFERENCES locations(id),
  district TEXT,
  tags TEXT[],
  description TEXT,
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Fase 2: Serviços (Médio Prazo)

#### 2.1. TourismService
```typescript
export class TourismService {
  static async getFeaturedAttractions(cityId: string, limit = 6) {
    // Query tourist_attractions WHERE city_id AND is_featured
  }
}
```

#### 2.2. JobService (se implementar)
```typescript
export class JobService {
  static async getFeaturedJobs(filter: TerritoryFilter, limit = 6) {
    // Query job_listings com filtro territorial
  }
}
```

#### 2.3. Expandir CityMetadataService
```typescript
export class CityMetadataService {
  static async getEmergencyContacts(cityId: string) {
    // Retorna city_metadata.emergency_contacts
  }
  
  static async getUtilityContacts(cityId: string) {
    // Retorna city_metadata.utility_contacts
  }
  
  static async getCityHallInfo(cityId: string) {
    // Retorna city_metadata.city_hall_info
  }
  
  static async getElectedOfficials(cityId: string) {
    // Retorna city_metadata.elected_officials
  }
}
```

### Fase 3: Hooks (Médio Prazo)

```typescript
// src/core/city/hooks/useCityTourism.ts
export function useCityTourism(cityId: string) {
  return useQuery({
    queryKey: ['city-tourism', cityId],
    queryFn: () => TourismService.getFeaturedAttractions(cityId),
  });
}

// src/core/city/hooks/useCityContacts.ts
export function useCityContacts(cityId: string) {
  return useQuery({
    queryKey: ['city-contacts', cityId],
    queryFn: () => CityMetadataService.getAllContacts(cityId),
  });
}
```

### Fase 4: Atualizar CidadeLandingPage (Médio Prazo)

```typescript
// Substituir constantes hardcoded por hooks
const { data: tourism } = useCityTourism(cityMetadata?.id);
const { data: contacts } = useCityContacts(cityMetadata?.id);
const { data: jobs } = useCityJobs(state, city); // se implementar
```

---

## 🎯 Priorização

### Alta Prioridade (Fazer Agora)
1. ✅ Expandir `city_metadata` com campos JSON
2. ✅ Migrar dados de contatos para o banco
3. ✅ Criar página admin para gerenciar contatos

### Média Prioridade (Próximas Sprints)
1. Criar tabela `tourist_attractions`
2. Implementar `TourismService`
3. Migrar dados de pontos turísticos

### Baixa Prioridade (Futuro)
1. Sistema de vagas (ou integração externa)
2. Sistema de gestão de políticos eleitos
3. Bairros em destaque dinâmicos

---

## 💡 Alternativa Rápida (Sem Criar Novas Tabelas)

Se não quiser criar novas tabelas agora, pode usar campos JSONB em `city_metadata`:

```sql
UPDATE city_metadata
SET 
  emergency_contacts = '[
    {"name": "SAMU", "phone": "192", "icon": "ambulance"},
    {"name": "Bombeiros", "phone": "193", "icon": "fire"}
  ]'::jsonb,
  utility_contacts = '[
    {"name": "Ouvidoria", "phone": "156"}
  ]'::jsonb,
  tourist_attractions = '[
    {"name": "Pelourinho", "description": "...", "featured": true}
  ]'::jsonb,
  city_hall_info = '{
    "name": "Prefeitura de Salvador",
    "address": "...",
    "phone": "..."
  }'::jsonb
WHERE id = 'salvador-ba';
```

Isso permite:
- ✅ Remover hardcoded imediatamente
- ✅ Admin pode editar via painel
- ✅ Dados versionados no banco
- ✅ Fácil de migrar para tabelas dedicadas depois

---

## 📊 Resumo

**Total de violações SSOT identificadas:** 7

**Dados hardcoded:**
- 6 bairros
- 6 vagas de emprego
- 6 pontos turísticos
- 9 políticos
- 8 contatos (emergência + utilidade)
- 1 objeto de prefeitura

**Impacto:**
- 🔴 Alto: Dados podem ficar desatualizados
- 🔴 Alto: Não há gestão centralizada
- 🟡 Médio: Dificulta manutenção
- 🟡 Médio: Não escalável para outras cidades

**Recomendação:**
Começar pela solução rápida (campos JSONB) e evoluir para tabelas dedicadas conforme necessidade.
