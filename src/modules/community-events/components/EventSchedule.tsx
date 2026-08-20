/**
 * EVENT SCHEDULE
 *
 * Programacao/agenda do evento
 *
 * @version 2.0.0
 */

import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { EventScheduleItem } from '../types';

interface EventScheduleProps {
  schedule: EventScheduleItem[];
  className?: string;
}

export function EventSchedule({ schedule, className }: EventScheduleProps) {
  if (!schedule || schedule.length === 0) return null;

  return (
    <section className={cn('py-12', className)}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              <Calendar className="h-4 w-4" />
              Agenda
            </div>
            <h2 className="text-3xl font-bold text-foreground">Programacao</h2>
            <p className="mt-2 text-muted-foreground">Confira o que vai acontecer</p>
          </div>

          <div className="relative">
            <div className="absolute bottom-0 left-6 top-0 w-0.5 bg-border" />

            <div className="space-y-6">
              {schedule.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative pl-16"
                >
                  <div className="absolute left-0 flex items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-background bg-primary shadow-lg">
                      <Clock className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                      <Clock className="h-4 w-4" />
                      {item.time}
                      {item.duration_minutes && (
                        <span className="text-muted-foreground">({item.duration_minutes} min)</span>
                      )}
                    </div>

                    <h3 className="mb-2 text-lg font-bold text-foreground">{item.title}</h3>

                    {item.description && (
                      <p className="mb-3 text-sm text-muted-foreground">{item.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {item.speaker && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          <span>{item.speaker}</span>
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span>{item.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
