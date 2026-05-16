# 🎨 Referência Visual - Comunicação Territorial V2

## 🎯 Conceito Visual

A V2 busca transmitir a sensação de um **ecossistema territorial vivo**, misturando:
- Mídia hiperlocal moderna
- Feed editorial curado
- Portal comunitário dinâmico
- Hub de descoberta territorial

## 🌈 Paleta de Cores

### Cores Principais

```css
/* Hero e Destaques */
--hero-dark: #07131a
--hero-mid: #0a1b23
--hero-accent: #112b26

/* Status e Indicadores */
--live-red: #ef4444 (red-500)
--verified-blue: #3b82f6 (blue-500)
--growth-green: #10b981 (green-500)
--trending-orange: #f97316 (orange-600)
--alert-yellow: #f59e0b (amber-500)
--event-pink: #ec4899 (pink-600)
--community-purple: #a855f7 (purple-600)

/* Base */
--background: #f8fafc (slate-50)
--card-white: #ffffff
--text-primary: #0f172a (slate-900)
--text-secondary: #64748b (slate-600)
--text-muted: #94a3b8 (slate-500)
```

### Uso de Cores por Categoria

| Categoria | Cor | Uso |
|-----------|-----|-----|
| Ao Vivo | 🔴 Vermelho | Transmissões, urgência |
| Verificado | 🔵 Azul | Confiança, oficial |
| Crescimento | 🟢 Verde | Métricas positivas |
| Trending | 🟠 Laranja | Popular, em alta |
| Alerta | 🟡 Amarelo | Atenção, cuidado |
| Eventos | 🩷 Rosa | Cultura, lazer |
| Comunidade | 🟣 Roxo | Social, coletivo |

## 📐 Layout e Grid

### Desktop (>1024px)

```
┌─────────────────────────────────────────────────┐
│  Filtros Sticky (100% width)                    │
└─────────────────────────────────────────────────┘

┌──────────────────────────────┐ ┌──────────────┐
│  Main Content (8 cols)       │ │ Sidebar      │
│                              │ │ (4 cols)     │
│  Hero                        │ │              │
│  ┌────────┐ ┌────────┐      │ │ CTA Card     │
│  │ Card   │ │ Card   │      │ │              │
│  └────────┘ └────────┘      │ │ Trending     │
│  ┌────────┐ ┌────────┐      │ │              │
│  │ Card   │ │ Card   │      │ │ Territory    │
│  └────────┘ └────────┘      │ │              │
│                              │ │ Events       │
│  Section 2                   │ │              │
│  ┌──────┐ ┌──────┐ ┌──────┐ │ │ Alerts       │
│  │ Card │ │ Card │ │ Card │ │ │              │
│  └──────┘ └──────┘ └──────┘ │ │              │
│                              │ │              │
│  Section 3...                │ │              │
└──────────────────────────────┘ └──────────────┘
```

### Mobile (<768px)

```
┌─────────────────┐
│  Filtros        │
└─────────────────┘

┌─────────────────┐
│  Hero           │
└─────────────────┘

┌─────────────────┐
│  Card           │
└─────────────────┘

┌─────────────────┐
│  Card           │
└─────────────────┘

┌─────────────────┐
│  Section 2      │
└─────────────────┘

┌─────────────────┐
│  Sidebar        │
└─────────────────┘
```

## 🎴 Anatomia dos Cards

### Card Grande (Mídias em Destaque)

```
┌─────────────────────────────────┐
│  Cover Image (h-48)             │
│  ┌─────────────────────────┐    │
│  │ Gradient Overlay        │    │
│  │                         │    │
│  │  [Badge] [Badge]        │    │
│  │                         │    │
│  │  [Avatar]               │    │
│  └─────────────────────────┘    │
├─────────────────────────────────┤
│  [Avatar] Channel Name          │
│  [Badge] Type                   │
│                                 │
│  Description (2 lines)          │
│                                 │
│  👥 12.5k  👁️ Alta  ⏰ 15 min   │
└─────────────────────────────────┘
```

### Card Horizontal (Trending)

```
┌──────────┬──────────────────────┐
│          │  [Avatar] Channel    │
│  Image   │  ⏰ há 2 horas        │
│  (h-40)  │                      │
│          │  Title (bold)        │
│          │                      │
│          │  Excerpt (2 lines)   │
│          │                      │
│          │  ❤️ 342  💬 87  🔄 45 │
└──────────┴──────────────────────┘
```

### Card Compacto (Publicações)

```
┌─────────────────────────┐
│  [Avatar] Channel       │
│  ⏰ há 30 min            │
│                         │
│  Title (2 lines)        │
│                         │
│  [Badge] Category       │
└─────────────────────────┘
```

### Card de Vídeo

```
┌─────────────────────────┐
│  Thumbnail (h-40)       │
│  ┌───────────────────┐  │
│  │  [Play Button]    │  │
│  │                   │  │
│  │  [Duration Badge] │  │
│  └───────────────────┘  │
├─────────────────────────┤
│  Title (2 lines)        │
│  Channel  👁️ 2.3k       │
└─────────────────────────┘
```

## 🏷️ Badges e Indicadores

### Badge Ao Vivo
```
[🔴 Ativo agora]
- Background: red-500
- Text: white
- Pulsante: animate-pulse no ponto
```

### Badge Verificado
```
[✓]
- Background: blue-500
- Icon: check em círculo
- Size: 3.5w x 3.5h
```

### Badge de Categoria
```
[Categoria]
- Variant: secondary
- Size: text-xs
- Padding: px-2 py-1
```

### Badge de Crescimento
```
[📈 +23%]
- Background: green-500
- Text: white
- Icon: TrendingUp
```

## 🎭 Animações e Transições

### Hover em Cards
```css
transition: all 300ms ease
hover:scale-105
hover:shadow-xl
hover:border-[color]-200
```

### Hover em Títulos
```css
transition: colors 300ms
hover:text-[color]-600
```

### Pulsante (Ao Vivo)
```css
animate-pulse
```

### Smooth Scroll
```css
scroll-behavior: smooth
```

## 📏 Espaçamento

### Containers
```css
container mx-auto px-4
```

### Seções
```css
space-y-6 (entre seções)
space-y-4 (dentro de seções)
```

### Cards
```css
gap-4 (grid pequeno)
gap-6 (grid grande)
```

### Padding
```css
p-3 (card compacto)
p-4 (card médio)
p-5 (card grande)
p-6 (CTA card)
```

## 🔤 Tipografia

### Hierarquia

```css
/* Hero Title */
text-4xl sm:text-5xl lg:text-6xl
font-bold
tracking-tight

/* Section Title */
text-2xl sm:text-3xl
font-bold

/* Card Title */
text-lg
font-bold

/* Card Title (compacto) */
text-sm
font-semibold

/* Body */
text-base
font-normal

/* Small */
text-sm

/* Extra Small */
text-xs
```

### Cores de Texto

```css
/* Primary */
text-slate-900

/* Secondary */
text-slate-600

/* Muted */
text-slate-500

/* White (em fundos escuros) */
text-white

/* Colored (hover) */
text-[color]-600
```

## 🖼️ Imagens

### Aspect Ratios

```css
/* Cover Image (card grande) */
h-48 (192px)

/* Thumbnail (card médio) */
h-40 (160px)

/* Thumbnail (card compacto) */
h-32 (128px)

/* Avatar */
h-8 w-8 (pequeno)
h-10 w-10 (médio)
h-16 w-16 (grande)
```

### Tratamento

```css
/* Todas as imagens */
object-cover
rounded-lg (ou rounded-xl)

/* Hover */
group-hover:scale-105
transition-transform duration-300

/* Overlay */
absolute inset-0
bg-gradient-to-t from-black/60 to-transparent
```

## 🎨 Gradientes

### Hero
```css
bg-gradient-to-br 
from-[#07131a] 
via-[#0a1b23] 
to-[#112b26]
```

### CTA Card
```css
bg-gradient-to-br 
from-blue-600 
to-blue-700
```

### Overlay de Imagem
```css
bg-gradient-to-t 
from-black/70 
via-black/30 
to-transparent
```

## 🔘 Botões

### Primário
```css
bg-white 
text-slate-900 
hover:bg-slate-100
shadow-lg
```

### Secundário
```css
variant="outline"
border-white/30 
text-white 
hover:bg-white/10
```

### Ghost
```css
variant="ghost"
hover:bg-slate-50
```

## 📱 Breakpoints

```css
/* Mobile First */
default: <640px

/* Small */
sm: 640px

/* Medium */
md: 768px

/* Large */
lg: 1024px

/* Extra Large */
xl: 1280px

/* 2XL */
2xl: 1536px
```

## 🎯 Estados Visuais

### Normal
- Border: border (1px)
- Shadow: shadow-sm

### Hover
- Border: border-2 hover:border-[color]-200
- Shadow: hover:shadow-lg
- Scale: hover:scale-105

### Active
- Background: bg-[color]-500
- Text: text-white

### Disabled
- Opacity: opacity-50
- Cursor: cursor-not-allowed

## 🌟 Destaques Especiais

### Sticky Elements
```css
sticky top-0 z-40
bg-white/80 backdrop-blur-lg
```

### Sidebar Sticky
```css
sticky top-24
```

### Live Indicator
```css
<span className="h-2 w-2 bg-white rounded-full mr-1.5 animate-pulse" />
```

### Verification Badge
```css
<svg className="h-3.5 w-3.5 text-blue-400" fill="currentColor">
  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
</svg>
```

## 📊 Métricas Visuais

### Formato
```
👥 12.5k (seguidores)
👁️ Alta (engajamento)
⏰ há 15 min (tempo)
❤️ 342 (likes)
💬 87 (comentários)
🔄 45 (compartilhamentos)
📈 +23% (crescimento)
```

## 🎨 Inspiração Visual

A V2 deve transmitir:
- ✨ **Modernidade**: Design atual, não datado
- 🏙️ **Urbanidade**: Sensação de cidade
- 🤝 **Comunidade**: Conexão entre pessoas
- 📡 **Conectividade**: Informação fluindo
- 🎯 **Relevância**: Conteúdo importante
- ⚡ **Dinamismo**: Movimento constante
- 🎭 **Cultura**: Vida cultural ativa
- 📰 **Jornalismo**: Informação de qualidade

---

**Use esta referência para manter consistência visual em toda a V2!**
