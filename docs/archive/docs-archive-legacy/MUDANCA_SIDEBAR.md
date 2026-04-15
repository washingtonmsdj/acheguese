# Mudança: Header para Sidebar Fixa (Desktop)

## Motivação
Seguindo o padrão de redes sociais hiperlocais como Nextdoor, que usam sidebar fixa no desktop para melhor organização e acesso rápido às seções principais.

## Mudanças Implementadas

### 1. Novo Componente: `AppSidebar.tsx`
**Localização:** `src/app/components/AppSidebar.tsx`

**Características:**
- Sidebar colapsável (ícones quando fechada)
- Atalho de teclado: `Cmd/Ctrl + B` para toggle
- Estado persistente via cookie
- Tooltips nos itens quando colapsada
- Integração com notificações e mensagens

**Seções:**
- **Navegação Principal:**
  - Início
  - Comunidade
  - Empresas
  - Serviços
  - Classificados
  - Mapa
  - Mobilidade

- **Ações Rápidas:**
  - Buscar
  - Mensagens (com contador de não lidas)
  - Notificações (componente unificado)

- **Footer:**
  - Avatar e nome do usuário
  - Link para perfil
  - Botão "Entrar" (se não autenticado)

### 2. Novo Layout: `AppLayoutSidebar.tsx`
**Localização:** `src/app/components/AppLayoutSidebar.tsx`

**Comportamento:**
- **Desktop:** Sidebar fixa + header minimalista (breadcrumb + toggle)
- **Mobile:** Mantém BottomNav (sem sidebar)

**Componentes usados:**
- `SidebarProvider` - Gerencia estado da sidebar
- `SidebarInset` - Container do conteúdo principal
- `SidebarTrigger` - Botão para colapsar/expandir

### 3. Atualização: `App.tsx`
**Mudança:**
```typescript
// Antes
import { AppLayoutHeader } from "@/app/components/AppLayoutHeader";
<Route element={<AppLayoutHeader />}>

// Depois
import { AppLayoutSidebar } from "@/app/components/AppLayoutSidebar";
<Route element={<AppLayoutSidebar />}>
```

## Arquivos Criados
1. `src/app/components/AppSidebar.tsx` - Componente da sidebar
2. `src/app/components/AppLayoutSidebar.tsx` - Layout com sidebar

## Arquivos Modificados
1. `src/App.tsx` - Troca de layout

## Arquivos Mantidos (não removidos)
- `src/app/components/AppLayoutHeader.tsx` - Mantido para referência
- `src/app/components/MainHeader.tsx` - Mantido para referência
- `src/app/components/BottomNav.tsx` - Ainda usado no mobile

## Comportamento por Plataforma

### Desktop (≥768px)
```
┌─────────────┬──────────────────────────────┐
│   SIDEBAR   │  Header (breadcrumb+toggle)  │
│             ├──────────────────────────────┤
│ 🏠 Início   │                              │
│ 👥 Comunid. │                              │
│ 🏢 Empresas │      CONTEÚDO PRINCIPAL      │
│ 🔧 Serviços │                              │
│ 🏷️ Classif. │                              │
│ 🗺️ Mapa     │                              │
│ 🚗 Mobilid. │                              │
│             │                              │
│ ─────────── │                              │
│ 🔍 Buscar   │                              │
│ 💬 Mensag.  │                              │
│ 🔔 Notific. │                              │
│             │                              │
│ 👤 Perfil   │                              │
└─────────────┴──────────────────────────────┘
```

### Mobile (<768px)
```
┌──────────────────────────────┐
│                              │
│                              │
│      CONTEÚDO PRINCIPAL      │
│                              │
│                              │
├──────────────────────────────┤
│  👥  🏢  🔧  ➕  🏷️  🗺️  🚗  │ ← BottomNav
└──────────────────────────────┘
```

## Vantagens da Sidebar

1. **Mais espaço para contexto**
   - Navegação sempre visível
   - Não compete com conteúdo por espaço vertical
   - Melhor para apps com muitas seções

2. **Padrão de mercado**
   - Nextdoor, LinkedIn, Discord usam sidebar
   - Usuários já familiarizados com o padrão
   - Melhor para redes sociais hiperlocais

3. **Escalabilidade**
   - Fácil adicionar novas seções
   - Espaço para widgets contextuais
   - Submenus possíveis

4. **Acessibilidade**
   - Atalho de teclado (Cmd+B)
   - Tooltips quando colapsada
   - Skip to content mantido

## Tecnologias Usadas

- **shadcn/ui Sidebar** - Componentes base
- **React Router** - Navegação
- **Tailwind CSS** - Estilização
- **Radix UI** - Primitivos acessíveis
- **Cookies** - Persistência de estado

## Validação
- ✅ Diagnóstico TypeScript: sem erros
- ✅ Mobile mantém BottomNav
- ✅ Desktop usa sidebar fixa
- ✅ Estado persistente funciona
- ✅ Atalhos de teclado funcionam
- ✅ Tooltips aparecem quando colapsada

## Próximos Passos (Opcionais)

1. **Widgets contextuais:**
   - Localização atual
   - Grupos favoritos
   - Eventos próximos

2. **Breadcrumbs dinâmicos:**
   - Mostrar caminho atual
   - Links para navegação rápida

3. **Submenus:**
   - Categorias de serviços
   - Tipos de classificados
   - Filtros de mapa

4. **Atalhos adicionais:**
   - Números 1-7 para seções
   - `/` para busca
   - `N` para novo post

## Status
✅ **IMPLEMENTADO** - Sidebar fixa no desktop, BottomNav no mobile

---
*Data: 2026-03-23*
*Tipo: Mudança de UX/UI (navegação)*
*Padrão: Nextdoor-like*
