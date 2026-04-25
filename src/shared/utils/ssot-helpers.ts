// SSOT Helper Functions - Gerado automaticamente
// Data: 2026-03-15T01:22:15.615Z

import { useState } from "react";
import {
  USER_ROLE,
  PAYMENT_METHOD,
  DRIVER_STATUS,
  VERIFICATION_STATUS,
  ALERT_STATUS,
  POST_STATUS,
  PAYMENT_STATUS,
  REPORT_STATUS,
  SUBSCRIPTION_PLAN,
} from "@/shared/types/constants";
import { RIDE_STATUS } from "@/modules/mobility/constants";
/**
 * Validadores SSOT - Type-safe validation functions
 */

export const SSOTValidators = {
  // User Role
  isValidUserRole: (
    role: string,
  ): role is (typeof USER_ROLE)[keyof typeof USER_ROLE] => {
    return Object.values(USER_ROLE).includes(role as any);
  },

  // Ride Status
  isValidRideStatus: (
    status: string,
  ): status is (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS] => {
    return Object.values(RIDE_STATUS).includes(status as any);
  },

  // Payment Method
  isValidPaymentMethod: (
    method: string,
  ): method is (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD] => {
    return Object.values(PAYMENT_METHOD).includes(method as any);
  },

  // Driver Status
  isValidDriverStatus: (
    status: string,
  ): status is (typeof DRIVER_STATUS)[keyof typeof DRIVER_STATUS] => {
    return Object.values(DRIVER_STATUS).includes(status as any);
  },

  // Verification Status
  isValidVerificationStatus: (
    status: string,
  ): status is (typeof VERIFICATION_STATUS)[keyof typeof VERIFICATION_STATUS] => {
    return Object.values(VERIFICATION_STATUS).includes(status as any);
  },

  // Alert Status
  isValidAlertStatus: (
    status: string,
  ): status is (typeof ALERT_STATUS)[keyof typeof ALERT_STATUS] => {
    return Object.values(ALERT_STATUS).includes(status as any);
  },

  // Post Status
  isValidPostStatus: (
    status: string,
  ): status is (typeof POST_STATUS)[keyof typeof POST_STATUS] => {
    return Object.values(POST_STATUS).includes(status as any);
  },

  // Payment Status
  isValidPaymentStatus: (
    status: string,
  ): status is (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS] => {
    return Object.values(PAYMENT_STATUS).includes(status as any);
  },

  // Report Status
  isValidReportStatus: (
    status: string,
  ): status is (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS] => {
    return Object.values(REPORT_STATUS).includes(status as any);
  },

  // Subscription Plan
  isValidSubscriptionPlan: (
    plan: string,
  ): plan is (typeof SUBSCRIPTION_PLAN)[keyof typeof SUBSCRIPTION_PLAN] => {
    return Object.values(SUBSCRIPTION_PLAN).includes(plan as any);
  },
};

/**
 * SSOT Guards - Runtime type guards with error messages
 */
export const SSOTGuards = {
  assertValidUserRole: (
    role: string,
  ): asserts role is (typeof USER_ROLE)[keyof typeof USER_ROLE] => {
    if (!SSOTValidators.isValidUserRole(role)) {
      throw new Error(
        `Invalid user role: ${role}. Expected: ${Object.values(USER_ROLE).join(", ")}`,
      );
    }
  },

  assertValidRideStatus: (
    status: string,
  ): asserts status is (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS] => {
    if (!SSOTValidators.isValidRideStatus(status)) {
      throw new Error(
        `Invalid ride status: ${status}. Expected: ${Object.values(RIDE_STATUS).join(", ")}`,
      );
    }
  },

  assertValidPaymentMethod: (
    method: string,
  ): asserts method is (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD] => {
    if (!SSOTValidators.isValidPaymentMethod(method)) {
      throw new Error(
        `Invalid payment method: ${method}. Expected: ${Object.values(PAYMENT_METHOD).join(", ")}`,
      );
    }
  },
};

/**
 * SSOT Utilities - Helper utilities for working with SSOT values
 */
export const SSOTUtils = {
  // Get all possible values for a constant
  getAllUserRoles: () => Object.values(USER_ROLE),
  getAllRideStatuses: () => Object.values(RIDE_STATUS),
  getAllPaymentMethods: () => Object.values(PAYMENT_METHOD),
  getAllDriverStatuses: () => Object.values(DRIVER_STATUS),
  getAllVerificationStatuses: () => Object.values(VERIFICATION_STATUS),
  getAllAlertStatuses: () => Object.values(ALERT_STATUS),
  getAllPostStatuses: () => Object.values(POST_STATUS),
  getAllPaymentStatuses: () => Object.values(PAYMENT_STATUS),
  getAllReportStatuses: () => Object.values(REPORT_STATUS),
  getAllSubscriptionPlans: () => Object.values(SUBSCRIPTION_PLAN),

  // Get human-readable labels
  getUserRoleLabel: (role: string): string => {
    const labels = {
      [USER_ROLE.ADMIN]: "Administrador",
      [USER_ROLE.USER]: "Usuário",
      [USER_ROLE.DRIVER]: "Motorista",
      [USER_ROLE.PASSENGER]: "Passageiro",
    };
    return labels[role as keyof typeof labels] || role;
  },

  getRideStatusLabel: (status: string): string => {
    const labels = {
      [RIDE_STATUS.PENDING]: "Pendente",
      [RIDE_STATUS.ACCEPTED]: "Aceita",
      [RIDE_STATUS.DRIVER_ASSIGNED]: "Motorista Designado",
      [RIDE_STATUS.DRIVER_ON_THE_WAY]: "Motorista a Caminho",
      [RIDE_STATUS.DRIVER_ARRIVED]: "Motorista Chegou",
      [RIDE_STATUS.PASSENGER_ON_BOARD]: "Passageiro a Bordo",
      [RIDE_STATUS.IN_PROGRESS]: "Em Andamento",
      [RIDE_STATUS.COMPLETED]: "Concluída",
      [RIDE_STATUS.CANCELLED]: "Cancelada",
    };
    return labels[status as keyof typeof labels] || status;
  },

  getPaymentMethodLabel: (method: string): string => {
    const labels = {
      [PAYMENT_METHOD.PIX]: "PIX",
      [PAYMENT_METHOD.DINHEIRO]: "Dinheiro",
      [PAYMENT_METHOD.CARTAO]: "Cartão",
      [PAYMENT_METHOD.CREDITO]: "Crédito",
      [PAYMENT_METHOD.DEBITO]: "Débito",
    };
    return labels[method as keyof typeof labels] || method;
  },
};

/**
 * SSOT React Hooks - Custom hooks for React components
 */
export const useSSOTValidation = () => {
  return {
    validators: SSOTValidators,
    guards: SSOTGuards,
    utils: SSOTUtils,
  };
};
