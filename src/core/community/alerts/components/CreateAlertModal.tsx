/**
 * CreateAlertModal - Modal multi-etapas para criacao de alerta comunitario
 */

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Siren } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { createAlertSchema, type CreateAlertFormData } from "../schemas/alertSchema";
import { RPC_ERROR_MESSAGES, useCreateAlert } from "../hooks/useCreateAlert";
import {
  ALERT_CATEGORY_LABELS,
  ALERT_CONFIRMATION_CHECKBOXES,
  ALERT_MODAL_DISCLAIMER,
  ALERT_RULES,
  ALERT_STARTED_APPROX_LABELS,
} from "../config/alertConfig";
import type { AlertCategory, AlertStartedApprox } from "../domain/types";
import type { Control, FieldErrors, UseFormSetValue, UseFormWatch } from "react-hook-form";

const TOTAL_STEPS = 5;

function getFieldsForStep(step: number): (keyof CreateAlertFormData)[] {
  switch (step) {
    case 1:
      return ["category"];
    case 2:
      return ["location_id", "location_reference"];
    case 3:
      return ["seen_personally", "started_at_approx", "is_happening_now", "still_risky"];
    case 4:
      return ["description"];
    case 5:
      return ["confirm_real", "confirm_no_ops", "confirm_consequences"];
    default:
      return [];
  }
}

interface CreateAlertModalProps {
  open: boolean;
  onClose: () => void;
  city: string;
  neighborhood?: string;
  locationId?: string;
  onAlertCreated?: () => void;
  canCreate?: boolean;
  blockedMessage?: string;
}

export function CreateAlertModal({
  open,
  onClose,
  city,
  neighborhood = "",
  locationId,
  onAlertCreated,
  canCreate = true,
  blockedMessage = "Verifique sua residencia para criar alertas nesta comunidade.",
}: CreateAlertModalProps) {
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { mutateAsync: createAlert, isPending } = useCreateAlert();

  const {
    control,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors },
    reset,
  } = useForm<CreateAlertFormData>({
    resolver: zodResolver(createAlertSchema),
    defaultValues: {
      location_id: locationId ?? "",
      location_reference: "",
      seen_personally: false,
      is_happening_now: false,
      still_risky: false,
    },
  });

  useEffect(() => {
    reset({
      category: undefined,
      location_id: locationId ?? "",
      location_reference: "",
      description: "",
      started_at_approx: undefined,
      seen_personally: false,
      is_happening_now: false,
      still_risky: false,
    });
    setStep(1);
    setServerError(null);
    setSuccess(false);
  }, [locationId, open, reset]);

  const description = watch("description") ?? "";
  const canSubmit = Boolean(locationId) && canCreate;

  function handleClose() {
    reset();
    setStep(1);
    setServerError(null);
    setSuccess(false);
    onClose();
  }

  async function goNext() {
    if (!canCreate) {
      setServerError(blockedMessage);
      toast.info(blockedMessage);
      return;
    }

    const valid = await trigger(getFieldsForStep(step));
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  async function onSubmit(data: CreateAlertFormData) {
    setServerError(null);
    if (!canCreate) {
      setServerError(blockedMessage);
      toast.info(blockedMessage);
      return;
    }

    const result = await createAlert({
      category: data.category,
      location_id: data.location_id,
      description: data.description,
      seen_personally: data.seen_personally,
      started_at_approx: data.started_at_approx,
      is_happening_now: data.is_happening_now,
      still_risky: data.still_risky,
    });

    if (result.success) {
      setSuccess(true);
      onAlertCreated?.();
      return;
    }

    setServerError(
      result.error
        ? getRecordValue(RPC_ERROR_MESSAGES, result.error) ?? "Erro ao criar alerta."
        : "Erro ao criar alerta.",
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Alerta da Comunidade</DialogTitle>
          {!success && <p className="text-xs text-muted-foreground">Etapa {step} de {TOTAL_STEPS}</p>}
        </DialogHeader>

        {success ? (
          <SuccessState onClose={handleClose} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && <StepCategory control={control} errors={errors} />}
            {step === 2 && (
              <StepLocation
                control={control}
                errors={errors}
                city={city}
                neighborhood={neighborhood}
                locationId={locationId}
              />
            )}
            {step === 3 && <StepObjective control={control} errors={errors} watch={watch} setValue={setValue} />}
            {step === 4 && <StepDescription control={control} errors={errors} charCount={description.length} />}
            {step === 5 && <StepConfirmation control={control} errors={errors} serverError={serverError} />}

            {!canSubmit && (
              <p className="text-xs text-amber-600">
                {canCreate
                  ? "Selecione um bairro valido para publicar alertas."
                  : blockedMessage}
              </p>
            )}

            <div className="flex justify-between pt-2">
              {step > 1 ? (
                <Button type="button" variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={isPending}>
                  Voltar
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
              )}

              {step < TOTAL_STEPS ? (
                <Button type="button" onClick={goNext} disabled={!canSubmit}>
                  Continuar
                </Button>
              ) : (
                <Button type="submit" disabled={isPending || !canSubmit} className="bg-red-600 hover:bg-red-700">
                  {isPending ? "Publicando..." : "Publicar alerta"}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface StepProps {
  control: Control<CreateAlertFormData>;
  errors: FieldErrors<CreateAlertFormData>;
}

interface StepLocationProps extends StepProps {
  city: string;
  neighborhood?: string;
  locationId?: string;
}

interface StepObjectiveProps extends StepProps {
  watch: UseFormWatch<CreateAlertFormData>;
  setValue: UseFormSetValue<CreateAlertFormData>;
}

interface StepDescriptionProps extends StepProps {
  charCount: number;
}

interface StepConfirmationProps extends StepProps {
  serverError: string | null;
}

function StepCategory({ control, errors }: StepProps) {
  const categories = Object.entries(ALERT_CATEGORY_LABELS) as [AlertCategory, string][];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Qual e o tipo de alerta?</p>
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange} className="grid grid-cols-1 gap-2">
            {categories.map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 cursor-pointer text-sm transition-colors",
                  field.value === value ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-border hover:bg-muted"
                )}
              >
                <RadioGroupItem value={value} />
                {label}
              </label>
            ))}
          </RadioGroup>
        )}
      />
      {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
    </div>
  );
}

function StepLocation({ control, errors, city, neighborhood, locationId }: StepLocationProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Confirme a regiao aproximada do alerta</p>
        <p className="mt-3 text-sm text-muted-foreground rounded-lg bg-muted/50 px-3 py-2.5 border border-border">
          Este alerta será publicado para moradores de{" "}
          <span className="font-semibold text-foreground">{neighborhood ? `${neighborhood}, ${city}` : city}</span>.
        </p>
      </div>

      <Controller
        name="location_id"
        control={control}
        render={({ field }) => <input {...field} value={locationId ?? ""} type="hidden" />}
      />
      {errors.location_id && <p className="text-xs text-destructive">{errors.location_id.message}</p>}

      <div className="space-y-1.5">
        <Label htmlFor="location_reference">
          Referencia aproximada <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Controller
          name="location_reference"
          control={control}
          render={({ field }) => (
            <input
              {...field}
              id="location_reference"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Ex.: proximo ao parque, na praca central, perto do mercado"
              maxLength={120}
            />
          )}
        />
        {errors.location_reference && <p className="text-xs text-destructive">{errors.location_reference.message}</p>}
      </div>
    </div>
  );
}

function StepObjective({ control, errors, watch, setValue }: StepObjectiveProps) {
  const isHappeningNow = watch("is_happening_now");

  function handleIsHappeningNowChange(checked: boolean, onChange: (v: boolean) => void) {
    onChange(checked);
    if (checked) setValue("still_risky", true, { shouldValidate: true });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium">Algumas perguntas rapidas.</p>

      <div className="space-y-2">
        <Label>Quando comecou?</Label>
        <Controller
          name="started_at_approx"
          control={control}
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-1">
              {(Object.entries(ALERT_STARTED_APPROX_LABELS) as [AlertStartedApprox, string][]).map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value={value} />
                  {label}
                </label>
              ))}
            </RadioGroup>
          )}
        />
        {errors.started_at_approx && <p className="text-xs text-destructive">{errors.started_at_approx.message}</p>}
      </div>

      <Controller
        name="is_happening_now"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <Checkbox checked={field.value} onCheckedChange={(checked) => handleIsHappeningNowChange(checked as boolean, field.onChange)} />
            Esta acontecendo agora
          </label>
        )}
      />

      <Controller
        name="still_risky"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isHappeningNow} />
            Ainda representa risco
          </label>
        )}
      />
      {errors.still_risky && <p className="text-xs text-destructive">{errors.still_risky.message}</p>}

      <Controller
        name="seen_personally"
        control={control}
        render={({ field }) => (
          <label className="flex items-center gap-3 text-sm cursor-pointer">
            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            Presenciei pessoalmente
          </label>
        )}
      />
    </div>
  );
}

function StepDescription({ control, errors, charCount }: StepDescriptionProps) {
  const { DESCRIPTION_MIN_LENGTH, DESCRIPTION_MAX_LENGTH } = ALERT_RULES;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Descreva o alerta de forma objetiva.</p>
      <p className="text-xs text-muted-foreground">Apenas fatos observáveis. Sem nomes, placas ou endereços exatos.</p>

      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            rows={4}
            placeholder="Ex: tiroteio na altura da praça, próximo ao mercado. Evitem a área."
            className="resize-none"
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
        )}
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Mínimo: {DESCRIPTION_MIN_LENGTH} caracteres</span>
        <span
          className={cn(
            charCount > DESCRIPTION_MAX_LENGTH && "text-destructive",
            charCount >= DESCRIPTION_MIN_LENGTH && charCount <= DESCRIPTION_MAX_LENGTH && "text-green-600"
          )}
        >
          {charCount}/{DESCRIPTION_MAX_LENGTH}
        </span>
      </div>

      {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
    </div>
  );
}

function StepConfirmation({ control, errors, serverError }: StepConfirmationProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
        <p className="text-xs text-amber-800 dark:text-amber-200 whitespace-pre-line leading-relaxed">{ALERT_MODAL_DISCLAIMER}</p>
      </div>

      <div className="space-y-3">
        {ALERT_CONFIRMATION_CHECKBOXES.map((item) => (
          <Controller
            key={item.id}
            name={item.id as keyof CreateAlertFormData}
            control={control}
            render={({ field }) => (
              <label className="flex items-start gap-3 text-sm cursor-pointer">
                <Checkbox checked={!!field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                <span>{item.label}</span>
              </label>
            )}
          />
        ))}
      </div>

      {(errors.confirm_real || errors.confirm_no_ops || errors.confirm_consequences) && (
        <p className="text-xs text-destructive">Todas as confirmações são obrigatórias.</p>
      )}

      {serverError && <p className="text-sm text-destructive font-medium">{serverError}</p>}
    </div>
  );
}

function SuccessState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <Siren className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <p className="font-semibold">Alerta publicado</p>
      <p className="text-sm text-muted-foreground">Sua comunidade foi notificada. O alerta expira automaticamente.</p>
      <Button onClick={onClose} className="w-full">
        Fechar
      </Button>
    </div>
  );
}
