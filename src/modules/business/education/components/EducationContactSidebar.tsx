import { memo } from 'react';
import { Phone, MapPin, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { SafeLink } from '@/shared/components/security';
import { buildWhatsAppUrl } from '@/shared/utils/contactLinks';

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
  const whatsappUrl = buildWhatsAppUrl(
    whatsappNumber,
    'Ola! Vi a instituicao no AcheGue-se e gostaria de mais informacoes.',
  );

  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 p-4 space-y-3', className)}>
      <h3 className="font-semibold text-gray-900 text-sm">Contato</h3>

      {whatsappUrl && (
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-green-700 border-green-200 hover:bg-green-50"
          asChild
        >
          <SafeLink href={whatsappUrl} target="_blank">
            <Phone className="w-4 h-4" />
            WhatsApp
          </SafeLink>
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
          <SafeLink href={website} target="_blank">
            <Globe className="w-4 h-4" />
            Site oficial
            <ExternalLink className="w-3 h-3 ml-auto" />
          </SafeLink>
        </Button>
      )}
    </div>
  );
});
