/**
 * DriverCard
 * 
 * Card de motorista na lista
 */

import { Card, CardContent } from "@/shared/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  MapPin,
  Calendar,
  CarFront,
  Star,
  Eye,
  AlertTriangle,
  History,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import type { DriverCardProps } from "../../sections/types";
import {
  formatDate,
  getDriverInitials,
  isDriverPending,
  isDriverSuspended,
  isDriverApproved,
} from "../../utils";

export function DriverCard({ driver, actions }: DriverCardProps) {
  const isPending = isDriverPending(driver);
  const isSuspended = isDriverSuspended(driver);
  const isApproved = isDriverApproved(driver);

  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all",
        isPending && driver.total_rides === 0 && "border-yellow-500/30 bg-yellow-500/5"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-14 w-14 border-2 border-background">
            <AvatarImage src={driver.avatar_url} />
            <AvatarFallback className="bg-teal-500/10 text-teal-600 font-bold">
              {getDriverInitials(driver.name ?? "?")}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">
                    {driver.name ?? "Nome não informado"}
                  </h3>
                  {isSuspended ? (
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                      <XCircle className="w-3 h-3 mr-1" /> Suspenso
                    </Badge>
                  ) : isApproved ? (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <Shield className="w-3 h-3 mr-1" /> Verificado
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      <Clock className="w-3 h-3 mr-1" /> Pendente
                    </Badge>
                  )}
                  {driver.is_online && !isSuspended && (
                    <Badge className="bg-teal-500/10 text-teal-600 border-teal-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse mr-1" />
                      Online
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  {driver.neighborhood && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {driver.neighborhood ?? "N/A"}, {driver.city ?? "N/A"}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(driver.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 mb-3">
              <CarFront className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {driver.vehicle_model ?? "Modelo não informado"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Placa: {driver.vehicle_plate ?? "N/A"}
                </p>
              </div>
              {driver.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold">
                    {driver.rating.toFixed(1)}
                  </span>
                </div>
              )}
              {driver.total_rides > 0 && (
                <span className="text-xs text-muted-foreground">
                  {driver.total_rides} corridas
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {isPending && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" onClick={() => actions.onReview(driver)}>
                      <Eye className="h-4 w-4 mr-1" /> Revisar Cadastro
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Analisar documentos e aprovar/rejeitar o cadastro do motorista</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isSuspended ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:bg-green-500/10"
                        onClick={() => actions.onReactivate(driver)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Reativar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remover suspensão e permitir que o motorista volte a aceitar corridas</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => actions.onViewHistory(driver.profile_id)}
                      >
                        <History className="h-4 w-4 mr-1" /> Histórico
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ver histórico completo de suspensões e reativações</p>
                    </TooltipContent>
                  </Tooltip>
                </>
              ) : (
                isApproved && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => actions.onToggleOnline(driver)}
                        >
                          {driver.is_online ? "Colocar Offline" : "Colocar Online"}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {driver.is_online
                            ? "Desativar motorista temporariamente - ele não receberá novas corridas"
                            : "Ativar motorista para receber corridas"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => actions.onSuspend(driver)}
                        >
                          <AlertTriangle className="h-4 w-4 mr-1" /> Suspender
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Suspender motorista permanentemente - bloqueia acesso e impede aceitar corridas</p>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
