/**
 * ContactSection
 * 
 * Seção de contato e redes sociais.
 * Inclui: telefone, WhatsApp, email, website, redes sociais.
 */

import { Phone } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { SocialMediaEditor } from "../SocialMediaEditor";

interface ContactInfo {
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
}

interface ContactSectionProps {
  data: ContactInfo;
  onChange: (data: ContactInfo) => void;
  className?: string;
}

export function ContactSection({
  data,
  onChange,
  className,
}: ContactSectionProps) {
  const handleChange = (field: keyof ContactInfo, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleSocialChange = (social: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    tiktok?: string;
    youtube?: string;
  }) => {
    onChange({
      ...data,
      ...social,
    });
  };

  const formatPhone = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Aplica máscara (XX) XXXXX-XXXX
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    }
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          Contato
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Informações de contato e redes sociais
        </p>
      </div>

      <div className="space-y-6">
        {/* Telefone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium">
            Telefone
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone || ""}
            onChange={(e) => handleChange("phone", formatPhone(e.target.value))}
            placeholder="(71) 3333-4444"
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground">
            Telefone fixo ou celular para contato
          </p>
        </div>

        {/* WhatsApp */}
        <div className="space-y-2">
          <Label htmlFor="whatsapp" className="text-sm font-medium">
            WhatsApp
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            value={data.whatsapp || ""}
            onChange={(e) => handleChange("whatsapp", formatPhone(e.target.value))}
            placeholder="(71) 99999-8888"
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground">
            Número com DDD para contato via WhatsApp
          </p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="contato@suaempresa.com.br"
          />
          <p className="text-xs text-muted-foreground">
            Email para contato comercial
          </p>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website" className="text-sm font-medium">
            Website
          </Label>
          <Input
            id="website"
            type="url"
            value={data.website || ""}
            onChange={(e) => handleChange("website", e.target.value)}
            placeholder="https://www.suaempresa.com.br"
          />
          <p className="text-xs text-muted-foreground">
            Site oficial da empresa (opcional)
          </p>
        </div>

        {/* Redes Sociais */}
        <div className="pt-4 border-t border-border">
          <SocialMediaEditor
            social={{
              instagram: data.instagram,
              facebook: data.facebook,
              twitter: data.twitter,
              linkedin: data.linkedin,
              tiktok: data.tiktok,
              youtube: data.youtube,
            }}
            onChange={handleSocialChange}
          />
        </div>
      </div>
    </div>
  );
}
