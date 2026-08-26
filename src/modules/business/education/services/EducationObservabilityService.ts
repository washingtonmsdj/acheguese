/**
 * Compatibility bridge for the Education module.
 *
 * Observability persistence is owned by core. Keep this one-way re-export
 * until all callers import the canonical owner directly.
 */
export * from "@/core/education/services/EducationObservabilityService";
