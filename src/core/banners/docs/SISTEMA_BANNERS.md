# 🎨 Sistema de Banners

## 📋 Visão Geral

Sistema completo de gerenciamento de banners para exibição em diferentes páginas e posições do app.

## ✅ O Que Foi Criado

### 1. Banco de Dados (SSOT Compliant)

**Tabela**: `banners`
- ✅ Ownership: `created_by_user_id` (admin que criou)
- ✅ RLS habilitado
- ✅ Policies para admin
- ✅ Agendamento (start_date, end_date)
- ✅ Estatísticas (views_count, clicks_count)

**Funções RPC**:
- `increment_banner_views(banner_id)` - Incrementa visualizações
- `increment_banner_clicks(banner_id)` - Incrementa cliques

### 2. Página Admin

**Rota**: `/admin/banners`

**Funcionalidades**:
- ✅ Listar todos os banners
- ✅ Criar novo banner
- ✅ Editar banner existente
- ✅ Excluir banner
- ✅ Ativar/desativar banner
- ✅ Visualizar estatísticas (views, clicks)

### 3. Componente de Exibição

**Componente**: `<BannerDisplay />`

**Props**:
- `page`: 'home' | 'community' | 'mobility' | 'business' | 'events' | 'all'
- `position`: 'top' | 'middle' | 'bottom' | 'sidebar'
- `className`: Classes CSS adicionais (opcional)

## 🚀 Como Usar

### 1. Aplicar Migrations

Execute no Supabase SQL Editor:

```sql
-- 1. Criar tabela
-- Arquivo: supabase/migrations/20260320_create_banners_table.sql

-- 2. Criar funções
-- Arquivo: supabase/migrations/20260320_create_banner_functions.sql
```

### 2. Acessar Página Admin

1. Acesse `/admin/banners`
2. Clique em "Novo Banner"
3. Preencha os campos:
   - **Título**: Nome do banner
   - **URL da Imagem**: Link da imagem
   - **Link**: URL de destino (opcional)
   - **Posição**: Onde exibir (top, middle, bottom, sidebar)
   - **Página**: Qual página (home, community, etc)
   - **Prioridade**: Ordem de exibição (maior = primeiro)
   - **Data Início/Fim**: Agendamento (opcional)
4. Clique em "Criar"

### 3. Exibir Banners nas Páginas

Adicione o componente onde quiser exibir banners:

```tsx
import { BannerDisplay } from '@/components/banners/BannerDisplay';

function HomePage() {
  return (
    <div>
      {/* Banner no topo */}
      <BannerDisplay page="home" position="top" />
      
      {/* Conteúdo da página */}
      <div>...</div>
      
      {/* Banner no meio */}
      <BannerDisplay page="home" position="middle" />
      
      {/* Mais conteúdo */}
      <div>...</div>
      
      {/* Banner no rodapé */}
      <BannerDisplay page="home" position="bottom" />
    </div>
  );
}
```

### 4. Exemplos de Uso

**Banner na Home (Topo)**:
```tsx
<BannerDisplay page="home" position="top" className="mb-6" />
```

**Banner na Comunidade (Sidebar)**:
```tsx
<BannerDisplay page="community" position="sidebar" className="sticky top-4" />
```

**Banner em Todas as Páginas (Rodapé)**:
```tsx
<BannerDisplay page="all" position="bottom" className="mt-8" />
```

## 📊 Campos do Banner

### Obrigatórios
- **title**: Título do banner
- **image_url**: URL da imagem
- **position**: Posição (top, middle, bottom, sidebar)
- **page**: Página (home, community, mobility, business, events, all)

### Opcionais
- **description**: Descrição adicional
- **link_url**: Link de destino
- **priority**: Ordem de exibição (padrão: 0)
- **is_active**: Ativo/inativo (padrão: true)
- **start_date**: Data de início
- **end_date**: Data de término
- **background_color**: Cor de fundo (padrão: #ffffff)
- **text_color**: Cor do texto (padrão: #000000)

## 🎯 Posições Disponíveis

- **top**: Topo da página (ideal para anúncios importantes)
- **middle**: Meio do conteúdo (entre seções)
- **bottom**: Rodapé da página
- **sidebar**: Barra lateral (sticky)

## 📄 Páginas Disponíveis

- **all**: Exibe em todas as páginas
- **home**: Apenas na home
- **community**: Apenas na comunidade
- **mobility**: Apenas em mobilidade
- **business**: Apenas em negócios
- **events**: Apenas em eventos

## 📈 Estatísticas

O sistema rastreia automaticamente:
- **Views**: Quantas vezes o banner foi exibido
- **Clicks**: Quantas vezes foi clicado

Visualize no admin em `/admin/banners`.

## 🔒 Segurança (RLS)

### Leitura
- Usuários veem apenas banners ativos e dentro do período
- Admins veem todos os banners

### Escrita
- Apenas admins podem criar/editar/excluir banners

## 🎨 Personalização

### Cores Customizadas
```tsx
// No admin, defina:
background_color: '#1a1a1a'
text_color: '#ffffff'
```

### Estilos Customizados
```tsx
<BannerDisplay 
  page="home" 
  position="top"
  className="rounded-xl shadow-2xl my-8"
/>
```

## 🔄 Agendamento

Banners podem ser agendados:

```tsx
// No admin:
start_date: '2026-03-20' // Começa a exibir
end_date: '2026-03-27'   // Para de exibir
```

Banners fora do período não são exibidos automaticamente.

## ✨ Recursos

- ✅ Botão de fechar (X) em cada banner
- ✅ Banners fechados são salvos no localStorage
- ✅ Rastreamento automático de views/clicks
- ✅ Lazy loading de imagens
- ✅ Responsivo
- ✅ Acessível (aria-labels)

## 🚀 Próximos Passos

1. Execute as migrations
2. Crie seu primeiro banner no admin
3. Adicione `<BannerDisplay />` nas páginas desejadas
4. Monitore as estatísticas

## 📝 Exemplo Completo

```tsx
// src/pages/HomePage.tsx
import { BannerDisplay } from '@/components/banners/BannerDisplay';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4">
      {/* Banner promocional no topo */}
      <BannerDisplay 
        page="home" 
        position="top"
        className="mb-8"
      />
      
      <h1>Bem-vindo!</h1>
      
      {/* Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Conteúdo principal */}
        </div>
        
        <aside>
          {/* Banner na sidebar */}
          <BannerDisplay 
            page="home" 
            position="sidebar"
            className="sticky top-4"
          />
        </aside>
      </div>
      
      {/* Banner no rodapé */}
      <BannerDisplay 
        page="home" 
        position="bottom"
        className="mt-12"
      />
    </div>
  );
}
```

## 🎉 Pronto!

Sistema de banners completo e profissional, seguindo SSOT! 🚀
