# Arquitetura: Abas do Perfil

## 🎯 Conceito

**"Dados Pessoais" NÃO é uma página separada** - é uma **aba/seção** dentro da mesma página `/perfil`.

---

## 📐 Estrutura

### **Single Page Application (SPA) com Abas**

```
┌─────────────────────────────────────────────────────────┐
│ URL: /perfil?sec=dados-pessoais                         │
│      ^^^^^^ ^^^^^^^^^^^^^^^^^^^                         │
│      Página    Query Parameter                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ PerfilHubPage (componente único)                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌─────────────┬─────────────────────────────────────┐  │
│ │  Sidebar    │  Conteúdo Dinâmico                  │  │
│ │  (Desktop)  │                                     │  │
│ │             │  Renderizado baseado em:            │  │
│ │ • Resumo    │  const activeSection = searchParams │  │
│ │ • Dados     │                        .get("sec")  │  │
│ │ • Empresas  │                                     │  │
│ │ • Mobilid.  │  if (activeSection === "resumo")    │  │
│ │ • Delivery  │    return <ResumoContent />         │  │
│ │ • Planos    │                                     │  │
│ │ • Notific.  │  if (activeSection === "dados-...")  │  │
│ │ • Config.   │    return <DadosPessoaisContent />  │  │
│ │ • Seguranç. │                                     │  │
│ │             │  // ... outras abas                 │  │
│ └─────────────┴─────────────────────────────────────┘  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │  Tabs (Mobile)                                      │ │
│ │  [Resumo] [Dados] [Empresas] [Mobilidade] ...      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementação Técnica

### **1. Leitura do Query Parameter**

```typescript
// src/modules/profile/pages/PerfilHubPage.tsx

import { useSearchParams } from "react-router-dom";

export default function PerfilHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Ler o parâmetro "sec" da URL
  const sectionParam = searchParams.get("sec");
  
  // Validar e definir aba ativa (default: "resumo")
  const activeSection: ProfileSectionId = isProfileSectionId(sectionParam)
    ? sectionParam
    : "resumo";
  
  // ...
}
```

### **2. Mudança de Aba**

```typescript
const setActiveSection = (section: ProfileSectionId) => {
  const nextParams = new URLSearchParams(searchParams);
  
  if (section === "resumo") {
    // Remover parâmetro para aba padrão
    nextParams.delete("sec");
  } else {
    // Adicionar/atualizar parâmetro
    nextParams.set("sec", section);
  }
  
  // Atualizar URL sem recarregar a página
  setSearchParams(nextParams, { replace: true });
};
```

### **3. Renderização Condicional**

```typescript
const renderSectionContent = () => {
  if (activeSection === "resumo") {
    return <ResumoContent />;
  }

  if (activeSection === "dados-pessoais") {
    return <DadosPessoaisContent />;
  }

  if (activeSection === "empresas") {
    return <EmpresasContent />;
  }

  // ... outras abas

  return <SegurancaContent />;  // default
};

return (
  <div>
    <ProfileSectionsNav
      items={sectionItems}
      activeId={activeSection}
      onChange={setActiveSection}
    />
    
    <div>
      {renderSectionContent()}
    </div>
  </div>
);
```

---

## 📋 Abas Disponíveis

### **Configuração SSOT**

```typescript
// src/modules/profile/config/profile-sections.config.ts

export const PROFILE_SECTIONS = [
  {
    id: "resumo",
    label: "Resumo",
    description: "Visão geral do perfil",
    icon: LayoutGrid,
  },
  {
    id: "dados-pessoais",
    label: "Dados Pessoais",
    description: "Informações pessoais e verificação",
    icon: UserRound,
  },
  {
    id: "empresas",
    label: "Empresas",
    description: "Negócios e operações",
    icon: Building2,
  },
  {
    id: "mobilidade",
    label: "Mobilidade",
    description: "Corridas e transporte",
    icon: Car,
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "Entregas e motoboy",
    icon: Truck,
  },
  {
    id: "planos",
    label: "Planos",
    description: "Assinaturas e recursos",
    icon: CreditCard,
  },
  {
    id: "notificacoes",
    label: "Notificações",
    description: "Alertas e mensagens",
    icon: Bell,
  },
  {
    id: "configuracoes",
    label: "Configurações",
    description: "Privacidade e preferências",
    icon: Settings2,
  },
  {
    id: "seguranca",
    label: "Segurança",
    description: "Conta e dados",
    icon: Shield,
  },
] as const;
```

---

## 🌐 URLs e Navegação

### **URLs Possíveis**

```
/perfil                          → Aba "Resumo" (padrão)
/perfil?sec=resumo               → Aba "Resumo" (explícito)
/perfil?sec=dados-pessoais       → Aba "Dados Pessoais"
/perfil?sec=empresas             → Aba "Empresas"
/perfil?sec=mobilidade           → Aba "Mobilidade"
/perfil?sec=delivery             → Aba "Delivery"
/perfil?sec=planos               → Aba "Planos"
/perfil?sec=notificacoes         → Aba "Notificações"
/perfil?sec=configuracoes        → Aba "Configurações"
/perfil?sec=seguranca            → Aba "Segurança"
```

### **Navegação Programática**

```typescript
// Dentro de um componente
const navigate = useNavigate();

// Navegar para aba específica
navigate("/perfil?sec=dados-pessoais");

// Ou usando a função setActiveSection
setActiveSection("dados-pessoais");
```

### **Links Diretos**

```typescript
// Em qualquer lugar do app
<Link to="/perfil?sec=empresas">
  Ver Empresas
</Link>

<Button onClick={() => navigate("/perfil?sec=mobilidade")}>
  Ir para Mobilidade
</Button>
```

---

## 🎨 Componentes de Navegação

### **Desktop: Sidebar**

```typescript
<aside className="hidden lg:flex lg:w-[240px]">
  <ProfileSectionsNav
    items={sectionItems}
    activeId={activeSection}
    onChange={setActiveSection}
    variant="sidebar"
  />
</aside>
```

**Características**:
- Visível apenas em desktop (≥ 1024px)
- Navegação vertical
- Sempre visível
- Largura fixa: 240px (lg) → 260px (xl)

### **Mobile: Tabs Horizontais**

```typescript
<div className="lg:hidden">
  <ProfileSectionsNav
    items={sectionItems}
    activeId={activeSection}
    onChange={setActiveSection}
    variant="tabs"
  />
</div>
```

**Características**:
- Visível apenas em mobile (< 1024px)
- Navegação horizontal scrollável
- Tabs compactas
- Swipe para navegar

---

## 🔄 Fluxo de Navegação

### **1. Usuário Clica em uma Aba**

```
Usuário clica "Dados Pessoais"
         ↓
setActiveSection("dados-pessoais")
         ↓
setSearchParams({ sec: "dados-pessoais" })
         ↓
URL atualizada: /perfil?sec=dados-pessoais
         ↓
React re-renderiza com novo activeSection
         ↓
renderSectionContent() retorna <DadosPessoaisContent />
         ↓
Conteúdo exibido na tela
```

### **2. Usuário Acessa URL Diretamente**

```
Usuário digita: /perfil?sec=empresas
         ↓
searchParams.get("sec") retorna "empresas"
         ↓
activeSection = "empresas"
         ↓
renderSectionContent() retorna <EmpresasContent />
         ↓
Conteúdo exibido na tela
```

### **3. Navegação Programática**

```typescript
// De qualquer lugar do app
navigate("/perfil?sec=notificacoes");
         ↓
URL muda para /perfil?sec=notificacoes
         ↓
PerfilHubPage detecta mudança
         ↓
activeSection atualizado para "notificacoes"
         ↓
Conteúdo renderizado
```

---

## 💡 Vantagens desta Arquitetura

### **1. Performance**
- ✅ Sem recarregamento de página
- ✅ Componentes compartilhados (header, sidebar)
- ✅ Estado mantido entre abas
- ✅ Transições suaves

### **2. UX**
- ✅ Navegação instantânea
- ✅ URLs compartilháveis
- ✅ Botão voltar funciona
- ✅ Histórico do navegador preservado

### **3. SEO**
- ✅ URLs únicas por aba
- ✅ Deep linking funciona
- ✅ Compartilhamento em redes sociais

### **4. Desenvolvimento**
- ✅ Código organizado
- ✅ Fácil adicionar novas abas
- ✅ Lógica centralizada
- ✅ Manutenção simplificada

---

## 🆚 Comparação: Abas vs Páginas Separadas

### **Abas (Implementação Atual)**

```
✅ Vantagens:
- Navegação instantânea
- Estado compartilhado
- Componentes reutilizados
- Menos código duplicado
- Transições suaves

⚠️ Desvantagens:
- Arquivo grande (PerfilHubPage.tsx)
- Toda lógica em um lugar
```

### **Páginas Separadas (Alternativa)**

```
❌ Desvantagens:
- Recarregamento entre páginas
- Estado perdido
- Componentes duplicados
- Mais código
- Transições bruscas

✅ Vantagens:
- Arquivos menores
- Lógica distribuída
- Code splitting automático
```

---

## 📊 Estrutura de Arquivos

```
src/modules/profile/
├── pages/
│   └── PerfilHubPage.tsx          ← Página única com todas as abas
│
├── components/
│   └── hub/
│       ├── ProfileHeaderCompact.tsx
│       ├── ProfileSectionsNav.tsx  ← Navegação (sidebar/tabs)
│       ├── ProfileStats.tsx
│       ├── SectionFrame.tsx
│       ├── HubLinkCard.tsx
│       └── ... (outros componentes)
│
├── config/
│   └── profile-sections.config.ts  ← Configuração SSOT das abas
│
└── hooks/
    └── useProfileHub.ts            ← Lógica compartilhada
```

---

## 🎯 Resumo

### **"Dados Pessoais" é:**
- ✅ Uma **aba/seção** dentro de `/perfil`
- ✅ Controlada por query parameter `?sec=dados-pessoais`
- ✅ Renderizada condicionalmente no mesmo componente
- ✅ Sem recarregamento de página

### **"Dados Pessoais" NÃO é:**
- ❌ Uma página separada com rota própria
- ❌ Um componente de página independente
- ❌ Uma rota como `/perfil/dados-pessoais`

---

## 🔗 Navegação Rápida

```typescript
// Para navegar para "Dados Pessoais" de qualquer lugar:

// Opção 1: Link direto
<Link to="/perfil?sec=dados-pessoais">Dados Pessoais</Link>

// Opção 2: Navegação programática
navigate("/perfil?sec=dados-pessoais");

// Opção 3: Dentro do PerfilHubPage
setActiveSection("dados-pessoais");
```

---

**Arquitetura de abas implementada com React Router e query parameters!** 🎯✨
