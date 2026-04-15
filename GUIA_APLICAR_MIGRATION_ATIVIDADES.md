# 🚀 Guia: Aplicar Migration de Atividades

**Data**: 2026-04-15  
**Migration**: `20260415000000_create_activity_feed_system.sql`

---

## 📋 Pré-requisitos

- ✅ Código implementado (100% completo)
- ✅ Migration SQL criada
- ⏳ Banco de dados acessível
- ⏳ Supabase CLI instalado (ou acesso ao dashboard)

---

## 🔧 Opção 1: Aplicar via Supabase CLI (Recomendado)

### 1. Verificar Migrations Pendentes

```bash
npx supabase migration list
```

Você deve ver:
```
20260415000000_create_activity_feed_system.sql (pending)
```

### 2. Aplicar Migration

```bash
npx supabase db push
```

Ou aplicar migration específica:

```bash
npx supabase migration up
```

### 3. Verificar Aplicação

```bash
npx supabase db diff
```

Não deve haver diferenças se tudo foi aplicado corretamente.

---

## 🔧 Opção 2: Aplicar via Dashboard Supabase

### 1. Acessar SQL Editor

1. Abra o dashboard do Supabase
2. Vá em **SQL Editor**
3. Clique em **New Query**

### 2. Copiar e Executar SQL

1. Abra o arquivo `supabase/migrations/20260415000000_create_activity_feed_system.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor
4. Clique em **Run**

### 3. Verificar Sucesso

Você deve ver mensagens de sucesso para:
- ✅ ALTER TABLE profiles (share_activity_default)
- ✅ ALTER TABLE delivery_requests (share_as_activity)
- ✅ CREATE INDEX (3 índices)
- ✅ CREATE FUNCTION (get_recent_gastronomy_activities)
- ✅ GRANT EXECUTE

---

## ✅ Verificação Pós-Migration

### 1. Verificar Campos Criados

Execute no SQL Editor:

```sql
-- Verificar campo em profiles
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND column_name = 'share_activity_default';

-- Verificar campo em delivery_requests
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'delivery_requests' 
  AND column_name = 'share_as_activity';
```

**Resultado esperado**:
```
share_activity_default | boolean | true
share_as_activity      | boolean | false
```

### 2. Verificar Índices Criados

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE indexname IN (
  'idx_reviews_activity_feed',
  'idx_favorites_activity_feed',
  'idx_delivery_requests_activity_feed'
);
```

**Resultado esperado**: 3 linhas

### 3. Verificar Function Criada

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_recent_gastronomy_activities';
```

**Resultado esperado**: 1 linha (FUNCTION)

### 4. Testar Function

```sql
-- Testar sem filtros (todas as atividades)
SELECT * FROM get_recent_gastronomy_activities(
  p_geographic_path_pattern := NULL,
  p_limit := 5,
  p_types := NULL
);

-- Testar com filtro territorial (Salvador)
SELECT * FROM get_recent_gastronomy_activities(
  p_geographic_path_pattern := '^BR\.BA\.Salvador\.',
  p_limit := 5,
  p_types := NULL
);

-- Testar apenas reviews
SELECT * FROM get_recent_gastronomy_activities(
  p_geographic_path_pattern := NULL,
  p_limit := 5,
  p_types := ARRAY['review']::text[]
);
```

---

## 🧪 Testes de Integração

### 1. Criar Dados de Teste

#### a) Criar Review (Automático)

```sql
-- Inserir review de teste
INSERT INTO reviews (
  reviewed_profile_id,
  reviewer_profile_id,
  rating,
  comment,
  review_type,
  status
) VALUES (
  '<business_id>',
  '<user_profile_id>',
  5,
  'Excelente comida!',
  'business',
  'active'
);
```

#### b) Criar Favorito (Automático)

```sql
-- Inserir favorito de teste
INSERT INTO user_favorite_businesses (
  user_id,
  business_id
) VALUES (
  '<user_id>',
  '<business_id>'
);
```

#### c) Criar Pedido com Compartilhamento (Opt-in)

```sql
-- Inserir pedido com compartilhamento
INSERT INTO delivery_requests (
  customer_id,
  business_id,
  delivery_mode,
  share_as_activity  -- OPT-IN
) VALUES (
  '<user_id>',
  '<business_id>',
  'delivery',
  true  -- Usuário optou por compartilhar
);
```

### 2. Verificar no Feed

```sql
-- Buscar atividades recentes
SELECT 
  type,
  user_name,
  business_name,
  action_label,
  emoji,
  created_at
FROM get_recent_gastronomy_activities(
  p_geographic_path_pattern := NULL,
  p_limit := 10,
  p_types := NULL
)
ORDER BY created_at DESC;
```

**Resultado esperado**: Deve mostrar as 3 atividades criadas acima.

---

## 🎨 Testar na UI

### 1. Iniciar Aplicação

```bash
npm run dev
```

### 2. Navegar para Gastronomia

Acesse: `http://localhost:5173/gastronomia`

### 3. Verificar Seção "Atividade dos Vizinhos"

**Cenários de Teste**:

#### ✅ Com Atividades
- Deve mostrar seção com scroll horizontal
- Cada item deve ter: emoji, nome do usuário, ação, nome do estabelecimento, tempo
- Animação de entrada deve funcionar

#### ✅ Sem Atividades (Dev)
- Em desenvolvimento: Deve mostrar empty state
- Mensagem: "Nenhuma atividade recente nesta região ainda."

#### ✅ Sem Atividades (Prod)
- Em produção: Seção deve estar oculta completamente

#### ✅ Loading State
- Ao carregar: Deve mostrar skeleton com 5 placeholders animados

#### ✅ Error State
- Se houver erro: Deve mostrar mensagem de erro

### 4. Testar Filtros Territoriais

1. Mudar seletor territorial (ex: Salvador → Nordeste)
2. Verificar que atividades são filtradas corretamente
3. Apenas atividades do território selecionado devem aparecer

---

## 🔐 Testar Privacidade

### 1. Configuração Padrão do Usuário

```sql
-- Verificar configuração padrão
SELECT user_id, share_activity_default
FROM profiles
WHERE user_id = '<seu_user_id>';

-- Alterar configuração
UPDATE profiles
SET share_activity_default = false
WHERE user_id = '<seu_user_id>';
```

### 2. Opt-in de Pedidos

No checkout de pedido, deve aparecer:
```
☐ Compartilhar esta atividade com vizinhos
  Outros usuários verão que você fez um pedido neste estabelecimento
```

- Se marcado: `share_as_activity = true` → Aparece no feed
- Se desmarcado: `share_as_activity = false` → NÃO aparece no feed

### 3. Verificar Regras

```sql
-- Reviews: Sempre aparecem (não tem controle)
SELECT COUNT(*) FROM reviews WHERE status = 'active';

-- Favoritos: Sempre aparecem (não tem controle)
SELECT COUNT(*) FROM user_favorite_businesses;

-- Pedidos: Apenas com opt-in
SELECT COUNT(*) FROM delivery_requests WHERE share_as_activity = true;
SELECT COUNT(*) FROM delivery_requests WHERE share_as_activity = false;
```

---

## 📊 Monitorar Performance

### 1. Verificar Uso de Índices

```sql
EXPLAIN ANALYZE
SELECT * FROM get_recent_gastronomy_activities(
  p_geographic_path_pattern := '^BR\.BA\.Salvador\.',
  p_limit := 10,
  p_types := NULL
);
```

**Verificar**:
- ✅ Índices estão sendo usados (Index Scan)
- ✅ Tempo de execução < 100ms
- ✅ Sem Sequential Scans em tabelas grandes

### 2. Verificar Cache do React Query

No DevTools do navegador:
1. Abrir React Query DevTools
2. Verificar query `['gastronomy', 'activities', ...]`
3. Verificar `staleTime: 120000` (2 minutos)
4. Verificar que não refetch desnecessários

---

## ⚠️ Troubleshooting

### Problema: Function não encontrada

**Erro**: `function get_recent_gastronomy_activities does not exist`

**Solução**:
```sql
-- Verificar se function existe
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'get_recent_gastronomy_activities';

-- Se não existir, executar migration novamente
```

### Problema: Campos não existem

**Erro**: `column "share_activity_default" does not exist`

**Solução**:
```sql
-- Adicionar campo manualmente
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS share_activity_default BOOLEAN DEFAULT true;

ALTER TABLE delivery_requests 
ADD COLUMN IF NOT EXISTS share_as_activity BOOLEAN DEFAULT false;
```

### Problema: Nenhuma atividade aparece

**Verificar**:
1. Existem dados nas tabelas? (reviews, user_favorite_businesses, delivery_requests)
2. Filtro territorial está correto?
3. Campo `share_as_activity` está true para pedidos?
4. Campo `status` está 'active' para reviews?

```sql
-- Debug: Ver todas as atividades sem filtro
SELECT * FROM get_recent_gastronomy_activities(NULL, 100, NULL);
```

### Problema: Erro de permissão

**Erro**: `permission denied for function get_recent_gastronomy_activities`

**Solução**:
```sql
-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_recent_gastronomy_activities TO authenticated;
```

---

## ✅ Checklist Final

- [ ] Migration aplicada com sucesso
- [ ] Campos criados em profiles e delivery_requests
- [ ] Índices criados
- [ ] Function criada e testada
- [ ] Dados de teste criados
- [ ] UI mostra atividades corretamente
- [ ] Loading state funciona
- [ ] Empty state funciona (dev)
- [ ] Filtros territoriais funcionam
- [ ] Privacidade (opt-in) funciona
- [ ] Performance aceitável (< 100ms)
- [ ] Cache do React Query funciona

---

## 🎉 Sucesso!

Se todos os itens acima estão ✅, a funcionalidade está **100% operacional** e seguindo SSOT!

**Próximos Passos**:
- Monitorar uso em produção
- Coletar feedback dos usuários
- Ajustar limite de atividades se necessário
- Implementar `getUserActivities` e `getBusinessActivities` (futuro)

---

**Documentação Relacionada**:
- `ANALISE_ATIVIDADES_GASTRONOMIA.md` - Análise completa
- `PROGRESSO_ATIVIDADES_GASTRONOMIA.md` - Progresso da implementação
- `src/modules/gastronomy/README.md` - Documentação do módulo
