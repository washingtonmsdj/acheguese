import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Clock, ExternalLink, Loader2 } from "lucide-react";
import type { BusinessHours } from "@/core/business/types/Business";
import { WEEK_DAYS, WEEK_DAY_LABELS } from "@/core/business/constants/weekDays";
import { OpeningHoursEditor } from "@/core/business/components/settings/OpeningHoursEditor";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { useBusinessEdit } from "@/modules/business/hooks/useBusinessEdit";
import { Button } from "@/shared/components/ui/button";
import "./BusinessOpeningHoursPage.css";

type DraftHours = Parameters<typeof OpeningHoursEditor>[0]["hours"];
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

// Normalize order only; do not fabricate schedules for missing days.
function scheduleKey(hours: DraftHours) {
  return JSON.stringify(
    WEEK_DAYS.map((day) => {
      const value = hours[day];
      return value
        ? [day, value.closed === true, value.open ?? "", value.close ?? ""]
        : [day];
    }),
  );
}

export default function BusinessOpeningHoursPage() {
  const { businessId, business, publicUrl } =
    useActiveBusinessDashboardContext();
  const [draft, setDraft] = useState<DraftHours | null>(null);
  const hours = draft ?? business.horario_funcionamento ?? {};
  const changed =
    scheduleKey(hours) !== scheduleKey(business.horario_funcionamento ?? {});
  const valid = WEEK_DAYS.every((day) => {
    const value = hours[day];
    return (
      !value ||
      value.closed ||
      (timePattern.test(value.open ?? "") &&
        timePattern.test(value.close ?? "") &&
        value.open !== value.close)
    );
  });
  const edit = useBusinessEdit({ onSuccess: () => setDraft(null) });
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!changed || !valid || edit.isLoading) return;
    const payload: BusinessHours = {};
    WEEK_DAYS.forEach((day) => {
      const value = hours[day];
      if (value)
        payload[day] = value.closed
          ? { open: "00:00", close: "00:00", closed: true }
          : { open: value.open!, close: value.close!, closed: false };
    });
    try {
      await edit.updateBusiness({
        id: businessId,
        data: { horario_funcionamento: payload },
      });
    } catch {
      /* The shared mutation displays the error and preserves the draft. */
    }
  };
  return (
    <div className="business-hours-page">
      <header className="business-hours-page__heading">
        <Clock aria-hidden="true" />
        <div>
          <p>{business.name}</p>
          <h1>Horário de funcionamento</h1>
          <p>
            Defina quando sua empresa atende. Revise a prévia antes de salvar.
          </p>
        </div>
        {publicUrl && (
          <Link to={publicUrl}>
            Ver página pública <ExternalLink size={16} aria-hidden="true" />
          </Link>
        )}
      </header>
      <div className="business-hours-page__layout">
        <form onSubmit={submit} className="business-hours-page__form">
          <fieldset disabled={edit.isLoading}>
            <legend className="sr-only">Horários semanais</legend>
            <OpeningHoursEditor hours={hours} onChange={setDraft} />
          </fieldset>
          {!valid && (
            <p role="status" className="business-hours-page__error">
              Preencha horários válidos e diferentes para abertura e fechamento.
            </p>
          )}
          <footer className="business-hours-page__actions">
            <Button
              type="button"
              variant="outline"
              disabled={!changed || edit.isLoading}
              onClick={() => setDraft(null)}
            >
              Descartar alterações
            </Button>
            <Button
              type="submit"
              disabled={!changed || !valid || edit.isLoading}
            >
              {edit.isLoading && <Loader2 className="animate-spin" size={16} />}{" "}
              {edit.isLoading ? "Salvando…" : "Salvar horários"}
            </Button>
          </footer>
        </form>
        <aside
          className="business-hours-page__preview"
          aria-label="Prévia dos horários"
        >
          <h2>Como aparece na página pública</h2>
          <p>
            {changed
              ? "Prévia — alterações ainda não salvas."
              : "Horários cadastrados."}
          </p>
          <dl>
            {WEEK_DAYS.map((day) => {
              const value = hours[day];
              return (
                <div key={day}>
                  <dt>{WEEK_DAY_LABELS[day]}</dt>
                  <dd>
                    {!value
                      ? "Não informado"
                      : value.closed
                        ? "Fechado"
                        : value.open && value.close
                          ? `${value.open} – ${value.close}`
                          : "Em edição"}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p>
            Não informe horários estimados. Dias sem informação permanecem sem
            horário publicado.
          </p>
        </aside>
      </div>
    </div>
  );
}
