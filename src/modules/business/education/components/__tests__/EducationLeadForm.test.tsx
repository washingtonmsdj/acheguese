import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EducationLeadForm } from '../EducationLeadForm';

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Nome completo *'), {
    target: { value: 'Responsavel E2E' },
  });
  fireEvent.change(screen.getByLabelText('E-mail *'), {
    target: { value: 'responsavel@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Telefone *'), {
    target: { value: '(71) 99999-9999' },
  });
}

describe('EducationLeadForm', () => {
  it('shows success only after the persistence callback resolves', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EducationLeadForm
        nicheKey="regular_school"
        onSubmit={onSubmit}
      />,
    );

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Quero matricular' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(
      await screen.findByText('Interesse registrado!'),
    ).toBeInTheDocument();
  });

  it('keeps the form open and exposes a retryable error when persistence fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('database unavailable'));

    render(
      <EducationLeadForm
        nicheKey="regular_school"
        onSubmit={onSubmit}
      />,
    );

    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'Quero matricular' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Nao foi possivel registrar seu interesse',
    );
    expect(screen.queryByText('Interesse registrado!')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Nome completo *')).toHaveValue(
      'Responsavel E2E',
    );
  });
});
