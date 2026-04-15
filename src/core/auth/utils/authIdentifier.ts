export type AuthIdentifierKind = 'email' | 'username';

export interface AuthIdentifier {
  kind: AuthIdentifierKind;
  raw: string;
  value: string;
}

export function parseAuthIdentifier(input: string): AuthIdentifier | null {
  const raw = input.trim();

  if (!raw) {
    return null;
  }

  const isExplicitUsername = raw.startsWith('@') && !raw.slice(1).includes('@');

  if (isExplicitUsername) {
    return {
      kind: 'username',
      raw,
      value: raw.slice(1).toLowerCase(),
    };
  }

  if (raw.includes('@')) {
    return {
      kind: 'email',
      raw,
      value: raw.toLowerCase(),
    };
  }

  return {
    kind: 'username',
    raw,
    value: raw.toLowerCase(),
  };
}
