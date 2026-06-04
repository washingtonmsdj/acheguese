/**
 * VALIDATION UTILITIES — Edge Functions
 *
 * Validação de input centralizada para todas as edge functions.
 * Substitui validações ad-hoc espalhadas por cada função.
 *
 * NOTA: Importa getAllSecurityHeaders do SSOT para garantir que
 * todas as respostas de validação incluem os headers de segurança.
 *
 * NOTA: Deno não suporta Zod diretamente via esm.sh em todas as versões.
 * Esta implementação usa validação manual tipada e robusta, compatível
 * com o ambiente Deno das edge functions.
 *
 * Padrão de uso:
 *   const result = validateBody<MyRequest>(body, mySchema);
 *   if (!result.ok) return badRequest(result.errors);
 */

import { getAllSecurityHeaders } from './security.ts';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS BASE
// ─────────────────────────────────────────────────────────────────────────────

export type FieldValidator = (value: unknown) => string | null; // null = válido

export interface FieldSchema {
  required?: boolean;
  validator: FieldValidator;
}

export type Schema<T> = {
  [K in keyof T]: FieldSchema;
};

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  errors: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE DE VALIDAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valida um objeto contra um schema de campos.
 * Retorna { ok, data, errors }.
 *
 * O tipo T não precisa satisfazer Record<string, unknown> — o schema
 * valida a estrutura em runtime. O cast final é seguro porque todos
 * os campos foram validados.
 */
export function validateBody<T>(
  body: unknown,
  schema: Schema<T>,
): ValidationResult<T> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, errors: { _root: "Body must be a JSON object" } };
  }

  const obj = body as Record<string, unknown>;
  const errorEntries: Array<[string, string]> = [];

  for (const [field, def] of Object.entries(schema) as [string, FieldSchema][]) {
    const value = Reflect.get(obj, field);
    const missing = value === undefined || value === null || value === "";

    if (def.required && missing) {
      errorEntries.push([field, `Field '${field}' is required`]);
      continue;
    }

    if (!missing) {
      const error = def.validator(value);
      if (error) {
        errorEntries.push([field, error]);
      }
    }
  }

  const errors = Object.fromEntries(errorEntries) as Record<string, string>;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, data: obj as T, errors: {} };
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATORS REUTILIZÁVEIS
// ─────────────────────────────────────────────────────────────────────────────

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isSafeSlug(value: string): boolean {
  if (!value || value.startsWith('-') || value.endsWith('-') || value.includes('--')) {
    return false;
  }

  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57;
    const isLowerAlpha = code >= 97 && code <= 122;
    const isHyphen = code === 45;

    if (!isDigit && !isLowerAlpha && !isHyphen) {
      return false;
    }
  }

  return true;
}

export const v = {
  /** UUID v4 */
  uuid(): FieldValidator {
    return (val) =>
      typeof val === "string" && UUID_REGEX.test(val)
        ? null
        : "Must be a valid UUID";
  },

  /** Email */
  email(): FieldValidator {
    return (val) =>
      typeof val === "string" && EMAIL_REGEX.test(val) && val.length <= 254
        ? null
        : "Must be a valid email address";
  },

  /** String com tamanho mínimo/máximo */
  string(min = 1, max = 1000): FieldValidator {
    return (val) => {
      if (typeof val !== "string") return "Must be a string";
      if (val.trim().length < min) return `Must be at least ${min} character(s)`;
      if (val.length > max) return `Must be at most ${max} character(s)`;
      return null;
    };
  },

  /** String de enum */
  enum<T extends string>(values: readonly T[]): FieldValidator {
    return (val) =>
      typeof val === "string" && (values as readonly string[]).includes(val)
        ? null
        : `Must be one of: ${values.join(", ")}`;
  },

  /** Inteiro positivo */
  positiveInt(max?: number): FieldValidator {
    return (val) => {
      if (typeof val !== "number" || !Number.isInteger(val) || val < 0) {
        return "Must be a non-negative integer";
      }
      if (max !== undefined && val > max) return `Must be at most ${max}`;
      return null;
    };
  },

  /** Booleano */
  boolean(): FieldValidator {
    return (val) =>
      typeof val === "boolean" ? null : "Must be a boolean";
  },

  /** URL válida */
  url(): FieldValidator {
    return (val) => {
      if (typeof val !== "string") return "Must be a string";
      try {
        new URL(val);
        return null;
      } catch {
        return "Must be a valid URL";
      }
    };
  },

  /**
   * URL de redirecionamento segura.
   *
   * Valida que a URL:
   * 1. É uma URL válida
   * 2. Usa protocolo HTTPS (ou HTTP em desenvolvimento)
   * 3. Pertence a um dos domínios permitidos configurados em ALLOWED_REDIRECT_DOMAINS
   *    ou, se não configurado, ao mesmo host da SUPABASE_URL (fallback seguro).
   *
   * Previne open redirect — atacante não pode passar https://evil.com como
   * successUrl/cancelUrl/returnUrl em operações de billing.
   */
  redirectUrl(): FieldValidator {
    return (val) => {
      if (typeof val !== "string") return "Must be a string";

      let parsed: URL;
      try {
        parsed = new URL(val);
      } catch {
        return "Must be a valid URL";
      }

      // Apenas HTTPS (ou HTTP em desenvolvimento explícito)
      const isDev = Deno.env.get('DENO_ENV') === 'development' || Deno.env.get('NODE_ENV') === 'development';
      if (parsed.protocol !== 'https:' && !(isDev && parsed.protocol === 'http:')) {
        return "Redirect URL must use HTTPS";
      }

      // Verificar domínios permitidos
      const allowedDomainsEnv = Deno.env.get('ALLOWED_REDIRECT_DOMAINS') || '';
      let allowedHosts: string[];

      if (allowedDomainsEnv) {
        allowedHosts = allowedDomainsEnv.split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);
      } else {
        // Fallback: extrair host da SUPABASE_URL (mesmo projeto)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        try {
          allowedHosts = [new URL(supabaseUrl).hostname];
        } catch {
          allowedHosts = [];
        }
        // Em desenvolvimento, permitir localhost
        if (isDev) {
          allowedHosts.push('localhost', '127.0.0.1');
        }
      }

      const requestedHost = parsed.hostname.toLowerCase();
      const isAllowed = allowedHosts.some(
        (allowed) => requestedHost === allowed || requestedHost.endsWith(`.${allowed}`),
      );

      if (!isAllowed) {
        return `Redirect URL domain '${requestedHost}' is not allowed. Configure ALLOWED_REDIRECT_DOMAINS.`;
      }

      return null;
    };
  },

  /** Slug (lowercase, hifens) */
  slug(): FieldValidator {
    return (val) =>
      typeof val === "string" && isSafeSlug(val)
        ? null
        : "Must be a valid slug (lowercase letters, numbers, hyphens)";
  },

  /** Senha com força mínima */
  password(minLength = 12): FieldValidator {
    return (val) => {
      if (typeof val !== "string") return "Must be a string";
      if (val.length < minLength) return `Must be at least ${minLength} characters`;
      return null;
    };
  },

  /** Username alfanumérico + underscore */
  username(): FieldValidator {
    return (val) => {
      if (typeof val !== "string") return "Must be a string";
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(val)) {
        return "Must be 3-30 characters: letters, numbers, underscores only";
      }
      return null;
    };
  },

  /** ISO 8601 date string */
  isoDate(): FieldValidator {
    return (val) => {
      if (typeof val !== "string") return "Must be a string";
      const d = new Date(val);
      return isNaN(d.getTime()) ? "Must be a valid ISO 8601 date" : null;
    };
  },

  /** Objeto não-nulo */
  object(): FieldValidator {
    return (val) =>
      typeof val === "object" && val !== null && !Array.isArray(val)
        ? null
        : "Must be an object";
  },

  /** Array não-vazio */
  array(minItems = 0): FieldValidator {
    return (val) => {
      if (!Array.isArray(val)) return "Must be an array";
      if (val.length < minItems) return `Must have at least ${minItems} item(s)`;
      return null;
    };
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMAS CANÔNICOS (reutilizados por múltiplas edge functions)
// ─────────────────────────────────────────────────────────────────────────────

/** Schema para criação de usuário admin */
export interface CreateUserBody {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role: "user" | "business" | "driver" | "moderator" | "admin" | "super_admin";
}

export const createUserSchema: Schema<CreateUserBody> = {
  email: { required: true, validator: v.email() },
  password: { required: true, validator: v.password(12) },
  username: { required: true, validator: v.username() },
  fullName: { required: true, validator: v.string(2, 100) },
  role: {
    required: true,
    validator: v.enum(["user", "business", "driver", "moderator", "admin", "super_admin"] as const),
  },
};

/** Schema para busca de usuário por ID */
export interface GetUserBody {
  userId: string;
}

export const getUserSchema: Schema<GetUserBody> = {
  userId: { required: true, validator: v.uuid() },
};

/** Schema para listagem de usuários */
export interface ListUsersBody {
  page: number;
  pageSize: number;
  search?: string;
}

export const listUsersSchema: Schema<ListUsersBody> = {
  page: { required: true, validator: v.positiveInt(10000) },
  pageSize: { required: true, validator: v.positiveInt(100) },
  search: { required: false, validator: v.string(1, 100) },
};

/** Schema para checkout de billing */
export interface CreateCheckoutBody {
  planCode: string;
  successUrl: string;
  cancelUrl: string;
  businessId?: string;
  subscriptionScope?: "user" | "business" | "profile" | "worker";
  entityFamily?: "company" | "professional" | "worker";
  vertical?:
    | "gastronomy"
    | "health"
    | "education"
    | "services"
    | "retail"
    | "classifieds"
    | "mobility_company"
    | "mobility_driver"
    | "mobility_courier";
}

export const createCheckoutSchema: Schema<CreateCheckoutBody> = {
  planCode: { required: true, validator: v.string(1, 50) },
  successUrl: { required: true, validator: v.redirectUrl() },
  cancelUrl: { required: true, validator: v.redirectUrl() },
  businessId: { required: false, validator: v.uuid() },
  subscriptionScope: {
    required: false,
    validator: v.enum(["user", "business", "profile", "worker"] as const),
  },
  entityFamily: {
    required: false,
    validator: v.enum(["company", "professional", "worker"] as const),
  },
  vertical: {
    required: false,
    validator: v.enum([
      "gastronomy",
      "health",
      "education",
      "services",
      "retail",
      "classifieds",
      "mobility_company",
      "mobility_driver",
      "mobility_courier",
    ] as const),
  },
};

/** Schema para portal de billing */
export interface CreatePortalBody {
  returnUrl: string;
}

export const createPortalSchema: Schema<CreatePortalBody> = {
  returnUrl: { required: true, validator: v.redirectUrl() },
};

/** Schema para envio de email */
export interface SendEmailBody {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId: string;
  category?: "transactional" | "social" | "system" | "marketing";
}

export const sendEmailSchema: Schema<SendEmailBody> = {
  to: { required: true, validator: v.email() },
  subject: { required: true, validator: v.string(1, 200) },
  html: { required: true, validator: v.string(1, 100000) },
  text: { required: false, validator: v.string(1, 100000) },
  userId: { required: true, validator: v.uuid() },
  category: {
    required: false,
    validator: v.enum(["transactional", "social", "system", "marketing"] as const),
  },
};

/** Schema para envio de push */
export interface SendPushBody {
  userId: string;
  notification: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    image?: string;
    data?: Record<string, unknown>;
    tag?: string;
    requireInteraction?: boolean;
  };
}

export const sendPushSchema: Schema<SendPushBody> = {
  userId: { required: true, validator: v.uuid() },
  notification: { required: true, validator: v.object() },
};

/** Schema para dispatch de corrida */
export interface DispatchRideBody {
  rideId: string;
}

export const dispatchRideSchema: Schema<DispatchRideBody> = {
  rideId: { required: true, validator: v.uuid() },
};

/** Schema para operações de gastronomia (base — só businessId) */
export interface GastronomyBusinessBody {
  businessId: string;
}

export const gastronomyBusinessSchema: Schema<GastronomyBusinessBody> = {
  businessId: { required: true, validator: v.uuid() },
};

/** Schema para upgrade/downgrade de plano de gastronomia */
export interface GastronomyUpgradeBody {
  businessId: string;
  newPlanTier: 'pro' | 'delivery';
  prorationBehavior?: 'create_prorations' | 'always_invoice' | 'none';
}

export const gastronomyUpgradeSchema: Schema<GastronomyUpgradeBody> = {
  businessId: { required: true, validator: v.uuid() },
  newPlanTier: {
    required: true,
    validator: v.enum(['pro', 'delivery'] as const),
  },
  prorationBehavior: {
    required: false,
    validator: v.enum(['create_prorations', 'always_invoice', 'none'] as const),
  },
};

/** Schema para adicionar método de pagamento */
export interface GastronomyAddPaymentBody {
  businessId: string;
  paymentMethodId: string;
}

export const gastronomyAddPaymentSchema: Schema<GastronomyAddPaymentBody> = {
  businessId: { required: true, validator: v.uuid() },
  paymentMethodId: { required: true, validator: v.string(1, 100) },
};

/** Schema para cancelamento de assinatura */
export interface GastronomyCancelBody {
  businessId: string;
  immediately?: boolean;
}

export const gastronomyCancelSchema: Schema<GastronomyCancelBody> = {
  businessId: { required: true, validator: v.uuid() },
  immediately: { required: false, validator: v.boolean() },
};

/** Schema para exclusao LGPD de conta */
export interface DeleteAccountBody {
  reason?: string;
  confirmation: boolean;
  export_first?: boolean;
}

export const deleteAccountSchema: Schema<DeleteAccountBody> = {
  reason: { required: false, validator: v.string(1, 500) },
  confirmation: { required: true, validator: v.boolean() },
  export_first: { required: false, validator: v.boolean() },
};

/** Schema para geracao de conteudo de territorio por IA */
export interface TerritoryAiContentBody {
  territory_slug: string;
  territory_name: string;
  members?: string[];
}

export const territoryAiContentSchema: Schema<TerritoryAiContentBody> = {
  territory_slug: { required: true, validator: v.string(1, 120) },
  territory_name: { required: true, validator: v.string(1, 160) },
  members: { required: false, validator: v.array(0) },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE RESPOSTA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retorna resposta 400 com erros de validação formatados.
 * Sempre inclui os headers de segurança completos do SSOT.
 * O parâmetro corsHeaders foi removido — use getAllSecurityHeaders() via security.ts.
 */
export function validationErrorResponse(
  errors: Record<string, string>,
  methods = "POST, OPTIONS",
  req?: Request,
): Response {
  return new Response(
    JSON.stringify({
      error: "Validation failed",
      details: errors,
    }),
    {
      status: 400,
      headers: getAllSecurityHeaders(methods, req),
    },
  );
}
