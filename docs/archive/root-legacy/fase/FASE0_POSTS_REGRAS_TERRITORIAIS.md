# FASE 0 - REGRAS TERRITORIAIS POSTS

**Data**: 2026-04-05  
**Status**: ⏳ PENDENTE - Aguardando Decisões  
**Sprint**: Sprint 2 - Posts

---

## OBJETIVO

Definir as regras territoriais para posts antes de iniciar implementação:
1. Relação entre location_id e reach
2. Níveis territoriais permitidos
3. Comportamento de expansão territorial
4. Validação e rejeição

---

## DECISÃO 1: Relação location_id vs reach

### Contexto

**Situação Atual**:
- `useCreatePostForm` usa `reach` (street/neighborhood/city)
- `CreatePostModal` não captura `location_id`
- `PostService.createPost()` usa campos legados (city, neighborhood, street)
- Não há integração entre reach e location_id

**Problema**:
```typescript
// Hook retorna reach
const data = form.getFormData();
// { content, type, reach: "neighborhood", images }

// Modal não converte reach → location_id
await postService.createSimplePost({
  author_profile_id: profile.id,
  content: data.content,
  // ❌ location_id não é definido
  // ❌ reach não é usado
});
```

### Opções

#### Opção A: Remover reach, usar apenas location_id do perfil

**Comportamento**:
- Post sempre usa `profile.location_id`
- Não há seletor de reach
- Simplicidade máxima

**Prós**:
- ✅ Simples de implementar
- ✅ Consistente com SSOT
- ✅ Sem ambiguidade

**Contras**:
- ❌ Perde funcionalidade de reach
- ❌ Usuário não pode escolher visibilidade

**Exemplo**:
```typescript
// Perfil em Barra (bairro)
profile.location_id = "barra_id"

// Post criado
post.location_id = "barra_id"  // Sempre o bairro do perfil
```

---

#### Opção B: reach como metadado, location_id como território

**Comportamento**:
- `location_id` sempre vem do perfil (SSOT)
- `reach` é metadado de visibilidade/alcance
- Filtros usam location_id + expansão territorial

**Prós**:
- ✅ Mantém funcionalidade de reach
- ✅ location_id consistente com SSOT
- ✅ Separação clara: território vs visibilidade

**Contras**:
- ⚠️ Mais complexo
- ⚠️ Precisa definir semântica de reach

**Exemplo**:
```typescript
// Perfil em Barra (bairro)
profile.location_id = "barra_id"

// Post criado com reach "city"
post.location_id = "barra_id"  // Território: Barra
post.reach = "city"             // Visibilidade: Cidade

// Feed de Salvador (cidade)
// Expande para todos os bairros, incluindo Barra
// Post aparece porque Barra ∈ Salvador
```

---

#### Opção C: reach define location_id (conversão)

**Comportamento**:
- Usuário escolhe reach (street/neighborhood/city)
- Sistema converte reach → location_id apropriado
- Post usa location_id convertido

**Prós**:
- ✅ Mantém UX de reach
- ✅ location_id sempre definido
- ✅ Flexibilidade para usuário

**Contras**:
- ❌ Complexo: precisa resolver rua/bairro/cidade
- ❌ Pode não ter location_id para rua
- ❌ Ambiguidade: qual cidade se perfil está em bairro?

**Exemplo**:
```typescript
// Perfil em Barra (bairro)
profile.location_id = "barra_id"

// Usuário escolhe reach "city"
// Sistema resolve: Barra → Salvador (cidade pai)
post.location_id = "salvador_id"  // Cidade
post.reach = "city"

// Problema: E se usuário escolher "street"?
// Não temos location_id para ruas
```

---

### ⏳ DECISÃO NECESSÁRIA

**Recomendação**: Opção B (reach como metadado)

**Justificativa**:
1. Mantém funcionalidade de reach
2. location_id sempre consistente (perfil)
3. Separação clara de responsabilidades
4. Expansão territorial resolve visibilidade

**Aguardando aprovação**

---

## DECISÃO 2: Níveis Territoriais Permitidos

### Contexto

**Pergunta**: Posts podem ser criados em qual nível territorial?

### Opções

#### Opção A: Apenas Bairros (districts)

**Comportamento**:
- Posts só podem ter `location_id` de bairro
- Perfis devem ter bairro definido
- Validação rejeita location_id de cidade

**Prós**:
- ✅ Consistência máxima
- ✅ Granularidade adequada
- ✅ Simples de validar

**Contras**:
- ❌ Usuários sem bairro não podem postar
- ❌ Menos flexível

---

#### Opção B: Bairros e Cidades

**Comportamento**:
- Posts podem ter location_id de bairro OU cidade
- Perfis podem ter bairro ou cidade
- Validação aceita ambos

**Prós**:
- ✅ Mais flexível
- ✅ Suporta usuários sem bairro
- ✅ Permite posts de cidade

**Contras**:
- ⚠️ Mais complexo
- ⚠️ Precisa tratar ambos os casos

---

### ⏳ DECISÃO NECESSÁRIA

**Recomendação**: Opção B (bairros e cidades)

**Justificativa**:
1. Suporta usuários sem bairro definido
2. Permite posts de escopo mais amplo
3. Consistente com tourist_points (aceita ambos)
4. Expansão territorial funciona para ambos

**Aguardando aprovação**

---

## DECISÃO 3: Expansão Territorial

### Contexto

**Pergunta**: Como funciona a expansão territorial para posts?

### Comportamento Esperado

**Cenário 1: Usuário em Salvador (cidade)**
```typescript
user.location_id = "salvador_id"  // Cidade

// Feed deve mostrar:
1. Posts com location_id = "salvador_id" (posts da cidade)
2. Posts com location_id ∈ distritos de Salvador (posts dos bairros)

// Expansão: cidade → cidade + todos os distritos
expanded_ids = ["salvador_id", "barra_id", "pelourinho_id", ...]
```

**Cenário 2: Usuário em Barra (bairro)**
```typescript
user.location_id = "barra_id"  // Bairro

// Feed deve mostrar:
1. Posts com location_id = "barra_id" (posts do bairro)
2. Posts com location_id = "salvador_id" (posts da cidade pai)

// Expansão: bairro → bairro + cidade pai
expanded_ids = ["barra_id", "salvador_id"]
```

### Regras de Expansão

**Cidade → Cidade + Distritos**:
```typescript
if (location.type === 'city') {
  expanded.push(location.id);  // Incluir cidade
  
  const districts = await getDistrictsByCity(location.id);
  expanded.push(...districts.map(d => d.id));  // Incluir distritos
}
```

**Bairro → Bairro + Cidade Pai**:
```typescript
if (location.type === 'district') {
  expanded.push(location.id);  // Incluir bairro
  
  if (location.parent_id) {
    expanded.push(location.parent_id);  // Incluir cidade pai
  }
}
```

### ⏳ DECISÃO NECESSÁRIA

**Recomendação**: Implementar ambas as expansões

**Justificativa**:
1. Consistente com tourist_points
2. Usuário vê posts relevantes do seu contexto
3. Posts de cidade aparecem em feeds de bairros
4. Posts de bairros aparecem em feeds de cidade

**Aguardando aprovação**

---

## DECISÃO 4: Validação e Rejeição

### Contexto

**Pergunta**: O que fazer quando location_id é inválido?

### Cenários

**Cenário 1: location_id null**
```typescript
// Perfil sem location_id
profile.location_id = null

// Tentativa de criar post
await postService.createPost({
  author_profile_id: profile.id,
  content: "...",
  location_id: null,  // ❌ Inválido
});

// Opções:
A) Rejeitar com erro
B) Usar cidade padrão
C) Permitir (temporário)
```

**Cenário 2: location_id inválido**
```typescript
// location_id não existe no SSOT
post.location_id = "xyz-invalid"

// Opções:
A) Rejeitar com erro
B) Tentar resolver
C) Usar fallback
```

**Cenário 3: location_id de tipo inválido**
```typescript
// location_id de rua (não permitido)
post.location_id = "rua_xyz_id"  // type = 'street'

// Opções:
A) Rejeitar com erro
B) Usar bairro pai
C) Permitir (se Decisão 2 = apenas bairros)
```

### ⏳ DECISÃO NECESSÁRIA

**Recomendação**: Rejeitar com erro (Opção A para todos)

**Justificativa**:
1. Validação rigorosa desde o início
2. Força correção de dados
3. Evita posts órfãos
4. Consistente com SSOT

**Comportamento**:
```typescript
// Validação no service
if (!data.location_id) {
  throw new PostError(
    "Configure sua localização no perfil antes de publicar",
    "LOCATION_REQUIRED"
  );
}

const location = await getLocationById(data.location_id);
if (!location) {
  throw new PostError(
    "Localização inválida",
    "INVALID_LOCATION"
  );
}

if (!['city', 'district'].includes(location.type)) {
  throw new PostError(
    "Posts só podem ser criados em cidades ou bairros",
    "INVALID_LOCATION_TYPE"
  );
}
```

**Aguardando aprovação**

---

## DECISÃO 5: Migração de Dados Legados

### Contexto

**Pergunta**: Como tratar posts existentes com city/neighborhood?

### Estratégia de Backfill

**Cenário 1: Match Exato**
```sql
-- Bairro existe no SSOT
UPDATE posts p
SET location_id = (
  SELECT l.id
  FROM locations l
  WHERE l.type = 'district'
    AND l.name = p.neighborhood
    AND l.parent_id IN (
      SELECT id FROM locations 
      WHERE type = 'city' AND name = p.city
    )
    AND l.status = 'active'
)
WHERE p.location_id IS NULL
  AND EXISTS (
    SELECT 1 FROM locations l
    WHERE l.type = 'district'
      AND l.name = p.neighborhood
      AND l.parent_id IN (
        SELECT id FROM locations 
        WHERE type = 'city' AND name = p.city
      )
      AND l.status = 'active'
  );
```

**Cenário 2: Match Ambíguo**
```sql
-- Múltiplos bairros com mesmo nome
-- Exemplo: "Centro" existe em várias cidades

-- Solução: Revisão manual
INSERT INTO posts_ambiguous_location (post_id, city, neighborhood, possible_locations)
SELECT ...
WHERE (
  SELECT COUNT(*) 
  FROM locations l
  WHERE l.type = 'district'
    AND l.name = p.neighborhood
    AND l.parent_id IN (
      SELECT id FROM locations 
      WHERE type = 'city' AND name = p.city
    )
) > 1;
```

**Cenário 3: Sem Match**
```sql
-- Bairro não existe no SSOT

-- Se Decisão 2 = Bairros e Cidades:
-- Usar cidade como fallback
UPDATE posts p
SET location_id = (
  SELECT id FROM locations
  WHERE type = 'city' AND name = p.city AND status = 'active'
  LIMIT 1
)
WHERE p.location_id IS NULL
  AND p.city IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM locations l
    WHERE l.type = 'district'
      AND l.name = p.neighborhood
      AND l.parent_id IN (
        SELECT id FROM locations WHERE type = 'city' AND name = p.city
      )
  );

-- Se Decisão 2 = Apenas Bairros:
-- Marcar para revisão manual
INSERT INTO posts_pending_location (post_id, city, neighborhood, reason)
SELECT id, city, neighborhood, 'Bairro não encontrado no SSOT'
FROM posts
WHERE location_id IS NULL;
```

### ⏳ DECISÃO NECESSÁRIA

**Recomendação**: Estratégia em 3 etapas

1. Match Exato → Automático
2. Match Ambíguo → Revisão Manual
3. Sem Match → Cidade (se Decisão 2 = B) ou Revisão Manual (se Decisão 2 = A)

**Aguardando aprovação**

---

## RESUMO DAS DECISÕES

| # | Decisão | Status | Recomendação |
|---|---------|--------|--------------|
| 1 | location_id vs reach | ⏳ PENDENTE | Opção B (reach como metadado) |
| 2 | Níveis territoriais | ⏳ PENDENTE | Opção B (bairros e cidades) |
| 3 | Expansão territorial | ⏳ PENDENTE | Ambas (cidade↔bairros) |
| 4 | Validação e rejeição | ⏳ PENDENTE | Rejeitar com erro |
| 5 | Migração de legados | ⏳ PENDENTE | 3 etapas (exato/ambíguo/sem match) |

---

## IMPACTO NA IMPLEMENTAÇÃO

### Se Decisões Aprovadas

**Fase 0.5: Consolidação Estrutural**:
- Adicionar coluna `reach` em posts (opcional, metadado)
- Manter `location_id` como obrigatório

**Fase 1: Modelagem**:
- Validação: location_id obrigatório, tipo city ou district
- Backfill: 3 etapas (exato/ambíguo/sem match)
- Índices: location_id + reach (se usado)

**Fase 2: Service Layer**:
- createPost(): validar location_id, aceitar reach opcional
- getFeed(): expansão territorial (cidade↔bairros)
- Logs estruturados para falhas

**Fase 3: Formulários**:
- CreatePostModal: capturar location_id do perfil
- useCreatePostForm: manter reach como metadado
- Validação: rejeitar se profile.location_id null

---

## PRÓXIMAS AÇÕES

1. ⏳ Aprovar ou ajustar as 5 decisões
2. ⏳ Documentar decisões finais
3. ⏳ Atualizar SPRINT2_POSTS_PLANO_V2.md com decisões
4. ⏳ Prosseguir com auditorias pendentes

---

**Status**: ⏳ AGUARDANDO DECISÕES  
**Bloqueante**: Sprint 2 não pode iniciar sem estas definições  
**Próximo Passo**: Aprovar recomendações ou propor alternativas
