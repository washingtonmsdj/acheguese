/**
 * DriverService - public API
 *
 * Re-export canonical implementation from DriverService.impl.
 */

export { DriverService, driverService } from './DriverService.impl';
export type {
  DriverProfile,
  DriverStats,
  WeeklyEarning,
} from './DriverService.impl';

