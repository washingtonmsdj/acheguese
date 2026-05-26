/**
 * Internal domain: delivery.
 */

export const DELIVERY_MODE = {
  MERCHANT_OWN_FLEET: "merchant_own_fleet",
  PLATFORM_COURIER_NETWORK: "platform_courier_network",
} as const;

export type DeliveryMode = (typeof DELIVERY_MODE)[keyof typeof DELIVERY_MODE];
