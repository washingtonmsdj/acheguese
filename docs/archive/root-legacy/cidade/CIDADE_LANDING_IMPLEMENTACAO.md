# Implementação da Página da Cidade (CidadeLandingPage)

## Visão Geral

A página `/cidade` foi completamente atualizada para combinar:
- **Dados dinâmicos** do banco de dados (empresas, serviços, classificados reais)
- **Dados mockados** para comparação visual (2 mocks + 4 reais por seção)
- **Metadados da cidade** gerenciáveis pelo admin e IA (população, bairros, etc.)
- **Conteúdo institucional** (vagas, turismo, políticos, contatos de emergência)

### Sistema de Comparação Mock vs Real

Para facilitar a visualização e comparação, cada seção de conteúdo dinâmico exibe:
- **2 cards com dados MOCK** (📋 badge amarelo) - Dados hardcoded de exemplo
- **4 cards com dados REAL** (✅ badge colorido) - Dados reais do Supabase

Isso permite comparar visualmente a diferença entre dados mockados e dados reais do banco.

## Estrutura Criada

### 1. Hooks

#### `useCityMetadata` (`src/core/city/hooks/useCityMetadata.ts`)
- Busca metadados da cidade do banco de dados
- Retorna: população, número de bairros, empresas ativas, escolas, profissionais, linhas de ônibus
- Usa valores padrão de Salvador enquanto não há dados no banco
- Cache de 10 minutos (dados mudam raramente)

#### `useCityFeatured` (`src/core/city/hooks/useCityFeatured.ts`)
- Busca conteúdo em destaque da cidade inteira
- Retorna: top 6 empresas, serviços e classificados
- Usa o mesmo serviço do `useLandingFeatured` mas com escopo de cidade

### 2. Banco de Dados

#### Tabela `city_metadata`
```sql
CREATE TABLE city_metadata (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  population INTEGER,
  districts_count INTEGER,
  active_businesses INTEGER,
  schools_count INTEGER,
  professionals_count INTEGER,
  bus_lines_count INTEGER,
  description TEXT,
  founded_year INTEGER,
  area_km2 NUMERIC(10, 2),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(state, city)
);
```

**Políticas RLS:**
- Leitura pública (qualquer um pode ler)
- Escrita apenas para admins

**Dados iniciais:**
- Salvador, BA já inserido com dados reais

### 3. Página Admin

#### `AdminCityMetadata` (`src/modules/admin/pages/AdminCityMetadata.tsx`)
- Interface para admins atualizarem metadados da cidade
- Campos editáveis:
  - População
  - Número de bairros
  - Empresas ativas
  - Escolas
  - Profissionais
  - Linhas de ônibus
  - Ano de fundação
  - Área (km²)
  - Descrição

**Acesso:** `/admin/city-metadata`

### 4. Página Atualizada

#### `CidadeLandingPage` (`src/app/pages/CidadeLandingPage.tsx`)

**Seções com dados dinâmicos (Mock + Real):**
1. **Estatísticas da cidade** - Usa `useCityMetadata()`
2. **Empresas em destaque** - 2 mocks + 4 reais do Supabase
3. **Profissionais em destaque** - 2 mocks + 4 reais do Supabase
4. **Classificados recentes** - 2 mocks + 4 reais do Supabase

**Identificação Visual:**
- Cards com badge **📋 MOCK** (amarelo) = Dados hardcoded
- Cards com badge **✅ REAL** (colorido) = Dados do banco
- Legenda explicativa no topo de cada seção
- Mocks não são clicáveis, reais navegam para páginas corretas

**Seções com dados mockados (institucional):**
5. Bairros em destaque (imagens e descrições)
6. Vagas de emprego
7. Pontos turísticos
8. Políticos eleitos
9. Contatos de emergência
10. Contatos de utilidade pública
11. Rodapé da prefeitura

## Como Funciona

### Fluxo de Dados

```
1. Usuário acessa /cidade ou /cidade/ba/salvador
   ↓
2. CidadeLandingPage carrega
   ↓
3. useCityMetadata busca metadados (população, bairros, etc.)
   ↓
4. useCityFeatured busca conteúdo real (empresas, serviços, classificados)
   ↓
5. Página renderiza com dados reais + conteúdo institucional
```

### Atualização de Dados

**Admin:**
1. Acessa `/admin/city-metadata`
2. Edita os campos desejados
3. Salva
4. Dados são atualizados no banco
5. Cache é invalidado
6. Página `/cidade` reflete as mudanças

**IA (futuro):**
- Pode sugerir atualizações baseadas em fontes oficiais
- Admin aprova ou rejeita as sugestões
- Sistema atualiza automaticamente

## Diferenças: /cidade vs /ba/salvador

### `/cidade` (nova implementação)
- **Escopo:** Cidade inteira
- **Dados:** Metadados gerenciáveis + conteúdo real do banco
- **Público:** Visitantes, turistas, novos usuários
- **Conteúdo:** Institucional + dinâmico
- **Seções únicas:**
  - Vagas de emprego
  - Pontos turísticos
  - Políticos eleitos
  - Contatos de emergência
  - Rodapé da prefeitura

### `/ba/salvador` (territorial)
- **Escopo:** Território específico (bairro ou grupo)
- **Dados:** 100% dinâmico do banco
- **Público:** Moradores, usuários ativos
- **Conteúdo:** Comunitário
- **Seções únicas:**
  - Destaques editoriais (highlights)
  - Conteúdo gerado por IA sobre o bairro
  - Gastronomia específica
  - Lazer e atividades

## Próximos Passos

### Curto Prazo
1. ✅ Criar tabela `city_metadata`
2. ✅ Implementar hooks `useCityMetadata` e `useCityFeatured`
3. ✅ Atualizar `CidadeLandingPage` com dados reais
4. ✅ Criar página admin `AdminCityMetadata`
5. ⏳ Aplicar migration no banco
6. ⏳ Testar página `/cidade` com dados reais

### Médio Prazo
1. Adicionar mais cidades (Rio, São Paulo, etc.)
2. Criar sistema de sugestões da IA para metadados
3. Adicionar gráficos e visualizações de dados
4. Implementar busca de vagas reais (integração com APIs)
5. Adicionar pontos turísticos dinâmicos do banco

### Longo Prazo
1. Sistema de aprovação de sugestões da IA
2. Dashboard de analytics da cidade
3. Comparação entre cidades
4. Exportação de relatórios
5. API pública de metadados das cidades

## Comandos Úteis

### Aplicar Migration
```bash
# Via Supabase CLI
supabase db push

# Ou via SQL direto no Supabase Dashboard
# Copiar conteúdo de: supabase/migrations/20250130_create_city_metadata.sql
```

### Testar Localmente
```bash
# Acessar a página
http://localhost:8080/cidade

# Acessar admin
http://localhost:8080/admin/city-metadata
```

### Verificar Dados
```sql
-- Ver metadados de Salvador
SELECT * FROM city_metadata WHERE id = 'salvador-ba';

-- Atualizar manualmente
UPDATE city_metadata 
SET population = 3000000 
WHERE id = 'salvador-ba';
```

## Observações Importantes

1. **Cache:** Os dados têm cache de 10 minutos. Para ver mudanças imediatas, limpe o cache do navegador.

2. **Fallback:** Se não houver dados no banco, usa valores padrão de Salvador.

3. **Permissões:** Apenas admins podem editar metadados. Usuários comuns só leem.

4. **Performance:** Queries são otimizadas com índices e cache adequado.

5. **SEO:** A página está preparada para SEO com metadados dinâmicos.

## Troubleshooting

### Dados não aparecem
- Verificar se a migration foi aplicada
- Verificar se há dados na tabela `city_metadata`
- Limpar cache do navegador
- Verificar console do navegador por erros

### Admin não consegue editar
- Verificar se o usuário tem role 'admin' na tabela `profiles`
- Verificar políticas RLS da tabela `city_metadata`
- Verificar logs do Supabase

### Performance lenta
- Verificar índices da tabela
- Ajustar staleTime dos hooks se necessário
- Verificar tamanho das imagens na página
