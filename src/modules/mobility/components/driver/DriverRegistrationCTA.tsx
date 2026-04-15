import React from "react";
import {
  Car,
  DollarSign,
  Clock,
  Users,
  Star,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/utils/cn";

interface DriverRegistrationCTAProps {
  onRegister: () => void;
  onGoBack: () => void;
}

export function DriverRegistrationCTA({
  onRegister,
  onGoBack,
}: DriverRegistrationCTAProps) {
  const benefits = [
    {
      icon: DollarSign,
      label: "Ganhe dinheiro",
      desc: "Receba direto do passageiro",
      bgClass: "bg-success/10",
      iconClass: "text-success",
    },
    {
      icon: Clock,
      label: "Horário flexível",
      desc: "Trabalhe quando quiser",
      bgClass: "bg-primary/10",
      iconClass: "text-primary",
    },
    {
      icon: Users,
      label: "Comunidade",
      desc: "Ajude seus vizinhos",
      bgClass: "bg-accent/10",
      iconClass: "text-accent",
    },
  ];

  const testimonials = [
    {
      name: "Roberto S.",
      text: "Faço em média R$ 80/dia só com corridas do bairro.",
      rides: 156,
    },
    {
      name: "Marcos O.",
      text: "Horário flexível, trabalho quando quero.",
      rides: 89,
    },
  ];

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-background">
      <div className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-xl border-border">
        <div className="max-w-5xl mx-auto h-14 px-4 flex items-center gap-3">
          <button
            onClick={onGoBack}
            className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Car className="h-5 w-5 text-primary" />
          <h1 className="text-base font-bold text-foreground">
            Painel do Motorista
          </h1>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
          <Car className="h-10 w-10 md:h-12 md:w-12 text-primary" />
        </div>

        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-3">
          Seja um Motorista
        </h1>
        <p className="text-muted-foreground max-w-md mb-6 text-sm">
          Cadastre-se como motorista e ganhe dinheiro levando vizinhos do
          bairro. Pagamento direto via Pix ou dinheiro.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 w-full max-w-lg">
          {benefits.map((item) => (
            <Card
              key={item.label}
              className="bg-card border-border p-4 text-center"
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2",
                  item.bgClass,
                )}
              >
                <item.icon className={cn("h-5 w-5", item.iconClass)} />
              </div>
              <p className="text-xs font-semibold text-foreground">
                {item.label}
              </p>
              <p className="text-[0.65rem] text-muted-foreground mt-0.5">
                {item.desc}
              </p>
            </Card>
          ))}
        </div>

        <Card className="w-full max-w-lg mb-8 bg-card border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-warning fill-warning" />
            <span className="text-xs font-semibold text-foreground">
              O que dizem nossos motoristas
            </span>
          </div>
          <div className="space-y-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-xs font-bold">
                    {(t.name ?? '?').charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {t.name}
                    </span>
                    <span className="text-[0.55rem] text-muted-foreground">
                      {t.rides} corridas
                    </span>
                  </div>
                  <p className="text-[0.65rem] text-muted-foreground mt-0.5 italic">
                    "{t.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button
          onClick={onRegister}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-12 px-8 shadow-lg shadow-primary/20 text-base"
        >
          <Shield className="h-5 w-5 mr-2" /> Cadastrar como Motorista
        </Button>
      </div>
    </div>
  );
}
