import { Phone, MessageCircle, Star, Share2, Mail } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks/use-toast";
import type { ProfessionalData } from "@/modules/professionals/services/hooks/useProfessionalDetail";

interface ProfessionalActionButtonsProps {
  professional: ProfessionalData;
  onReviewClick: () => void;
}

export function ProfessionalActionButtons({
  professional,
  onReviewClick,
}: ProfessionalActionButtonsProps) {
  const { toast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;
    const text = `${professional.name} - ${professional.service}`;
    if (navigator.share) {
      await navigator.share({ title: text, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    }
  };

  const hasPhone = !!professional.phone;
  const hasWhatsapp = !!professional.whatsapp;
  const hasEmail = !!professional.email;

  return (
    <div className="px-4 py-3 border-b">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {hasWhatsapp && (
          <Button
            asChild
            size="sm"
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            <a
              href={`https://wa.me/55${professional.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-4 w-4 mr-1.5" />
              WhatsApp
            </a>
          </Button>
        )}

        {hasPhone && (
          <Button asChild variant="outline" size="sm">
            <a href={`tel:${professional.phone}`}>
              <Phone className="h-4 w-4 mr-1.5" />
              Ligar
            </a>
          </Button>
        )}

        {hasEmail && (
          <Button asChild variant="outline" size="sm">
            <a href={`mailto:${professional.email}`}>
              <Mail className="h-4 w-4 mr-1.5" />
              Email
            </a>
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={onReviewClick}>
          <Star className="h-4 w-4 mr-1.5" />
          Avaliar
        </Button>

        <Button variant="ghost" size="sm" onClick={handleShare}>
          <Share2 className="h-4 w-4 mr-1.5" />
          Compartilhar
        </Button>
      </div>
    </div>
  );
}
