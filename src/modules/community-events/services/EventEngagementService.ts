/**
 * Compatibility bridge for the legacy Events feature namespace.
 *
 * Persistence and engagement rules are owned by core. Keep this file as a
 * one-way re-export until src/features/events is fully migrated to
 * src/modules/community-events.
 */
export * from "@/core/verticals/events/services/EventEngagementService";
