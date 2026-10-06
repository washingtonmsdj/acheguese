import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { EducationLead } from '@/core/education';
import { EducationPipelineView } from '../EducationPipelineView';

const lead: EducationLead = {
  id: 'lead-1',
  education_profile_id: 'profile-1',
  full_name: 'Responsável',
  email: 'responsavel@example.com',
  phone: '71999999999',
  child_name: 'Nome legado',
  child_age: 4,
  interest_note: null,
  source_channel: 'website',
  status: 'enrolled',
  owner_user_id: null,
  first_contact_at: null,
  lost_reason: null,
  created_at: '2026-10-06T12:00:00.000Z',
  updated_at: '2026-10-06T12:00:00.000Z',
  student_name: 'Bebê',
  student_age: 0,
  desired_grade: null,
  desired_shift: null,
};

describe('EducationPipelineView', () => {
  it('renders canonical student fields and preserves age zero', () => {
    render(<EducationPipelineView leads={[lead]} />);

    expect(screen.getByText('Aluno: Bebê (0 anos)')).toBeInTheDocument();
    expect(screen.queryByText(/Nome legado/)).not.toBeInTheDocument();
  });
});
