/**
 * Módulo vertical: delivery
 *
 * Mantém fluxo de negócio de pedidos/preparo/retirada/entrega fora de core.
 */

export * from "./delivery/types";
export * from "./logistics/types";
export * from "./logistics/OrderLogisticsStateMachine";
export * from "./logistics/FinancialStatusStateMachine";
export * from "./constants/queryKeys";

export * from "./proof-of-delivery/types";
export * from "./incidents/types";
export * from "./audit-timeline/types";

export * from "./payment-context/types";
export * from "./payment-context/PaymentContextService";

export * from "./settlement-context/types";
export * from "./settlement-context/SettlementContextService";

export * from "./order/types";
export * from "./order/OrderDraftService";
export * from "./order/adapters/GastronomyOrderOriginAdapter";
export * from "./services/OrderDeliverySSOTService";
export * from "./hooks/useOrderDelivery";

// Explicit re-exports for commonly used types
export type {
  OrderRecord,
  OrderItemRecord,
  CreateOrderInput,
  OrderOperationResult,
} from "./order/types";
