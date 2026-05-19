import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { EVENTS_ITEMS_PER_PAGE } from '../constants';
import { EventCard } from '../components/EventCard';
import { EventSkeleton } from '../components/EventSkeleton';
import type { Event } from '../types';
import type { ViewMode } from './EventsListPage.model';

type EventsListResultsProps = {
  activeFiltersCount: number;
  currentPage: number;
  events: Event[];
  filteredCount: number;
  isLoading: boolean;
  onClearFilters: () => void;
  onEventClick: (eventId: string) => void;
  onPageChange: (page: number) => void;
  totalPages: number;
  viewMode: ViewMode;
};

export function EventsListResults({
  activeFiltersCount,
  currentPage,
  events,
  filteredCount,
  isLoading,
  onClearFilters,
  onEventClick,
  onPageChange,
  totalPages,
  viewMode,
}: EventsListResultsProps) {
  return (
    <section className="flex-1 px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <main>
          {!isLoading && filteredCount > 0 && (
            <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
              <p>
                Mostrando <span className="font-semibold text-foreground">{(currentPage - 1) * EVENTS_ITEMS_PER_PAGE + 1}</span> a{' '}
                <span className="font-semibold text-foreground">
                  {Math.min(currentPage * EVENTS_ITEMS_PER_PAGE, filteredCount)}
                </span>{' '}
                de <span className="font-semibold text-foreground">{filteredCount}</span> eventos
              </p>
            </div>
          )}

          {isLoading ? (
            <div className={getEventsGridClassName(viewMode)}>
              {Array.from({ length: 10 }).map((_, index) => (
                <EventSkeleton key={index} variant={viewMode === 'grid' ? 'card' : 'compact'} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center sm:py-16"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted sm:h-20 sm:w-20">
                <Calendar className="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground sm:text-lg">Nenhum evento encontrado</h3>
              <p className="mb-4 text-sm text-muted-foreground">Tente ajustar os filtros ou buscar por outros termos</p>
              {activeFiltersCount > 0 && (
                <Button onClick={onClearFilters} variant="outline" size="sm">
                  Limpar filtros
                </Button>
              )}
            </motion.div>
          ) : (
            <>
              <div className={getEventsGridClassName(viewMode)}>
                {events.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    variant={viewMode === 'grid' ? 'default' : 'compact'}
                    onClick={onEventClick}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
                      const showPage = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);

                      if (!showPage) {
                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 text-muted-foreground">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onPageChange(page)}
                          className="h-9 w-9 p-0"
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </section>
  );
}

function getEventsGridClassName(viewMode: ViewMode): string {
  return cn('grid gap-3 sm:gap-4 lg:gap-6', viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-1');
}
