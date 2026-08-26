/**
 * Compatibility bridge for module-local imports.
 *
 * Persistence and engagement rules are owned by src/core/community-events.
 * Keep this file as a one-way re-export until module callers converge on the
 * canonical core contract.
 */
export * from "@/core/community-events/services/EventEngagementService";
