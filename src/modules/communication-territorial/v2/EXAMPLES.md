# 📚 Communication Agent V2 - Exemplos de Uso

## 🎯 Navegação

### Link Direto
```tsx
import { Link } from 'react-router-dom';

function MeuComponente() {
  return (
    <Link to="/comunicacao/agente/portal-nordeste">
      Ver Portal Nordeste
    </Link>
  );
}
```

### Navegação Programática
```tsx
import { useNavigate } from 'react-router-dom';

function MeuComponente() {
  const navigate = useNavigate();
  
  const verPortal = (slug: string) => {
    navigate(`/comunicacao/agente/${slug}`);
  };
  
  return (
    <button onClick={() => verPortal('radio-comunitaria')}>
      Ver Rádio Comunitária
    </button>
  );
}
```

---

## 🧩 Adicionar Nova Seção

### 1. Criar o Componente

```tsx
// src/modules/communication-territorial/v2/agent-page/sections/MinhaNovaSecao.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Sparkles } from "lucide-react";

interface MinhaNovaSecaoProps {
  agent: any;
  data?: any;
}

/**
 * MinhaNovaSecao
 * 
 * Descrição do que esta seção faz.
 */
export function MinhaNovaSecao({ agent, data }: MinhaNovaSecaoProps) {
  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Minha Nova Seção
            </h2>
          </div>
          <p className="text-muted-foreground">
            Descrição da seção
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Card 1</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Conteúdo do card</p>
          </CardContent>
        </Card>
        
        {/* Mais cards... */}
      </div>
    </section>
  );
}
```

### 2. Exportar no Index

```tsx
// src/modules/communication-territorial/v2/agent-page/sections/index.ts

export { MinhaNovaSecao } from './MinhaNovaSecao';
```

### 3. Usar na Página Principal

```tsx
// src/modules/communication-territorial/v2/pages/CommunicationAgentPageV2.tsx

import { MinhaNovaSecao } from "../agent-page/sections/MinhaNovaSecao";

export default function CommunicationAgentPageV2() {
  // ... código existente
  
  return (
    <>
      {/* ... código existente */}
      
      <main className="lg:col-span-8 space-y-6 sm:space-y-8">
        {/* Seções existentes */}
        <AgentWeekHighlights publications={publications} />
        <AgentLatestPublications publications={publications} agent={agent} />
        
        {/* Nova seção */}
        <MinhaNovaSecao agent={agent} data={someData} />
        
        {/* Mais seções... */}
      </main>
    </>
  );
}
```

---

## 🎨 Adicionar Widget Sidebar

### 1. Criar o Widget

```tsx
// src/modules/communication-territorial/v2/agent-page/sidebar/MeuWidget.tsx

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Star } from "lucide-react";

interface MeuWidgetProps {
  agent: any;
}

export function MeuWidget({ agent }: MeuWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Meu Widget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Descrição do widget
        </p>
        
        <Button className="w-full">
          Ação Principal
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 2. Exportar e Usar

```tsx
// sidebar/index.ts
export { MeuWidget } from './MeuWidget';

// CommunicationAgentPageV2.tsx
<aside className="lg:col-span-4 space-y-6">
  <div className="lg:sticky lg:top-6 space-y-6">
    <AgentSidebarAbout agent={agent} />
    <MeuWidget agent={agent} />
    {/* Outros widgets... */}
  </div>
</aside>
```

---

## 📊 Buscar Dados Customizados

### Com React Query

```tsx
import { useQuery } from "@tanstack/react-query";

function MinhaSecao({ agent }: any) {
  const { data, isLoading } = useQuery({
    queryKey: ["meus-dados", agent.id],
    queryFn: async () => {
      const response = await fetch(`/api/agent/${agent.id}/custom-data`);
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <section>
      {/* Usar data aqui */}
    </section>
  );
}
```

---

## 🎨 Customizar Estilos

### Tema Customizado

```tsx
// Criar variante de card
<Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
  <CardContent>
    Conteúdo com tema customizado
  </CardContent>
</Card>

// Badge customizado
<Badge className="bg-orange-500 text-white">
  Em Alta
</Badge>

// Button com gradiente
<Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
  Ação Premium
</Button>
```

### Animações

```tsx
// Hover effect
<Card className="transition-all duration-300 hover:shadow-xl hover:scale-105">
  Conteúdo
</Card>

// Fade in
<div className="animate-in fade-in duration-500">
  Conteúdo
</div>

// Slide in
<div className="animate-in slide-in-from-bottom duration-700">
  Conteúdo
</div>
```

---

## 📱 Responsividade

### Grid Responsivo

```tsx
// 1 coluna mobile, 2 tablet, 3 desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>

// 1 coluna mobile, 3 tablet, 4 desktop
<div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6">
  {items.map(item => <Card key={item.id}>...</Card>)}
</div>
```

### Texto Responsivo

```tsx
// Tamanho de fonte responsivo
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Título Responsivo
</h1>

// Espaçamento responsivo
<div className="space-y-4 sm:space-y-6 lg:space-y-8">
  Conteúdo
</div>

// Padding responsivo
<div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
  Conteúdo
</div>
```

### Mostrar/Ocultar por Breakpoint

```tsx
// Ocultar em mobile
<div className="hidden sm:block">
  Visível apenas em tablet+
</div>

// Mostrar apenas em mobile
<div className="block sm:hidden">
  Visível apenas em mobile
</div>

// Layout diferente por breakpoint
<div className="flex flex-col lg:flex-row gap-4">
  Coluna em mobile, linha em desktop
</div>
```

---

## 🔄 Estados de Loading

### Skeleton

```tsx
import { Skeleton } from "@/shared/components/ui/skeleton";

function MinhaSecao({ isLoading, data }: any) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return <div>{/* Conteúdo real */}</div>;
}
```

### Spinner

```tsx
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
      </div>
    </div>
  );
}
```

---

## 🎯 Interações

### Click Handler

```tsx
function MinhaSecao() {
  const handleClick = (item: any) => {
    console.log('Item clicado:', item);
    // Lógica aqui
  };

  return (
    <Card onClick={() => handleClick(item)} className="cursor-pointer">
      Clique aqui
    </Card>
  );
}
```

### Hover State

```tsx
function CardInterativo() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`transition-all ${isHovered ? 'shadow-xl scale-105' : ''}`}
    >
      {isHovered ? 'Hovering!' : 'Normal'}
    </Card>
  );
}
```

---

## 📊 Formatação de Dados

### Números

```tsx
// Formatar número grande
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

// Uso
<p>{formatNumber(12500)} seguidores</p> // "12.5k seguidores"
```

### Datas

```tsx
// Data relativa
const formatRelativeTime = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) return 'Agora';
  if (diffHours < 24) return `Há ${diffHours} horas`;
  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays} dias`;
};

// Uso
<span>{formatRelativeTime(publication.created_at)}</span>
```

---

## 🎨 Ícones

### Uso Básico

```tsx
import { Star, Heart, Share2, Bookmark } from "lucide-react";

function MinhaSecao() {
  return (
    <div className="flex items-center gap-2">
      <Star className="h-5 w-5 text-yellow-500" />
      <Heart className="h-5 w-5 text-red-500" />
      <Share2 className="h-5 w-5 text-blue-500" />
      <Bookmark className="h-5 w-5 text-green-500" />
    </div>
  );
}
```

### Ícones Dinâmicos

```tsx
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
    case 'inactive': return <XCircle className="h-5 w-5 text-red-500" />;
    default: return <HelpCircle className="h-5 w-5 text-gray-500" />;
  }
};
```

---

## 🔗 Links e Navegação

### Link Externo

```tsx
<a 
  href="https://example.com" 
  target="_blank" 
  rel="noopener noreferrer"
  className="text-primary hover:underline"
>
  Link Externo
</a>
```

### Link Interno

```tsx
import { Link } from 'react-router-dom';

<Link 
  to="/comunicacao" 
  className="text-primary hover:underline"
>
  Voltar para Comunicação
</Link>
```

---

## 📱 Compartilhamento Social

### Share API

```tsx
const handleShare = async () => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: agent.public_name,
        text: agent.description,
        url: window.location.href,
      });
    } catch (err) {
      console.log('Erro ao compartilhar:', err);
    }
  } else {
    // Fallback: copiar link
    navigator.clipboard.writeText(window.location.href);
    alert('Link copiado!');
  }
};

<Button onClick={handleShare}>
  <Share2 className="h-4 w-4 mr-2" />
  Compartilhar
</Button>
```

---

## 🎯 Conclusão

Estes exemplos cobrem os casos de uso mais comuns. Para mais detalhes, consulte:

- 📚 `../../../../docs/communication-territorial/AGENT_PAGE_V2_DOCUMENTATION.md` - Documentação completa
- 🔄 `AGENT_PAGE_V1_VS_V2.md` - Comparação com V1
- 📖 `README.md` - Quick start

---

**Happy coding! 🚀**

*Última atualização: 15/05/2026*
