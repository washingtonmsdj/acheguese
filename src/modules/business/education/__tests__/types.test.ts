import { describe, it, expect } from 'vitest';
import type {
  EducationProfile,
  EducationProgram,
  EducationLead,
  EducationLeadEvent,
  EducationEvent,
  EducationLeadStatus,
  EducationProfileStatus,
} from '../types';

describe('Education Types', () => {
  it('EducationProfile should accept valid data', () => {
    const profile: EducationProfile = {
      id: 'uuid-test',
      business_id: 'business-uuid',
      institution_type: 'school',
      niche_key: 'regular_school',
      support_level: 'basic_enabled',
      summary: 'Test school',
      whatsapp_number: '+5588999999999',
      status: 'published',
      published_at: '2026-01-01T00:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(profile.status).toBe('published');
    expect(profile.niche_key).toBe('regular_school');
  });

  it('EducationProgram should accept valid data', () => {
    const program: EducationProgram = {
      id: 'uuid-test',
      education_profile_id: 'profile-uuid',
      name: 'Programa de Teste',
      description: 'Descricao do programa',
      age_group: '3-5 anos',
      shift: 'Manha',
      modality: 'Presencial',
      available_slots: 10,
      price_from: 199.99,
      is_active: true,
      display_order: 0,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(program.is_active).toBe(true);
    expect(program.display_order).toBe(0);
  });

  it('EducationLead should accept valid data with all pipeline statuses', () => {
    const statuses: EducationLeadStatus[] = [
      'new', 'contacted', 'visit_scheduled', 'proposal_sent', 'enrolled', 'lost',
    ];

    statuses.forEach((status) => {
      const lead: EducationLead = {
        id: 'uuid-test',
        education_profile_id: 'profile-uuid',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+5588999999999',
        child_name: 'Child Name',
        child_age: 5,
        interest_note: 'Interessado',
        source_channel: 'website',
        status,
        owner_user_id: null,
        first_contact_at: null,
        lost_reason: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };
      expect(lead.status).toBe(status);
    });
  });

  it('EducationProfileStatus should accept valid values', () => {
    const statuses: EducationProfileStatus[] = ['draft', 'published', 'paused'];
    statuses.forEach((status) => {
      expect(['draft', 'published', 'paused']).toContain(status);
    });
  });

  it('EducationLeadEvent should accept valid data', () => {
    const event: EducationLeadEvent = {
      id: 'uuid-test',
      lead_id: 'lead-uuid',
      event_type: 'status_change',
      payload: { from: 'new', to: 'contacted' },
      actor_user_id: null,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(event.event_type).toBe('status_change');
    expect(event.payload).toEqual({ from: 'new', to: 'contacted' });
  });

  it('EducationEvent should accept valid data', () => {
    const event: EducationEvent = {
      id: 'uuid-test',
      education_profile_id: 'profile-uuid',
      title: 'Evento de Teste',
      description: 'Descricao do evento',
      starts_at: '2026-01-01T10:00:00Z',
      ends_at: '2026-01-01T12:00:00Z',
      location: 'Sala 101',
      is_public: true,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };
    expect(event.is_public).toBe(true);
    expect(event.title).toBe('Evento de Teste');
  });
});
