# ✅ Correção: Vagas Mantém Bairro na Navegação

## 🐛 Problema Identificado

Quando o usuário estava em um bairro (ex: `/ba/salvador/brotas`) e clicava em "Vagas" no menu lateral, a navegação mudava para a cidade (`/vagas/ba/salvador`) ao invés de manter o bairro (`/vagas/ba/salvador/brotas`).

**Comportamento incorreto:**
```
Usuário em: /empresas/ba/salvador/brotas
Clica em: Vagas
Vai para: /vagas/ba/salvador ❌ (perdeu o bairro)
```

**Comportamento esperado:**
```
Usuário em: /empresas/ba/salvador/brotas
Clica em: Vagas
Vai para: /vagas/ba/salvador/brotas ✅ (mantém o bairro)
```

---

## 🔍 Causa Raiz

No `AppSidebar.tsx`, vagas estava usando `appUrls.jobs` (fixo) enquanto outros módulos usavam `urls.classifieds`, `urls.business`, etc. (dinâmicos):

```typescript
// ❌ ANTES: Vagas usava appUrls (fixo)
const exploreItems: NavItem[] = useMemo(() => [
  { icon: Home, label: 'Início', href: urls.landing },
  { icon: Building2, label: 'Empresas', href: urls.business },      // ✅ Dinâmico
  { icon: Wrench, label: 'Serviços', href: urls.services },         // ✅ Dinâmico
  { icon: Tag, label: 'Classificados', href: urls.classifieds },    // ✅ Dinâmico
  { icon: Calendar, label: 'Eventos', href: urls.events },          // ✅ Dinâmico
  { icon: Briefcase, label: 'Vagas', href: appUrls.jobs },          // ❌ Fixo
], [urls, appUrls.jobs]);
```

**Diferença:**
- `urls` = `useFriendlyModuleUrls()` → Mantém território ativo (cidade + bairro)
- `appUrls` = `useAppUrls()` → URLs fixas (LAUNCH_URLS)

---

## 🔧 Solução Implementada

### 1. Adicionado `jobs` ao `useFriendlyModuleUrls`

**Arquivo: `src/core/routing/hooks/useFriendlyModuleUrls.ts`**

**Interface atualizada:**
```typescript
export interface FriendlyModuleUrls {
  community:    string;
  business:     string;
  services:     string;
  classifieds:  string;
  events:       string;
  jobs:         string;  // ✅ Adicionado
  base:         string;
  landing:      string;
  territoryName: string | null;
}
```

**Lógica de prioridade (mantida):**

**Prioridade 1: Params da URL** (fonte de verdade)
```typescript
if (stateIsTerritory) {
  if (slug) {
    return {
      // ...
      jobs: `/vagas/${state}/${city}/${slug}`,  // ✅ Com bairro
    };
  }
  return {
    // ...
    jobs: `/vagas/${state}/${city}`,  // ✅ Sem bairro
  };
}
```

**Prioridade 2: activeLocation do store** (fallback)
```typescript
if (activeLocation?.geographic_path) {
  const publicPath = geoPathToPublicUrl(activeLocation.geographic_path);
  return {
    // ...
    jobs: `/vagas${publicPath}`,  // ✅ Mantém path completo
  };
}
```

**Prioridade 3: Território de lançamento** (fallback final)
```typescript
return {
  // ...
  jobs: LAUNCH_URLS.jobs,  // /vagas/ba/salvador
};
```

### 2. Atualizado `AppSidebar` para usar `urls.jobs`

**Arquivo: `src/app/components/AppSidebar.tsx`**

```typescript
// ✅ AGORA: Todos usam urls (dinâmico)
const exploreItems: NavItem[] = useMemo(() => [
  { icon: Home, label: 'Início', href: urls.landing },
  { icon: Building2, label: 'Empresas', href: urls.business },
  { icon: Wrench, label: 'Serviços', href: urls.services },
  { icon: Tag, label: 'Classificados', href: urls.classifieds },
  { icon: Calendar, label: 'Eventos', href: urls.events },
  { icon: Briefcase, label: 'Vagas', href: urls.jobs },  // ✅ Dinâmico
], [urls]);  // ✅ Dependência simplificada
```

---

## 🎯 Resultado

### Cenário 1: Usuário em bairro
```
Contexto: /empresas/ba/salvador/brotas
Clica em: Vagas
Vai para: /vagas/ba/salvador/brotas ✅
Banner: "Exibindo vagas de Brotas" ✅
```

### Cenário 2: Usuário em cidade
```
Contexto: /empresas/ba/salvador
Clica em: Vagas
Vai para: /vagas/ba/salvador ✅
Banner: "Exibindo vagas de Salvador" ✅
```

### Cenário 3: Usuário em página global (ex: /perfil)
```
Contexto: /perfil
activeLocation: Brotas
Clica em: Vagas
Vai para: /vagas/ba/salvador/brotas ✅
Banner: "Exibindo vagas de Brotas" ✅
```

### Cenário 4: Sem território ativo
```
Contexto: /perfil
activeLocation: null
Clica em: Vagas
Vai para: /vagas/ba/salvador (fallback) ✅
Banner: "Exibindo vagas de Salvador" ✅
```

---

## 📊 Consistência com Outros Módulos

Agora vagas está 100% consistente com os outros módulos:

| Módulo | Hook | Mantém Bairro? | Status |
|--------|------|----------------|--------|
| Empresas | `urls.business` | ✅ | Correto |
| Serviços | `urls.services` | ✅ | Correto |
| Classificados | `urls.classifieds` | ✅ | Correto |
| Eventos | `urls.events` | ✅ | Correto |
| Comunidade | `urls.community` | ✅ | Correto |
| **Vagas** | `urls.jobs` | ✅ | **Corrigido** |

---

## ✅ Validação SSOT

**Sem hardcoded values:**
- ✅ Usa `useFriendlyModuleUrls()` (SSOT de território)
- ✅ Respeita prioridade: URL params → activeLocation → LAUNCH_URLS
- ✅ Mantém território completo (cidade + bairro)
- ✅ Fallback seguro para território de lançamento

**Sem gambiarras:**
- ✅ Mesma lógica de classificados, serviços, empresas
- ✅ Código limpo e profissional
- ✅ Tipagem forte (TypeScript)
- ✅ Memoização correta

---

## 🎉 Conclusão

Problema resolvido! Vagas agora mantém o bairro na navegação, igual aos outros módulos. A correção foi simples e seguiu o padrão SSOT existente.
