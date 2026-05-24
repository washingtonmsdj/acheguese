/**
 * EVENT CALENDAR
 * 
 * Visualização de eventos em formato de calendário
 * Permite exportar para Google Calendar e iCal
 * 
 * @version 1.0.0
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Download,
  ExternalLink,
  Clock
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { openSafeExternalUrl } from '@/shared/utils/safeRedirect';
import type { Event } from '../types';

interface EventCalendarProps {
  events: Event[];
  onEventClick?: (eventId: string) => void;
}

export function EventCalendar({ events, onEventClick }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar data
  const { year, month, daysInMonth, firstDayOfMonth, monthName } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    return { year, month, daysInMonth, firstDayOfMonth, monthName };
  }, [currentDate]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const grouped: Record<number, Event[]> = {};

    events.forEach(event => {
      const eventDate = new Date(event.start_date);
      if (eventDate.getMonth() === month && eventDate.getFullYear() === year) {
        const day = eventDate.getDate();
        if (!grouped[day]) {
          grouped[day] = [];
        }
        grouped[day].push(event);
      }
    });

    return grouped;
  }, [events, month, year]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Export functions
  const exportToGoogleCalendar = (event: Event) => {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', event.title);
    url.searchParams.append('dates', `${formatDate(startDate)}/${formatDate(endDate)}`);
    url.searchParams.append('details', event.description);
    url.searchParams.append('location', event.location.address || '');

    openSafeExternalUrl(url.toString(), { context: "event-google-calendar" });
  };

  const exportToICalendar = (event: Event) => {
    const startDate = new Date(event.start_date);
    const endDate = event.end_date ? new Date(event.end_date) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Achegue-se//Events//PT',
      'BEGIN:VEVENT',
      `UID:${event.id}@achegue-se.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location.address || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.slug}.ics`;
    link.click();
  };

  // Render calendar days
  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="aspect-square border border-border/30 bg-muted/20" />
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = eventsByDay[day] || [];
      const isToday = isCurrentMonth && today.getDate() === day;
      const hasEvents = dayEvents.length > 0;

      days.push(
        <motion.div
          key={day}
          whileHover={hasEvents ? { scale: 1.02 } : undefined}
          className={cn(
            "group relative aspect-square border border-border/30 bg-card p-1 transition-all sm:p-2",
            hasEvents && "cursor-pointer hover:border-primary hover:shadow-md",
            isToday && "ring-2 ring-primary ring-offset-2"
          )}
        >
          {/* Day number */}
          <div className={cn(
            "mb-1 text-xs font-semibold sm:text-sm",
            isToday ? "text-primary" : "text-foreground"
          )}>
            {day}
          </div>

          {/* Events */}
          {hasEvents && (
            <div className="space-y-0.5">
              {dayEvents.slice(0, 2).map((event, index) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event.id)}
                  className="w-full truncate rounded bg-primary/10 px-1 py-0.5 text-left text-[10px] font-medium text-primary transition-colors hover:bg-primary/20 sm:text-xs"
                  title={event.title}
                >
                  {event.title}
                </button>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-[10px] text-muted-foreground sm:text-xs">
                  +{dayEvents.length - 2} mais
                </div>
              )}
            </div>
          )}

          {/* Hover tooltip */}
          {hasEvents && (
            <div className="absolute left-0 top-full z-10 mt-1 hidden w-64 rounded-lg border border-border bg-card p-3 shadow-xl group-hover:block">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                {dayEvents.length} {dayEvents.length === 1 ? 'evento' : 'eventos'}
              </p>
              <div className="space-y-2">
                {dayEvents.map(event => (
                  <div key={event.id} className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{event.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(event.start_date).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToGoogleCalendar(event);
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Google
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportToICalendar(event);
                        }}
                      >
                        <Download className="h-3 w-3" />
                        iCal
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      );
    }

    return days;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold capitalize text-foreground sm:text-2xl">
            {monthName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {Object.keys(eventsByDay).length} {Object.keys(eventsByDay).length === 1 ? 'dia com eventos' : 'dias com eventos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="hidden sm:flex"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextMonth}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-muted-foreground sm:text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {renderCalendarDays()}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full ring-2 ring-primary" />
          <span>Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary/10" />
          <span>Com eventos</span>
        </div>
      </div>
    </div>
  );
}
