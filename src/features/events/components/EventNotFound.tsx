/**
 * 🔍 EVENT NOT FOUND
 * 
 * Componente para exibir quando um evento não é encontrado
 * 
 * @version 1.0.0
 */

import { motion } from 'framer-motion';
import { Calendar, Search, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { Helmet } from 'react-helmet-async';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import { useCommunityUrls } from '@/core/routing/hooks/useCommunityUrls';

interface EventNotFoundProps {
  eventId?: string;
  message?: string;
}

export function EventNotFound({ eventId, message }: EventNotFoundProps) {
  const navigate = useNavigate();
  const territorialContext = useTerritorialContextOptional();
  const eventUrls = useCommunityUrls(territorialContext?.resolved);

  return (
    <>
      <Helmet>
        <title>Evento não encontrado | Achegue-se</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-6 flex justify-center"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-12 w-12 text-muted-foreground" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="mb-3 text-3xl font-bold text-foreground">
            Evento não encontrado
          </h1>

          {/* Description */}
          <p className="mb-2 text-muted-foreground">
            {message || 'O evento que você está procurando não existe ou foi removido.'}
          </p>

          {eventId && (
            <p className="mb-6 text-sm text-muted-foreground">
              ID: <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{eventId}</code>
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="gap-2"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              onClick={() => navigate(eventUrls.events)}
              className="gap-2"
              size="lg"
            >
              <Search className="h-4 w-4" />
              Ver todos os eventos
            </Button>
          </div>

          {/* Additional Help */}
          <div className="mt-8 rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Sugestões:
            </p>
            <ul className="space-y-2 text-left text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                <span>Verifique se o link está correto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                <span>O evento pode ter sido cancelado ou encerrado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-primary">•</span>
                <span>Explore outros eventos disponíveis</span>
              </li>
            </ul>
          </div>

          {/* Home Link */}
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="mt-6 gap-2 text-muted-foreground"
          >
            <Home className="h-4 w-4" />
            Ir para página inicial
          </Button>
        </motion.div>
      </div>
    </>
  );
}
