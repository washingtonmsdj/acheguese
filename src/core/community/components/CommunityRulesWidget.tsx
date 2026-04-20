import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { BookOpen, ExternalLink } from "lucide-react";
export function CommunityRulesWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Regras da Comunidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="text-xs space-y-2 text-muted-foreground">
          <li>• Seja respeitoso com todos</li>
          <li>• Não compartilhe informações falsas</li>
          <li>• Evite spam e propaganda</li>
          <li>• Mantenha o foco na sua localidade</li>
          <li>• Denuncie conteúdo inadequado</li>
        </ul>
        <Button variant="outline" size="sm" className="w-full text-xs">
          Ver Diretrizes Completas
          <ExternalLink className="w-3 h-3 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
