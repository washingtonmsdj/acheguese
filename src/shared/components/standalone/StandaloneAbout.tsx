 
import React from "react";
/**
 * Seção Sobre da página standalone
 * Informações detalhadas da business
 */

import { Clock, CreditCard, Star, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import type { Business as BizData } from "@/shared/types/business";

interface StandaloneAboutProps {
  business: BizData;
}

export default function StandaloneAbout({ business }: StandaloneAboutProps) {
  const standaloneBusiness = business as BizData & {
    especialidades?: string[];
    facilidades?: string[];
    ano_fundacao?: string | number;
  };

  return (
    <section id="about" className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Título */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">Sobre Nós</h2>
            <p className="text-muted-foreground">
              Conheça mais sobre {business.name}
            </p>
          </div>

          {/* Descrição Completa */}
          {business.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-lg leading-relaxed">
                  {business.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Grid de Informações */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Horário de Funcionamento */}
            {business.schedule && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Horário de Funcionamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {business.schedule
                      .replace(/\\n/g, "\n") // Converter \\n literal para \n
                      .split("\n")
                      .filter((linha: string) => linha.trim())
                      .map((linha: string, idx: number) => (
                        <p key={idx} className="text-sm leading-relaxed">
                          {linha.trim()}
                        </p>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formas de Pagamento */}
            {business.formas_pagamento &&
              business.formas_pagamento.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Formas de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {business.formas_pagamento.map(
                        (forma: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {forma}
                          </Badge>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Especialidades */}
            {standaloneBusiness.especialidades && standaloneBusiness.especialidades.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Especialidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {standaloneBusiness.especialidades.map(
                      (esp: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {esp}
                        </Badge>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Facilidades */}
            {standaloneBusiness.facilidades && standaloneBusiness.facilidades.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Facilidades
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {standaloneBusiness.facilidades.map((fac: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {fac}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Ano de Fundação */}
          {standaloneBusiness.ano_fundacao && (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Desde{" "}
                  <span className="font-bold text-foreground text-xl">
                    {standaloneBusiness.ano_fundacao}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
