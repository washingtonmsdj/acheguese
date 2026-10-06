import { describe, expect, it } from 'vitest';
import { getEducationAdminReadErrorMessage } from '../educationAdminErrorMessage';

describe('EducationAdminReadError', () => {
  it('does not expose backend authorization details', () => {
    const raw = 'permission denied for relation education_leads by row-level security';
    const message = getEducationAdminReadErrorMessage(new Error(raw));

    expect(message).toBe(
      'Sua conta não tem permissão para consultar estes dados de Educação.',
    );
    expect(message).not.toContain('education_leads');
    expect(message).not.toContain('row-level security');
  });

  it('maps connectivity failures to actionable copy', () => {
    const message = getEducationAdminReadErrorMessage(
      new Error('TypeError: Failed to fetch'),
    );

    expect(message).toContain('Não foi possível conectar ao serviço de Educação');
    expect(message).not.toContain('TypeError');
  });

  it('uses a generic message for unknown infrastructure failures', () => {
    const raw = 'syntax error at or near internal_policy_name';
    const message = getEducationAdminReadErrorMessage(new Error(raw));

    expect(message).toBe(
      'Não foi possível carregar os dados de Educação agora. Tente novamente.',
    );
    expect(message).not.toContain('internal_policy_name');
  });
});
