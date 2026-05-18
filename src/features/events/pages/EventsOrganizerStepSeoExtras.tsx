import { Calendar, CheckCircle, DollarSign, MapPin, Users } from 'lucide-react';

import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/utils/cn';

type SeoExtrasFormData = Record<string, string | boolean | number | unknown>;

type EventsOrganizerStepSeoExtrasProps = {
  formData: SeoExtrasFormData;
  onFieldChange: (field: string, value: unknown) => void;
};

const EVENT_FEATURES = [
  { key: 'hasCertificate', label: 'Certificado de Participação', icon: CheckCircle },
  { key: 'hasRecording', label: 'Gravação Disponível', icon: Calendar },
  { key: 'hasNetworking', label: 'Área de Networking', icon: Users },
  { key: 'hasFood', label: 'Alimentação Incluída', icon: DollarSign },
  { key: 'hasParking', label: 'Estacionamento', icon: MapPin },
  { key: 'isAccessible', label: 'Acessível (PCD)', icon: CheckCircle },
];

export function EventsOrganizerStepSeoExtras({ formData, onFieldChange }: EventsOrganizerStepSeoExtrasProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <CheckCircle className="h-5 w-5 text-primary" />
          SEO e Otimizações
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="metaTitle">Meta Título (SEO)</Label>
            <Input
              id="metaTitle"
              value={(formData.metaTitle as string) || ''}
              onChange={(e) => onFieldChange('metaTitle', e.target.value)}
              placeholder="Título otimizado para buscadores"
              maxLength={60}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {((formData.metaTitle as string) || '').length}/60 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="metaDescription">Meta Descrição (SEO)</Label>
            <Textarea
              id="metaDescription"
              value={(formData.metaDescription as string) || ''}
              onChange={(e) => onFieldChange('metaDescription', e.target.value)}
              placeholder="Descrição para aparecer nos resultados de busca"
              rows={2}
              maxLength={160}
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              {((formData.metaDescription as string) || '').length}/160 caracteres
            </p>
          </div>

          <div>
            <Label htmlFor="metaKeywords">Palavras-chave (separadas por vírgula)</Label>
            <Input
              id="metaKeywords"
              value={(formData.metaKeywords as string) || ''}
              onChange={(e) => onFieldChange('metaKeywords', e.target.value)}
              placeholder="evento, música, festival, salvador"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Recursos do Evento
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Marque os recursos disponíveis no seu evento
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {EVENT_FEATURES.map((feature) => (
            <label
              key={feature.key}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all',
                formData[feature.key] ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              )}
            >
              <input
                type="checkbox"
                checked={Boolean(formData[feature.key])}
                onChange={(e) => onFieldChange(feature.key, e.target.checked)}
                className="h-4 w-4"
              />
              <feature.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{feature.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Contato do Organizador
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Formas de contato para os participantes tirarem dúvidas
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="organizerWhatsapp">WhatsApp</Label>
            <Input
              id="organizerWhatsapp"
              value={(formData.organizerWhatsapp as string) || ''}
              onChange={(e) => onFieldChange('organizerWhatsapp', e.target.value)}
              placeholder="(71) 99999-9999"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="organizerInstagram">Instagram</Label>
            <Input
              id="organizerInstagram"
              value={(formData.organizerInstagram as string) || ''}
              onChange={(e) => onFieldChange('organizerInstagram', e.target.value)}
              placeholder="@seuperfil"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="organizerEmail">E-mail</Label>
            <Input
              id="organizerEmail"
              type="email"
              value={(formData.organizerEmail as string) || ''}
              onChange={(e) => onFieldChange('organizerEmail', e.target.value)}
              placeholder="contato@exemplo.com"
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="organizerPhone">Telefone</Label>
            <Input
              id="organizerPhone"
              value={(formData.organizerPhone as string) || ''}
              onChange={(e) => onFieldChange('organizerPhone', e.target.value)}
              placeholder="(71) 3333-3333"
              className="mt-2"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="organizerWebsite">Website</Label>
            <Input
              id="organizerWebsite"
              type="url"
              value={(formData.organizerWebsite as string) || ''}
              onChange={(e) => onFieldChange('organizerWebsite', e.target.value)}
              placeholder="https://seusite.com"
              className="mt-2"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
        <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-600">
          <CheckCircle className="h-5 w-5" />
          Quase lá!
        </h4>
        <p className="text-sm text-muted-foreground">
          Você preencheu todas as informações. Revise tudo e clique em "Publicar Evento" para finalizar!
        </p>
      </div>
    </div>
  );
}
