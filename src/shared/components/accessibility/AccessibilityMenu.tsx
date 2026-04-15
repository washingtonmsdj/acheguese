import React, { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Accessibility, Type, Contrast, Eye } from "lucide-react";
import { useAccessibility } from "./AccessibilityProvider";

export function AccessibilityMenu() {
  const {
    isHighContrast,
    toggleHighContrast,
    fontSize,
    setFontSize,
    announceToScreenReader,
  } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);

  const handleMenuToggle = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      announceToScreenReader("Menu de acessibilidade aberto");
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleMenuToggle}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Menu de acessibilidade"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <Accessibility className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Acessibilidade</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-56"
        role="menu"
        aria-label="Opções de acessibilidade"
      >
        <DropdownMenuLabel>
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" aria-hidden="true" />
            Opções Visuais
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={toggleHighContrast}
          className="flex items-center gap-2 cursor-pointer"
          role="menuitem"
          aria-pressed={isHighContrast}
        >
          <Contrast className="h-4 w-4" aria-hidden="true" />
          <span>{isHighContrast ? "Desativar" : "Ativar"} Alto Contraste</span>
          {isHighContrast && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground px-1 rounded">
              Ativo
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuLabel className="mt-2">
          <span className="flex items-center gap-2">
            <Type className="h-4 w-4" aria-hidden="true" />
            Tamanho da Fonte
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => setFontSize("normal")}
          className="flex items-center gap-2 cursor-pointer"
          role="menuitem"
          aria-pressed={fontSize === "normal"}
        >
          <span className="text-sm">Normal</span>
          {fontSize === "normal" && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground px-1 rounded">
              Ativo
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setFontSize("large")}
          className="flex items-center gap-2 cursor-pointer"
          role="menuitem"
          aria-pressed={fontSize === "large"}
        >
          <span className="text-base">Grande</span>
          {fontSize === "large" && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground px-1 rounded">
              Ativo
            </span>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setFontSize("extra-large")}
          className="flex items-center gap-2 cursor-pointer"
          role="menuitem"
          aria-pressed={fontSize === "extra-large"}
        >
          <span className="text-lg">Extra Grande</span>
          {fontSize === "extra-large" && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground px-1 rounded">
              Ativo
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
