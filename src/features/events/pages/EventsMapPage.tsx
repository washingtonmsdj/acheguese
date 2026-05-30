/**
 * 🗺️ EVENTS MAP PAGE
 * 
 * Página de visualização de eventos em mapa
 * Usa o MapaPageV4 existente com filtro apenas para eventos
 * 
 * @version 2.0.0
 */

import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Map, Home, List, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import MapaPageV4 from '@/core/maps/pages/MapaPageV4';
import { useTerritorialContextOptional } from '@/core/routing/components/TerritorialLayout';
import { useCommunityUrls } from '@/core/routing/hooks/useCommunityUrls';

export default function EventsMapPage() {
  const navigate = useNavigate();
  const territorialContext = useTerritorialContextOptional();
  const eventUrls = useCommunityUrls(territorialContext?.resolved);

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>Mapa de Eventos | Achegue-se</title>
        <meta name="description" content="Encontre eventos próximos a você no mapa interativo" />
      </Helmet>

      {/* Page Container */}
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-background via-background to-muted/20">
        {/* Breadcrumbs */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="flex items-center gap-1 transition-colors hover:text-foreground">
                <Home className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Início</span>
              </Link>
              <span>/</span>
              <Link to={eventUrls.events} className="transition-colors hover:text-foreground">
                Eventos
              </Link>
              <span>/</span>
              <span className="font-medium text-foreground">Mapa</span>
            </nav>
          </div>
        </div>

        {/* Header */}
        <section className="border-b border-border/50 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              {/* Icon */}
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 shadow-lg sm:h-16 sm:w-16">
                  <Map className="h-6 w-6 text-white sm:h-8 sm:w-8" />
                </div>
              </div>

              {/* Title */}
              <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">
                Mapa de Eventos
              </h1>

              {/* Subtitle */}
              <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
                Encontre eventos próximos a você
              </p>

              {/* View toggles */}
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(eventUrls.events)}
                  className="gap-2"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Lista</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(eventUrls.eventCalendar)}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendário</span>
                </Button>
                <Button variant="default" size="sm" className="gap-2">
                  <Map className="h-4 w-4" />
                  <span className="hidden sm:inline">Mapa</span>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Map - Ocupa o resto da tela */}
        <section className="relative flex-1">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute inset-0"
          >
            <MapaPageV4 
              resolved={territorialContext?.resolved}
              activeMemberIds={territorialContext?.activeMemberIds}
            />
          </motion.div>
        </section>
      </div>
    </>
  );
}
