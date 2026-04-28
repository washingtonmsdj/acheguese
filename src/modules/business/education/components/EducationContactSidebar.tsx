import { memo } from 'react';
import { Phone, MapPin, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

export interface EducationContactSidebarProps {
  whatsappNumber?: string | null;
  address?: string | null;
  website?: string | null;
  className?: string;
}

export const EducationContactSidebar = memo(function EducationContactSidebar({
  whatsappNumber,
  address,
  website,
  className,
}: EducationContactSidebarProps) {
  const buildWhatsAppLink = (phone: string): string => {
    const clean = phone.replace(/\D/g, '');
    const message = encodeURIComponent('Ola! Vi a instituicao no AcheGue-se e gostaria de mais informacoes.');
    return `https://wa.me/${clean}?text=${message}`;
  };

  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 p-4 space-y-3', className)}>
      <h3 className="font-semibold text-gray-900 text-sm">Contato</h3>

      {whatsappNumber && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-green-700 border-green-200 hover:bg-green-50"
          asChild
        >
          <a href={buildWhatsAppLink(whatsappNumber)} target="_blank" rel="noopener noreferrer">
            <Phone className="w-4 h-4" />
            WhatsApp
          </a>
        </Button>
      )}

      {address && (
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <span>{address}</span>
        </div>
      )}

      {website && (
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-blue-600 hover:text-blue-700"
          asChild
        >
          <a href={website} target="_blank" rel="noopener noreferrer">
            <Globe className="w-4 h-4" />
            Site oficial
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
        </Button>
      )}
    </div>
  );
});
