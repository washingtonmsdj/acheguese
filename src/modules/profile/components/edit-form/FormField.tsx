import React from "react";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "textarea";
  maxLength?: number;
  rows?: number;
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  maxLength,
  rows = 4,
}: FormFieldProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      {type === "textarea" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="resize-none"
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      )}
    </div>
  );
}
