# ✅ TerritorialLandingPage Melhorada

## Objetivo
Atualizar a página de bairro/grupo (`TerritorialLandingPage`) para ter o mesmo layout rico e profissional da `CidadeLandingPage`, mas com conteúdo específico do território.

## Mudanças Implementadas

### 1. Navbar Fixa no Topo
```typescript
<nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
    <button onClick={() => navigate(baseUrl)}>
      <MapPin /> {name}
    </button>
    <div>
      <button>Comunidade</button>
      <button>Empresas</button>
    </div>
  </div>
</nav>
```

**Benefícios:**
- Navegação sempre acessível
- Identidade visual consistente com CidadeLandingPage
- Acesso rápido aos módulos principais

### 2. Banner de Destaque
```typescript
<div className="w-full bg-gradient-to-r from-teal-500/20 via-teal-500/10 to-teal-500/20">
  <Sparkles /> Portal do Bairro! Tudo sobre {name} em um só lugar.
</div>
```

**Benefícios:**
- Chama atenção para a proposta de valor
- Visual atraente e moderno

### 3. Hero Expandido e Rico
```typescript
<section className="relative w-full overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-teal-500/12">
    {/* Efeitos de fundo */}
  </div>
  
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
    <h1 className="text-3xl md:text-5xl font-bold">{name}</h1>
    <p className="text-base md:text-lg">Descrição do bairro/grupo</p>
    
    {/* Chips de navegação rápida */}
    <div className="flex flex-wrap gap-2">
      <button>Comunidade</button>
      <button>Empresas</button>
      <button>Serviços</button>
      <button>Classificados</button>
    </div>
  </div>
</section>
```

**Melhorias:**
- Hero mais espaçoso e impactante
- Tipografia maior e mais legível
- Chips de navegação rápida para módulos
- Efeitos visuais de fundo (gradientes e blur)
- Badge de localização no canto

### 4. Estatísticas Expandidas
```typescript
<section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14">
  <h2 className="text-xl md:text-2xl font-bold">{name} em Números</h2>
  
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    <div>Habitantes</div>
    <div>Empresas ativas</div>
    <div>Profissionais</div>
    <div>Anúncios ativos</div>
    <div>Escolas</div>
    <div>Linhas de ônibus</div>
  </div>
</section>
```

**Melhorias:**
- 6 estatísticas ao invés de 3
- Layout responsivo (2 cols mobile, 3 tablet, 6 desktop)
- Cards maiores e mais visuais
- Cores diferentes para cada métrica

### 5. Seções com Layout Profissional

Todas as seções agora seguem o padrão:

```typescript
<section className="max-w-7xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h2 className="text-xl md:text-2xl font-bold">Título</h2>
      <p className="text-sm text-muted-foreground">Subtítulo</p>
    </div>
    <button>Ver mais</button>
  </div>
  
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {/* Conteúdo */}
  </div>
</section>
```

**Melhorias:**
- Container centralizado com max-width
- Espaçamento consistente (py-10 md:py-14)
- Headers com título e subtítulo
- Grid responsivo (1 col mobile, 2 tablet, 4 desktop)
- Gaps maiores entre cards (gap-4 ao invés de gap-2)

### 6. Cards Maiores e Mais Visuais

**Antes:**
```typescript
<button className="flex items-center gap-3 p-3 rounded-xl">
  <div className="h-10 w-10">Logo</div>
  <div>
    <p className="text-xs">Nome</p>
    <p className="text-[10px]">Categoria</p>
  </div>
</button>
```

**Depois:**
```typescript
<button className="flex items-center gap-3 p-4 rounded-xl group">
  <div className="h-14 w-14">
    <img className="group-hover:scale-110 transition-transform" />
  </div>
  <div>
    <p className="text-sm font-bold group-hover:text-teal-500">Nome</p>
    <p className="text-xs">Categoria</p>
  </div>
</button>
```

**Melhorias:**
- Padding maior (p-4 ao invés de p-3)
- Imagens maiores (h-14 w-14 ao invés de h-10 w-10)
- Tipografia maior (text-sm ao invés de text-xs)
- Efeitos hover (scale, mudança de cor)
- Transições suaves

### 7. Seção de Lazer Expandida

**Antes:** 2 cards simples

**Depois:** 4 cards com visual rico
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="relative overflow-hidden bg-gradient-to-br p-6">
    <div className="h-12 w-12 rounded-xl">
      <Music className="h-6 w-6" />
    </div>
    <p className="text-base font-semibold">Eventos culturais</p>
    <p className="text-sm">Shows e apresentações</p>
    <div className="absolute blur-2xl" />
  </div>
  {/* Mais 3 cards */}
</div>
```

**Melhorias:**
- 4 categorias ao invés de 2
- Cards maiores com mais informação
- Efeitos de blur no fundo
- Ícones maiores

### 8. CTA Final Expandido

**Antes:** Card pequeno com texto mínimo

**Depois:** Seção hero-style
```typescript
<section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
  <div className="rounded-2xl bg-gradient-to-br p-8 md:p-12">
    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
      <div className="p-4 rounded-2xl">
        <Users className="h-8 w-8" />
      </div>
      <div className="flex-1">
        <h2 className="text-2xl md:text-3xl font-bold">Comunidade {name}</h2>
        <p className="text-base leading-relaxed">Descrição expandida...</p>
        <button className="bg-teal-500 px-6 py-3 rounded-xl">
          Entrar na comunidade
        </button>
      </div>
    </div>
  </div>
</section>
```

**Melhorias:**
- Layout horizontal em desktop
- Tipografia maior e mais impactante
- Botão mais proeminente
- Padding generoso (p-8 md:p-12)

## Comparação Visual

### Antes (Mobile-first, compacto)
- Hero pequeno com ícone
- 3 estatísticas em grid 3 cols
- Cards pequenos (p-3, h-10)
- Tipografia pequena (text-xs, text-[10px])
- Seções sem max-width
- Gaps pequenos (gap-2)

### Depois (Desktop-first, espaçoso)
- Hero expandido com gradientes
- 6 estatísticas em grid responsivo
- Cards maiores (p-4, h-14)
- Tipografia legível (text-sm, text-base)
- Seções centralizadas (max-w-7xl)
- Gaps generosos (gap-4)

## Estrutura Completa

```
TerritorialLandingPage
├── Navbar (sticky)
├── Banner de destaque
├── Hero expandido
│   ├── Título grande
│   ├── Descrição
│   ├── Chips de bairros (se grupo)
│   └── Chips de navegação
├── Estatísticas (6 cards)
├── Sobre o bairro (IA)
├── Destaques editoriais (3 cards)
├── Gastronomia (3 cards)
├── Negócios locais (4 cards)
├── Profissionais e serviços (4 cards)
├── Lazer e atividades (4 cards)
├── Classificados recentes (4 cards)
└── CTA Comunidade (hero-style)
```

## Responsividade

### Mobile (< 640px)
- 1 coluna para todos os grids
- Hero compacto (py-12)
- Navbar simplificada
- Estatísticas em 2 colunas

### Tablet (640px - 1024px)
- 2 colunas para cards
- 3 colunas para estatísticas
- Hero médio (py-16)

### Desktop (> 1024px)
- 4 colunas para cards
- 6 colunas para estatísticas
- Hero expandido (py-20)
- Navbar completa

## Consistência com CidadeLandingPage

Ambas as páginas agora compartilham:
- ✅ Navbar fixa no topo
- ✅ Banner de destaque
- ✅ Hero expandido com gradientes
- ✅ Seções centralizadas (max-w-7xl)
- ✅ Tipografia consistente
- ✅ Espaçamento generoso
- ✅ Cards com hover effects
- ✅ CTA final impactante

## Diferenças Mantidas

**CidadeLandingPage:**
- Foco em dados da cidade inteira
- Seção de bairros em destaque
- Seção de políticos eleitos
- Contatos úteis (emergência)
- Dados da prefeitura

**TerritorialLandingPage:**
- Foco em dados do bairro/grupo específico
- Seção de lazer e atividades
- Destaques editoriais do território
- Conteúdo IA sobre o bairro
- CTA para comunidade local

## Resultado

A TerritorialLandingPage agora tem:
✅ Layout profissional e espaçoso
✅ Tipografia legível e hierárquica
✅ Visual consistente com CidadeLandingPage
✅ Melhor experiência em desktop
✅ Responsividade mantida
✅ Conteúdo específico do território
