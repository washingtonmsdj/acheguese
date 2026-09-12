import { AdminMotoboyReadService } from "@/core/admin/services/AdminMotoboyReadService";
import type {
  AdminMotoboyDelivery,
  AdminMotoboyStatsRow,
} from "@/core/admin/services/AdminMotoboyReadService";
import { RideOperationalService } from "@/core/mobility/core/RideOperationalService";
import {
  RIDE_STATE,
  RideStateMachine,
  type RideState,
} from "@/core/mobility/core/RideStateMachine";
import { MobilityRpcService } from "@/core/mobility/services/MobilityRpcService";
import { RideOperationalContextReadService } from "@/core/mobility/services/RideOperationalContextReadService";

export type { AdminMotoboyDelivery } from "@/core/admin/services/AdminMotoboyReadService";

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
  static canCancelOperational(status: string): boolean {
    return resolveAdminCancellationTarget(status as RideState) !== null;
  }

  static canRedispatch(status: string): boolean {
    return (
      status === RIDE_STATE.DRIVER_ASSIGNED ||
      status === RIDE_STATE.DRIVER_ACCEPTED
    );
  }

  static async listDeliveries(filters: {
    status?: string;
    sourceType?: string;
  }): Promise<AdminMotoboyDelivery[]> {
    return AdminMotoboyReadService.listDeliveries(filters);
  }

  static async listStatsRows(): Promise<AdminMotoboyStatsRow[]> {
    return AdminMotoboyReadService.listStatsRows();
  }

  /**
   * Intervencao administrativa preservando o motor operacional.
   *
   * O admin nao falsifica mais toda intervencao como
   * `cancelled_by_passenger`. O estado de destino e derivado das transicoes
   * realmente permitidas e a mutacao passa pelo mesmo owner atomico das
   * operacoes normais, incluindo auditoria e efeitos pos-transicao.
   */
  static async cancelOperational(rideId: string, reason: string): Promise<void> {
    const ride = await RideOperationalContextReadService.getLifecycle(rideId);
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
      `Intervencao administrativa: ${reason || "Cancelamento operacional"}`,
    );

    if (!result.success) {
      throw new Error(result.error || "Cancelamento operacional nao aplicado");
    }
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
