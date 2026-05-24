/**
 * SocialMediaEditor
 * 
 * Editor de redes sociais da empresa.
 * Usa SSOT de @/core/business/constants
 */

import { useState } from "react";
import { ExternalLink, Check, Lightbulb, X } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";
import { SOCIAL_PLATFORMS, validateSocialUsername, getSocialUrl } from "@/core/business/constants";

interface SocialMedia {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
}

interface SocialMediaEditorProps {
  social: SocialMedia;
  onChange: (social: SocialMedia) => void;
  className?: string;
}

export function SocialMediaEditor({
  social,
  onChange,
  className,
}: SocialMediaEditorProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (platform: string, value: string) => {
    const platformConfig = SOCIAL_PLATFORMS.find((p) => p.id === platform);
    if (!platformConfig) return;

    // Limpar valor (remover espaços, @ inicial, etc)
    let cleanValue = value.trim();
    if (cleanValue.startsWith("@")) {
      cleanValue = cleanValue.substring(1);
    }

    // Validar formato usando helper do SSOT
    if (cleanValue && !validateSocialUsername(platform, cleanValue)) {
      setValidationErrors({
        ...validationErrors,
        [platform]: "Formato inválido",
      });
    } else {
      const newErrors = Object.fromEntries(
        Object.entries(validationErrors).filter(([key]) => key !== platform),
      );
      setValidationErrors(newErrors);
    }

    onChange({
      ...social,
      [platform]: cleanValue || undefined,
    });
  };

  const getFullUrl = (platform: string, username?: string) => {
    return getSocialUrl(platform, username || "");
  };

  const isValid = (platform: string, value?: string) => {
    if (!value) return null; // Não validar se vazio
    return validateSocialUsername(platform, value);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Redes Sociais</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Adicione os perfis da sua empresa nas redes sociais
        </p>
      </div>

      {/* Social platforms */}
      <div className="space-y-3">
        {SOCIAL_PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const value = social[platform.id as keyof SocialMedia] || "";
          const hasError = validationErrors[platform.id];
          const validationStatus = isValid(platform.id, value);
          const fullUrl = getFullUrl(platform.id, value);

          return (
            <div key={platform.id} className="space-y-2">
              {/* Platform label */}
              <div className="flex items-center gap-2">
                <div className={cn("rounded-lg p-1.5 bg-secondary")}>
                  <Icon className={cn("h-4 w-4", platform.color)} />
                </div>
                <label className="text-sm font-medium text-foreground">
                  {platform.label}
                </label>
              </div>

              {/* Input with validation */}
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    {platform.prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {platform.prefix}
                      </span>
                    )}
                    <Input
                      value={value}
                      onChange={(e) => handleChange(platform.id, e.target.value)}
                      placeholder={platform.placeholder}
                      className={cn(
                        platform.prefix && "pl-8",
                        hasError && "border-destructive focus-visible:ring-destructive",
                        validationStatus === true && "border-emerald-500 focus-visible:ring-emerald-500"
                      )}
                    />
                    {/* Validation indicator */}
                    {value && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {validationStatus === true ? (
                          <Check className="h-4 w-4 text-emerald-600" />
                        ) : validationStatus === false ? (
                          <X className="h-4 w-4 text-destructive" />
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Preview link */}
                  {fullUrl && validationStatus === true && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gap-2"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Ver
                      </a>
                    </Button>
                  )}
                </div>

                {/* Error message */}
                {hasError && (
                  <p className="text-xs text-destructive mt-1">
                    {hasError}
                  </p>
                )}

                {/* Full URL preview */}
                {fullUrl && validationStatus === true && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {fullUrl}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="bg-secondary/50 rounded-lg p-3 text-xs text-muted-foreground">
        <p className="mb-1 flex items-center gap-1.5 font-medium">
          <Lightbulb className="h-3.5 w-3.5" />
          Dicas:
        </p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Digite apenas o nome de usuário, sem @ ou URL completa</li>
          <li>Exemplo: para @minhaempresa, digite apenas "minhaempresa"</li>
          <li>Os links serão gerados automaticamente</li>
        </ul>
      </div>

      {/* Summary */}
      {Object.values(social).filter(Boolean).length > 0 && (
        <div className="bg-primary/5 rounded-lg p-3 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">
            {Object.values(social).filter(Boolean).length} {Object.values(social).filter(Boolean).length === 1 ? "rede social" : "redes sociais"}
          </span>{" "}
          configurada{Object.values(social).filter(Boolean).length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
