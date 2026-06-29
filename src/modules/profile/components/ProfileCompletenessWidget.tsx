import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Progress } from "@/shared/components/ui/progress";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import {
  useProfileCompleteness,
  type ProfileCompletenessRecord,
} from "../hooks/useProfileCompleteness";

interface ProfileCompletenessWidgetProps {
  profile: ProfileCompletenessRecord;
}

export function ProfileCompletenessWidget({ profile }: ProfileCompletenessWidgetProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const { score, items, completed, total } = useProfileCompleteness(profile);

  // Perfil 100% completo - nao exibe o widget
  if (score === 100) return null;

  const pending = items.filter((item) => !item.done);

  const scoreColor =
    score >= 80
      ? "text-green-600 dark:text-green-400"
      : score >= 50
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-500 dark:text-red-400";

  const barColor =
    score >= 80
      ? "[&>div]:bg-green-500"
      : score >= 50
        ? "[&>div]:bg-amber-500"
        : "[&>div]:bg-red-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2 rounded-lg border bg-card px-3 py-2.5 sm:space-y-3 sm:rounded-xl sm:px-4 sm:py-3"
    >
      {/* Cabecalho */}
      <div
        className="flex cursor-pointer select-none items-center justify-between"
        onClick={() => setExpanded((value) => !value)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((value) => !value);
          }
        }}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary sm:h-4 sm:w-4" />
          <span className="text-xs font-medium sm:text-sm">Complete seu perfil</span>
          <span className={cn("text-xs font-bold tabular-nums sm:text-sm", scoreColor)}>
            {score}%
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 sm:h-4 sm:w-4",
            expanded && "rotate-180",
          )}
        />
      </div>

      {/* Barra de progresso */}
      <div className="space-y-0.5 sm:space-y-1">
        <Progress value={score} className={cn("h-1.5 sm:h-2", barColor)} />
        <p className="text-[10px] text-muted-foreground sm:text-[11px]">
          {completed} de {total} itens concluidos
        </p>
      </div>

      {/* Lista expansivel de pendencias */}
      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            key="items"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 pt-1">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs",
                    item.done ? "opacity-50" : "bg-accent/40",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                    {item.done ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500 sm:h-3.5 sm:w-3.5" />
                    ) : (
                      <Circle className="h-3 w-3 shrink-0 text-muted-foreground sm:h-3.5 sm:w-3.5" />
                    )}
                    <span
                      className={cn(
                        "truncate text-[10px] sm:text-xs",
                        item.done && "line-through text-muted-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                  {!item.done ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 shrink-0 px-1.5 text-[10px] text-primary hover:text-primary sm:h-6 sm:px-2 sm:text-[11px]"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(item.path);
                      }}
                    >
                      Adicionar
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>

            {pending.length > 0 ? (
              <Button
                size="sm"
                className="mt-2.5 h-7 w-full gap-1 text-[10px] sm:mt-3 sm:h-8 sm:gap-1.5 sm:text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(pending[0].path);
                }}
              >
                Completar agora
              </Button>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
