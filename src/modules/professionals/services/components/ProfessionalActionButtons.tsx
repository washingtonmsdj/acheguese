import { useState } from "react";
import { Phone, MessageCircle, Star, Share2, Mail, Send } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useToast } from "@/shared/hooks/use-toast";
import { ProfessionalLeadRequestDialog } from "@/modules/professionals/components/ProfessionalLeadRequestDialog";
import { buildMailtoUrl, buildTelUrl, buildWhatsAppUrl } from "@/shared/utils/contactLinks";
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
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);

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
        <Button
          size="sm"
          onClick={() => setLeadDialogOpen(true)}
          disabled={!professional.is_accepting_clients}
        >
          <Send className="h-4 w-4 mr-1.5" />
          Orcamento
        </Button>

        {hasWhatsapp && (
          <Button
            asChild
            size="sm"
            className="bg-success hover:bg-success/90 text-success-foreground"
          >
            <a
              href={buildWhatsAppUrl(professional.whatsapp) ?? undefined}
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
            <a href={buildTelUrl(professional.phone) ?? undefined}>
              <Phone className="h-4 w-4 mr-1.5" />
              Ligar
            </a>
          </Button>
        )}

        {hasEmail && (
          <Button asChild variant="outline" size="sm">
            <a href={buildMailtoUrl(professional.email) ?? undefined}>
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

      <ProfessionalLeadRequestDialog
        open={leadDialogOpen}
        onOpenChange={setLeadDialogOpen}
        professionalId={professional.professional_data_id}
        professionalName={professional.name}
        defaultService={professional.service || professional.category}
        sourceChannel="service_profile"
      />
    </div>
  );
}
