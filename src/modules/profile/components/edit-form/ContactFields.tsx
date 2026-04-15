import React from "react";
import { FormField } from "./FormField";

interface ContactFieldsProps {
  phone: string;
  whatsapp: string;
  onFieldChange: (field: "phone" | "whatsapp", value: string) => void;
}

export function ContactFields({
  phone,
  whatsapp,
  onFieldChange,
}: ContactFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        label="Telefone"
        value={phone}
        onChange={(value) => onFieldChange("phone", value)}
        placeholder="(11) 9999-0000"
      />
      <FormField
        label="WhatsApp"
        value={whatsapp}
        onChange={(value) => onFieldChange("whatsapp", value)}
        placeholder="(11) 99999-0000"
      />
    </div>
  );
}
