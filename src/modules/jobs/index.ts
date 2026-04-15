/**
 * 💼 JOBS MODULE - Barrel Export
 *
 * Public API for the jobs module
 * SSOT v2.0 - Refatoração completa
 */

// Services
export { jobService } from "./services/JobService";
export type { NeighborhoodWithJobCount, JobFilterInput } from "./services/JobService";

// Hooks
export { useNeighborhoodsWithJobs } from "./hooks/useNeighborhoodsWithJobs";
export { useJobFilters } from "./hooks/useJobFilters";

// Types
export type {
  Job,
  JobContractType,
  JobModality,
  JobStatus,
} from "./types/job.types";

export { JOB_CATEGORIES } from "./types/job.types";
