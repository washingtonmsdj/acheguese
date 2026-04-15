# 🚀 Guia Rápido - SSOT de URLs

## 📖 Referência Rápida para Desenvolvedores

Este guia fornece exemplos práticos de como usar o sistema SSOT de URLs.

---

## 🎯 Conceito Básico

**SSOT (Single Source of Truth)**: Todas as URLs da aplicação são gerenciadas através de hooks centralizados, eliminando strings hardcoded e garantindo type-safety.

---

## 🔧 Como Usar

### 1. Importar o Hook

```typescript
import { useAppUrls } from '@/core/routing/hooks';
```

### 2. Usar no Componente

```typescript
function MyComponent() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  
  // Usar as URLs
  const handleClick = () => {
    navigate(appUrls.services.list);
  };
  
  return <Button onClick={handleClick}>Ver Serviços</Button>;
}
```

---

## 📚 URLs Disponíveis

### Profile (Perfil)

```typescript
appUrls.profile.central           // '/perfil'
appUrls.profile.public(userId)    // '/perfil/:userId'
appUrls.profile.manage            // '/perfil/gerenciar'
appUrls.profile.edit              // '/perfil/editar'
```

**Exemplo:**
```typescript
// Ir para perfil central
navigate(appUrls.profile.central);

// Ver perfil público de um usuário
navigate(appUrls.profile.public('user-123'));
```

---

### Auth (Autenticação)

```typescript
appUrls.auth.login                // '/login'
appUrls.auth.register             // '/cadastro'
appUrls.auth.onboarding           // '/onboarding'
```

**Exemplo:**
```typescript
// Redirecionar para login
if (!user) {
  navigate(appUrls.auth.login);
}
```

---

### Family (Família)

```typescript
appUrls.family.home               // '/familia'
appUrls.family.alerts             // '/familia/alertas'
appUrls.family.zones              // '/familia/zonas'
appUrls.family.settings           // '/familia/configuracoes'
```

**Exemplo:**
```typescript
// Ir para alertas da família
navigate(appUrls.family.alerts);
```

---

### Services (Serviços) - Territorial

```typescript
appUrls.services.list             // '/servicos/ba/salvador' (dinâmico)
appUrls.services.detail(id)       // '/servicos/:id'
appUrls.services.create           // '/servicos/cadastrar'
appUrls.services.edit(id)         // '/servicos/editar/:id'
```

**Exemplo:**
```typescript
// Ver lista de serviços (territorial)
navigate(appUrls.services.list);

// Ver detalhes de um serviço
navigate(appUrls.services.detail('service-123'));

// Criar novo serviço
navigate(appUrls.services.create);
```

---

### Classifieds (Classificados) - Territorial

```typescript
appUrls.classifieds.list          // '/classificados/ba/salvador' (dinâmico)
appUrls.classifieds.detail(id)    // '/classificados/:id'
appUrls.classifieds.create        // '/classificados/novo'
appUrls.classifieds.edit(id)      // '/classificados/editar/:id'
```

**Exemplo:**
```typescript
// Ver lista de classificados (territorial)
navigate(appUrls.classifieds.list);

// Ver detalhes de um classificado
navigate(appUrls.classifieds.detail('classified-123'));
```

---

### Business (Empresas) - Territorial

```typescript
appUrls.business.list             // '/empresas/ba/salvador' (dinâmico)
appUrls.business.portal(slug)     // '/business/:slug'
appUrls.business.create           // '/create-business'
appUrls.business.edit(id)         // '/edit-business/:id'
appUrls.business.dashboard(id)    // '/dashboard/business/:id'
```

**Exemplo:**
```typescript
// Ver lista de empresas (territorial)
navigate(appUrls.business.list);

// Ver portal de uma empresa
navigate(appUrls.business.portal('minha-empresa'));

// Criar nova empresa
navigate(appUrls.business.create);
```

---

### Community (Comunidade) - Territorial + Global

```typescript
// Territorial
appUrls.community.feed            // '/comunidade/ba/salvador' (dinâmico)
appUrls.community.events          // '/eventos/ba/salvador' (dinâmico)

// Global
appUrls.community.groups          // '/grupos'
appUrls.community.groupDetail(id) // '/grupos/:id'

appUrls.community.recommendations // '/recomendacoes'
appUrls.community.newRecommendation // '/recomendacoes/nova'
appUrls.community.recommendationDetail(id) // '/recomendacoes/:id'

appUrls.community.lostAndFound    // '/achados-perdidos'
appUrls.community.newLostAndFound // '/achados-perdidos/novo'
appUrls.community.lostAndFoundDetail(id) // '/achados-perdidos/:id'

appUrls.community.eventDetail(id) // '/eventos/:id'
appUrls.community.coupons         // '/cupons'
appUrls.community.newPost         // '/novo-post'
```

**Exemplo:**
```typescript
// Ver feed da comunidade (territorial)
navigate(appUrls.community.feed);

// Ver eventos (territorial)
navigate(appUrls.community.events);

// Ver grupos
navigate(appUrls.community.groups);

// Criar nova recomendação
navigate(appUrls.community.newRecommendation);
```

---

### Outras URLs Globais

```typescript
appUrls.home                      // '/'
appUrls.settings                  // '/configuracoes'
appUrls.messages                  // '/mensagens'
appUrls.chat(conversationId)      // '/chat/:conversationId'
appUrls.map                       // '/mapa'
appUrls.ranking                   // '/ranking'
appUrls.gamification              // '/gamificacao'
appUrls.mobility                  // '/mobilidade'
appUrls.mobilityPassenger         // '/mobilidade/passageiro'
appUrls.mobilityDriver            // '/mobilidade/motorista'
appUrls.mobilityHistory           // '/mobilidade/historico'
appUrls.search                    // '/busca'
appUrls.notifications             // '/notificacoes'
```

**Exemplo:**
```typescript
// Ir para home
navigate(appUrls.home);

// Ver mensagens
navigate(appUrls.messages);

// Ver ranking
navigate(appUrls.ranking);
```

---

## 🎨 Exemplos Práticos

### Exemplo 1: Botão de Login

```typescript
function LoginButton() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user } = useAuth();
  
  if (user) return null;
  
  return (
    <Button onClick={() => navigate(appUrls.auth.login)}>
      Fazer Login
    </Button>
  );
}
```

### Exemplo 2: Card de Serviço

```typescript
function ServiceCard({ service }) {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  
  return (
    <Card onClick={() => navigate(appUrls.services.detail(service.id))}>
      <h3>{service.title}</h3>
      <p>{service.description}</p>
    </Card>
  );
}
```

### Exemplo 3: Navegação Condicional

```typescript
function ProtectedAction() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  const { user } = useAuth();
  
  const handleAction = () => {
    if (!user) {
      toast.error('Faça login para continuar');
      navigate(appUrls.auth.login);
      return;
    }
    
    // Ação protegida
    navigate(appUrls.services.create);
  };
  
  return <Button onClick={handleAction}>Criar Serviço</Button>;
}
```

### Exemplo 4: Breadcrumb

```typescript
function Breadcrumb() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  
  return (
    <div className="flex items-center gap-2">
      <button onClick={() => navigate(appUrls.home)}>
        Home
      </button>
      <span>/</span>
      <button onClick={() => navigate(appUrls.profile.central)}>
        Perfil
      </button>
      <span>/</span>
      <span>Editar</span>
    </div>
  );
}
```

### Exemplo 5: Menu de Navegação

```typescript
function NavigationMenu() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();
  
  const menuItems = [
    { label: 'Serviços', url: appUrls.services.list },
    { label: 'Classificados', url: appUrls.classifieds.list },
    { label: 'Empresas', url: appUrls.business.list },
    { label: 'Comunidade', url: appUrls.community.feed },
  ];
  
  return (
    <nav>
      {menuItems.map(item => (
        <button key={item.label} onClick={() => navigate(item.url)}>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
```

---

## ❌ O Que NÃO Fazer

### ❌ Hardcoded URLs

```typescript
// ❌ ERRADO - Não fazer!
navigate('/servicos');
navigate('/login');
navigate(`/servicos/${id}`);
```

### ❌ String Templates

```typescript
// ❌ ERRADO - Não fazer!
const url = `/servicos/${id}`;
navigate(url);
```

### ❌ Concatenação

```typescript
// ❌ ERRADO - Não fazer!
navigate('/servicos' + '/' + id);
```

---

## ✅ O Que Fazer

### ✅ Usar Hooks SSOT

```typescript
// ✅ CORRETO - Fazer assim!
const appUrls = useAppUrls();
navigate(appUrls.services.list);
navigate(appUrls.auth.login);
navigate(appUrls.services.detail(id));
```

### ✅ Type-Safe

```typescript
// ✅ CORRETO - TypeScript valida!
const appUrls = useAppUrls();

// Autocomplete funciona
appUrls.services.

// Erros detectados em compilação
appUrls.services.invalidUrl; // ❌ Erro TypeScript
```

---

## 🔍 URLs Territoriais

Algumas URLs são **territoriais** e mudam dinamicamente baseadas na localização ativa:

```typescript
// URLs territoriais (mudam baseadas na localização)
appUrls.services.list      // '/servicos/ba/salvador' ou '/servicos/ba/salvador/pituba'
appUrls.classifieds.list   // '/classificados/ba/salvador'
appUrls.business.list      // '/empresas/ba/salvador'
appUrls.community.feed     // '/comunidade/ba/salvador'
appUrls.community.events   // '/eventos/ba/salvador'
```

**Como funciona:**
1. O hook detecta a localização ativa do usuário
2. Constrói a URL dinamicamente com o caminho geográfico
3. Se não houver localização, usa o território padrão (BA/Salvador)

---

## 🆕 Como Adicionar Novas URLs

### Para URLs Globais

Editar `src/core/routing/hooks/useAppUrls.ts`:

```typescript
export function useAppUrls(): AppUrls {
  return {
    // ... outras URLs
    myNewUrl: '/minha-nova-rota',
    myNewUrlWithParam: (id: string) => `/minha-rota/${id}`,
  };
}
```

### Para URLs de Módulo

Criar `src/modules/[modulo]/hooks/use[Modulo]Urls.ts`:

```typescript
export function useMyModuleUrls(): MyModuleUrls {
  const { activeLocation } = useActiveTerritory();
  
  const listUrl = activeLocation?.geographic_path
    ? `/meu-modulo${geoPathToPublicUrl(activeLocation.geographic_path)}`
    : `/meu-modulo/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`;
  
  return {
    list: listUrl,
    detail: (id: string) => `/meu-modulo/${id}`,
  };
}
```

---

## 🐛 Troubleshooting

### Problema: URL não está disponível

**Solução:** Verifique se a URL foi adicionada ao hook correto:
- URLs globais → `useAppUrls`
- URLs de módulo → `use[Modulo]Urls`

### Problema: TypeScript reclama

**Solução:** Atualize a interface do hook:

```typescript
export interface AppUrls {
  // ... outras URLs
  myNewUrl: string;
}
```

### Problema: URL territorial não funciona

**Solução:** Verifique se o hook usa `useActiveTerritory()` e `geoPathToPublicUrl()`.

---

## 📚 Recursos Adicionais

- **Documentação Completa**: `AUDITORIA_FINAL_SSOT_COMPLETA.md`
- **Exemplos Reais**: Ver arquivos corrigidos no projeto
- **Arquitetura**: `RESUMO_FINAL_SSOT.md`

---

## ✅ Checklist para Desenvolvedores

Ao criar um novo componente com navegação:

- [ ] Importar `useAppUrls` do `@/core/routing/hooks`
- [ ] Usar `appUrls.[modulo].[acao]` ao invés de strings
- [ ] Verificar se a URL existe no hook
- [ ] Se não existir, adicionar ao hook apropriado
- [ ] Testar navegação
- [ ] Verificar autocomplete no IDE
- [ ] Confirmar que não há erros TypeScript

---

**Última atualização**: 27 de março de 2026  
**Versão**: 1.0.0  
**Status**: ✅ Ativo e Funcional
