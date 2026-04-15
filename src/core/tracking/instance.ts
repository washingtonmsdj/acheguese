/**
 * Core Tracking - Singleton Instance
 *
 * Instância canônica do TrackingService.
 * Use esta instância em toda a aplicação.
 */

import { TrackingService } from './services/TrackingService';

export const trackingService = TrackingService.getInstance();