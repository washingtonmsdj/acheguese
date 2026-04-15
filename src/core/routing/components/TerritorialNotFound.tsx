/**
 * TerritorialNotFound
 *
 * 404 territorial explícito — sem fallback, sem redirect mágico.
 */

import { useNavigate } from 'react-router-dom';
import { TERRITORY_CONFIG } from '@/config/territory';

interface Props {
  message?: string;
}

export function TerritorialNotFound({ message }: Props) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-4xl font-bold text-muted-foreground">404</p>
      <p className="text-lg font-medium">Território não encontrado</p>
      {message && <p className="text-sm text-muted-foreground max-w-sm">{message}</p>}
      <button
        onClick={() => navigate(`/${TERRITORY_CONFIG.launch.state}/${TERRITORY_CONFIG.launch.city}`, { replace: true })}
        className="mt-4 text-sm underline text-primary"
      >
        Ir para Salvador
      </button>
    </div>
  );
}
