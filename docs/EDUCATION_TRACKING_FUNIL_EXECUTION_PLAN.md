# Plano de Execução: Tracking Real e Funil de Matrícula

## Objetivo
Fechar o fluxo completo de conversão de uma escola (regular_school), desde a visualização pública até o lead de matrícula e acompanhamento no painel.

## Contexto Atual
✅ Persistência do nicho regular_school implementada:
- Migration com campos escolares
- EducationProfile com campos escolares
- EducationProgram com séries/turmas
- EducationLead com campos de matrícula
- EducationEvent com school_event_type
- EducationLeadForm adaptado
- EducationEventsPage com tipo de evento
- useEducationAnalytics com backend real parcial
- check:ssot, typecheck, build e testes passando

## Arquitetura

### Princípios
1. Serviço central de tracking de Educação
2. Nenhum insert de analytics diretamente em componentes
3. Tracking genérico para Educação (não hardcoded para regular_school)
4. Aceitar nicheKey para futuros nichos
5. Respeitar SSOT, hooks e services existentes
6. Não duplicar analytics fora do domínio de Educação

### Estrutura Proposta
```
src/modules/business/education/
├── services/
│   ├── EducationTrackingService.ts     # Serviço central de tracking
│   └── education.queries.ts            # Extensão: queries de analytics
├── hooks/
│   ├── useEducationTracking.ts         # Hook para registrar eventos
│   └── useEducationAnalytics.ts        # Atualização: usar dados reais
└── types/
    └── index.ts                        # Tipos de eventos de tracking
```

## Fases de Implementação

---

## FASE 1: Infraestrutura de Tracking (Banco de Dados)

### 1.1 Migration: education_analytics_events

**Arquivo:** `supabase/migrations/20260427140000_create_education_analytics_events.sql`

```sql
-- Tabela de eventos de analytics do módulo Education
CREATE TABLE education_analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificadores principais
    education_profile_id uuid REFERENCES education_profiles(id) ON DELETE CASCADE,
    business_id uuid REFERENCES business_data(id) ON DELETE CASCADE,
    niche_key text NOT NULL,
    
    -- Tipo de evento
    event_type text NOT NULL CHECK (event_type IN (
        'profile_view',
        'program_view',
        'event_view',
        'whatsapp_click',
        'enrollment_cta_click',
        'lead_submitted',
        'event_interest'
    )),
    
    -- IDs relacionados (quando aplicável)
    program_id uuid REFERENCES education_programs(id) ON DELETE SET NULL,
    education_event_id uuid REFERENCES education_events(id) ON DELETE SET NULL,
    lead_id uuid REFERENCES education_leads(id) ON DELETE SET NULL,
    
    -- Contexto
    source_page text,
    session_id text,
    
    -- Dados extras flexíveis
    metadata jsonb DEFAULT '{}',
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    
    -- Índices otimizados
    CONSTRAINT valid_niche_key CHECK (niche_key IN (
        'regular_school', 'daycare', 'language_school', 
        'prep_course', 'technical_school', 'tutoring_center',
        'music_school', 'sports_school'
    ))
);

-- Índices de performance
CREATE INDEX idx_education_analytics_profile ON education_analytics_events(education_profile_id);
CREATE INDEX idx_education_analytics_event_type ON education_analytics_events(event_type);
CREATE INDEX idx_education_analytics_niche ON education_analytics_events(niche_key);
CREATE INDEX idx_education_analytics_created ON education_analytics_events(created_at DESC);
CREATE INDEX idx_education_analytics_program ON education_analytics_events(program_id) WHERE program_id IS NOT NULL;
CREATE INDEX idx_education_analytics_event ON education_analytics_events(education_event_id) WHERE education_event_id IS NOT NULL;
CREATE INDEX idx_education_analytics_lead ON education_analytics_events(lead_id) WHERE lead_id IS NOT NULL;

-- RLS: Inserção pública (page views), leitura restrita
ALTER TABLE education_analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Permitir inserção anônima (tracking de page views)
CREATE POLICY "allow_anonymous_insert" ON education_analytics_events
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Policy: Leitura apenas para owners do perfil
CREATE POLICY "allow_owner_read" ON education_analytics_events
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM education_profiles ep
            JOIN business_data bd ON ep.business_id = bd.id
            WHERE ep.id = education_analytics_events.education_profile_id
            AND bd.owner_id = auth.uid()
        )
    );

-- Comentários
COMMENT ON TABLE education_analytics_events IS 'Eventos de analytics do módulo Education';
COMMENT ON COLUMN education_analytics_events.event_type IS 'Tipo: profile_view, program_view, event_view, whatsapp_click, enrollment_cta_click, lead_submitted, event_interest';
```

### 1.2 Types: EducationAnalyticsEvent

**Arquivo:** `src/modules/business/education/types/index.ts` (adicionar)

```typescript
// ============================================================
// ANALYTICS EVENT TYPES
// ============================================================

export type EducationAnalyticsEventType =
  | 'profile_view'
  | 'program_view'
  | 'event_view'
  | 'whatsapp_click'
  | 'enrollment_cta_click'
  | 'lead_submitted'
  | 'event_interest';

export interface EducationAnalyticsEvent {
  id: string;
  education_profile_id: string;
  business_id?: string | null;
  niche_key: EducationNicheKey;
  event_type: EducationAnalyticsEventType;
  program_id?: string | null;
  education_event_id?: string | null;
  lead_id?: string | null;
  source_page?: string | null;
  session_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TrackEventPayload {
  educationProfileId: string;
  businessId?: string;
  nicheKey: EducationNicheKey;
  eventType: EducationAnalyticsEventType;
  programId?: string;
  educationEventId?: string;
  leadId?: string;
  sourcePage?: string;
  metadata?: Record<string, unknown>;
}
```

---

## FASE 2: Serviço Central de Tracking

### 2.1 EducationTrackingService

**Arquivo:** `src/modules/business/education/services/EducationTrackingService.ts`

```typescript
/**
 * EducationTrackingService
 * 
 * Serviço centralizado para tracking de eventos do módulo Education.
 * Todas as operações de analytics devem passar por aqui.
 * 
 * @version 1.0.0
 */

import { supabase } from '@/integrations/supabase';
import { logger } from '@/shared/utils/logger';
import type { 
  EducationAnalyticsEventType, 
  EducationAnalyticsEvent,
  EducationNicheKey 
} from '../types';

export interface TrackEventOptions {
  educationProfileId: string;
  businessId?: string;
  nicheKey: EducationNicheKey;
  eventType: EducationAnalyticsEventType;
  programId?: string;
  educationEventId?: string;
  leadId?: string;
  sourcePage?: string;
  metadata?: Record<string, unknown>;
}

export const EducationTrackingService = {
  /**
   * Registra um evento de analytics
   * 
   * NOTA: Esta função é fire-and-forget. Não espere por resposta.
   * O tracking nunca deve bloquear a experiência do usuário.
   */
  async trackEvent(options: TrackEventOptions): Promise<void> {
    try {
      // Fire-and-forget: não esperamos resposta
      supabase
        .from('education_analytics_events')
        .insert({
          education_profile_id: options.educationProfileId,
          business_id: options.businessId ?? null,
          niche_key: options.nicheKey,
          event_type: options.eventType,
          program_id: options.programId ?? null,
          education_event_id: options.educationEventId ?? null,
          lead_id: options.leadId ?? null,
          source_page: options.sourcePage ?? window?.location?.pathname ?? null,
          session_id: this.getSessionId(),
          metadata: options.metadata ?? {},
        })
        .then(({ error }) => {
          if (error) {
            logger.warn('[EducationTrackingService] Failed to track event:', error);
          }
        });
    } catch (err) {
      // Tracking nunca deve quebrar a aplicação
      logger.warn('[EducationTrackingService] Error tracking event:', err);
    }
  },

  /**
   * Gera ou recupera ID de sessão para tracking
   */
  getSessionId(): string {
    if (typeof window === 'undefined') return 'server-side';
    
    const key = 'education_session_id';
    let sessionId = sessionStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(key, sessionId);
    }
    
    return sessionId;
  },

  // ============================================================
  // HELPERS ESPECÍFICOS (mantêm regras de negócio)
  // ============================================================

  /**
   * Track: Visualização de perfil
   */
  async trackProfileView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessId?: string,
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'profile_view',
    });
  },

  /**
   * Track: Visualização de programa
   */
  async trackProgramView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    programId: string,
    businessId?: string,
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'program_view',
      programId,
    });
  },

  /**
   * Track: Visualização de evento
   */
  async trackEventView(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    educationEventId: string,
    businessId?: string,
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'event_view',
      educationEventId,
    });
  },

  /**
   * Track: Clique no WhatsApp
   */
  async trackWhatsAppClick(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessId?: string,
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'whatsapp_click',
    });
  },

  /**
   * Track: Clique no CTA de matrícula
   */
  async trackEnrollmentCTAClick(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    businessId?: string,
    metadata?: { ctaLabel?: string },
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'enrollment_cta_click',
      metadata,
    });
  },

  /**
   * Track: Lead enviado
   */
  async trackLeadSubmitted(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    leadId: string,
    businessId?: string,
    metadata?: { hasGuardian?: boolean; hasStudent?: boolean; desiredGrade?: string; desiredShift?: string },
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'lead_submitted',
      leadId,
      metadata,
    });
  },

  /**
   * Track: Interesse em evento
   */
  async trackEventInterest(
    educationProfileId: string,
    nicheKey: EducationNicheKey,
    educationEventId: string,
    businessId?: string,
    metadata?: { eventType?: string },
  ): Promise<void> {
    await this.trackEvent({
      educationProfileId,
      businessId,
      nicheKey,
      eventType: 'event_interest',
      educationEventId,
      metadata,
    });
  },
};
```

### 2.2 Hook useEducationTracking

**Arquivo:** `src/modules/business/education/hooks/useEducationTracking.ts`

```typescript
/**
 * useEducationTracking Hook
 * 
 * Hook para facilitar o tracking de eventos em componentes React.
 * 
 * @version 1.0.0
 */

import { useCallback } from 'react';
import { EducationTrackingService } from '../services/EducationTrackingService';
import type { EducationNicheKey } from '../types';

export interface UseEducationTrackingOptions {
  educationProfileId: string;
  nicheKey: EducationNicheKey;
  businessId?: string;
}

export function useEducationTracking(options: UseEducationTrackingOptions) {
  const { educationProfileId, nicheKey, businessId } = options;

  const trackProfileView = useCallback(() => {
    EducationTrackingService.trackProfileView(
      educationProfileId,
      nicheKey,
      businessId,
    );
  }, [educationProfileId, nicheKey, businessId]);

  const trackProgramView = useCallback((programId: string) => {
    EducationTrackingService.trackProgramView(
      educationProfileId,
      nicheKey,
      programId,
      businessId,
    );
  }, [educationProfileId, nicheKey, businessId]);

  const trackEventView = useCallback((eventId: string) => {
    EducationTrackingService.trackEventView(
      educationProfileId,
      nicheKey,
      eventId,
      businessId,
    );
  }, [educationProfileId, nicheKey, businessId]);

  const trackWhatsAppClick = useCallback(() => {
    EducationTrackingService.trackWhatsAppClick(
      educationProfileId,
      nicheKey,
      businessId,
    );
  }, [educationProfileId, nicheKey, businessId]);

  const trackEnrollmentCTAClick = useCallback((ctaLabel?: string) => {
    EducationTrackingService.trackEnrollmentCTAClick(
      educationProfileId,
      nicheKey,
      businessId,
      ctaLabel ? { ctaLabel } : undefined,
    );
  }, [educationProfileId, nicheKey, businessId]);

  const trackLeadSubmitted = useCallback((
    leadId: string,
    metadata?: { hasGuardian?: boolean; hasStudent?: boolean; desiredGrade?: string; desiredShift?: string },
  ) => {
    EducationTrackingService.trackLeadSubmitted(
      educationProfileId,
      nicheKey,
      leadId,
      businessId,
      metadata,
    );
  }, [educationProfileId, nicheKey, businessId]);

  const trackEventInterest = useCallback((eventId: string, eventType?: string) => {
    EducationTrackingService.trackEventInterest(
      educationProfileId,
      nicheKey,
      eventId,
      businessId,
      eventType ? { eventType } : undefined,
    );
  }, [educationProfileId, nicheKey, businessId]);

  return {
    trackProfileView,
    trackProgramView,
    trackEventView,
    trackWhatsAppClick,
    trackEnrollmentCTAClick,
    trackLeadSubmitted,
    trackEventInterest,
  };
}
```

---

## FASE 3: Queries de Analytics (Dados Reais)

### 3.1 Extensão education.queries.ts

**Arquivo:** `src/modules/business/education/services/education.queries.ts` (adicionar ao final)

```typescript
// ============================================================
// ANALYTICS QUERIES - Real Tracking Data
// ============================================================

export interface ProfileViewMetrics {
  totalViews: number;
  uniqueSessions: number;
  viewsLast7Days: number;
  viewsLast30Days: number;
}

export interface ConversionFunnelMetrics {
  profileViews: number;
  whatsappClicks: number;
  ctaClicks: number;
  leadsSubmitted: number;
  leadsContacted: number;
  leadsVisited: number;
  leadsEnrolled: number;
  leadsLost: number;
}

export interface ProgramViewMetrics {
  programId: string;
  programName: string;
  viewCount: number;
  leadCount: number;
  conversionRate: number;
}

export interface EventMetrics {
  eventId: string;
  eventTitle: string;
  viewCount: number;
  interestCount: number;
}

/**
 * Conta visualizações de perfil
 */
export async function getProfileViewMetrics(profileId: string): Promise<ProfileViewMetrics> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('education_analytics_events')
    .select('session_id, created_at')
    .eq('education_profile_id', profileId)
    .eq('event_type', 'profile_view');

  if (error) {
    logger.error('[EducationQueries] Error fetching profile views:', error);
    return { totalViews: 0, uniqueSessions: 0, viewsLast7Days: 0, viewsLast30Days: 0 };
  }

  const events = data ?? [];
  const sessions = new Set(events.map((e) => e.session_id));
  
  return {
    totalViews: events.length,
    uniqueSessions: sessions.size,
    viewsLast7Days: events.filter((e) => e.created_at >= sevenDaysAgo).length,
    viewsLast30Days: events.filter((e) => e.created_at >= thirtyDaysAgo).length,
  };
}

/**
 * Calcula funil de conversão
 */
export async function getConversionFunnel(profileId: string): Promise<ConversionFunnelMetrics> {
  const { data, error } = await supabase
    .from('education_analytics_events')
    .select('event_type, lead_id')
    .eq('education_profile_id', profileId)
    .in('event_type', [
      'profile_view', 'whatsapp_click', 'enrollment_cta_click', 
      'lead_submitted'
    ]);

  if (error) {
    logger.error('[EducationQueries] Error fetching funnel:', error);
    return {
      profileViews: 0, whatsappClicks: 0, ctaClicks: 0, leadsSubmitted: 0,
      leadsContacted: 0, leadsVisited: 0, leadsEnrolled: 0, leadsLost: 0,
    };
  }

  const events = data ?? [];
  const submittedLeadIds = events
    .filter((e) => e.event_type === 'lead_submitted' && e.lead_id)
    .map((e) => e.lead_id);

  // Busca status dos leads enviados
  const { data: leadData } = await supabase
    .from('education_leads')
    .select('status')
    .in('id', submittedLeadIds)
    .eq('education_profile_id', profileId);

  const leads = leadData ?? [];

  return {
    profileViews: events.filter((e) => e.event_type === 'profile_view').length,
    whatsappClicks: events.filter((e) => e.event_type === 'whatsapp_click').length,
    ctaClicks: events.filter((e) => e.event_type === 'enrollment_cta_click').length,
    leadsSubmitted: submittedLeadIds.length,
    leadsContacted: leads.filter((l) => ['contacted', 'visit_scheduled', 'proposal_sent', 'enrolled'].includes(l.status)).length,
    leadsVisited: leads.filter((l) => ['visit_scheduled', 'proposal_sent', 'enrolled'].includes(l.status)).length,
    leadsEnrolled: leads.filter((l) => l.status === 'enrolled').length,
    leadsLost: leads.filter((l) => l.status === 'lost').length,
  };
}

/**
 * Calcula views e conversão por programa
 */
export async function getProgramViewMetrics(profileId: string): Promise<ProgramViewMetrics[]> {
  const { data: programs, error: progError } = await supabase
    .from('education_programs')
    .select('id, name')
    .eq('education_profile_id', profileId);

  if (progError || !programs) {
    logger.error('[EducationQueries] Error fetching programs:', progError);
    return [];
  }

  const { data: views, error: viewError } = await supabase
    .from('education_analytics_events')
    .select('program_id')
    .eq('education_profile_id', profileId)
    .eq('event_type', 'program_view')
    .not('program_id', 'is', null);

  const { data: leads, error: leadError } = await supabase
    .from('education_leads')
    .select('desired_grade, status')
    .eq('education_profile_id', profileId)
    .not('desired_grade', 'is', null);

  if (viewError || leadError) {
    logger.error('[EducationQueries] Error fetching program metrics:', viewError || leadError);
    return [];
  }

  return programs.map((program) => {
    const viewCount = (views ?? []).filter((v) => v.program_id === program.id).length;
    // Mapeia desired_grade com program.name (aproximação)
    const leadCount = (leads ?? []).filter((l) => 
      l.desired_grade?.toLowerCase().includes(program.name.toLowerCase())
    ).length;
    
    return {
      programId: program.id,
      programName: program.name,
      viewCount,
      leadCount,
      conversionRate: viewCount > 0 ? Math.round((leadCount / viewCount) * 100) : 0,
    };
  });
}

/**
 * Calcula views e interesse por evento
 */
export async function getEventMetrics(profileId: string): Promise<EventMetrics[]> {
  const { data: events, error: eventError } = await supabase
    .from('education_events')
    .select('id, title')
    .eq('education_profile_id', profileId);

  if (eventError || !events) {
    logger.error('[EducationQueries] Error fetching events:', eventError);
    return [];
  }

  const { data: analytics, error: analError } = await supabase
    .from('education_analytics_events')
    .select('education_event_id, event_type')
    .eq('education_profile_id', profileId)
    .in('event_type', ['event_view', 'event_interest'])
    .not('education_event_id', 'is', null);

  if (analError) {
    logger.error('[EducationQueries] Error fetching event analytics:', analError);
    return [];
  }

  return events.map((event) => ({
    eventId: event.id,
    eventTitle: event.title,
    viewCount: (analytics ?? []).filter(
      (a) => a.education_event_id === event.id && a.event_type === 'event_view'
    ).length,
    interestCount: (analytics ?? []).filter(
      (a) => a.education_event_id === event.id && a.event_type === 'event_interest'
    ).length,
  }));
}
```

---

## FASE 4: Integração na UI

### 4.1 EducationDetailPage - Page View Tracking

**Arquivo:** `src/modules/business/education/pages/EducationDetailPage.tsx`

```typescript
// Adicionar imports
import { useEducationTracking } from '../hooks/useEducationTracking';

// Dentro do componente principal:
const { trackProfileView, trackWhatsAppClick, trackEnrollmentCTAClick } = 
  useEducationTracking({
    educationProfileId: profile?.id ?? '',
    nicheKey: profile?.niche_key ?? 'regular_school',
    businessId: profile?.business_id,
  });

// useEffect para page view (após carregar profile)
useEffect(() => {
  if (profile?.id) {
    trackProfileView();
  }
}, [profile?.id, trackProfileView]);

// Handler para WhatsApp click
const handleWhatsAppClick = () => {
  trackWhatsAppClick();
  // ... resto do código existente
};

// Handler para CTA click
const handleEnrollmentCTAClick = () => {
  trackEnrollmentCTAClick(labels.enrollmentCTA);
  // ... scroll para formulário
};
```

### 4.2 EducationLeadForm - Lead Submitted Tracking

**Arquivo:** `src/modules/business/education/components/EducationLeadForm.tsx`

```typescript
// Adicionar prop onLeadCreated opcional
export interface EducationLeadFormProps {
  educationProfileId: string;
  nicheKey?: string | null;
  businessId?: string;
  onSubmit?: (data: LeadFormData) => void;
  onLeadCreated?: (leadId: string, data: LeadFormData) => void; // NOVO
  className?: string;
}

// Após criar lead com sucesso, chamar:
onLeadCreated?.(createdLead.id, formData);

// OU usando o hook useEducationTracking dentro do componente:
const { trackLeadSubmitted } = useEducationTracking({
  educationProfileId,
  nicheKey: nicheKey ?? 'regular_school',
  businessId,
});

// No handleSubmit após sucesso:
if (createdLead) {
  trackLeadSubmitted(createdLead.id, {
    hasGuardian: Boolean(formData.guardianName),
    hasStudent: Boolean(formData.studentName),
    desiredGrade: formData.desiredGrade,
    desiredShift: formData.desiredShift,
  });
}
```

---

## FASE 5: Atualização do useEducationAnalytics

### 5.1 Remover TODOs e usar dados reais

**Arquivo:** `src/modules/business/education/hooks/useEducationAnalytics.ts`

```typescript
// Alterar queryFn para incluir novas queries
const [
  leadStatusCounts,
  { rate: conversionRate, avgDays: avgDaysToConversion },
  programMetrics,
  eventCounts,
  profileViews,        // NOVO
  funnelMetrics,       // NOVO
  programViewMetrics,  // NOVO
  eventViewMetrics,    // NOVO
] = await Promise.all([
  educationQueries.countLeadsByStatus(profileId),
  educationQueries.getLeadConversionRate(profileId),
  educationQueries.getProgramEnrollmentMetrics(profileId),
  educationQueries.countEventsByType(profileId),
  educationQueries.getProfileViewMetrics(profileId),      // NOVO
  educationQueries.getConversionFunnel(profileId),        // NOVO
  educationQueries.getProgramViewMetrics(profileId),        // NOVO
  educationQueries.getEventMetrics(profileId),              // NOVO
]);

// Atualizar dados de retorno:
programs: {
  total: programMetrics.total,
  active: programMetrics.active,
  avgViews: profileViews.totalViews / (programMetrics.total || 1), // NOVO: real
  avgInquiries: funnelMetrics.leadsSubmitted / (profileViews.totalViews || 1), // NOVO: real
  avgEnrollmentRate: programMetrics.totalVacancies > 0 
    ? Math.round((programMetrics.filledVacancies / programMetrics.totalVacancies) * 100)
    : 0,
  totalVacancies: programMetrics.totalVacancies,
  filledVacancies: programMetrics.filledVacancies,
},
events: {
  total: eventCounts.total,
  upcoming: eventCounts.upcoming,
  totalAttendees: funnelMetrics.leadsVisited, // Aproximação: visitas agendadas
  schoolToursCount: eventCounts.schoolToursCount,
  openHouseCount: eventCounts.openHouseCount,
  enrollmentFairCount: eventCounts.enrollmentFairCount,
},
// Adicionar funnel metrics:
funnel: funnelMetrics, // NOVO
```

---

## FASE 6: Validação

### Checklist de Validação

- [ ] **1. Migration**
  - [ ] Rodar migration
  - [ ] Verificar tabela criada com indexes e RLS

- [ ] **2. Typecheck**
  - [ ] `npm run typecheck` passa

- [ ] **3. Build**
  - [ ] `npm run build` passa

- [ ] **4. SSOT Check**
  - [ ] `npm run check:ssot` passa

- [ ] **5. Testes**
  - [ ] `npx vitest run src/modules/business/education` passa
  - [ ] Adicionar testes para EducationTrackingService

- [ ] **6. Tracking na UI**
  - [ ] EducationDetailPage registra page view
  - [ ] WhatsApp CTA registra clique
  - [ ] Formulário de matrícula registra lead submitted
  - [ ] Verificar inserts no banco

- [ ] **7. Analytics**
  - [ ] useEducationAnalytics retorna dados reais
  - [ ] TODOs removidos ou atualizados
  - [ ] UI do painel mostra dados reais

---

## Entregáveis

### Arquivos Criados
1. `supabase/migrations/20260427140000_create_education_analytics_events.sql`
2. `src/modules/business/education/services/EducationTrackingService.ts`
3. `src/modules/business/education/hooks/useEducationTracking.ts`

### Arquivos Modificados
1. `src/modules/business/education/types/index.ts` (tipos de analytics)
2. `src/modules/business/education/services/education.queries.ts` (queries de analytics)
3. `src/modules/business/education/hooks/useEducationAnalytics.ts` (dados reais)
4. `src/modules/business/education/pages/EducationDetailPage.tsx` (tracking)
5. `src/modules/business/education/components/EducationLeadForm.tsx` (tracking)

### Eventos Implementados
- profile_view
- program_view
- event_view
- whatsapp_click
- enrollment_cta_click
- lead_submitted
- event_interest

### Analytics com Dados Reais
- Visualizações da página da escola
- Cliques no WhatsApp
- Cliques no CTA de matrícula
- Leads enviados
- Conversão de visualização para lead
- Conversão de lead para matrícula
- Leads por série desejada
- Leads por turno desejado
- Eventos por tipo
- Interesse por evento

### TODOs Removidos
- tracking de views
- tracking de inquiries
- guardianVsStudentRatio (com dados reais de guardian_name vs full_name)

## Timeline Estimada
- Fase 1 (Migration + Types): 30 min
- Fase 2 (Serviço + Hook): 45 min
- Fase 3 (Queries): 45 min
- Fase 4 (Integração UI): 30 min
- Fase 5 (Analytics): 30 min
- Fase 6 (Validação): 30 min
- **Total: ~3.5 horas**
