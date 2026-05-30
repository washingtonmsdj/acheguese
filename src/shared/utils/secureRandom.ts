const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const UINT32_RANGE = 0x100000000;

function getCryptoApi(): Crypto {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Secure random generation requires Web Crypto getRandomValues.');
  }
  return cryptoApi;
}

export function secureRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > UINT32_RANGE) {
    throw new Error('secureRandomInt requires a positive integer within uint32 range.');
  }

  const cryptoApi = getCryptoApi();
  const bucketSize = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  const values = new Uint32Array(1);

  let value: number;
  do {
    cryptoApi.getRandomValues(values);
    value = values[0];
  } while (value >= bucketSize);

  return value % maxExclusive;
}

export function secureRandomString(length: number, alphabet = DEFAULT_ALPHABET): string {
  if (!Number.isInteger(length) || length <= 0) {
    throw new Error('secureRandomString requires a positive length.');
  }
  if (!alphabet.length) {
    throw new Error('secureRandomString requires a non-empty alphabet.');
  }

  let result = '';
  for (let index = 0; index < length; index += 1) {
    result += alphabet[secureRandomInt(alphabet.length)];
  }
  return result;
}

export function secureRandomDigits(length: number): string {
  return secureRandomString(length, '0123456789');
}
