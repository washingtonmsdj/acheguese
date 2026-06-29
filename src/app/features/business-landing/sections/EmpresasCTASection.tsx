/**
 * EmpresasCTASection
 * 
 * Seção de CTA final (Call-to-Action)
 */

import type { EmpresasCTASectionProps } from "./types";
import { Button } from "@/shared/components/ui/button";

export function EmpresasCTASection({ navigate }: EmpresasCTASectionProps) {
  return (
    <section className="w-full bg-gradient-to-br from-primary/20 via-card to-accent/20 border-t border-border">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-heading">
          Cadastre Sua Empresa Gratuitamente
        </h2>
        <p className="text-muted-foreground text-sm md:text-base mb-6 max-w-lg mx-auto">
          Conecte-se com milhares de clientes no seu bairro. Cadastro rápido, fácil e sem custo.
        </p>
        <Button
          onClick={() => navigate("/empresas/cadastrar")}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm md:text-base h-11 px-8 rounded-lg shadow-lg"
        >
          Cadastrar Minha Empresa
        </Button>
      </div>
    </section>
  );
}
