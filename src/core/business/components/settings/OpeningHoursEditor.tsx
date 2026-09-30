import { useId } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/utils/cn";
import { WEEK_DAYS, WEEK_DAY_LABELS } from "@/core/business/constants/weekDays";
import type { BusinessHours } from "@/core/business/types/Business";
import "./OpeningHoursEditor.css";

type DaySchedule = Partial<BusinessHours[string]>;
interface OpeningHoursEditorProps {
  hours: Partial<Record<(typeof WEEK_DAYS)[number], DaySchedule>>;
  onChange: (hours: OpeningHoursEditorProps["hours"]) => void;
  className?: string;
}
const validTime = (value?: string) =>
  Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));

export function OpeningHoursEditor({
  hours,
  onChange,
  className,
}: OpeningHoursEditorProps) {
  const id = useId();
  return (
    <div className={cn("opening-hours-editor", className)}>
      <p className="opening-hours-editor__hint">
        Informe um intervalo por dia. Dias sem informação não serão apresentados
        como abertos.
      </p>
      {WEEK_DAYS.map((day) => {
        const schedule = hours[day];
        const mode = !schedule
          ? "unknown"
          : schedule.closed
            ? "closed"
            : "hours";
        const complete =
          validTime(schedule?.open) && validTime(schedule?.close);
        const changeTime = (field: "open" | "close", value: string) =>
          onChange({
            ...hours,
            [day]: { ...schedule, [field]: value, closed: false },
          });
        return (
          <section
            key={day}
            className="opening-hours-editor__day"
            aria-labelledby={`${id}-${day}`}
          >
            <div className="opening-hours-editor__heading">
              <h3 id={`${id}-${day}`}>{WEEK_DAY_LABELS[day]}</h3>
              <select
                aria-label={`Funcionamento de ${WEEK_DAY_LABELS[day]}`}
                value={mode}
                onChange={(event) => {
                  const next = { ...hours };
                  if (event.target.value === "unknown") delete next[day];
                  else
                    next[day] =
                      event.target.value === "closed"
                        ? { open: "00:00", close: "00:00", closed: true }
                        : { open: "", close: "", closed: false };
                  onChange(next);
                }}
              >
                <option value="unknown">Não informado</option>
                <option value="hours">Definir horário</option>
                <option value="closed">Fechado</option>
              </select>
            </div>
            {mode === "hours" && (
              <>
                <div className="opening-hours-editor__times">
                  <label htmlFor={`${id}-${day}-open`}>
                    Abre às
                    <Input
                      id={`${id}-${day}-open`}
                      type="time"
                      value={schedule?.open ?? ""}
                      required
                      onChange={(event) =>
                        changeTime("open", event.target.value)
                      }
                    />
                  </label>
                  <label htmlFor={`${id}-${day}-close`}>
                    Fecha às
                    <Input
                      id={`${id}-${day}-close`}
                      type="time"
                      value={schedule?.close ?? ""}
                      required
                      onChange={(event) =>
                        changeTime("close", event.target.value)
                      }
                    />
                  </label>
                </div>
                {!complete && (
                  <p className="opening-hours-editor__hint">
                    Preencha abertura e fechamento.
                  </p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={!complete}
                  className="opening-hours-editor__copy"
                  onClick={() => {
                    const next = { ...hours };
                    WEEK_DAYS.forEach((target) => {
                      next[target] = { ...schedule };
                    });
                    onChange(next);
                  }}
                >
                  <Copy size={16} aria-hidden="true" /> Aplicar este horário a
                  todos os dias
                </Button>
              </>
            )}
          </section>
        );
      })}
      <p className="opening-hours-editor__hint">
        Revise os dias antes de salvar. As alterações só serão publicadas após a
        confirmação.
      </p>
    </div>
  );
}
