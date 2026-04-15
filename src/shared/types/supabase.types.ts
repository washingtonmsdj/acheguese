/**
 * 🔧 TIPOS SUPABASE - NÍVEL AAA
 *
 * Tipos TypeScript para queries e operações do Supabase
 * Substitui uso de 'any' por tipos adequados
 *
 * @version 1.0.0
 * @author Kiro AI
 */

/**
 * Resposta genérica do Supabase
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

/**
 * Resposta com array
 */
export interface SupabaseArrayResponse<T> {
  data: T[] | null;
  error: SupabaseError | null;
}

/**
 * Erro do Supabase
 */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Metadata flexível mas tipado
 */
export interface FlexibleMetadata {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | undefined
    | FlexibleMetadata;
}

/**
 * Device Info para tracking
 */
export interface DeviceInfo {
  userAgent?: string;
  platform?: string;
  language?: string;
  screenResolution?: string;
  timezone?: string;
}

/**
 * Notification Data
 */
export interface NotificationData {
  type?: string;
  targetId?: string;
  targetType?: string;
  actionUrl?: string;
  imageUrl?: string;
  metadata?: FlexibleMetadata;
}

/**
 * Horário de Funcionamento
 */
export interface BusinessHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  open: string; // HH:mm
  close: string; // HH:mm
  closed?: boolean;
}

/**
 * Location Data
 */
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp?: string;
}

/**
 * Filtros de Query
 */
export interface QueryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  status?: string;
  category?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

/**
 * Resultado Paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  totalPages: number;
}

/**
 * RPC Function Response
 */
export interface RpcResponse<T = unknown> {
  data: T | null;
  error: SupabaseError | null;
}

/**
 * Upload Response
 */
export interface UploadResponse {
  path: string;
  publicUrl: string;
  error: SupabaseError | null;
}

/**
 * Batch Operation Result
 */
export interface BatchOperationResult<T> {
  success: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  total: number;
  successCount: number;
  failedCount: number;
}

/**
 * Type Guards
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as SupabaseError).message === "string"
  );
}

export function hasData<T>(
  response: SupabaseResponse<T>,
): response is { data: T; error: null } {
  return response.data !== null && response.error === null;
}

export function hasError<T>(
  response: SupabaseResponse<T>,
): response is { data: null; error: SupabaseError } {
  return response.error !== null;
}
