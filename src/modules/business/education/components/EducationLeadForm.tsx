import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  User,
  Mail,
  Phone,
  MessageSquare,
  Check,
  GraduationCap,
  Clock,
  AlertCircle,
  LifeBuoy,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';
import { useLabels } from '../hooks/useEducationLabels';
import type { EducationNicheKey, SchoolShift } from '@/core/education';
import { getSchoolStageOptions, SCHOOL_STAGE_OTHER_VALUE } from '@/core/education/constants/schoolStageOptions';

export interface EducationLeadFormProps {
  nicheKey?: string | null;
  onSubmit: (data: LeadFormData) => Promise<void> | void;
  className?: string;
}
export interface LeadFormData {
  fullName: string;
  email: string;
  phone: string;
  childName?: string;
  childAge?: number;
  interestNote?: string;
  guardianName?: string;
  studentName?: string;
  studentAge?: number;
  desiredGrade?: string;
  desiredShift?: SchoolShift;
}

const SHIFT_OPTIONS: { value: SchoolShift; label: string }[] = [
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening', label: 'Noite' },
  { value: 'full_day', label: 'Integral' },
];

const FIELD_CLASS_NAME =
  'border-territory-border bg-territory-surface text-territory-ink placeholder:text-territory-muted focus-visible:ring-territory-brand focus-visible:ring-offset-territory-canvas';

const SELECT_CLASS_NAME =
  'h-10 w-full rounded-md border border-territory-border bg-territory-surface px-3 py-2 text-sm text-territory-ink ring-offset-territory-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-territory-brand focus-visible:ring-offset-2';

export function EducationLeadForm({
  nicheKey,
  onSubmit,
  className,
}: EducationLeadFormProps) {
  const labels = useLabels((nicheKey ?? undefined) as EducationNicheKey | undefined);
  const isSchoolContext = nicheKey === 'regular_school' || nicheKey === 'daycare';
  const stageOptions = getSchoolStageOptions((nicheKey ?? undefined) as EducationNicheKey | undefined);

  const [formData, setFormData] = useState<LeadFormData>({
    fullName: '',
    email: '',
    phone: '',
    childName: '',
    childAge: undefined,
    interestNote: '',
    guardianName: '',
    studentName: '',
    studentAge: undefined,
    desiredGrade: '',
    desiredShift: undefined,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [desiredStageOption, setDesiredStageOption] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'childAge' || name === 'studentAge'
          ? value
            ? parseInt(value, 10)
            : undefined
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) return;

    setSubmissionError(null);
    setIsLoading(true);
    try {
      await onSubmit(formData);
      setIsSubmitted(true);
    } catch {
      setSubmissionError(
        'Não foi possível registrar seu interesse. Revise os dados e tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'rounded-xl border border-territory-success/25 bg-territory-success/10 p-6 text-center text-territory-ink',
          className,
        )}
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-territory-success/15">
          <Check className="h-6 w-6 text-territory-success" aria-hidden="true" />
        </div>
        <h3 className="mb-1 font-heading font-semibold text-territory-ink">
          Interesse registrado!
        </h3>
        <p className="text-sm text-territory-success">Entraremos em contato em breve.</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      id="education-lead-form"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className={cn('space-y-4 text-territory-ink', className)}
    >
      <h3 className="flex items-center gap-2 font-heading font-semibold text-territory-ink">
        <MessageSquare className="h-5 w-5 text-territory-brand" aria-hidden="true" />
        {isSchoolContext ? labels.enrollmentLabel : 'Solicitar Informações'}
      </h3>

      <div className="space-y-3">
        {isSchoolContext && (
          <div>
            <Label htmlFor="guardianName" className="text-sm">
              Nome do responsável
            </Label>
            <div className="relative mt-1">
              <User
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted"
                aria-hidden="true"
              />
              <Input
                id="guardianName"
                name="guardianName"
                value={formData.guardianName ?? ''}
                onChange={handleChange}
                placeholder="Quando diferente do nome acima"
                className={cn(FIELD_CLASS_NAME, 'pl-10')}
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="fullName" className="text-sm">
            Nome completo *
          </Label>
          <div className="relative mt-1">
            <User
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted"
              aria-hidden="true"
            />
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Seu nome"
              className={cn(FIELD_CLASS_NAME, 'pl-10')}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm">
            E-mail *
          </Label>
          <div className="relative mt-1">
            <Mail
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted"
              aria-hidden="true"
            />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className={cn(FIELD_CLASS_NAME, 'pl-10')}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm">
            Telefone *
          </Label>
          <div className="relative mt-1">
            <Phone
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-territory-muted"
              aria-hidden="true"
            />
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(71) 99999-9999"
              className={cn(FIELD_CLASS_NAME, 'pl-10')}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={isSchoolContext ? 'studentName' : 'childName'} className="text-sm">
              Nome do aluno
            </Label>
            <Input
              id={isSchoolContext ? 'studentName' : 'childName'}
              name={isSchoolContext ? 'studentName' : 'childName'}
              value={isSchoolContext ? (formData.studentName ?? '') : (formData.childName ?? '')}
              onChange={handleChange}
              placeholder="Opcional"
              className={cn(FIELD_CLASS_NAME, 'mt-1')}
            />
          </div>
          <div>
            <Label htmlFor={isSchoolContext ? 'studentAge' : 'childAge'} className="text-sm">
              {isSchoolContext ? 'Idade do aluno' : 'Idade'}
            </Label>
            <Input
              id={isSchoolContext ? 'studentAge' : 'childAge'}
              name={isSchoolContext ? 'studentAge' : 'childAge'}
              type="number"
              value={isSchoolContext ? (formData.studentAge ?? '') : (formData.childAge ?? '')}
              onChange={handleChange}
              placeholder="Anos"
              className={cn(FIELD_CLASS_NAME, 'mt-1')}
              min={0}
              max={120}
            />
          </div>
        </div>

        {isSchoolContext && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="desiredStageOption" className="flex items-center gap-1 text-sm">
                <GraduationCap className="h-3.5 w-3.5 text-territory-muted" aria-hidden="true" />
                {labels.gradeLabel} desejada
              </Label>
              <select
                id="desiredStageOption"
                value={desiredStageOption}
                onChange={(e) => {
                  const value = e.target.value;
                  setDesiredStageOption(value);
                  if (value === SCHOOL_STAGE_OTHER_VALUE) return;
                  const selected = stageOptions.find((opt) => opt.value === value);
                  setFormData((prev) => ({ ...prev, desiredGrade: selected?.label ?? '' }));
                }}
                className={cn(SELECT_CLASS_NAME, 'mt-1')}
              >
                <option value="">Selecione...</option>
                {stageOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
                <option value={SCHOOL_STAGE_OTHER_VALUE}>Outros (informar manualmente)</option>
              </select>
              {desiredStageOption === SCHOOL_STAGE_OTHER_VALUE && (
                <div className="mt-2 space-y-2">
                  <Input
                    id="desiredGrade"
                    name="desiredGrade"
                    value={formData.desiredGrade ?? ''}
                    onChange={handleChange}
                    placeholder="Informe a etapa/série"
                    className={FIELD_CLASS_NAME}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="gap-2 border-territory-border bg-territory-surface text-territory-ink hover:bg-territory-raised hover:text-territory-ink"
                  >
                    <a href="/contato">
                      <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                      Contatar suporte
                    </a>
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="desiredShift" className="flex items-center gap-1 text-sm">
                <Clock className="h-3.5 w-3.5 text-territory-muted" aria-hidden="true" />
                {labels.shiftLabel} desejado
              </Label>
              <select
                id="desiredShift"
                name="desiredShift"
                value={formData.desiredShift ?? ''}
                onChange={handleChange}
                className={cn(SELECT_CLASS_NAME, 'mt-1')}
              >
                <option value="">Selecione...</option>
                {SHIFT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="interestNote" className="text-sm">
            Observações
          </Label>
          <Textarea
            id="interestNote"
            name="interestNote"
            value={formData.interestNote}
            onChange={handleChange}
            placeholder="Conte-nos o que procura..."
            className={cn(FIELD_CLASS_NAME, 'mt-1 resize-none')}
            rows={3}
          />
        </div>
      </div>

      {submissionError && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-start gap-2 rounded-lg border border-territory-error/25 bg-territory-error/10 p-3 text-sm text-territory-error"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{submissionError}</span>
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-territory-brand text-territory-on-image hover:bg-territory-brand/90"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="animate-pulse">Enviando...</span>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            {isSchoolContext ? labels.enrollmentCTA : 'Solicitar informações'}
          </>
        )}
      </Button>
    </motion.form>
  );
}
