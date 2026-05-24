/**
 * TerritorialNotFound
 *
 * 404 territorial explícito. Não faz fallback para Salvador e não
 * redireciona de forma silenciosa: URL territorial inválida deve falhar visivelmente.
 */

import { useNavigate } from 'react-router-dom';

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
      <button onClick={() => navigate('/', { replace: true })} className="mt-4 text-sm underline text-primary">
        Voltar ao início
      </button>
    </div>
  );
}
