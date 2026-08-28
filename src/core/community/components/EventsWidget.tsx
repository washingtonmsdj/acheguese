import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { isLaunchSurfaceEnabled } from "@/app/config/launchScope";
import { Button } from "@/shared/components/ui/button";
import { useAppUrls } from "@/core/routing/hooks";

export function EventsWidget() {
  const navigate = useNavigate();
  const appUrls = useAppUrls();

  if (!isLaunchSurfaceEnabled("events")) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Proximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground text-center py-4">
          Nenhum evento proximo
        </div>

        <Button
          onClick={() => navigate(appUrls.community.events)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          Ver Todos os Eventos
        </Button>
      </CardContent>
    </Card>
  );
}
