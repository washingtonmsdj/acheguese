import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import {
  RIDE_STATE,
  RideStateMachine,
  type RideState,
} from "@/core/mobility/core/RideStateMachine";
import { getRideById } from "@/core/mobility/services/mobility.queries";
import { MobilityRpcService } from "@/core/mobility/services/MobilityRpcService";
import { MobilityService } from "@/core/mobility/services/runtime";

export interface AdminMotoboyDelivery {
  id: string;
  status: string;
  source_type: string | null;
  source_id: string | null;
  recipient_name: string | null;
  package_size: string | null;
  suggested_price: number | null;
  created_at: string;
  updated_at: string;
  driver_profile_id: string | null;
  pickup_location_id: string | null;
  delivery_notes: string | null;
  failed_delivery_reason: string | null;
}

const ADMIN_CANCELLATION_TARGETS: readonly RideState[] = [
  RIDE_STATE.CANCELLED_BY_PASSENGER,
  RIDE_STATE.CANCELLED_BY_DRIVER,
  RIDE_STATE.FAILED,
];

function resolveAdminCancellationTarget(currentState: RideState): RideState | null {
  return (
    ADMIN_CANCELLATION_TARGETS.find((targetState) =>
      RideStateMachine.canTransition(currentState, targetState),
    ) ?? null
  );
}

export class AdminMotoboyOperationsService {
  static async listDeliveries(filters: {
    status?: string;
    sourceType?: string;
  }): Promise<AdminMotoboyDelivery[]> {
    const data = await MobilityService.listMotoboyDeliveries(filters);
    return (data as AdminMotoboyDelivery[]) || [];
  }

  static async listStatsRows(): Promise<
    Array<{ status: string; created_at: string; driver_profile_id: string | null }>
  > {
    return MobilityService.listMotoboyStatsRows();
  }

  /**
   * Intervencao administrativa preservando o motor operacional.
   *
   * O admin nao falsifica mais toda intervencao como
   * `cancelled_by_passenger`. O estado de destino e derivado das transicoes
   * realmente permitidas e a mutacao passa pelo mesmo owner atomico das
   * operacoes normais, incluindo auditoria e efeitos pos-transicao.
   */
  static async cancelOperational(rideId: string, reason: string): Promise<boolean> {
    const ride = (await getRideById(rideId)) as { status?: string } | null;
    if (!ride?.status) {
      throw new Error("Entrega nao encontrada");
    }

    const currentState = ride.status as RideState;
    const targetState = resolveAdminCancellationTarget(currentState);
    if (!targetState) {
      throw new Error(
        `Entrega nao pode ser encerrada por cancelamento operacional no estado ${currentState}`,
      );
    }

    const result = await RideOperationalService.transitionTo(
      rideId,
      targetState,
      "system",
      `Admin override: ${reason || "Cancelamento operacional"}`,
    );

    if (!result.success) {
      throw new Error(result.error || "Cancelamento operacional nao aplicado");
    }

    return true;
  }

  /**
   * Reencaminha uma entrega pelo command admin atomico. A autoridade e
   * revalidada no broker; o banco libera o motorista, encerra ofertas pendentes,
   * restaura searching_driver e grava audit na mesma transacao.
   */
  static async redispatch(rideId: string): Promise<void> {
    const result = await MobilityRpcService.adminRedispatch(
      rideId,
      "Reencaminhamento manual pelo admin",
    );

    if (result.success !== true) {
      throw new Error(
        `Redispatch nao aplicado${result.reason ? `: ${result.reason}` : ""}`,
      );
    }
  }
}
