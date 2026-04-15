# Sistema de Preços para Profissionais

## Visão Geral

Implementado um sistema flexível de precificação para profissionais que permite diferentes modelos de cobrança, incluindo "A combinar", "Sob consulta", etc.

## Tipos de Preço (`price_type`)

### 1. **hourly** - Por Hora
- Usa o campo `hourly_rate`
- Exibição: "R$ 80/h", "R$ 150/h"
- Ideal para: Consultores, freelancers, técnicos

### 2. **fixed** - Preço Fixo
- Usa o campo `price_range`
- Exibição: "R$ 200", "R$ 500-800"
- Ideal para: Serviços com escopo definido

### 3. **negotiable** - A Combinar
- Não usa valores específicos
- Exibição: "A combinar"
- Ideal para: Serviços personalizados, projetos sob medida

### 4. **free** - Gratuito
- Serviço sem custo
- Exibição: "Gratuito"
- Ideal para: Voluntários, serviços comunitários

### 5. **package** - Pacotes
- Usa o campo `price_range` para descrever pacotes
- Exibição: "Pacotes disponíveis" ou valor do price_range
- Ideal para: Serviços com múltiplas opções

### 6. **consultation** - Sob Consulta
- Requer consulta prévia para orçamento
- Exibição: "Sob consulta"
- Ideal para: Projetos complexos, serviços especializados

## Estrutura no Banco

### Campos na Tabela `professional_data`

```sql
price_type TEXT DEFAULT 'negotiable'
  CHECK (price_type IN ('hourly', 'fixed', 'negotiable', 'free', 'package', 'consultation'))

hourly_rate DECIMAL(10,2)  -- Usado quando price_type = 'hourly'

price_range TEXT  -- Usado quando price_type = 'fixed' ou 'package'
```

### Função Helper

```sql
format_professional_price(price_type, hourly_rate, price_range) RETURNS TEXT
```

Formata automaticamente o preço para exibição baseado no tipo.

## Exemplos de Uso

### Cadastro de Profissional

```typescript
// Profissional por hora
{
  price_type: 'hourly',
  hourly_rate: 120.00,
  price_range: null
}
// Exibe: "R$ 120/h"

// Profissional com preço fixo
{
  price_type: 'fixed',
  hourly_rate: null,
  price_range: 'R$ 500-800'
}
// Exibe: "R$ 500-800"

// Profissional a combinar
{
  price_type: 'negotiable',
  hourly_rate: null,
  price_range: null
}
// Exibe: "A combinar"

// Profissional com pacotes
{
  price_type: 'package',
  hourly_rate: null,
  price_range: 'Básico R$ 300 | Premium R$ 600'
}
// Exibe: "Básico R$ 300 | Premium R$ 600"

// Profissional sob consulta
{
  price_type: 'consultation',
  hourly_rate: null,
  price_range: null
}
// Exibe: "Sob consulta"
```

## Lógica de Exibição

### No Frontend (LandingFeaturedService)

```typescript
let priceDisplay = 'A combinar';

if (price_type === 'hourly' && hourly_rate) {
  priceDisplay = `R$ ${hourly_rate}/h`;
} else if (price_type === 'fixed' && price_range) {
  priceDisplay = price_range;
} else if (price_type === 'negotiable') {
  priceDisplay = 'A combinar';
} else if (price_type === 'free') {
  priceDisplay = 'Gratuito';
} else if (price_type === 'package') {
  priceDisplay = price_range || 'Pacotes disponíveis';
} else if (price_type === 'consultation') {
  priceDisplay = 'Sob consulta';
}
```

## Migration Aplicada

### `20250130000003_add_price_type_to_professional_data.sql`

**O que faz:**
1. Adiciona coluna `price_type` com constraint
2. Cria função `format_professional_price()`
3. Atualiza registros existentes com tipo apropriado
4. Adiciona índice para queries por tipo de preço

**Migração de dados existentes:**
- Se tem `hourly_rate` → `price_type = 'hourly'`
- Se tem `price_range` → `price_type = 'fixed'`
- Caso contrário → `price_type = 'negotiable'`

## Interface de Cadastro

### Campos no Formulário

```typescript
<Select name="price_type">
  <option value="hourly">Por Hora</option>
  <option value="fixed">Preço Fixo</option>
  <option value="negotiable">A Combinar</option>
  <option value="free">Gratuito</option>
  <option value="package">Pacotes</option>
  <option value="consultation">Sob Consulta</option>
</Select>

{/* Mostrar apenas se price_type === 'hourly' */}
<Input 
  name="hourly_rate" 
  type="number" 
  placeholder="Ex: 120.00"
  label="Valor por Hora (R$)"
/>

{/* Mostrar apenas se price_type === 'fixed' ou 'package' */}
<Input 
  name="price_range" 
  type="text" 
  placeholder="Ex: R$ 500-800"
  label="Faixa de Preço"
/>
```

## Exibição na Página

### Card de Profissional

```tsx
<div className="professional-card">
  <h3>{name}</h3>
  <p>{category}</p>
  
  {/* Preço formatado */}
  <p className="price">
    {price_range || 'A combinar'}
  </p>
</div>
```

### Exemplos Visuais

```
📋 MOCK
João Eletricista
Elétrica
R$ 80-150/h

✅ REAL
Antônio Costa
Tecnologia da Informação
A combinar

✅ REAL
Maria Silva
Design Gráfico
R$ 120/h

✅ REAL
Pedro Santos
Consultoria
Sob consulta

✅ REAL
Ana Oliveira
Aulas de Yoga
Gratuito
```

## Vantagens do Sistema

1. **Flexibilidade**: Suporta diferentes modelos de negócio
2. **Clareza**: Usuário sabe o que esperar antes de contatar
3. **Profissionalismo**: Opções adequadas para cada tipo de serviço
4. **Escalável**: Fácil adicionar novos tipos no futuro
5. **Consistente**: Formatação padronizada em toda aplicação

## Próximos Passos

### Curto Prazo
- ✅ Migration aplicada
- ✅ Serviço atualizado
- ⏳ Atualizar formulário de cadastro
- ⏳ Atualizar página de perfil do profissional

### Médio Prazo
- Adicionar filtro por tipo de preço na busca
- Estatísticas de preços por categoria
- Sugestões de preço baseadas em mercado

### Longo Prazo
- Sistema de negociação de preços
- Histórico de alterações de preço
- Comparação de preços entre profissionais
