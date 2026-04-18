# Rotas Públicas Canônicas - Guia Definitivo

## 📋 Rotas por Tipo de Entidade

### **1. Perfil Pessoal**
- **Rota**: `/u/:username`
- **Exemplo**: `/u/joaosilva`
- **Contexto**: Identidade pessoal/social
- **Página**: `ProfilePublicPage`
- **Resolver**: `ProfilePublicRoute`
- **Service**: `buildPublicProfileUrl(username)`

**Características:**
- ✅ Username único globalmente
- ✅ Representa a identidade social do usuário
- ✅ Perfil obrigatório (criado no signup)
- ✅ Pode ter verificação de identidade

---

### **2. Empresa**

#### **Rota Completa (Canônica)**
- **Rota**: `/empresas/:uf/:cidade/:bairro/:slug`
- **Exemplo**: `/empresas/ba/salvador/barra/restaurante-bom-sabor`
- **Contexto**: Negócio/empresa com localização territorial
- **Página**: `BusinessPublicPage`
- **Resolver**: `BusinessPublicRoute`
- **Service**: `BusinessUrlService.getCanonicalUrl(ctx)`

#### **Rota Premium (Curta)**
- **Rota**: `/p/:slug`
- **Exemplo**: `/p/restaurante-bom-sabor`
- **Comportamento**: Redireciona 308 para rota canônica
- **Resolver**: `BusinessPremiumRoute`
- **Service**: `BusinessUrlService.getShareUrl(ctx)`

**Características:**
- ✅ Slug único por localização
- ✅ Obrigatório ter bairro (location_id)
- ✅ Empresas premium têm rota curta adicional
- ✅ Rota territorial para SEO local

---

### **3. Profissional**
- **Rota**: `/profissionais/:uf/:cidade/:slug`
- **Exemplo**: `/profissionais/ba/salvador/joao-silva-dev`
- **Contexto**: Serviços profissionais autônomos
- **Página**: `ProfessionalPublicPage` (✅ Existe)
- **Resolver**: `ProfessionalPublicRoute` (✅ Existe)
- **Service**: `ProfessionalUrlService` (✅ Implementado)

**Características:**
- ✅ Slug único por cidade
- ✅ Não requer bairro específico
- ✅ Rota territorial para SEO local
- ✅ Implementação completa

---

### **4. Motorista/Motoboy**
- **Rota**: ❌ **Não possui página pública genérica**
- **Contexto**: Informações aparecem em:
  - Perfil pessoal (se houver)
  - Contexto de corrida (para passageiros)
  - Dashboard interno de mobilidade

**Características:**
- ❌ Sem página pública `/u/:username`
- ✅ Informações visíveis apenas em contexto operacional
- ✅ Privacidade por design

---

## 🔑 Regras de Negócio

### **Username vs Slug vs Handle**

| Conceito | Tipo | Formato | Escopo | Usado em |
|----------|------|---------|--------|----------|
| **Username** | Personal | `joaosilva` | Global | `/u/:username` |
| **Slug** | Business | `restaurante-bom-sabor` | Por localização | `/empresas/.../:slug` |
| **Slug** | Professional | `joao-silva-dev` | Por cidade | `/profissionais/.../:slug` |
| **Handle** | Genérico | `@joaosilva` | Variável | Legado (evitar) |

### **Redirecionamentos Automáticos**

#### **ProfilePublicRoute (`/u/:username`)**
```typescript
// ✅ Personal → Renderiza ProfilePublicPage
/u/joaosilva (personal) → ProfilePublicPage

// ✅ Business → Redireciona para rota canônica
/u/restaurante-bom-sabor (business) → /empresas/ba/salvador/barra/restaurante-bom-sabor

// ✅ Professional → Redireciona para rota canônica
/u/joao-dev (professional) → /profissionais/ba/salvador/joao-dev

// ✅ Driver → 404 (não tem página pública)
/u/joao-driver (driver) → 404
```

#### **BusinessPremiumRoute (`/p/:slug`)**
```typescript
// ✅ Premium → Redireciona para rota canônica
/p/restaurante-bom-sabor → /empresas/ba/salvador/barra/restaurante-bom-sabor

// ✅ Não premium → 404
/p/empresa-basica → 404
```

---

## 🔧 Funções SSOT

### **Personal**
```typescript
import { buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';

// ✅ Construir URL pública de perfil pessoal
const url = buildPublicProfileUrl('joaosilva');
// → /u/joaosilva
```

### **Business**
```typescript
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';

// ✅ Construir URL canônica
const canonical = BusinessUrlService.getCanonicalUrl({
  id: 'uuid',
  slug: 'restaurante-bom-sabor',
  is_premium: false,
  geographic_path: '/br/ba/salvador/barra'
});
// → /empresas/ba/salvador/barra/restaurante-bom-sabor

// ✅ Construir URL de compartilhamento (premium ou canônica)
const share = BusinessUrlService.getShareUrl({
  id: 'uuid',
  slug: 'restaurante-bom-sabor',
  is_premium: true,
  geographic_path: '/br/ba/salvador/barra'
});
// → /p/restaurante-bom-sabor (se premium)
// → /empresas/ba/salvador/barra/restaurante-bom-sabor (se não premium)
```

### **Professional** (✅ IMPLEMENTADO)
```typescript
import { ProfessionalUrlService } from '@/core/professional/services/ProfessionalUrlService';

// ✅ Construir URL canônica
const url = ProfessionalUrlService.getCanonicalUrl({
  id: 'uuid',
  slug: 'joao-silva-dev',
  state: 'BA',
  city: 'Salvador'
});
// → /profissionais/ba/salvador/joao-silva-dev

// ✅ Resolver por slug + localização
const ctx = await ProfessionalUrlService.resolveBySlug('joao-silva-dev', 'ba', 'salvador');
if (ctx) {
  const url = ProfessionalUrlService.getCanonicalUrl(ctx);
  navigate(url);
}

// ✅ Resolver por ID
const ctx = await ProfessionalUrlService.resolveById(professionalProfile.id);
if (ctx) {
  const url = ProfessionalUrlService.getCanonicalUrl(ctx);
  navigate(url);
}
```

### **Função Universal**
```typescript
import { buildCanonicalPublicUrl } from '@/core/profiles/utils/publicProfileUrl';

// ✅ Construir URL canônica baseada no tipo de perfil
const url = buildCanonicalPublicUrl(profile);

// Personal → /u/:username
// Business → null (usar BusinessUrlService)
// Professional → null (usar ProfessionalUrlService)
// Driver → null (não tem página pública)
```

---

## ✅ Checklist de Implementação

### **FASE 1: ProfilePublicRoute (✅ CONCLUÍDO)**
- [x] Aceita apenas perfil personal
- [x] Redireciona business para rota canônica
- [x] Retorna 404 para professional
- [x] Retorna 404 para driver
- [x] Logs de redirecionamento

### **FASE 2: Funções SSOT (✅ CONCLUÍDO)**
- [x] `buildPublicProfileUrl` documentado como personal-only
- [x] `buildCanonicalPublicUrl` criado
- [x] `canHavePublicUrl` criado
- [x] Tipos TypeScript atualizados

### **FASE 3: Correção de Usos (✅ CONCLUÍDO)**
- [x] `CadastrarServicoPage.tsx` - Redireciona para `/services`
- [x] `CriarMotoristaPage.tsx` - Redireciona para dashboard
- [x] `PerfilIdentidadesPage.tsx` - Usa `buildCanonicalPublicUrl`
- [x] Imports não utilizados removidos

### **FASE 4: Documentação (✅ CONCLUÍDO)**
- [x] `ProfilePublicPage` documentada como personal-only
- [x] `ProfilePublicRoute` documentado com redirecionamentos
- [x] Guia de rotas públicas criado

### **FASE 5: ProfessionalUrlService (✅ CONCLUÍDO)**
- [x] Criar `ProfessionalUrlService`
- [x] Implementar `buildCanonicalUrl`
- [x] Implementar `resolveBySlug`
- [x] Implementar `resolveById`
- [x] Atualizar `ProfilePublicRoute` para redirecionar professional
- [x] Atualizar `buildCanonicalPublicUrl` documentação

### **FASE 6: Testes e Monitoramento (⚠️ TODO)**
- [ ] Testes de redirecionamento
- [ ] Logs de uso de rotas legadas
- [ ] Monitoramento de 404s
- [ ] Analytics de rotas públicas

---

## 📊 Impacto das Mudanças

### **Antes (Ambíguo)**
```
❌ /u/:username aceita qualquer tipo de perfil
❌ Confusão entre pessoa e empresa
❌ SEO prejudicado por ambiguidade
❌ Experiência inconsistente
```

### **Depois (Canônico)**
```
✅ /u/:username = APENAS perfil pessoal
✅ Empresas têm rotas territoriais claras
✅ Profissionais têm rotas territoriais claras
✅ Motoristas sem página pública (privacidade)
✅ SEO otimizado por tipo
✅ Experiência consistente e previsível
```

---

## 🚀 Exemplos de Uso

### **Criar link para perfil pessoal**
```typescript
import { buildPublicProfileUrl } from '@/core/profiles/utils/publicProfileUrl';

// ✅ CORRETO
const url = buildPublicProfileUrl(personalProfile.username);
navigate(url);
```

### **Criar link para empresa**
```typescript
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';

// ✅ CORRETO
const businessContext = await BusinessUrlService.resolveById(businessProfile.id);
if (businessContext) {
  const url = BusinessUrlService.getCanonicalUrl(businessContext);
  navigate(url);
}
```

### **Verificar se perfil pode ter URL pública**
```typescript
import { buildCanonicalPublicUrl } from '@/core/profiles/utils/publicProfileUrl';

// ✅ CORRETO - Funciona para qualquer tipo
const publicUrl = buildCanonicalPublicUrl(profile);
if (publicUrl) {
  navigate(publicUrl);
} else {
  toast.error('Este perfil não possui página pública');
}
```

### **Abrir perfil público de qualquer tipo**
```typescript
import { buildCanonicalPublicUrl } from '@/core/profiles/utils/publicProfileUrl';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { ProfessionalUrlService } from '@/core/professional/services/ProfessionalUrlService';

// ✅ CORRETO - Lógica universal
async function openPublicProfile(profile: Profile) {
  if (profile.profile_type === 'personal') {
    const url = buildCanonicalPublicUrl(profile);
    if (url) navigate(url);
  } else if (profile.profile_type === 'business') {
    const ctx = await BusinessUrlService.resolveById(profile.id);
    if (ctx) navigate(BusinessUrlService.getCanonicalUrl(ctx));
  } else if (profile.profile_type === 'professional') {
    const ctx = await ProfessionalUrlService.resolveById(profile.id);
    if (ctx) navigate(ProfessionalUrlService.getCanonicalUrl(ctx));
  } else {
    toast.error('Este perfil não possui página pública');
  }
}
```

---

## 🎯 Resultado Final

### **Clareza Conceitual**
- ✅ Cada tipo de entidade tem sua rota específica
- ✅ Sem ambiguidade de multi-perfil
- ✅ Contexto apropriado por URL

### **SEO Otimizado**
- ✅ URLs descritivas e hierárquicas
- ✅ Estrutura territorial para negócios locais
- ✅ Sem conteúdo duplicado

### **Experiência do Usuário**
- ✅ Expectativas claras por tipo de URL
- ✅ Navegação intuitiva
- ✅ Privacidade respeitada (driver)

### **Manutenibilidade**
- ✅ SSOT para geração de URLs
- ✅ Código limpo e type-safe
- ✅ Sem gambiarras

---

**Arquitetura limpa, sem ambiguidade, seguindo SSOT!** 🚀
