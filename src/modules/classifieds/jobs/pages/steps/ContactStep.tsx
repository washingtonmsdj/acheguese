import React from "react";
import { AlertCircle, ExternalLink, Mail, Phone } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { FormField } from "./shared";

export interface ContactStepProps {
  errors: Record<string, string>;
  contatoEmail: string;
  setContatoEmail: (value: string) => void;
  contatoWhatsapp: string;
  setContatoWhatsapp: (value: string) => void;
  contatoTelefone: string;
  setContatoTelefone: (value: string) => void;
  linkExterno: string;
  setLinkExterno: (value: string) => void;
}

export function ContactStep({
  errors,
  contatoEmail,
  setContatoEmail,
  contatoWhatsapp,
  setContatoWhatsapp,
  contatoTelefone,
  setContatoTelefone,
  linkExterno,
  setLinkExterno,
}: ContactStepProps) {
  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Informe pelo menos um canal para que candidatos entrem em contato.
      </p>

      {errors.contact && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive">{errors.contact}</p>
        </div>
      )}

      <FormField label="Email">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="email"
            placeholder="rh@empresa.com"
            value={contatoEmail}
            onChange={(e) => setContatoEmail(e.target.value)}
            className="pl-10 h-12 text-sm rounded-xl"
          />
        </div>
      </FormField>

      <FormField label="WhatsApp">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="71999990001"
            value={contatoWhatsapp}
            onChange={(e) => setContatoWhatsapp(e.target.value)}
            className="pl-10 h-12 text-sm rounded-xl"
          />
        </div>
      </FormField>

      <FormField label="Telefone">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="7133001234"
            value={contatoTelefone}
            onChange={(e) => setContatoTelefone(e.target.value)}
            className="pl-10 h-12 text-sm rounded-xl"
          />
        </div>
      </FormField>

      <FormField label="Link externo" optional>
        <div className="relative">
          <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="https://empresa.com/vagas"
            value={linkExterno}
            onChange={(e) => setLinkExterno(e.target.value)}
            className="pl-10 h-12 text-sm rounded-xl"
          />
        </div>
      </FormField>
    </div>
  );
}
