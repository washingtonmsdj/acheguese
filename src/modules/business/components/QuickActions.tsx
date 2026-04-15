import React from "react";
import { Button } from "@/shared/components/ui/button";
import {
  MessageCircle,
  Phone,
  Navigation,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import BookingButton from "./BookingButton";
interface QuickActionsProps {
  whatsapp?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
  businessName: string;
  businessId?: string;
  hasProducts?: boolean;
  hasServices?: boolean;
  isOwner?: boolean;
  services?: Array<{
    id: string;
    name: string;
    duracao?: string;
    price?: number;
  }>;
}

export default function QuickActions({
  whatsapp,
  phone,
  latitude,
  longitude,
  businessName,
  businessId,
  hasProducts = false,
  hasServices = false,
  isOwner = false,
  services = [],
}: QuickActionsProps) {
  const openWhatsApp = () => {
    if (!whatsapp) {
      toast.error("WhatsApp não disponível");
      return;
    }
    const message = `Olá! Vi o profile de ${businessName} no LocalConnect e gostaria de saber mais informações.`;
    window.open(
      `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const makeCall = () => {
    if (!phone) {
      toast.error("Telefone não disponível");
      return;
    }
    window.location.href = `tel:${phone}`;
  };

  const openMaps = () => {
    if (!latitude || !longitude) {
      toast.error("Localização não disponível");
      return;
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIos) {
      window.open(
        `maps://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(businessName)}`,
        "_blank",
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        "_blank",
      );
    }
  };

  const scrollToProducts = () => {
    const element = document.querySelector('[date-tab="products"]');
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToServices = () => {
    const element = document.querySelector('[date-tab="services"]');
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* WhatsApp - Destaque principal */}
      {whatsapp && (
        <Button
          onClick={openWhatsApp}
          size="lg"
          className="h-14 gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all col-span-2 md:col-span-1"
        >
          <MessageCircle className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-90">Falar no</span>
            <span>WhatsApp</span>
          </div>
        </Button>
      )}

      {/* Ligar Agora */}
      {phone && (
        <Button
          onClick={makeCall}
          size="lg"
          variant="outline"
          className="h-14 gap-2 border-2 hover:bg-primary hover:text-primary-foreground font-semibold transition-all"
        >
          <Phone className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-70">Ligar</span>
            <span>Agora</span>
          </div>
        </Button>
      )}

      {/* Como Chegar */}
      {latitude && longitude && (
        <Button
          onClick={openMaps}
          size="lg"
          variant="outline"
          className="h-14 gap-2 border-2 hover:bg-blue-600 hover:text-white font-semibold transition-all"
        >
          <Navigation className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-70">Como</span>
            <span>Chegar</span>
          </div>
        </Button>
      )}

      {/* Ver Produtos */}
      {hasProducts && (
        <Button
          onClick={scrollToProducts}
          size="lg"
          variant="outline"
          className="h-14 gap-2 border-2 hover:bg-purple-600 hover:text-white font-semibold transition-all"
        >
          <ShoppingBag className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-70">Ver</span>
            <span>Produtos</span>
          </div>
        </Button>
      )}

      {/* Agendar Horário (apenas para clientes, não para o dono) */}
      {hasServices && businessId && !isOwner && (
        <BookingButton
          businessId={businessId}
          businessName={businessName}
          businessPhone={phone}
          businessWhatsApp={whatsapp}
          services={services}
          variant="outline"
          className="h-14 gap-2 border-2 hover:bg-purple-600 hover:text-white font-semibold transition-all"
        />
      )}

      {/* Ver Serviços (quando não tem agendamento) */}
      {hasServices && !hasProducts && !businessId && (
        <Button
          onClick={scrollToServices}
          size="lg"
          variant="outline"
          className="h-14 gap-2 border-2 hover:bg-purple-600 hover:text-white font-semibold transition-all"
        >
          <Calendar className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-70">Ver</span>
            <span>Serviços</span>
          </div>
        </Button>
      )}
    </div>
  );
}
