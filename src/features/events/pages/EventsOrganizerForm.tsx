/**
 * EVENTS ORGANIZER FORM
 * 
 * FormulÃ¡rio completo para criar/editar eventos
 * Multi-step com validaÃ§Ã£o
 * 
 * @version 1.0.0
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Eye,
  Upload,
  X,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Clock,
  FileText,
  Image as ImageIcon,
  HelpCircle,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/utils/cn';
import { getMockEventById } from '../utils/mockData';
import type { EventCategory, EventType } from '../types';
import { EVENT_CATEGORY_OPTIONS } from '../constants';
import { EventsOrganizerStepSeoExtras } from './EventsOrganizerStepSeoExtras';

const STEPS = [
  { id: 1, title: 'InformaÃ§Ãµes BÃ¡sicas', icon: FileText },
  { id: 2, title: 'Data e Local', icon: MapPin },
  { id: 3, title: 'Ingressos', icon: DollarSign },
  { id: 4, title: 'Detalhes', icon: Calendar },
  { id: 5, title: 'MÃ­dia', icon: ImageIcon },
  { id: 6, title: 'ProgramaÃ§Ã£o', icon: Clock },
  { id: 7, title: 'FAQ', icon: HelpCircle },
  { id: 8, title: 'SEO e Extras', icon: CheckCircle },
];

export default function EventsOrganizerForm() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const isEditing = !!eventId;

  // Load event if editing
  const existingEvent = isEditing ? getMockEventById(eventId) : null;

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    title: existingEvent?.title || '',
    subtitle: existingEvent?.subtitle || '',
    shortDescription: existingEvent?.short_description || '',
    description: existingEvent?.description || '',
    category: existingEvent?.category || 'cultural' as EventCategory,
    tags: existingEvent?.tags?.join(', ') || '',
    
    // Step 2: Date & Location
    startDate: existingEvent?.start_date || '',
    endDate: existingEvent?.end_date || '',
    durationMinutes: existingEvent?.duration_minutes || 0,
    timezone: existingEvent?.timezone || 'America/Sao_Paulo',
    locationType: existingEvent?.location.type || 'physical' as EventType,
    venueName: existingEvent?.location.venue_name || '',
    address: existingEvent?.location.address || '',
    neighborhood: existingEvent?.location.neighborhood || '',
    city: existingEvent?.location.city || '',
    state: existingEvent?.location.state || '',
    zipcode: existingEvent?.location.zipcode || '',
    onlineUrl: existingEvent?.location.online_url || '',
    onlinePlatform: existingEvent?.location.online_platform || '',
    locationInstructions: existingEvent?.location.instructions || '',
    
    // Step 3: Tickets
    isFree: existingEvent?.is_free || true,
    capacity: existingEvent?.capacity || 0,
    waitlistEnabled: existingEvent?.waitlist_enabled || false,
    
    // Step 4: Details
    requirements: existingEvent?.requirements?.join('\n') || '',
    whatToBring: existingEvent?.what_to_bring?.join('\n') || '',
    ageRestriction: existingEvent?.age_restriction || '',
    dressCode: existingEvent?.dress_code || '',
    accessibilityInfo: existingEvent?.accessibility_info || '',
    
    // Step 5: Media
    coverImage: existingEvent?.cover_image_url || '',
    bannerImage: existingEvent?.banner_image_url || '',
    videoUrl: existingEvent?.video_url || '',
    gallery: existingEvent?.gallery?.map(g => g.url) || [],
    
    // Step 6: Schedule (ProgramaÃ§Ã£o)
    schedule: existingEvent?.schedule || [],
    
    // Step 7: FAQ
    faq: existingEvent?.faq || [],
    
    // Step 8: SEO & Features
    metaTitle: existingEvent?.meta_title || '',
    metaDescription: existingEvent?.meta_description || '',
    metaKeywords: existingEvent?.meta_keywords?.join(', ') || '',
    hasCertificate: existingEvent?.features?.has_certificate || false,
    hasRecording: existingEvent?.features?.has_recording || false,
    hasNetworking: existingEvent?.features?.has_networking || false,
    hasFood: existingEvent?.features?.has_food || false,
    hasParking: existingEvent?.features?.has_parking || false,
    isAccessible: existingEvent?.features?.is_accessible || false,
    
    // Organizer Contact
    organizerWhatsapp: existingEvent?.organizer?.contact?.whatsapp || '',
    organizerInstagram: existingEvent?.organizer?.contact?.instagram || '',
    organizerEmail: existingEvent?.organizer?.contact?.email || '',
    organizerPhone: existingEvent?.organizer?.contact?.phone || '',
    organizerWebsite: existingEvent?.organizer?.contact?.website || '',
  });

  // Handlers
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">TÃ­tulo do Evento *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Ex: Festival de MÃºsica 2024"
                className="mt-2"
              />
            </div>

            {/* Subtitle */}
            <div>
              <Label htmlFor="subtitle">SubtÃ­tulo (opcional)</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => handleInputChange('subtitle', e.target.value)}
                placeholder="Ex: O maior festival de mÃºsica do Nordeste"
                className="mt-2"
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_CATEGORY_OPTIONS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags (separadas por vÃ­rgula)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="Ex: mÃºsica, festival, ao vivo, rock"
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Tags ajudam as pessoas a encontrarem seu evento
              </p>
            </div>

            {/* Short Description */}
            <div>
              <Label htmlFor="shortDescription">DescriÃ§Ã£o Curta *</Label>
              <Textarea
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                placeholder="Resumo do evento em atÃ© 160 caracteres"
                rows={2}
                maxLength={160}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {formData.shortDescription.length}/160 caracteres
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">DescriÃ§Ã£o Completa *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva seu evento em detalhes..."
                rows={6}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Date Range */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="startDate">Data de InÃ­cio *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data de TÃ©rmino</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Location Type */}
            <div>
              <Label>Tipo de Evento *</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {[
                  { value: 'physical', label: 'Presencial', icon: MapPin },
                  { value: 'online', label: 'Online', icon: Users },
                  { value: 'hybrid', label: 'HÃ­brido', icon: Calendar },
                ].map(type => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleInputChange('locationType', type.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                      formData.locationType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <type.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Physical Location */}
            {(formData.locationType === 'physical' || formData.locationType === 'hybrid') && (
              <>
                <div>
                  <Label htmlFor="venueName">Nome do Local *</Label>
                  <Input
                    id="venueName"
                    value={formData.venueName}
                    onChange={(e) => handleInputChange('venueName', e.target.value)}
                    placeholder="Ex: Teatro Municipal"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="address">EndereÃ§o Completo *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Rua, nÃºmero"
                    className="mt-2"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                      placeholder="Ex: Centro"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipcode">CEP</Label>
                    <Input
                      id="zipcode"
                      value={formData.zipcode}
                      onChange={(e) => handleInputChange('zipcode', e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="Salvador"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="BA"
                      maxLength={2}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="locationInstructions">InstruÃ§Ãµes de Acesso (opcional)</Label>
                  <Textarea
                    id="locationInstructions"
                    value={formData.locationInstructions}
                    onChange={(e) => handleInputChange('locationInstructions', e.target.value)}
                    placeholder="Ex: Entrada pela porta lateral, estacionamento disponÃ­vel..."
                    rows={2}
                    className="mt-2"
                  />
                </div>
              </>
            )}

            {/* Online URL */}
            {(formData.locationType === 'online' || formData.locationType === 'hybrid') && (
              <>
                <div>
                  <Label htmlFor="onlinePlatform">Plataforma Online</Label>
                  <Select
                    value={formData.onlinePlatform}
                    onValueChange={(value) => handleInputChange('onlinePlatform', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Selecione a plataforma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="meet">Google Meet</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                      <SelectItem value="youtube">YouTube Live</SelectItem>
                      <SelectItem value="instagram">Instagram Live</SelectItem>
                      <SelectItem value="other">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="onlineUrl">Link do Evento Online *</Label>
                  <Input
                    id="onlineUrl"
                    type="url"
                    value={formData.onlineUrl}
                    onChange={(e) => handleInputChange('onlineUrl', e.target.value)}
                    placeholder="https://zoom.us/..."
                    className="mt-2"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    O link serÃ¡ enviado aos participantes apÃ³s a inscriÃ§Ã£o
                  </p>
                </div>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Is Free */}
            <div>
              <Label>Tipo de Ingresso *</Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('isFree', true)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                    formData.isFree
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-sm font-medium">Gratuito</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('isFree', false)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all",
                    !formData.isFree
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm font-medium">Pago</span>
                </button>
              </div>
            </div>

            {/* Capacity */}
            <div>
              <Label htmlFor="capacity">Capacidade (opcional)</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                placeholder="Ex: 100"
                min="0"
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Deixe 0 para capacidade ilimitada
              </p>
            </div>

            {/* Ticket Types (if paid) */}
            {!formData.isFree && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  ObservaÃ§Ã£o: A configuraÃ§Ã£o detalhada de ingressos pagos serÃ¡ implementada em breve.
                  Por enquanto, vocÃª pode criar o evento e adicionar os ingressos depois.
                </p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Requirements */}
            <div>
              <Label htmlFor="requirements">Requisitos (um por linha)</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                placeholder="Ex:\nMaior de 18 anos\nDocumento com foto"
                rows={4}
                className="mt-2"
              />
            </div>

            {/* What to Bring */}
            <div>
              <Label htmlFor="whatToBring">O que levar (um por linha)</Label>
              <Textarea
                id="whatToBring"
                value={formData.whatToBring}
                onChange={(e) => handleInputChange('whatToBring', e.target.value)}
                placeholder="Ex:\nGarrafa de Ã¡gua\nProtetor solar"
                rows={4}
                className="mt-2"
              />
            </div>

            {/* Age Restriction */}
            <div>
              <Label htmlFor="ageRestriction">ClassificaÃ§Ã£o EtÃ¡ria</Label>
              <Select
                value={formData.ageRestriction}
                onValueChange={(value) => handleInputChange('ageRestriction', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="livre">Livre</SelectItem>
                  <SelectItem value="10">10 anos</SelectItem>
                  <SelectItem value="12">12 anos</SelectItem>
                  <SelectItem value="14">14 anos</SelectItem>
                  <SelectItem value="16">16 anos</SelectItem>
                  <SelectItem value="18">18 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dress Code */}
            <div>
              <Label htmlFor="dressCode">Dress Code (opcional)</Label>
              <Input
                id="dressCode"
                value={formData.dressCode}
                onChange={(e) => handleInputChange('dressCode', e.target.value)}
                placeholder="Ex: Casual, Esporte fino, Traje de gala"
                className="mt-2"
              />
            </div>

            {/* Accessibility Info */}
            <div>
              <Label htmlFor="accessibilityInfo">InformaÃ§Ãµes de Acessibilidade</Label>
              <Textarea
                id="accessibilityInfo"
                value={formData.accessibilityInfo}
                onChange={(e) => handleInputChange('accessibilityInfo', e.target.value)}
                placeholder="Ex: Local com rampa de acesso, banheiros adaptados, intÃ©rprete de libras disponÃ­vel..."
                rows={3}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Informe sobre acessibilidade para pessoas com deficiÃªncia
              </p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            {/* Cover Image */}
            <div>
              <Label>Imagem de Capa *</Label>
              <div className="mt-2 flex flex-col gap-3">
                {formData.coverImage ? (
                  <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
                    <img
                      src={formData.coverImage}
                      alt="Capa"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleInputChange('coverImage', '')}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                    <div className="text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Clique para fazer upload
                      </p>
                    </div>
                  </div>
                )}
                <Input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => handleInputChange('coverImage', e.target.value)}
                  placeholder="Ou cole a URL da imagem"
                />
              </div>
            </div>

            {/* Banner Image */}
            <div>
              <Label>Banner (opcional)</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Imagem de banner para destaque (diferente da capa)
              </p>
              <Input
                type="url"
                value={formData.bannerImage}
                onChange={(e) => handleInputChange('bannerImage', e.target.value)}
                placeholder="URL do banner"
                className="mt-2"
              />
            </div>

            {/* Video URL */}
            <div>
              <Label>VÃ­deo do Evento (opcional)</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Link do YouTube, Vimeo ou outro
              </p>
              <Input
                type="url"
                value={formData.videoUrl}
                onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                placeholder="https://youtube.com/..."
                className="mt-2"
              />
            </div>

            {/* Gallery */}
            <div>
              <Label>Galeria de Fotos (opcional)</Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Adicione fotos adicionais do evento
              </p>
              <div className="mt-2 rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">
                  ObservaÃ§Ã£o: Upload de galeria serÃ¡ implementado em breve
                </p>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <Clock className="h-5 w-5 text-primary" />
                ProgramaÃ§Ã£o do Evento
              </h3>
              <p className="text-sm text-muted-foreground">
                Adicione a agenda/programaÃ§Ã£o do seu evento. Isso ajuda os participantes a se organizarem!
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <h4 className="mb-2 font-semibold text-foreground">
                Gerenciador de ProgramaÃ§Ã£o
              </h4>
              <p className="mb-4 text-sm text-muted-foreground">
                Adicione horÃ¡rios, palestras, atividades e palestrantes
              </p>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar item a programacao
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              ObservaÃ§Ã£o: <strong>Dica:</strong> Uma programaÃ§Ã£o bem detalhada aumenta a confianÃ§a dos participantes!
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <HelpCircle className="h-5 w-5 text-primary" />
                Perguntas Frequentes (FAQ)
              </h3>
              <p className="text-sm text-muted-foreground">
                Responda as dÃºvidas mais comuns dos participantes antecipadamente!
              </p>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
              <HelpCircle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <h4 className="mb-2 font-semibold text-foreground">
                Gerenciador de FAQ
              </h4>
              <p className="mb-4 text-sm text-muted-foreground">
                Adicione perguntas e respostas para esclarecer dÃºvidas
              </p>
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Pergunta
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                Exemplos de perguntas comuns:
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Posso levar crianÃ§as?</li>
                <li>Tem estacionamento no local?</li>
                <li>Posso cancelar minha inscriÃ§Ã£o?</li>
                <li>O evento serÃ¡ gravado?</li>
                <li>Tem certificado de participaÃ§Ã£o?</li>
              </ul>
            </div>
          </div>
        );
      case 8:
        return <EventsOrganizerStepSeoExtras formData={formData} onFieldChange={handleInputChange} />;

      default:
        return null;
    }
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
                {renderStepContent()}
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
                PrÃ³ximo
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
