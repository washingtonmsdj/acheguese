/**
 * RequestMotoboyButton - CTA para solicitar motoboy.
 *
 * Usa autorizacao centralizada (MotoboyAuthorizationService) para
 * evitar drift de regras em componentes.
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bike, AlertCircle } from "lucide-react";
import { useAuth } from "@/core/auth";
import { useLocationContext } from "@/core/location";
import { supabase } from "@/integrations/supabase";
import { logger } from "@/shared/utils/logger";
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

const supabaseAny = supabase as any;

async function resolvePlanTier(sourceType: SourceType, sourceId: string): Promise<string | undefined> {
  if (sourceType === "business") {
    const { data, error } = await supabaseAny
      .from("business_subscriptions")
      .select("plan_tier")
      .eq("business_id", sourceId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn("RequestMotoboyButton.resolvePlanTier.business", error);
      return undefined;
    }

    return data?.plan_tier;
  }

  if (sourceType === "gastronomy") {
    const { data, error } = await supabaseAny
      .from("gastronomy_subscriptions")
      .select("plan_tier")
      .eq("business_id", sourceId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logger.warn("RequestMotoboyButton.resolvePlanTier.gastronomy", error);
      return undefined;
    }

    return data?.plan_tier;
  }

  return undefined;
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
          reason: "Faça login para solicitar motoboy.",
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
        const { data: sourceProfile, error: sourceError } = await supabaseAny
          .from("profiles")
          .select("location_id")
          .eq("id", sourceId)
          .maybeSingle();

        if (sourceError) {
          logger.warn("RequestMotoboyButton.resolveLocation.profile", sourceError);
        }

        locationId = sourceProfile?.location_id ?? null;
      }

      if (!locationId) {
        return {
          allowed: false,
          reason: "Defina um territorio ativo para solicitar motoboy.",
        };
      }

      const planTier = sourceId ? await resolvePlanTier(sourceType, sourceId) : undefined;

      const auth = await MotoboyAuthorizationService.canRequestDelivery({
        sourceType,
        sourceId,
        locationId,
        planTier,
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sourceType={sourceType}
        sourceId={sourceId}
        businessName={businessName}
      />
    </>
  );
}
