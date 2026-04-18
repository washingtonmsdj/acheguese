# Arquitetura de Identidade Pública Canônica - Plano de Ação

## 🎯 Objetivo

Padronizar a arquitetura de identidade pública, eliminando ambiguidade de multi-perfil legado e estabelecendo rotas canônicas claras para cada tipo de entidade.

---

## 📋 Situação Atual (PROBLEMÁTICA)

### **Problema Principal**
A rota `/u/:username` aceita **QUALQUER tipo de perfil** (personal, business, professional, driver), criando:
- ❌ Ambiguidade conceitual
- ❌ Confusão para usuários
- ❌ Dificuldade de SEO
- ❌ Mistura de contextos (pessoa vs empresa)

### **Rotas Atuais**
```
/u/:username              → QUALQUER perfil (❌ AMBÍGUO)
/p/:slug                  → Business premium (✅ OK)
/empresas/:uf/:cidade/:bairro/:slug  → Business (✅ OK)
/profissionais/:uf/:cidade/:slug     → Professional (✅ OK)
```

### **Problemas Identificados**

#### 1. **ProfilePublicRoute aceita qualquer tipo**
```typescript
// ❌ PROBLEMA: Busca qualquer perfil
const profile = await profileService.getByUsername(username);
// Retorna: personal, business, professional, driver
```

#### 2. **buildPublicProfileUrl usado para todos os tipos**
```typescript
// ❌ PROBLEMA: Usado para business, professional, driver
navigate(buildPublicProfileUrl(result.handle));
```

#### 3. **ProfilePublicPage não diferencia contextos**
```typescript
// ❌ PROBLEMA: Mesma página para pessoa e empresa
export function ProfilePublicPage({ profile }: ProfilePublicPageProps)
```

---

## ✅ Modelo Canônico (SOLUÇÃO)

### **Rotas Públicas Canônicas**

| Tipo | Rota Canônica | Exemplo | Descrição |
|------|---------------|---------|-----------|
| **Personal** | `/u/:username` | `/u/joaosilva` | Perfil pessoal/social |
| **Business** | `/empresas/:uf/:cidade/:bairro/:slug` | `/empresas/ba/salvador/barra/restaurante-bom-sabor` | Empresa (rota completa) |
| **Business Premium** | `/p/:slug` | `/p/restaurante-bom-sabor` | Empresa premium (rota curta) |
| **Professional** | `/profissionais/:uf/:cidade/:slug` | `/profissionais/ba/salvador/joao-silva-dev` | Profissional |
| **Driver** | ❌ Sem página pública | - | Não tem página pública genérica |

### **Decisões de Arquitetura**

#### ✅ **1. /u/:username = APENAS Personal**
```typescript
// ProfilePublicRoute deve:
// 1. Buscar perfil por username
// 2. Verificar se é profile_type = 'personal'
// 3. Se não for, redirecionar para rota canônica
// 4. Se for, renderizar ProfilePublicPage
```

#### ✅ **2. Business → Rota territorial**
```typescript
// Business NÃO usa /u/:username
// Rota canônica: /empresas/:uf/:cidade/:bairro/:slug
// Rota premium: /p/:slug (redireciona para canônica)
```

#### ✅ **3. Professional → Rota territorial**
```typescript
// Professional NÃO usa /u/:username
// Rota canônica: /profissionais/:uf/:cidade/:slug
```

#### ✅ **4. Driver → Sem página pública**
```typescript
// Driver NÃO tem página pública genérica
// Informações de motorista aparecem em:
// - Perfil pessoal (se houver)
// - Contexto de corrida (para passageiros)
```

---

## 🔧 Implementação

### **FASE 1: Atualizar ProfilePublicRoute**

#### **Arquivo**: `src/core/routing/components/ProfilePublicRoute.tsx`

```typescript
/**
 * Profile Public Route
 * Rota pública de perfil PESSOAL por username: /u/:username
 *
 * RESPONSABILIDADE:
 * - Resolver username para profile PERSONAL
 * - Redirecionar outros tipos para suas rotas canônicas
 * - Renderizar página pública do perfil pessoal
 *
 * Rota pública canônica:
 * - /u/:username = APENAS perfil pessoal/social
 */

import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/core/profiles/services/ProfileService';
import { BusinessUrlService } from '@/core/business/services/BusinessUrlService';
import { logger } from '@/shared/utils/logger';
import { ProfilePublicPage } from '@/modules/profile/pages/ProfilePublicPage';
import { logPageNotFound } from '@/core/public-identity/utils/identity-logger';

export default function ProfilePublicRoute() {
  const { username } = useParams<{ username: string }>();

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      if (!username) {
        throw new Error('Username is required');
      }

      logger.info('[ProfilePublicRoute] Resolving username', { username });

      const profile = await profileService.getByUsername(username);

      if (!profile) {
        logger.warn('[ProfilePublicRoute] Profile not found', { username });
        return { type: 'not_found' as const };
      }

      // ✅ NOVO: Verificar tipo de perfil e redirecionar se necessário
      if (profile.profile_type === 'business') {
        logger.info('[ProfilePublicRoute] Redirecting business to canonical URL', { 
          username, 
          profileId: profile.id 
        });

        // Buscar URL canônica da empresa
        const businessContext = await BusinessUrlService.resolveByProfileId(profile.id);
        
        if (businessContext) {
          const urls = BusinessUrlService.buildUrls(businessContext);
          return { 
            type: 'redirect' as const, 
            url: urls.canonical 
          };
        }

        // Fallback: se não encontrar contexto, vai para 404
        return { type: 'not_found' as const };
      }

      if (profile.profile_type === 'professional') {
        logger.info('[ProfilePublicRoute] Redirecting professional to canonical URL', { 
          username, 
          profileId: profile.id 
        });

        // TODO: Implementar resolução de URL canônica de profissional
        // Por enquanto, redireciona para 404
        return { type: 'not_found' as const };
      }

      if (profile.profile_type === 'driver') {
        logger.info('[ProfilePublicRoute] Driver profile has no public page', { 
          username, 
          profileId: profile.id 
        });

        // Driver não tem página pública
        return { type: 'not_found' as const };
      }

      // ✅ CORRETO: Apenas personal chega aqui
      if (profile.profile_type === 'personal') {
        return { 
          type: 'profile' as const, 
          profile 
        };
      }

      // Tipo desconhecido
      return { type: 'not_found' as const };
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !result || result.type === 'not_found') {
    logger.error('[ProfilePublicRoute] Error or profile not found', { username, error });

    if (username) {
      logPageNotFound({
        entityType: 'profile',
        identifier: username,
        attemptedUrl: `/u/${username}`,
      });
    }

    return <Navigate to="/404" replace />;
  }

  if (result.type === 'redirect') {
    logger.info('[ProfilePublicRoute] Redirecting to canonical URL', { 
      from: `/u/${username}`, 
      to: result.url 
    });
    return <Navigate to={result.url} replace />;
  }

  // ✅ APENAS perfil personal chega aqui
  return <ProfilePublicPage profile={result.profile} />;
}
```

---

### **FASE 2: Criar funções SSOT para URLs públicas**

#### **Arquivo**: `src/core/profiles/utils/publicProfileUrl.ts`

```typescript
import type { Profile } from '@/core/profiles/types';

/**
 * Constrói URL pública para perfil PESSOAL
 * 
 * @param username - Username do perfil pessoal
 * @returns URL pública: /u/:username
 * 
 * ⚠️ IMPORTANTE: Usar APENAS para perfil personal
 */
export function buildPublicProfileUrl(username: string): string {
  return `/u/${username}`;
}

/**
 * Constrói URL pública canônica baseada no tipo de perfil
 * 
 * @param profile - Perfil completo
 * @returns URL pública canônica ou null se não aplicável
 * 
 * ✅ SSOT: Função centralizada para determinar URL pública
 */
export function buildCanonicalPublicUrl(profile: Profile): string | null {
  switch (profile.profile_type) {
    case 'personal':
      return profile.username ? `/u/${profile.username}` : null;
    
    case 'business':
      // Business usa rota territorial
      // URL será construída por BusinessUrlService
      return null;
    
    case 'professional':
      // Professional usa rota territorial
      // URL será construída por ProfessionalUrlService (TODO)
      return null;
    
    case 'driver':
      // Driver não tem página pública
      return null;
    
    default:
      return null;
  }
}

/**
 * Verifica se um perfil pode ter URL pública
 * 
 * @param profile - Perfil a verificar
 * @returns true se o perfil pode ter URL pública
 */
export function canHavePublicUrl(profile: Profile): boolean {
  return profile.profile_type === 'personal' && Boolean(profile.username);
}

/**
 * Constrói URL de edição de perfil
 */
export function buildProfileEditUrl(profileId: string): string {
  return `/perfil/editar/${profileId}`;
}

/**
 * Constrói URL de configurações de perfil
 */
export function buildProfileSettingsUrl(
  tab?: "privacy" | "links" | "members",
): string {
  return tab ? `/perfil/configuracoes?tab=${tab}` : "/perfil/configuracoes";
}
```

---

### **FASE 3: Atualizar usos de buildPublicProfileUrl**

#### **Locais a corrigir**:

1. ✅ **CadastrarServicoPage.tsx** - Criar profissional
```typescript
// ❌ ANTES
navigate(buildPublicProfileUrl(result.handle));

// ✅ DEPOIS
// Professional não usa /u/:username
// Redirecionar para página de sucesso ou dashboard
navigate('/profissionais/sucesso');
```

2. ✅ **CriarMotoristaPage.tsx** - Criar motorista
```typescript
// ❌ ANTES
navigate(buildPublicProfileUrl(result.handle));

// ✅ DEPOIS
// Driver não tem página pública
// Redirecionar para dashboard de motorista
navigate('/mobilidade/motorista/dashboard');
```

3. ✅ **PerfilIdentidadesPage.tsx** - Abrir perfil público
```typescript
// ❌ ANTES
navigate(buildPublicProfileUrl(profile.handle));

// ✅ DEPOIS
const publicUrl = buildCanonicalPublicUrl(profile);
if (publicUrl) {
  navigate(publicUrl);
} else {
  toast.error('Este perfil não possui página pública');
}
```

---

### **FASE 4: Atualizar ProfilePublicPage**

#### **Arquivo**: `src/modules/profile/pages/ProfilePublicPage.tsx`

```typescript
/**
 * Página pública de perfil PESSOAL por username — /u/:username
 * 
 * RESPONSABILIDADE:
 * - Renderizar informações públicas do perfil PESSOAL
 * - Usar apenas dados públicos seguros (sem PII sensível)
 * - Contexto: Identidade pessoal/social
 * 
 * ⚠️ IMPORTANTE:
 * - Esta página é APENAS para perfil personal
 * - Business usa /empresas/:uf/:cidade/:bairro/:slug
 * - Professional usa /profissionais/:uf/:cidade/:slug
 * - Driver não tem página pública
 * 
 * Rota pública canônica:
 * - /u/:username = perfil pessoal/social
 */

// ... (resto do código permanece igual)
```

---

### **FASE 5: Criar ProfessionalUrlService**

#### **Arquivo**: `src/core/professionals/services/ProfessionalUrlService.ts`

```typescript
/**
 * ProfessionalUrlService - SSOT para URLs de profissionais
 * 
 * Responsabilidade:
 * - Construir URLs canônicas de profissionais
 * - Resolver profissionais por slug
 * - Manter consistência com padrão territorial
 */

export class ProfessionalUrlService {
  /**
   * Constrói URL canônica de profissional
   * 
   * @param params - Parâmetros territoriais e slug
   * @returns URL canônica: /profissionais/:uf/:cidade/:slug
   */
  static buildCanonicalUrl(params: {
    state: string;
    city: string;
    slug: string;
  }): string {
    const { state, city, slug } = params;
    return `/profissionais/${state.toLowerCase()}/${city.toLowerCase()}/${slug}`;
  }

  /**
   * Resolve profissional por slug e localização
   */
  static async resolveBySlug(params: {
    state: string;
    city: string;
    slug: string;
  }): Promise<Professional | null> {
    // TODO: Implementar busca no banco
    return null;
  }
}
```

---

### **FASE 6: Documentação**

#### **Arquivo**: `docs/ROTAS_PUBLICAS_CANONICAS.md`

```markdown
# Rotas Públicas Canônicas - Guia Definitivo

## 📋 Rotas por Tipo de Entidade

### **1. Perfil Pessoal**
- **Rota**: `/u/:username`
- **Exemplo**: `/u/joaosilva`
- **Contexto**: Identidade pessoal/social
- **Página**: `ProfilePublicPage`
- **Resolver**: `ProfilePublicRoute`

### **2. Empresa**
- **Rota Completa**: `/empresas/:uf/:cidade/:bairro/:slug`
- **Exemplo**: `/empresas/ba/salvador/barra/restaurante-bom-sabor`
- **Rota Premium**: `/p/:slug` (redireciona para completa)
- **Exemplo Premium**: `/p/restaurante-bom-sabor`
- **Contexto**: Negócio/empresa
- **Página**: `BusinessPublicPage`
- **Resolver**: `BusinessRouteResolver`

### **3. Profissional**
- **Rota**: `/profissionais/:uf/:cidade/:slug`
- **Exemplo**: `/profissionais/ba/salvador/joao-silva-dev`
- **Contexto**: Serviços profissionais
- **Página**: `ProfissionalPublicPage`
- **Resolver**: `ProfissionalPublicRoute`

### **4. Motorista**
- **Rota**: ❌ Não possui página pública
- **Contexto**: Informações aparecem em:
  - Perfil pessoal (se houver)
  - Contexto de corrida (para passageiros)

## 🔑 Regras de Negócio

### **Username vs Slug**
- **Username**: Identificador único de perfil PESSOAL
  - Formato: `joaosilva`, `maria123`
  - Usado em: `/u/:username`
  - Único globalmente

- **Slug**: Identificador único de entidade territorial
  - Formato: `restaurante-bom-sabor`, `joao-silva-dev`
  - Usado em: `/empresas/.../:slug`, `/profissionais/.../:slug`
  - Único por localização

### **Redirecionamentos**
- `/u/:username` com business → Redireciona para `/empresas/...`
- `/u/:username` com professional → Redireciona para `/profissionais/...`
- `/u/:username` com driver → 404
- `/p/:slug` → Redireciona para `/empresas/...` (se premium)

## ✅ Checklist de Implementação

- [ ] ProfilePublicRoute aceita apenas personal
- [ ] buildPublicProfileUrl usado apenas para personal
- [ ] buildCanonicalPublicUrl criado (SSOT)
- [ ] ProfessionalUrlService criado
- [ ] Usos incorretos de buildPublicProfileUrl corrigidos
- [ ] ProfilePublicPage documentada como personal-only
- [ ] Testes de redirecionamento implementados
- [ ] Documentação atualizada
```

---

## 📊 Impacto das Mudanças

### **Antes (Ambíguo)**
```
/u/joaosilva              → Personal ✅
/u/restaurante-bom-sabor  → Business ❌ (ambíguo)
/u/joao-dev               → Professional ❌ (ambíguo)
/u/joao-driver            → Driver ❌ (ambíguo)
```

### **Depois (Canônico)**
```
/u/joaosilva                                    → Personal ✅
/empresas/ba/salvador/barra/restaurante-bom-sabor → Business ✅
/profissionais/ba/salvador/joao-dev             → Professional ✅
/u/joao-driver                                  → 404 ✅
```

---

## 🚀 Plano de Execução

### **Prioridade 1 (Crítico)**
1. ✅ Atualizar ProfilePublicRoute (filtrar apenas personal)
2. ✅ Criar buildCanonicalPublicUrl (SSOT)
3. ✅ Corrigir usos incorretos de buildPublicProfileUrl

### **Prioridade 2 (Importante)**
4. ✅ Criar ProfessionalUrlService
5. ✅ Atualizar documentação de ProfilePublicPage
6. ✅ Adicionar testes de redirecionamento

### **Prioridade 3 (Desejável)**
7. ✅ Criar guia de rotas públicas
8. ✅ Adicionar logs de redirecionamento
9. ✅ Monitorar uso de rotas legadas

---

## ✅ Resultado Esperado

### **Clareza Conceitual**
- ✅ `/u/:username` = APENAS perfil pessoal
- ✅ Empresas têm rotas territoriais
- ✅ Profissionais têm rotas territoriais
- ✅ Motoristas não têm página pública

### **SEO Melhorado**
- ✅ URLs descritivas por tipo
- ✅ Estrutura hierárquica clara
- ✅ Sem ambiguidade de conteúdo

### **Experiência do Usuário**
- ✅ Expectativas claras por URL
- ✅ Contexto apropriado por tipo
- ✅ Navegação intuitiva

---

**Arquitetura limpa, sem gambiarras, seguindo SSOT!** 🚀
