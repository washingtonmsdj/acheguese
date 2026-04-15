 
import React from "react";
/**
 * Navegação da página standalone
 * Header fixo com logo e menu da business
 */

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import type { Business } from "@/shared/types/business";

interface StandaloneNavProps {
  business: Business;
}

export default function StandaloneNav({ business }: StandaloneNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={business.logo_url} alt={business.name} />
              <AvatarFallback>{business.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-semibold text-lg hidden sm:inline">
              {business.name}
            </span>
          </div>

          {/* Menu Desktop */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection("hero")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Sobre
            </button>
            <button
              onClick={() => scrollToSection("products")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {business.category === "restaurante" ? "Cardápio" : "Produtos"}
            </button>
            <button
              onClick={() => scrollToSection("gallery")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Galeria
            </button>
            <button
              onClick={() => scrollToSection("location")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Localização
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Contato
            </button>
          </div>

          {/* Botão Menu Mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Menu Mobile */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <button
              onClick={() => scrollToSection("hero")}
              className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection("about")}
              className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
            >
              Sobre
            </button>
            <button
              onClick={() => scrollToSection("products")}
              className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
            >
              {business.category === "restaurante" ? "Cardápio" : "Produtos"}
            </button>
            <button
              onClick={() => scrollToSection("gallery")}
              className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
            >
              Galeria
            </button>
            <button
              onClick={() => scrollToSection("location")}
              className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
            >
              Localização
            </button>
            <button
              onClick={() => scrollToSection("contact")}
              className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
            >
              Contato
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
