import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { Progress } from '@/shared/components/ui/progress';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { useProfileCompleteness } from '../hooks/useProfileCompleteness';
import type { Profile } from '@/core/profiles/services/multi-profile/types';

interface ProfileCompletenessWidgetProps {
  profile: Profile;
}

export function ProfileCompletenessWidget({ profile }: ProfileCompletenessWidgetProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const { score, items, completed, total } = useProfileCompleteness(profile);

  // Perfil 100% completo — não exibe o widget
  if (score === 100) return null;

  const pending = items.filter(i => !i.done);

  const scoreColor =
    score >= 80 ? 'text-green-600 dark:text-green-400' :
    score >= 50 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-500 dark:text-red-400';

  const barColor =
    score >= 80 ? '[&>div]:bg-green-500' :
    score >= 50 ? '[&>div]:bg-amber-500' :
    '[&>div]:bg-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-card px-4 py-3 space-y-3"
    >
      {/* Cabeçalho */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(v => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); } }}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium">Complete seu perfil</span>
          <span className={cn('text-sm font-bold tabular-nums', scoreColor)}>
            {score}%
          </span>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', expanded && 'rotate-180')}
        />
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1">
        <Progress value={score} className={cn('h-2', barColor)} />
        <p className="text-[11px] text-muted-foreground">
          {completed} de {total} itens concluídos
        </p>
      </div>

      {/* Lista expansível de pendências */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="items"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-1 space-y-1.5">
              {items.map(item => (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-xs',
                    item.done ? 'opacity-50' : 'bg-accent/40'
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {item.done
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      : <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    }
                    <span className={cn('truncate', item.done && 'line-through text-muted-foreground')}>
                      {item.label}
                    </span>
                  </div>
                  {!item.done && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-primary hover:text-primary flex-shrink-0"
                      onClick={e => { e.stopPropagation(); navigate(item.path); }}
                    >
                      Adicionar
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {pending.length > 0 && (
              <Button
                size="sm"
                className="w-full mt-3 h-8 text-xs gap-1.5"
                onClick={e => { e.stopPropagation(); navigate(pending[0].path); }}
              >
                Completar agora
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
