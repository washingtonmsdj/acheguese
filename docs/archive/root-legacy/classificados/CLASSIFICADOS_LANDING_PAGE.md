# ClassificadosLandingPage - Nova Página de Classificados

## 📋 Descrição

Nova página de classificados criada no estilo moderno da `ServicosLandingPage` e `HomePageV2`, com design editorial, dark theme, acentos teal e animações suaves.

## 🎨 Características

### Design e Estilo
- **Dark theme** com acentos em teal/primary
- **Animações suaves** com Framer Motion
- **Layout responsivo** mobile-first
- **Componentes modernos** com shadcn/ui
- **Gradientes e efeitos** visuais sofisticados

### Funcionalidades

1. **Hero Section**
   - Imagem de fundo com overlay gradiente
   - Busca em destaque
   - Pills de categorias rápidas
   - Call-to-action para anunciar

2. **Estatísticas**
   - 4 cards com métricas principais
   - Ícones coloridos
   - Animação ao scroll

3. **Destaques da Semana**
   - Carrossel horizontal de anúncios em destaque
   - Cards compactos com imagem e preço
   - Ordenados por preço (mais caros primeiro)

4. **Categorias**
   - Pills interativas com emojis
   - Filtro por categoria
   - Design consistente com outras landing pages

5. **Grid de Anúncios**
   - Cards com imagem, título, preço e localização
   - Informações do vendedor
   - Botão de WhatsApp direto
   - Skeleton loading
   - Empty state

6. **Como Funciona**
   - 3 passos explicativos
   - Ícones e descrições
   - Design em cards

7. **Benefícios**
   - 4 cards com vantagens da plataforma
   - Ícones coloridos
   - Descrições detalhadas

8. **CTAs**
   - Banner para vendedores anunciarem
   - Footer com call-to-action para explorar
   - Links para outras seções (Empresas, Serviços, Comunidade)

## 🔧 Integração SSOT

A página está totalmente integrada com o SSOT (Single Source of Truth):

- ✅ Recebe `resolved` e `activeMemberIds` como props
- ✅ Usa `useClassificados` com filtro territorial
- ✅ Usa `useAppUrls` para navegação consistente
- ✅ Usa `TerritoryIndicator` para contexto territorial
- ✅ Categorias centralizadas

## 📁 Arquivos

- **Página**: `src/modules/classifieds/pages/ClassificadosLandingPage.tsx`
- **Export**: Adicionado em `src/modules/classifieds/index.ts`
- **Rota**: `/classificados-landing` (já configurada em `src/App.tsx`)

## 🚀 Como Usar

### Acessar a Página
```
http://localhost:5173/classificados-landing
```

### Integração em Rotas
A página já está configurada no App.tsx:
```tsx
<Route path="/classificados-landing" element={<ClassificadosLandingPage />} />
```

### Props
```tsx
interface ClassificadosLandingPageProps {
  resolved?: ResolvedTerritory;
  activeMemberIds?: string[];
}
```

## 🎯 Diferenças da Página Atual

A nova `ClassificadosLandingPage` difere da `ClassificadosPage` atual:

### ClassificadosPage (Atual)
- Foco em listagem e filtros
- Design mais compacto
- Grid de 2 colunas
- Filtros em sheet lateral
- Infinite scroll

### ClassificadosLandingPage (Nova)
- Foco em apresentação e conversão
- Design editorial expansivo
- Seções explicativas (Como Funciona, Benefícios)
- Hero section com imagem
- Estatísticas e destaques
- CTAs para anunciar
- Grid de 3 colunas (desktop)

## 📊 Componentes Principais

1. **CategoryPill** - Pills de categoria com emoji
2. **ClassificadoCard** - Card de anúncio com imagem e detalhes
3. **FeaturedCard** - Card compacto para destaques
4. **Stats Section** - Métricas da plataforma
5. **How It Works** - Passo a passo
6. **Benefits** - Vantagens da plataforma
7. **CTA Sections** - Chamadas para ação

## 🎨 Paleta de Cores

- **Primary**: Ações principais e destaques
- **Accent**: Elementos secundários
- **Success**: WhatsApp e ações positivas
- **Warning**: Destaques e troféus
- **Muted**: Textos secundários

## ✅ Status

- [x] Página criada
- [x] Integração SSOT
- [x] Export configurado
- [x] Rota configurada
- [x] Sem erros de diagnóstico
- [x] Design responsivo
- [x] Animações implementadas
- [x] Componentes reutilizáveis

## 🔄 Próximos Passos

1. Testar a página em diferentes resoluções
2. Adicionar imagens reais no hero
3. Conectar com dados reais de estatísticas
4. Implementar analytics
5. Testes de acessibilidade
6. Otimização de performance
