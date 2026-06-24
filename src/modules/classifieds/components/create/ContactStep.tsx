/**
 * 🔧 STEP: Contato do Vendedor
 */

import React from "react";
import { Phone, MessageCircle } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";

interface ContactStepProps {
  phone: string;
  onPhoneChange: (v: string) => void;
  whatsapp: string;
  onWhatsappChange: (v: string) => void;
  showPhone: boolean;
  onShowPhoneChange: (v: boolean) => void;
}

export function ContactStep({
  phone,
  onPhoneChange,
  whatsapp,
  onWhatsappChange,
  showPhone,
  onShowPhoneChange,
}: ContactStepProps) {
  return (
    <div className="space-y-4">
      {/* Telefone */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Phone className="h-4 w-4 text-primary" />
          Telefone
          <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
        </label>
        <Input
          type="tel"
          placeholder="(71) 99999-9999"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          className="h-12 text-sm rounded-xl"
          maxLength={15}
        />
      </div>

      {/* WhatsApp */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4 text-green-500" />
          WhatsApp
          <span className="text-muted-foreground font-normal text-xs">(recomendado)</span>
        </label>
        <Input
          type="tel"
          placeholder="(71) 99999-9999"
          value={whatsapp}
          onChange={(e) => onWhatsappChange(e.target.value)}
          className="h-12 text-sm rounded-xl"
          maxLength={15}
        />
      </div>

      {/* Toggle exibição */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
        <div>
          <p className="text-sm font-medium text-foreground">Exibir telefone no anúncio</p>
          <p className="text-[10px] text-muted-foreground">Se desativado, contato será somente via WhatsApp</p>
        </div>
        <Switch checked={showPhone} onCheckedChange={onShowPhoneChange} />
      </div>
    </div>
  );
}
