# Classificados: Alcance Global e Avisos de Bairro Vazio

## Funcionalidades Implementadas

### 1. Classificados com Alcance Global

Implementado sistema de alcance (reach) para classificados, permitindo que anúncios apareçam em áreas maiores que o bairro específico.

#### Níveis de Alcance

- **district** (padrão): Anúncio aparece apenas no bairro específico
- **city**: Anúncio aparece em toda a cidade (todos os bairros)
- **state**: Anúncio aparece em todo o estado

#### Campos Adicionados

```sql
-- Campo de alcance
reach TEXT DEFAULT 'district' CHECK (reach IN ('district', 'city', 'state'))

-- Campo de destaque
is_featured BOOLEAN DEFAULT FALSE
```

#### Comportamento

**Quando usuário está em um bairro**:
- Mostra anúncios do bairro (reach='district')
- Mostra anúncios da cidade com reach='city'
- Anúncios com reach='city' aparecem em TODOS os bairros daquela cidade

**Quando usuário está em uma cidade**:
- Mostra anúncios da cidade e todos os bairros
- Anúncios com reach='city' aparecem normalmente

**Exemplo prático**:
```
Usuário em: /classificados/ba/salvador/pituba
Mostra:
  - Anúncios de Pituba (reach='district')
  - Anúncios de Salvador com reach='city' (aparecem em todos os bairros)
```

### 2. Aviso de Bairro Sem Anúncios

Quando um bairro não tem anúncios, exibe um card informativo com ações sugeridas.

#### Quando Aparece

- Usuário está em um bairro (district)
- Não há anúncios no bairro
- Página terminou de carregar (não está em loading)

#### Conteúdo do Aviso

```
┌─────────────────────────────────────────┐
│         [Ícone de Tag]                  │
│                                         │
│  Nenhum anúncio em [Nome do Bairro]   │
│                                         │
│  Não encontramos anúncios neste        │
│  bairro no momento. Que tal explorar   │
│  anúncios de toda a cidade?            │
│                                         │
│  [Ver anúncios da cidade]              │
│  [Criar primeiro anúncio]              │
└─────────────────────────────────────────┘
```

#### Ações Disponíveis

1. **Ver anúncios da cidade**: Navega para a cidade pai (ex: de Pituba → Salvador)
2. **Criar primeiro anúncio**: 
   - Se logado: vai para criação de anúncio
   - Se não logado: vai para login

## Arquivos Modificados

### Migration
- `supabase/migrations/20240102000000_add_classified_reach_fields.sql`
  - Adiciona campos `reach` e `is_featured`
  - Cria índices para performance
  - Atualiza anúncios existentes

### Backend
- `src/core/classifieds/services/ClassifiedService.ts`
  - Modificado `getAllClassifieds()` para incluir anúncios com reach maior
  - Detecta se location é distrito e busca parent_id
  - Inclui anúncios com reach='city' da cidade pai quando em distrito

### Frontend
- `src/modules/classifieds/pages/ClassificadosLandingPage.tsx`
  - Detecta se está em distrito (`isDistrict`)
  - Calcula path da cidade pai (`parentCityPath`)
  - Exibe aviso quando `isDistrict && classificados.length === 0`
  - Botões de ação para navegar ou criar anúncio

## Lógica de Filtro (ClassifiedService)

```typescript
// Quando em distrito (bairro)
if (isDistrict && parentCityId) {
  // Busca:
  // 1. Anúncios do bairro (qualquer reach)
  // 2. Anúncios da cidade com reach='city'
  query = query.or(
    `location_id.in.(${districtIds}),and(location_id.eq.${parentCityId},reach.eq.city)`
  );
}

// Quando em cidade
else {
  // Busca todos anúncios da cidade e bairros
  query = query.in('location_id', cityAndDistrictIds);
}
```

## Casos de Uso

### Caso 1: Loja com Entrega em Toda Cidade
```
Loja em Pituba quer vender para toda Salvador:
- Cria anúncio com reach='city'
- Anúncio aparece em Pituba, Barra, Ondina, etc
- Usuários de qualquer bairro veem o anúncio
```

### Caso 2: Bairro Novo Sem Anúncios
```
Usuário acessa /classificados/ba/salvador/novo-bairro:
- Não há anúncios locais
- Vê aviso amigável
- Pode ver anúncios de Salvador inteira
- Pode criar primeiro anúncio do bairro
```

### Caso 3: Anúncio Destaque
```
Anúncio importante com is_featured=true:
- Pode ter reach='city' ou 'state'
- Aparece em posição de destaque
- Maior visibilidade na plataforma
```

## Benefícios

### Para Vendedores
- Maior alcance com reach='city'
- Não ficam limitados ao bairro
- Podem atingir toda a cidade

### Para Compradores
- Sempre veem conteúdo relevante
- Anúncios de toda cidade quando bairro vazio
- Experiência sem frustração

### Para Plataforma
- Melhor distribuição de anúncios
- Menos páginas vazias
- Incentivo para criar conteúdo

## SSOT Compliance

✅ Usa campos do banco (reach, is_featured)
✅ Filtro territorial canônico (TerritoryFilter)
✅ Navegação por URL (não filtro local)
✅ Detecta tipo de location (city/district)
✅ Busca parent_id do banco
✅ Sem hardcoded values ou gambiarras

## Próximos Passos (Opcional)

1. Interface admin para marcar anúncios como featured
2. Interface de criação permitir escolher reach
3. Preço diferenciado para reach='city'
4. Analytics de alcance por anúncio
5. Limite de anúncios featured por usuário
