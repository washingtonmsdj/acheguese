/**
 * IdentityHistoryPanel
 * Painel de histórico de mudanças de identificador.
 * Recebe IdentityChangeRecord[] — sem acesso direto a DB.
 */

import { History } from 'lucide-react';
import type { IdentityChangeRecord } from '@/core/public-identity/domain/types';

const REASON_LABELS: Record<IdentityChangeRecord['reason'], string> = {
  user_requested: 'Solicitado pelo usuário',
  admin_action: 'Ação administrativa',
  policy_violation: 'Violação de política',
  territory_changed: 'Território alterado',
};

interface IdentityHistoryPanelProps {
  history: IdentityChangeRecord[];
  isLoading?: boolean;
  /** Se false, painel não é renderizado (ex: professional nesta fase) */
  visible?: boolean;
}

export function IdentityHistoryPanel({
  history,
  isLoading,
  visible = true,
}: IdentityHistoryPanelProps) {
  if (!visible) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <History className="h-3.5 w-3.5" aria-hidden="true" />
        Histórico de alterações
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Carregando histórico...</p>
      )}

      {!isLoading && history.length === 0 && (
        <p className="text-xs text-muted-foreground">Nenhuma alteração registrada.</p>
      )}

      {!isLoading && history.length > 0 && (
        <ul className="space-y-1.5" aria-label="Histórico de identificadores">
          {history.map((record) => (
            <li key={record.id} className="text-xs text-muted-foreground">
              <span className="font-mono text-foreground">{record.oldIdentifier}</span>
              {record.newIdentifier && (
                <>
                  {' → '}
                  <span className="font-mono text-foreground">{record.newIdentifier}</span>
                </>
              )}
              {' · '}
              {REASON_LABELS[record.reason]}
              {' · '}
              {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(record.changedAt)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
