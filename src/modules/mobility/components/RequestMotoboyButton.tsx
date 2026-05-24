/**
 * RequestMotoboyButton
 *
 * CTA para solicitar motoboy usando autorizacao centralizada.
 * 
 * FASE 6: Migrado para SSOT
 * - Removida resolução local de planTier
 * - Autorização resolve entitlement internamente via EntitlementResolver
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bike, AlertCircle } from "lucide-react";
import { useAuth } from "@/core/auth";
import { useLocationContext } from "@/core/location";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import { MotoboyAuthorizationService } from "../services/MotoboyAuthorizationService";
import type { SourceType } from "../constants";
import { CreateDeliveryModal } from "./CreateDeliveryModal";

interface RequestMotoboyButtonProps {
  sourceType: SourceType;
  sourceId: string;
  businessName?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

export function RequestMotoboyButton({
  sourceType,
  sourceId,
  businessName,
  variant = "default",
  size = "default",
  className,
}: RequestMotoboyButtonProps) {
  const { user } = useAuth();
  const { activeLocation } = useLocationContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: permission, isLoading } = useQuery({
    queryKey: ["motoboy-permission", sourceType, sourceId, activeLocation?.id ?? null, user?.id ?? null],
    queryFn: async (): Promise<PermissionResult> => {
      if (!user?.id) {
        return {
          allowed: false,
          reason: "Faca login para solicitar motoboy.",
        };
      }

      if (sourceType !== "passenger" && !sourceId) {
        return {
          allowed: false,
          reason: "Origem da solicitacao invalida.",
        };
      }

      let locationId = activeLocation?.id ?? null;

      if (!locationId && sourceId) {
        const { MotoboySourceResolverService } = await import("../services/MotoboySourceResolverService");
        locationId = (await MotoboySourceResolverService.resolveLocationIdFromSource(sourceId)) ?? null;
      }

      if (!locationId) {
        return {
          allowed: false,
          reason: "Defina um territorio ativo para solicitar motoboy.",
        };
      }

      // FASE 6: Removida resolução local de planTier
      // Autorização resolve entitlement internamente via EntitlementResolver
      const auth = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType,
        sourceId,
        locationId,
        userId: user.id,
      });

      return {
        allowed: auth.allowed,
        reason: auth.reason,
      };
    },
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Bike className="mr-2 h-4 w-4" />
        Verificando...
      </Button>
    );
  }

  if (!permission?.allowed) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {permission?.reason || "Solicitacao de motoboy indisponivel para este perfil."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setIsModalOpen(true)}>
        <Bike className="mr-2 h-4 w-4" />
        Solicitar Motoboy
      </Button>

      <CreateDeliveryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        sourceType={sourceType}
        sourceId={sourceId}
        businessName={businessName}
      />
    </>
  );
}
