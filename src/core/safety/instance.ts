/**
 * Core Safety - Singleton Instance
 *
 * Instância canônica do SafetyService.
 * Use esta instância em toda a aplicação.
 */

import { SafetyService } from './services/SafetyService';

export const safetyService = SafetyService.getInstance();