/**
 * EVENTS ORGANIZER FORM
 *
 * Formulario completo para criar/editar eventos
 * Multi-step com validacao
 *
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, Clock, DollarSign, FileText, HelpCircle, Image as ImageIcon, MapPin, Save, Eye } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { buildEventsOrganizerFormData, type EventsOrganizerFieldChange } from './EventsOrganizerForm.model';
import { EventsOrganizerFormStepContent } from './EventsOrganizerFormStepContent';
import { communityEventsRuntimeService } from '@/core/community/services/CommunityEventsRuntimeService';
import { mapCommunityEventToEvent } from '../utils/eventAdapters';

const STEPS = [
  { id: 1, title: 'Informacoes Basicas', icon: FileText },
  { id: 2, title: 'Data e Local', icon: MapPin },
  { id: 3, title: 'Ingressos', icon: DollarSign },
  { id: 4, title: 'Detalhes', icon: Calendar },
  { id: 5, title: 'Midia', icon: ImageIcon },
  { id: 6, title: 'Programacao', icon: Clock },
  { id: 7, title: 'FAQ', icon: HelpCircle },
  { id: 8, title: 'SEO e Extras', icon: CheckCircle },
];

export default function EventsOrganizerForm() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const isEditing = !!eventId;

  const { data: existingEvent = null } = useQuery({
    queryKey: ['events-organizer-form', eventId],
    enabled: isEditing,
    queryFn: async () => {
      if (!eventId) return null;
      const row = await communityEventsRuntimeService.getEventById(eventId);
      return row ? mapCommunityEventToEvent(row) : null;
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => buildEventsOrganizerFormData(existingEvent));

  useEffect(() => {
    if (existingEvent) {
      setFormData(buildEventsOrganizerFormData(existingEvent));
    }
  }, [existingEvent]);

  // Handlers
  const handleInputChange: EventsOrganizerFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveDraft = () => {
    // TODO: Salvar como rascunho
    alert('Salvo como rascunho!');
  };

  const handlePublish = () => {
    // TODO: Publicar evento
    alert('Evento publicado!');
    navigate('/central/eventos');
  };

  const handlePreview = () => {
    // TODO: Abrir preview
    alert('Preview do evento');
  };

  return (
    <>
      {/* SEO */}
      <Helmet>
        <title>{isEditing ? 'Editar Evento' : 'Criar Evento'} | Dashboard | Achegue-se</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      {/* Page Container */}
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate('/central/eventos')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePreview} className="gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview</span>
                </Button>
                <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Salvar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-border/50 bg-muted/30 py-6">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all",
                        currentStep >= step.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      )}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="hidden text-xs font-medium sm:block">
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-0.5 flex-1 transition-all",
                        currentStep > step.id ? "bg-primary" : "bg-border"
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  {STEPS[currentStep - 1].title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Passo {currentStep} de {STEPS.length}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <EventsOrganizerFormStepContent currentStep={currentStep} formData={formData} onFieldChange={handleInputChange} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} className="gap-2">
                Proximo
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handlePublish} className="gap-2">
                <CheckCircle className="h-4 w-4" />
                Publicar Evento
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
