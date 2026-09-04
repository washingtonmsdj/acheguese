import { assertApprovedRemoteMutationTarget } from './remote-mutation-safety.mjs';

const OPERATIONAL_ALPHA_INVITE_NOTE = 'e2e_seed';
const OPERATIONAL_ALPHA_INVITE_TTL_MS = 10 * 60 * 1000;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireOperationalEmail(payload) {
  if (!isRecord(payload)) {
    throw new Error('Operational Auth createUser payload must be an object.');
  }

  const email = typeof payload.email === 'string'
    ? payload.email.trim().toLowerCase()
    : '';
  if (!email) {
    throw new Error('Operational Auth createUser requires an explicit email.');
  }
  return email;
}

async function createWithOperationalAlphaInvite(client, adminTarget, createUser, payload) {
  const email = requireOperationalEmail(payload);
  const { error: inviteError } = await client.rpc('alpha_access_issue_invite', {
    p_email: email,
    p_expires_at: new Date(Date.now() + OPERATIONAL_ALPHA_INVITE_TTL_MS).toISOString(),
    p_max_uses: 1,
    p_note: OPERATIONAL_ALPHA_INVITE_NOTE,
  });

  if (inviteError) {
    throw new Error(
      `Unable to issue operational alpha invite: ${inviteError.message}`,
    );
  }

  try {
    return await Reflect.apply(createUser, adminTarget, [payload]);
  } finally {
    const { error: cleanupError } = await client.rpc(
      'alpha_access_delete_operational_invite',
      { p_email: email },
    );

    if (cleanupError) {
      throw new Error(
        `Unable to clean operational alpha invite: ${cleanupError.message}`,
      );
    }
  }
}

export function wrapOperationalTechnicalAuthClient(client, supabaseUrl) {
  assertApprovedRemoteMutationTarget(supabaseUrl);

  const authProxy = new Proxy(client.auth, {
    get(authTarget, authProperty, authReceiver) {
      if (authProperty !== 'admin') {
        const value = Reflect.get(authTarget, authProperty, authReceiver);
        return typeof value === 'function' ? value.bind(authTarget) : value;
      }

      const adminApi = authTarget.admin;
      return new Proxy(adminApi, {
        get(adminTarget, adminProperty, adminReceiver) {
          const value = Reflect.get(adminTarget, adminProperty, adminReceiver);
          if (adminProperty === 'createUser' && typeof value === 'function') {
            return (payload) =>
              createWithOperationalAlphaInvite(
                client,
                adminTarget,
                value,
                payload,
              );
          }

          return typeof value === 'function' ? value.bind(adminTarget) : value;
        },
      });
    },
  });

  return new Proxy(client, {
    get(target, property, receiver) {
      if (property === 'auth') return authProxy;
      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });
}

export const operationalAlphaInviteContract = Object.freeze({
  note: OPERATIONAL_ALPHA_INVITE_NOTE,
  ttlMs: OPERATIONAL_ALPHA_INVITE_TTL_MS,
});
