# Análise: Exibição de Tipo de Perfil no Header

## 🔍 Problema Reportado

**Usuário**: @washingtonmsdj  
**Sintoma**: Header mostrando "@washingtonmsdj · Empresa"  
**Expectativa**: Mostrar o tipo correto do perfil ativo

---

## 📊 Análise do Código

### **1. Componente ProfileHeaderCompact**

**Arquivo**: `src/modules/profile/components/hub/ProfileHeaderCompact.tsx`  
**Linha**: 233

```typescript
<Badge variant="secondary" className="h-5 text-[10px] font-medium">
  {getProfileTypeLabel(activeProfile)}
</Badge>
```

**Status**: ✅ Código correto - está usando `activeProfile` do contexto

---

### **2. Contexto Multi-Perfil**

**Arquivo**: `src/core/profiles/contexts/multi-profile-runtime-context.tsx`

**Lógica**:
```typescript
const effectiveProfile = contextualProfile ?? activeProfile;
```

**Comportamento**:
- `activeProfile`: Perfil selecionado pelo usuário (pode ser personal, business, professional, driver)
- `contextualProfile`: Perfil contextual baseado na rota (ex: business em `/empresas`)
- `effectiveProfile`: Perfil efetivo usado no módulo

**Status**: ✅ Lógica correta

---

### **3. Hook useProfileHub**

**Arquivo**: `src/modules/profile/hooks/useProfileHub.ts`

```typescript
const { activeProfile, allProfiles, switchProfile } = useMultiProfileContext();
```

**Status**: ✅ Usando corretamente o contexto

---

### **4. Página PerfilHubPage**

**Arquivo**: `src/modules/profile/pages/PerfilHubPage.tsx`  
**Linha**: 1367

```typescript
<ProfileHeaderCompact
  activeProfile={activeProfile}  // ← Perfil ativo (pode ser business)
  profile={profile}              // ← Perfil personal (fallback)
  // ...
/>
```

**Status**: ⚠️ Passando `activeProfile` que pode ser de qualquer tipo

---

## 🎯 Causa Raiz

O sistema está funcionando **corretamente** conforme projetado:

1. ✅ Usuário tem múltiplos perfis (personal, business, etc.)
2. ✅ Usuário selecionou perfil de **empresa** como ativo
3. ✅ Sistema mostra "@washingtonmsdj · Empresa" (correto!)
4. ❌ Usuário esperava ver o tipo do perfil **personal**

---

## 🤔 Interpretação do Problema

### **Cenário A: Usuário quer ver o perfil personal**
- **Solução**: Trocar o perfil ativo para personal
- **Ação**: Usar o switcher de perfis

### **Cenário B: Header deve sempre mostrar personal**
- **Problema conceitual**: Contradiz a arquitetura multi-perfil
- **Impacto**: Confusão sobre qual perfil está ativo

### **Cenário C: Mostrar ambos (ativo + personal)**
- **Solução**: Mostrar "Perfil ativo: Empresa | Pessoal: @washingtonmsdj"
- **Impacto**: Header mais complexo

---

## 💡 Soluções Propostas

### **Opção 1: Manter comportamento atual (RECOMENDADO)**

**Justificativa**:
- ✅ Arquitetura multi-perfil funcionando corretamente
- ✅ Usuário vê claramente qual perfil está ativo
- ✅ Consistente com SSOT e design do sistema

**Ação**: Explicar ao usuário como trocar de perfil

---

### **Opção 2: Sempre mostrar perfil personal no header**

**Mudança**:
```typescript
// Encontrar perfil personal
const personalProfile = allProfiles.find(p => p.profile_type === 'personal') || profile;

<ProfileHeaderCompact
  activeProfile={personalProfile}  // ← Sempre personal
  profile={profile}
  // ...
/>
```

**Impacto**:
- ❌ Contradiz arquitetura multi-perfil
- ❌ Confusão: header mostra personal, mas ações usam business
- ❌ Inconsistente com resto do sistema

---

### **Opção 3: Mostrar perfil ativo + indicador de personal**

**Mudança**:
```typescript
<div className="flex items-center gap-2">
  <Badge variant="secondary">
    {getProfileTypeLabel(activeProfile)}
  </Badge>
  {activeProfile?.profile_type !== 'personal' && (
    <Badge variant="outline" className="text-[10px]">
      Pessoal: @{personalHandle}
    </Badge>
  )}
</div>
```

**Impacto**:
- ✅ Mostra ambos os contextos
- ⚠️ Header mais complexo
- ⚠️ Pode confundir usuários

---

### **Opção 4: Sidebar mostra personal, header mostra ativo**

**Mudança**:
```typescript
// Sidebar (ProfileSidebarHeader)
<ProfileSidebarHeader
  profile={personalProfile}  // ← Sempre personal
  // ...
/>

// Header (ProfileHeaderCompact)
<ProfileHeaderCompact
  activeProfile={activeProfile}  // ← Perfil ativo
  // ...
/>
```

**Impacto**:
- ✅ Sidebar = identidade principal (personal)
- ✅ Header = contexto operacional (ativo)
- ✅ Separação clara de responsabilidades
- ✅ Mantém arquitetura multi-perfil

---

## 🎯 Recomendação Final

### **Implementar Opção 4: Sidebar Personal + Header Ativo**

**Justificativa**:
1. ✅ **Sidebar** mostra identidade principal (personal) - sempre visível
2. ✅ **Header** mostra contexto operacional (perfil ativo) - muda conforme seleção
3. ✅ Mantém arquitetura multi-perfil intacta
4. ✅ Usuário vê ambos os contextos sem confusão
5. ✅ Consistente com SSOT

**Implementação**:
```typescript
// PerfilHubPage.tsx - linha ~1350
const personalProfile = allProfiles.find((p) => p.profile_type === "personal") || profile;

// Sidebar - linha ~1367
<ProfileSectionsNav
  profile={personalProfile}  // ← Sempre personal
  // ...
/>

// Header - linha ~1380
<ProfileHeaderCompact
  activeProfile={activeProfile}  // ← Perfil ativo (business, professional, driver)
  profile={profile}              // ← Fallback
  // ...
/>
```

---

## 📝 Mudanças Necessárias

### **1. PerfilHubPage.tsx**

**Linha ~1350**: Adicionar variável `personalProfile`
```typescript
const personalProfile = allProfiles.find((p) => p.profile_type === "personal") || profile;
```

**Linha ~1367**: Passar `personalProfile` para sidebar
```typescript
<ProfileSectionsNav
  items={sectionItems}
  activeId={activeSection}
  onChange={setActiveSection}
  variant="sidebar"
  profile={personalProfile}  // ← Mudança aqui
  isVerified={isVerified}
  handle={handle}
  canOpenPublicProfile={canOpenPublicProfile}
/>
```

**Linha ~1380**: Manter `activeProfile` no header
```typescript
<ProfileHeaderCompact
  activeProfile={activeProfile}  // ← Mantém ativo
  profile={profile}
  // ...
/>
```

---

### **2. ProfileSidebarHeader.tsx**

**Status**: ✅ Já está correto - recebe `profile` como prop

---

### **3. ProfileHeaderCompact.tsx**

**Status**: ✅ Já está correto - usa `activeProfile`

---

## ✅ Resultado Esperado

### **Antes (Problema)**
```
Header: @washingtonmsdj · Empresa
Sidebar: @washingtonmsdj · Empresa
```
**Problema**: Tudo mostra empresa, usuário não vê identidade personal

---

### **Depois (Solução)**
```
Header: @washingtonmsdj · Empresa        ← Contexto operacional (ativo)
Sidebar: @washingtonmsdj · Pessoal       ← Identidade principal (personal)
```
**Benefício**: 
- ✅ Sidebar = identidade principal sempre visível
- ✅ Header = contexto operacional atual
- ✅ Usuário vê ambos sem confusão

---

## 🔄 Fluxo de Uso

### **Cenário 1: Usuário com perfil personal ativo**
```
Header: @washingtonmsdj · Pessoal
Sidebar: @washingtonmsdj · Pessoal
```
**Status**: Ambos mostram personal (consistente)

---

### **Cenário 2: Usuário com perfil business ativo**
```
Header: @washingtonmsdj · Empresa
Sidebar: @washingtonmsdj · Pessoal
```
**Status**: 
- Header = contexto operacional (empresa)
- Sidebar = identidade principal (personal)

---

### **Cenário 3: Usuário com perfil professional ativo**
```
Header: @washingtonmsdj · Profissional
Sidebar: @washingtonmsdj · Pessoal
```
**Status**: 
- Header = contexto operacional (profissional)
- Sidebar = identidade principal (personal)

---

### **Cenário 4: Usuário com perfil driver ativo**
```
Header: @washingtonmsdj · Motorista
Sidebar: @washingtonmsdj · Pessoal
```
**Status**: 
- Header = contexto operacional (motorista)
- Sidebar = identidade principal (personal)

---

## 🎯 Conclusão

**Problema**: Sistema funcionando corretamente, mas UX pode ser melhorada

**Solução**: Separar responsabilidades
- **Sidebar** = Identidade principal (personal) - sempre visível
- **Header** = Contexto operacional (ativo) - muda conforme seleção

**Impacto**: 
- ✅ Mantém arquitetura multi-perfil
- ✅ Melhora UX sem quebrar SSOT
- ✅ Usuário vê ambos os contextos
- ✅ Sem confusão sobre qual perfil está ativo

---

## 📋 Checklist de Implementação

- [ ] Adicionar variável `personalProfile` em PerfilHubPage.tsx
- [ ] Passar `personalProfile` para ProfileSectionsNav (sidebar)
- [ ] Manter `activeProfile` em ProfileHeaderCompact (header)
- [ ] Testar com perfil personal ativo
- [ ] Testar com perfil business ativo
- [ ] Testar com perfil professional ativo
- [ ] Testar com perfil driver ativo
- [ ] Validar TypeScript (0 erros)
- [ ] Documentar mudança

---

**Status**: ✅ Análise completa  
**Próximo passo**: Implementar Opção 4
