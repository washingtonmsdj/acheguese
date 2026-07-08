import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

interface CommentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const CommentInput = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  disabled = false,
  placeholder = "Escreva um comentario...",
}: CommentInputProps) => {
  const isDisabled = disabled || isSubmitting;

  return (
    <div
      className="flex-shrink-0 p-4 border-t"
      style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
    >
      <div className="flex gap-2">
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="flex-1 min-h-[60px] max-h-[120px] resize-none border-white/10"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            color: "#FFFFFF",
          }}
          disabled={isDisabled}
        />
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || isDisabled}
          className="h-[60px] px-4 flex-shrink-0"
          style={{
            background: value.trim() && !isDisabled
              ? "linear-gradient(135deg, #4FD1C5 0%, #06B6D4 100%)"
              : "rgba(255, 255, 255, 0.1)",
            color: "#FFFFFF",
          }}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
