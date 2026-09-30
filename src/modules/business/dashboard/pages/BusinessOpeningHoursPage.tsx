import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, ExternalLink, Loader2 } from "lucide-react";
import type { BusinessHours } from "@/core/business/types/Business";
import { WEEK_DAYS, WEEK_DAY_LABELS } from "@/core/business/constants/weekDays";
import { OpeningHoursEditor } from "@/core/business/components/settings/OpeningHoursEditor";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { useBusinessEdit } from "@/modules/business/hooks/useBusinessEdit";
import { Button } from "@/shared/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import {
  getScheduleError,
  getSchedulePreview,
} from "@/core/business/utils/openingHoursPresentation";
import "./BusinessOpeningHoursPage.css";

type DraftHours = Parameters<typeof OpeningHoursEditor>[0]["hours"];

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
  const invalidDays = WEEK_DAYS.filter((day) => getScheduleError(hours[day]));
  const valid = invalidDays.length === 0;
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
    <BusinessOpeningHoursView
      businessName={business.name}
      publicUrl={publicUrl}
      hours={hours}
      changed={changed}
      isSaving={edit.isLoading}
      onChange={setDraft}
      onSubmit={submit}
      onDiscard={() => setDraft(null)}
    />
  );
}

interface BusinessOpeningHoursViewProps {
  businessName: string;
  publicUrl: string | null;
  hours: DraftHours;
  changed: boolean;
  isSaving: boolean;
  onChange: (hours: DraftHours) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDiscard: () => void;
}

/** Shared presentation used by the authenticated page and the isolated dev preview. */
export function BusinessOpeningHoursView({
  businessName,
  publicUrl,
  hours,
  changed,
  isSaving,
  onChange,
  onSubmit,
  onDiscard,
}: BusinessOpeningHoursViewProps) {
  const invalidDays = WEEK_DAYS.filter((day) => getScheduleError(hours[day]));
  const valid = invalidDays.length === 0;
  return (
    <div className="business-hours-page">
      <header className="business-hours-page__heading">
        <Clock aria-hidden="true" />
        <div>
          <p>{businessName}</p>
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
        <form
          onSubmit={onSubmit}
          className="business-hours-page__form"
          aria-busy={isSaving}
        >
          <fieldset disabled={isSaving}>
            <legend className="sr-only">Horários semanais</legend>
            <OpeningHoursEditor hours={hours} onChange={onChange} />
          </fieldset>
          {!valid && (
            <p role="status" className="business-hours-page__error">
              Revise:{" "}
              {invalidDays.map((day) => WEEK_DAY_LABELS[day]).join(", ")}.
            </p>
          )}
          <footer className="business-hours-page__actions">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!changed || isSaving}
                >
                  Descartar alterações
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[calc(100%-2rem)] rounded-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Os horários voltarão à última versão salva. Suas alterações
                    nesta tela serão perdidas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="min-h-11">
                    Continuar editando
                  </AlertDialogCancel>
                  <AlertDialogAction className="min-h-11" onClick={onDiscard}>
                    Descartar alterações
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="submit"
              className="business-hours-page__save"
              disabled={!changed || !valid || isSaving}
            >
              {isSaving && <Loader2 className="animate-spin" size={16} />}{" "}
              {isSaving ? "Salvando…" : "Salvar horários"}
              {!isSaving && <ArrowRight size={16} aria-hidden="true" />}
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
                  <dd>{getSchedulePreview(value)}</dd>
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
