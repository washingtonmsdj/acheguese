# ⚡ SSOT - Ações Imediatas

**Data**: 2026-04-01  
**Prioridade**: 🔴 Alta  
**Prazo**: Esta semana

---

## 🎯 Objetivo

Completar as ações necessárias para desbloquear o progresso da Fase 1 do projeto SSOT.

---

## 📋 Checklist de Ações

### 1. Melhorar Script de Compliance ⏭️ PRÓXIMO

**Arquivo**: `scripts/check-ssot-compliance.ts`  
**Tempo estimado**: 2-3 horas  
**Prioridade**: 🔴 Alta

**Problema**:
- Script detecta SSOTs legítimos como violações
- 27 falsos positivos identificados
- Relatórios confusos

**Solução**:
```typescript
// Adicionar mapeamento de tabelas para SSOTs
const TABLE_SSOTS: Record<string, string[]> = {
  'user_subscriptions': ['SubscriptionService.ts'],
  'tourist_points': ['TouristPointService.ts'],
  'business_data': ['BusinessService.ts'],
  'profiles': ['ProfileService.ts'],
  'professional_data': ['ProfessionalService.ts'],
  'driver_data': ['MobilityService.ts'],
  'posts': ['PostService.ts'],
  'comments': ['CommentService.ts'],
  'classifieds': ['ClassifiedService.ts'],
  'events': ['EventService.ts'],
  'reviews': ['ReviewsService.ts'],
  'locations': ['LocationService.ts'],
  'menu_categories': ['MenuService.ts'],
  'menu_items': ['MenuService.ts'],
};

// Verificar se arquivo é SSOT da tabela
function isTableSSot(filePath: string, table: string): boolean {
  const ssots = TABLE_SSOTS[table] || [];
  return ssots.some(ssot => filePath.includes(ssot));
}

// Usar na detecção
if (isTableSSot(filePath, table)) {
  continue; // Não é violação
}
```

**Resultado esperado**:
- Reduzir falsos positivos de 27 para ~0
- Relatórios mais precisos
- Violações reais: 295 → 268

---

### 2. Adicionar Métodos ao ProfileService

**Arquivo**: `src/core/profiles/services/ProfileService.ts`  
**Tempo estimado**: 3-4 horas  
**Prioridade**: 🔴 Alta

**Métodos a adicionar**:

```typescript
/**
 * Busca perfis por status de verificação
 */
async getProfilesByVerificationStatus(
  status: 'pending' | 'verified' | 'rejected',
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: 'created_at' | 'updated_at';
  }
): Promise<Profile[]> {
  // Implementação
}

/**
 * Busca estatísticas de verificação
 */
async getVerificationStats(): Promise<{
  total_pending: number;
  total_verified: number;
  total_rejected: number;
}> {
  // Implementação
}

/**
 * Atualiza status de verificação de um perfil
 */
async updateVerificationStatus(
  profileId: string,
  status: 'pending' | 'verified' | 'rejected' | 'none',
  reason?: string
): Promise<void> {
  // Implementação
}

/**
 * Aprova verificação de um perfil
 */
async approveVerification(profileId: string): Promise<void> {
  await this.updateVerificationStatus(profileId, 'verified');
}

/**
 * Rejeita verificação de um perfil
 */
async rejectVerification(profileId: string, reason?: string): Promise<void> {
  await this.updateVerificationStatus(profileId, 'rejected', reason);
}

/**
 * Revoga verificação de um perfil
 */
async revokeVerification(profileId: string): Promise<void> {
  await this.updateVerificationStatus(profileId, 'none');
}
```

**Resultado esperado**:
- VerificationService pode ser refatorado
- 15 violações podem ser corrigidas

---

### 3. Adicionar Métodos ao BusinessService

**Arquivo**: `src/core/business/services/BusinessService.ts`  
**Tempo estimado**: 3-4 horas  
**Prioridade**: 🔴 Alta

**Métodos a adicionar**:

```typescript
/**
 * Verifica se slug já existe
 */
static async checkSlugExists(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  try {
    let query = supabase
      .from('business_data')
      .select('id')
      .eq('slug', slug)
      .limit(1);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    
    return !!data;
  } catch (error) {
    logger.error('Error checking slug existence:', error);
    throw error;
  }
}

/**
 * Busca slugs similares para sugestão
 */
static async getSimilarSlugs(slug: string, limit = 20): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('business_data')
      .select('slug')
      .ilike('slug', `${slug}%`)
      .limit(limit);

    if (error) throw error;
    
    return (data || []).map(d => d.slug).filter(Boolean);
  } catch (error) {
    logger.error('Error getting similar slugs:', error);
    throw error;
  }
}

/**
 * Busca histórico de mudanças de slug
 */
static async getSlugHistory(businessId: string): Promise<Array<{
  id: string;
  old_slug: string;
  change_reason: string;
  created_at: string;
}>> {
  try {
    const { data, error } = await supabase
      .from('business_slug_history')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    logger.error('Error getting slug history:', error);
    throw error;
  }
}

/**
 * Resolve slug antigo para slug atual
 */
static async resolveOldSlug(oldSlug: string): Promise<{
  businessId: string;
  currentSlug: string;
} | null> {
  try {
    // Busca no histórico
    const { data: histData, error: histErr } = await supabase
      .from('business_slug_history')
      .select('business_id')
      .eq('old_slug', oldSlug)
      .maybeSingle();

    if (histErr || !histData) return null;

    // Busca slug atual
    const { data: currentData, error: currentErr } = await supabase
      .from('business_data')
      .select('id, slug')
      .eq('id', histData.business_id)
      .eq('status', 'active')
      .maybeSingle();

    if (currentErr || !currentData) return null;

    return {
      businessId: currentData.id,
      currentSlug: currentData.slug,
    };
  } catch (error) {
    logger.error('Error resolving old slug:', error);
    throw error;
  }
}
```

**Resultado esperado**:
- BusinessIdentityAdapter pode ser refatorado
- 4 violações podem ser corrigidas

---

### 4. Refatorar VerificationService

**Arquivo**: `src/modules/verification/services/VerificationService.ts`  
**Tempo estimado**: 1-2 horas  
**Prioridade**: 🟡 Média (após ação 2)

**Dependência**: Ação 2 (métodos no ProfileService)

**Mudanças**:
```typescript
// Antes
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('verification_status', 'pending');

// Depois
const profiles = await profileService.getProfilesByVerificationStatus('pending');
```

**Resultado esperado**:
- 15 violações corrigidas
- Código mais limpo e manutenível

---

### 5. Refatorar BusinessIdentityAdapter

**Arquivo**: `src/core/public-identity/adapters/BusinessIdentityAdapter.ts`  
**Tempo estimado**: 1-2 horas  
**Prioridade**: 🟡 Média (após ação 3)

**Dependência**: Ação 3 (métodos no BusinessService)

**Mudanças**:
```typescript
// Antes
const { data, error } = await supabase
  .from('business_data')
  .select('id')
  .eq('slug', slug);

// Depois
const exists = await BusinessService.checkSlugExists(slug);
```

**Resultado esperado**:
- 4 violações corrigidas
- Adapter mais limpo

---

### 6. Refatorar Identity Adapters Restantes

**Arquivos**:
- `src/core/public-identity/adapters/ProfessionalIdentityAdapter.ts` (2 violações)
- `src/core/public-identity/adapters/ProfileIdentityAdapter.ts` (2 violações)

**Tempo estimado**: 2-3 horas  
**Prioridade**: 🟡 Média

**Abordagem**: Seguir mesmo padrão do BusinessIdentityAdapter

**Resultado esperado**:
- 4 violações corrigidas

---

## 📊 Impacto Total

### Se todas as ações forem completadas:

**Violações**:
- Inicial: 295
- Falsos positivos removidos: -27
- Corrigidas nesta semana: -38
- **Total restante**: 230

**Compliance**:
- Inicial: 60%
- **Final**: 73% (+13%)

**Fase 1**:
- Inicial: 26%
- **Final**: 77% (+51%)

---

## ⏱️ Timeline Sugerida

### Segunda-feira
- ✅ Ação 1: Melhorar script (manhã)
- ✅ Ação 2: Adicionar métodos ao ProfileService (tarde)

### Terça-feira
- ✅ Ação 3: Adicionar métodos ao BusinessService (manhã)
- ✅ Ação 4: Refatorar VerificationService (tarde)

### Quarta-feira
- ✅ Ação 5: Refatorar BusinessIdentityAdapter (manhã)
- ✅ Ação 6: Refatorar outros Identity Adapters (tarde)

### Quinta-feira
- ✅ Testes e validação
- ✅ Documentação
- ✅ Code review

### Sexta-feira
- ✅ Merge e deploy
- ✅ Treinamento da equipe
- ✅ Planejamento da próxima semana

---

## ✅ Critérios de Sucesso

### Técnicos
- [ ] Script de compliance sem falsos positivos
- [ ] ProfileService com 6 novos métodos
- [ ] BusinessService com 4 novos métodos
- [ ] VerificationService 100% SSOT compliant
- [ ] BusinessIdentityAdapter 100% SSOT compliant
- [ ] Identity Adapters 100% SSOT compliant

### Qualidade
- [ ] Zero diagnósticos TypeScript
- [ ] Todos os testes passando
- [ ] Code review aprovado
- [ ] Documentação atualizada

### Processo
- [ ] Pre-commit hook funcionando
- [ ] CI/CD passando
- [ ] Equipe treinada
- [ ] Próxima semana planejada

---

## 🚨 Bloqueadores Potenciais

### 1. Métodos Complexos
**Risco**: Métodos novos podem ter lógica complexa  
**Mitigação**: Começar com implementação simples, iterar depois

### 2. Testes Quebrados
**Risco**: Mudanças podem quebrar testes existentes  
**Mitigação**: Rodar testes frequentemente, fix incremental

### 3. Conflitos de Merge
**Risco**: Outros devs podem estar trabalhando nos mesmos arquivos  
**Mitigação**: Comunicar mudanças, fazer merges frequentes

---

## 📞 Suporte

**Dúvidas técnicas**: #ssot-project no Slack  
**Code review**: @arquitetura  
**Aprovações**: @tech-lead

---

## 🎯 Meta da Semana

**Completar 100% das ações listadas**

Isso nos colocará em:
- 73% de compliance total
- 77% da Fase 1 completa
- Pronto para iniciar Fase 2 na próxima semana

---

**Criado**: 2026-04-01T11:45:00Z  
**Responsável**: Equipe de Arquitetura  
**Deadline**: 2026-04-05 (sexta-feira)  
**Status**: ⏭️ Pronto para iniciar
