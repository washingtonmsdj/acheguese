# Correções - Destaques da Semana

## 🐛 Problemas Identificados

### 1. Parâmetros Incorretos no Hook
O hook `useClassificados` estava sendo chamado com parâmetros incorretos:
```typescript
// ❌ ANTES (errado)
const { classificados, initialLoading } = useClassificados({
  sortBy: "recente",
  filter: selectedCategory !== "todos" ? selectedCategory : undefined,
  search: searchQuery,
  routeResolved: resolved,
  activeMemberIds,
});
```

O hook espera:
- `filters` (objeto) ao invés de parâmetros soltos
- `isLoading` ao invés de `initialLoading`

### 2. Estrutura de Dados Incompatível
Os dados mock tinham estrutura diferente do tipo `ClassificadoWithVendedor`:

```typescript
// ❌ ANTES (errado)
{
  vendedor_id: "user-001",
  vendedor_name: "Carlos Silva",
  vendedor_avatar: null,
  vendedor_whatsapp: "71999990001",
  vendedor_rating: 4.8,
  vendedor_reviews_count: 12,
}

// ✅ DEPOIS (correto)
{
  vendedor: {
    id: "user-001",
    nome: "Carlos Silva",
    avatar_url: null,
  }
}
```

### 3. Campos Obrigatórios Faltando
Os mocks não tinham os campos obrigatórios:
- `public_id`
- `slug`

## ✅ Correções Aplicadas

### 1. Hook useClassificados
```typescript
// ✅ CORRETO
const { classificados: classificadosFromDB, isLoading } = useClassificados({
  filters: {
    category: selectedCategory !== "todos" ? selectedCategory : undefined,
    search: searchQuery,
    sortBy: "recente",
  },
  routeResolved: resolved,
  activeMemberIds,
});
```

### 2. Dados Mock Atualizados
```typescript
export const MOCK_CLASSIFIEDS: ClassificadoWithVendedor[] = [
  {
    id: "class-001",
    public_id: "abc12345",
    slug: "iphone-14-pro-max-256gb-seminovo",
    titulo: "iPhone 14 Pro Max 256GB - Seminovo",
    // ... outros campos
    vendedor: {
      id: "user-001",
      nome: "Carlos Silva",
      avatar_url: null,
    },
  },
  // ...
];
```

### 3. Componente ClassificadoCard
```typescript
// ✅ CORRETO
<div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
  {ad.vendedor?.nome?.[0]?.toUpperCase() || "?"}
</div>
<span className="text-xs text-muted-foreground truncate max-w-[100px]">
  {ad.vendedor?.nome || "Vendedor"}
</span>
```

### 4. Referências a isLoading
Todas as referências a `initialLoading` foram substituídas por `isLoading`:
- Seção de destaques
- Grid de anúncios

## 📊 Resultado

Agora a seção "Destaques da Semana" funciona corretamente:
- ✅ Hook chamado com parâmetros corretos
- ✅ Dados mock compatíveis com o tipo esperado
- ✅ Componentes usando a estrutura correta
- ✅ Sem erros de diagnóstico
- ✅ Destaques ordenados por preço (mais caros primeiro)
- ✅ Exibe até 6 anúncios em destaque

## 🎯 Funcionalidades

A seção de destaques agora:
1. Filtra os anúncios por preço (mais caros primeiro)
2. Exibe até 6 anúncios
3. Mostra cards compactos com:
   - Imagem do produto
   - Título
   - Categoria
   - Preço
   - Bairro
   - Ícone de estrela
4. Animação ao aparecer na tela
5. Hover effects
6. Link para ver todos os anúncios

## 🔍 Verificação

Para testar:
1. Acesse `/classificados-landing`
2. A seção "Destaques da Semana" deve aparecer após as estatísticas
3. Deve mostrar os 6 produtos mais caros
4. Ao clicar em um card, deve navegar para o detalhe do anúncio
5. O botão "Ver todos" deve levar para a lista completa

## 📝 Notas

- Os dados mock agora têm apenas 10 anúncios (simplificado para facilitar manutenção)
- Todos seguem a estrutura correta do tipo `ClassificadoWithVendedor`
- Removido o botão de WhatsApp dos cards (não estava no tipo)
- Mantida compatibilidade com dados reais do banco
