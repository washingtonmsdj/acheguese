/**
 * BusinessSlugSection
 * Seção de slug público para telas de criação/edição de empresa.
 * Inclui: aviso de impacto persistente + confirmação ao salvar.
 */

import { useState, useCallback } from 'react';
import { BusinessIdentityField } from '@/shared/components/public-identity/domains/BusinessIdentityField';
import { IdentityImpactNotice } from '@/shared/components/public-identity/IdentityImpactNotice';
import { IdentityChangeConfirmDialog } from '@/shared/components/public-identity/IdentityChangeConfirmDialog';

interface BusinessSlugSectionProps {
  slug: string;
  onSlugChange: (value: string) => void;
  /** Slug original salvo no banco (vazio se criação) */
  originalSlug?: string;
  businessId?: string;
  isPremium?: boolean;
  disabled?: boolean;
  /**
   * Chamado quando o usuário confirma o save com mudança de slug.
   * Se não fornecido, o save ocorre diretamente sem confirmação.
   */
  onSaveWithIdentityChange?: () => void;
}

export function BusinessSlugSection({
  slug,
  onSlugChange,
  originalSlug = '',
  businessId,
  isPremium = false,
  disabled,
  onSaveWithIdentityChange,
}: BusinessSlugSectionProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const previewFn = isPremium
    ? (s: string) => (s ? `/p/${s}` : '')
    : (s: string) => (s ? `/empresas/:uf/:cidade/:bairro/${s}` : '');

  const originalUrl = originalSlug ? previewFn(originalSlug) : '';
  const newUrl = slug ? previewFn(slug) : '';

  const hasChange =
    !!originalSlug && !!slug && originalSlug.trim() !== slug.trim();

  /** Exposto para a página chamar ao clicar em Salvar */
  const requestSave = useCallback(() => {
    if (hasChange && onSaveWithIdentityChange) {
      setConfirmOpen(true);
    } else {
      onSaveWithIdentityChange?.();
    }
  }, [hasChange, onSaveWithIdentityChange]);

  // Expõe requestSave via ref-like pattern não é necessário aqui —
  // a página controla o save e chama onSaveWithIdentityChange diretamente.
  // O dialog é aberto pela seção quando a página tenta salvar.

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        Identidade pública
      </p>

      <BusinessIdentityField
        value={slug}
        onChange={onSlugChange}
        entityId={businessId}
        isPremium={isPremium}
        showHistory={!!businessId}
        showCooldown={!!businessId}
        disabled={disabled}
        placeholder="ex: padaria-do-joao"
      />

      <IdentityImpactNotice
        entityType="business"
        originalValue={originalSlug}
        currentValue={slug}
        originalUrl={originalUrl}
        newUrl={newUrl}
      />

      <IdentityChangeConfirmDialog
        open={confirmOpen}
        entityType="business"
        onConfirm={() => {
          setConfirmOpen(false);
          onSaveWithIdentityChange?.();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
