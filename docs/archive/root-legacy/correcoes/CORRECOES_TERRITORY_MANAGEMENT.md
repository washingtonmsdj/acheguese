# Correções Aplicadas - Territory Management

## ✅ Correções Implementadas

### 1. Hook useAdminTerritoryManagement
- ✅ Adicionado tratamento robusto de erros com try-catch
- ✅ Adicionado logs de console para debug
- ✅ Adicionado fallback para campos null/undefined
- ✅ Tratamento gracioso quando grupos não existem
- ✅ Validação de dados antes de mapear

### 2. Página AdminTerritoryManagement
- ✅ Adicionado tratamento de erro na UI
- ✅ Melhorado estado de loading com mensagem
- ✅ Adicionado try-catch na função buildTree
- ✅ Logs de debug na construção da árvore
- ✅ Identificação de nós órfãos

### 3. Componente TerritorialGroupForm
- ✅ Adicionado logs de debug nas mutations
- ✅ Invalidação de queries corrigida

### 4. Componente de Debug
- ✅ Criado TerritoryManagementDebug para diagnóstico
- ✅ Mostra estatísticas gerais
- ✅ Identifica nós órfãos
- ✅ Mostra dados brutos

## 📋 Próximos Passos

### Passo 1: Acessar a Página
1. Acesse: `http://localhost:8080/admin/territory-management`
2. Abra o Console do Navegador (F12)
3. Observe os logs e o painel de debug

### Passo 2: Verificar Logs
Procure por:
- `Locations fetched: X` - Quantas locations foram carregadas
- `Groups fetched: X` - Quantos grupos foram carregados
- `Building tree from locations: X` - Construção da árvore
- `Map created with X nodes` - Mapa de nós
- `Tree built with X root nodes` - Nós raiz
- Avisos de nós órfãos

### Passo 3: Analisar Painel de Debug
O painel azul no topo mostra:
- Total de locations e grupos
- Nós raiz (devem existir)
- Nós órfãos (não devem existir - indica problema no banco)
- Locations por tipo
- Dados brutos

### Passo 4: Executar Queries SQL
Execute o arquivo `test-territory-management.sql` no Supabase SQL Editor para:
- Verificar estrutura dos dados
- Identificar nós órfãos
- Verificar metadata null
- Verificar políticas RLS

## 🔍 Problemas Comuns e Soluções

### Problema 1: Nós Órfãos
**Sintoma**: Painel de debug mostra nós órfãos
**Causa**: parent_id aponta para ID inexistente
**Solução**: Corrigir no banco ou remover parent_id

```sql
-- Identificar órfãos
SELECT l.id, l.name, l.parent_id
FROM locations l
WHERE l.parent_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM locations p WHERE p.id = l.parent_id);

-- Corrigir (exemplo: tornar raiz)
UPDATE locations SET parent_id = NULL WHERE id = 'ID_DO_ORFAO';
```

### Problema 2: Metadata NULL
**Sintoma**: Erro ao acessar metadata.is_selector_active
**Causa**: Campo metadata é NULL
**Solução**: Inicializar metadata

```sql
UPDATE locations SET metadata = '{}'::jsonb WHERE metadata IS NULL;
UPDATE territorial_groups SET metadata = '{}'::jsonb WHERE metadata IS NULL;
```

### Problema 3: Sem Nós Raiz
**Sintoma**: Árvore vazia, nenhum nó raiz
**Causa**: Todos os locations têm parent_id
**Solução**: Deve existir pelo menos um país (type='country', parent_id=NULL)

```sql
-- Verificar países
SELECT * FROM locations WHERE type = 'country' AND parent_id IS NULL;
```

### Problema 4: Erro de Permissão (RLS)
**Sintoma**: Erro 403 ou "permission denied"
**Causa**: Políticas RLS bloqueando acesso
**Solução**: Verificar políticas

```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('locations', 'territorial_groups');
```

## 🎯 Ativar Salvador e Complexo

Após corrigir os erros, execute:

```sql
-- Ativar Salvador
UPDATE locations 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_selector_active": true}'::jsonb
WHERE geographic_path = '/br/ba/salvador'
  AND status = 'active';

-- Ativar Complexo do Nordeste de Amaralina
UPDATE territorial_groups 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"is_selector_active": true}'::jsonb
WHERE slug = 'complexo-do-nordeste-de-amaralina'
  AND status = 'active';
```

## 🧹 Remover Debug

Após resolver os problemas, remover o painel de debug:

1. Abrir `src/modules/admin/pages/AdminTerritoryManagement.tsx`
2. Remover import: `import { TerritoryManagementDebug } from '../components/TerritoryManagementDebug';`
3. Remover linha: `<TerritoryManagementDebug />`
4. (Opcional) Deletar arquivo: `src/modules/admin/components/TerritoryManagementDebug.tsx`

## 📊 Arquivos Criados

1. `activate-territories.sql` - Script para ativar territórios
2. `test-territory-management.sql` - Queries de diagnóstico
3. `DIAGNOSTICO_TERRITORY_MANAGEMENT.md` - Análise inicial
4. `CORRECOES_TERRITORY_MANAGEMENT.md` - Este arquivo
5. `src/modules/admin/components/TerritoryManagementDebug.tsx` - Componente de debug

## 🎉 Resultado Esperado

Após as correções, a página deve:
- ✅ Carregar sem erros
- ✅ Mostrar hierarquia de territórios (País → Estado → Cidade → Bairro)
- ✅ Mostrar grupos territoriais sob suas cidades âncora
- ✅ Permitir toggle de visibilidade
- ✅ Buscar territórios
- ✅ Criar novos grupos territoriais
