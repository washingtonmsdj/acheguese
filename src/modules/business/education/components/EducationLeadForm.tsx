import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, User, Mail, Phone, MessageSquare, Check, GraduationCap, Clock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';
import { useLabels } from '../hooks/useEducationLabels';
import type { SchoolShift } from '../types';

export interface EducationLeadFormProps {
  educationProfileId: string;
  nicheKey?: string | null;
  onSubmit?: (data: LeadFormData) => void;
  onLeadCreated?: (leadId: string, data: LeadFormData) => void;
  className?: string;
}

export interface LeadFormData {
  fullName: string;
  email: string;
  phone: string;
  childName?: string;
  childAge?: number;
  interestNote?: string;
  // Campos específicos para matrícula escolar
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

export function EducationLeadForm({
  educationProfileId,
  nicheKey,
  onSubmit,
  className,
}: EducationLeadFormProps) {
  const labels = useLabels(nicheKey);
  const isSchoolContext = nicheKey === 'regular_school' || nicheKey === 'daycare';

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'childAge' || name === 'studentAge'
          ? value
            ? parseInt(value)
            : undefined
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) return;

    setIsLoading(true);
    try {
      await onSubmit?.(formData);
      setIsSubmitted(true);
    } catch {
      // Error handled by parent
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
          'bg-green-50 border border-green-200 rounded-xl p-6 text-center',
          className,
        )}
      >
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="font-semibold text-green-800 mb-1">Interesse registrado!</h3>
        <p className="text-sm text-green-600">
          Entraremos em contato em breve.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className={cn('space-y-4', className)}
    >
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-500" />
        {isSchoolContext ? labels.enrollmentLabel : 'Solicitar Informacoes'}
      </h3>

      <div className="space-y-3">
        {isSchoolContext && (
          <div>
            <Label htmlFor="guardianName" className="text-sm">
              Nome do responsavel
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="guardianName"
                name="guardianName"
                value={formData.guardianName ?? ''}
                onChange={handleChange}
                placeholder="Quando diferente do nome acima"
                className="pl-10"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="fullName" className="text-sm">
            Nome completo *
          </Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Seu nome"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email" className="text-sm">
            E-mail *
          </Label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm">
            Telefone *
          </Label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(88) 99999-9999"
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={isSchoolContext ? 'studentName' : 'childName'} className="text-sm">
              {isSchoolContext ? 'Nome do aluno' : 'Nome do aluno'}
            </Label>
            <Input
              id={isSchoolContext ? 'studentName' : 'childName'}
              name={isSchoolContext ? 'studentName' : 'childName'}
              value={isSchoolContext ? (formData.studentName ?? '') : (formData.childName ?? '')}
              onChange={handleChange}
              placeholder="Opcional"
              className="mt-1"
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
              className="mt-1"
              min={0}
              max={120}
            />
          </div>
        </div>

        {isSchoolContext && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="desiredGrade" className="text-sm flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                {labels.gradeLabel} desejada
              </Label>
              <Input
                id="desiredGrade"
                name="desiredGrade"
                value={formData.desiredGrade ?? ''}
                onChange={handleChange}
                placeholder="Ex: 1º ano, 6º ano"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="desiredShift" className="text-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {labels.shiftLabel} desejado
              </Label>
              <select
                id="desiredShift"
                name="desiredShift"
                value={formData.desiredShift ?? ''}
                onChange={handleChange}
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            className="mt-1 resize-none"
            rows={3}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? (
          <span className="animate-pulse">Enviando...</span>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            {isSchoolContext ? labels.enrollmentCTA : 'Solicitar informacoes'}
          </>
        )}
      </Button>
    </motion.form>
  );
}
