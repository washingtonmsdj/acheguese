/**
 * Edge Function: territorial-group-admin-rpc
 *
 * Authenticated admin broker for territorial group lifecycle. The database
 * commands own the transaction; this gateway owns admin/MFA authority, bounded
 * input validation and audit. Do not deploy until the G43 command migration is
 * promoted in the same target environment.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireAdmin } from '../_shared/adminAuth.ts';
import {
  auditLog,
  getAllSecurityHeaders,
  getAuditInfo,
  getRequiredEnv,
  isValidUUID,
  jsonResponse,
  rateLimitMiddleware,
  readJsonBody,
  requireHttpMethod,
} from '../_shared/security.ts';

const ALLOWED_METHODS = 'POST, OPTIONS';
const MAX_MEMBERS = 500;
const ACTIONS = {
  saveGroup: true,
  setStatus: true,
} as const;

type Action = keyof typeof ACTIONS;
type Params = Record<string, unknown>;
type GroupStatus = 'active' | 'inactive';

interface RequestBody {
  action?: string;
  params?: Params;
}

class RequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RequestValidationError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireText(
  value: unknown,
  field: string,
  minLength: number,
  maxLength: number,
): string {
  if (typeof value !== 'string') throw new RequestValidationError(`Invalid ${field}`);
  const normalized = value.trim();
  if (normalized.length < minLength || normalized.length > maxLength) {
    throw new RequestValidationError(`Invalid ${field}`);
  }
  return normalized;
}

function optionalDescription(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  return requireText(value, 'description', 1, 1000);
}

function optionalGroupId(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (!isValidUUID(value)) throw new RequestValidationError('Invalid groupId');
  return value as string;
}

function requireUuid(value: unknown, field: string): string {
  if (!isValidUUID(value)) throw new RequestValidationError(`Invalid ${field}`);
  return value as string;
}

function requireMemberIds(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_MEMBERS) {
    throw new RequestValidationError('Invalid memberLocationIds');
  }

  const unique = new Set<string>();
  for (const candidate of value) {
    if (!isValidUUID(candidate)) {
      throw new RequestValidationError('Invalid memberLocationIds');
    }
    unique.add(candidate as string);
  }
  return [...unique];
}

function cleanSlug(value: unknown): string {
  const slug = requireText(value, 'slug', 2, 120).toLowerCase();
  let previousWasHyphen = false;

  for (let index = 0; index < slug.length; index += 1) {
    const code = slug.charCodeAt(index);
    const isLowercaseLetter = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;

    if (isLowercaseLetter || isDigit) {
      previousWasHyphen = false;
      continue;
    }

    const isValidHyphen =
      code === 45 && index > 0 && index < slug.length - 1 && !previousWasHyphen;
    if (!isValidHyphen) {
      throw new RequestValidationError('Invalid slug');
    }
    previousWasHyphen = true;
  }

  return slug;
}

function cleanStatus(value: unknown): GroupStatus {
  if (value !== 'active' && value !== 'inactive') {
    throw new RequestValidationError('Invalid status');
  }
  return value;
}

function knownRpcError(errorMessage: string): {
  status: number;
  error: string;
} | null {
  const mappings: Array<[string, number]> = [
    ['group_not_found', 404],
    ['group_slug_conflict', 409],
    ['active_group_requires_member', 409],
    ['anchor_city_immutable', 409],
    ['invalid_group_slug', 400],
    ['invalid_group_name', 400],
    ['invalid_group_description', 400],
    ['invalid_anchor_city', 400],
    ['invalid_group_members', 400],
    ['invalid_group_member_scope', 400],
    ['invalid_group_status_request', 400],
  ];

  for (const [reason, status] of mappings) {
    if (errorMessage.includes(reason)) return { status, error: reason };
  }
  return null;
}

function sameMemberSet(value: unknown, expected: string[]): boolean {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    return false;
  }

  const returned = value as string[];
  const uniqueReturned = [...new Set(returned)];
  if (uniqueReturned.length !== returned.length || returned.length !== expected.length) {
    return false;
  }

  const actualSorted = [...uniqueReturned].sort();
  const expectedSorted = [...expected].sort();
  return actualSorted.every((id, index) => id === expectedSorted[index]);
}

function requireSaveGroupAck(
  value: unknown,
  expected: {
    groupId: string | null;
    slug: string;
    name: string;
    description: string | null;
    anchorCityId: string;
    memberLocationIds: string[];
  },
): Record<string, unknown> {
  if (!isRecord(value) || !isRecord(value.group)) {
    throw new Error('Territorial group save returned an invalid acknowledgement');
  }

  const group = value.group;
  const returnedId = group.id;
  const expectedCreated = expected.groupId === null;
  const description = group.description ?? null;

  if (
    !isValidUUID(returnedId) ||
    (expected.groupId !== null && returnedId !== expected.groupId) ||
    group.slug !== expected.slug ||
    group.name !== expected.name ||
    description !== expected.description ||
    group.anchor_city_id !== expected.anchorCityId ||
    value.created !== expectedCreated ||
    value.memberCount !== expected.memberLocationIds.length ||
    !sameMemberSet(value.memberIds, expected.memberLocationIds) ||
    (expectedCreated && group.status !== 'inactive')
  ) {
    throw new Error('Territorial group save acknowledgement mismatch');
  }

  return value;
}

function requireStatusAck(
  value: unknown,
  groupId: string,
  status: GroupStatus,
): Record<string, unknown> {
  if (!isRecord(value) || !isRecord(value.group)) {
    throw new Error('Territorial group status returned an invalid acknowledgement');
  }

  if (value.group.id !== groupId || value.group.status !== status) {
    throw new Error('Territorial group status acknowledgement mismatch');
  }

  return value;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getAllSecurityHeaders(ALLOWED_METHODS, req),
    });
  }

  const methodError = requireHttpMethod(req, ['POST'], ALLOWED_METHODS);
  if (methodError) return methodError;

  const rateLimitResponse = await rateLimitMiddleware(req, 80, 60_000);
  if (rateLimitResponse) return rateLimitResponse;

  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;

  const rawBody = await readJsonBody<RequestBody>(req, {
    maxBytes: 32_768,
    methods: ALLOWED_METHODS,
  });
  if (!rawBody.ok) return rawBody.response;

  const action = rawBody.data?.action;
  if (!action || !(action in ACTIONS)) {
    return jsonResponse({ error: 'Invalid action' }, 400, ALLOWED_METHODS, req);
  }

  const safeAction = action as Action;
  const params =
    rawBody.data.params && typeof rawBody.data.params === 'object' && !Array.isArray(rawBody.data.params)
      ? rawBody.data.params
      : {};

  try {
    const supabaseAdmin = createClient(
      getRequiredEnv('SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    let data: Record<string, unknown>;

    if (safeAction === 'saveGroup') {
      const groupId = optionalGroupId(params.groupId);
      const slug = cleanSlug(params.slug);
      const name = requireText(params.name, 'name', 2, 160);
      const description = optionalDescription(params.description);
      const anchorCityId = requireUuid(params.anchorCityId, 'anchorCityId');
      const memberLocationIds = requireMemberIds(params.memberLocationIds);

      const result = await supabaseAdmin.rpc('territorial_admin_save_group', {
        p_group_id: groupId,
        p_slug: slug,
        p_name: name,
        p_description: description,
        p_anchor_city_id: anchorCityId,
        p_member_location_ids: memberLocationIds,
      });
      if (result.error) {
        const known = knownRpcError(result.error.message);
        if (known) return jsonResponse({ error: known.error }, known.status, ALLOWED_METHODS, req);
        throw result.error;
      }

      data = requireSaveGroupAck(result.data, {
        groupId,
        slug,
        name,
        description,
        anchorCityId,
        memberLocationIds,
      });
    } else {
      const groupId = requireUuid(params.groupId, 'groupId');
      const status = cleanStatus(params.status);
      const result = await supabaseAdmin.rpc('territorial_admin_set_group_status', {
        p_group_id: groupId,
        p_status: status,
      });
      if (result.error) {
        const known = knownRpcError(result.error.message);
        if (known) return jsonResponse({ error: known.error }, known.status, ALLOWED_METHODS, req);
        throw result.error;
      }

      data = requireStatusAck(result.data, groupId, status);
    }

    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `territorial_group_admin_${safeAction}`,
      resource: 'territorial-group-admin-rpc',
      status: 'success',
      details: {
        action: safeAction,
        targetGroupId:
          safeAction === 'saveGroup'
            ? optionalGroupId(params.groupId)
            : requireUuid(params.groupId, 'groupId'),
      },
      ...getAuditInfo(req),
    });

    return jsonResponse({ success: true, action: safeAction, data }, 200, ALLOWED_METHODS, req);
  } catch (error: unknown) {
    if (error instanceof RequestValidationError) {
      return jsonResponse({ error: error.message }, 400, ALLOWED_METHODS, req);
    }

    console.error('[territorial-group-admin-rpc]', error);
    auditLog({
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      action: `territorial_group_admin_${safeAction}`,
      resource: 'territorial-group-admin-rpc',
      status: 'failure',
      details: { action: safeAction, reason: 'territorial_group_command_failed' },
      ...getAuditInfo(req),
    });
    return jsonResponse({ error: 'Internal server error' }, 500, ALLOWED_METHODS, req);
  }
});
