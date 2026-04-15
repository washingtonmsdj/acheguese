// @ts-nocheck
/**
 * 🔒 HIBP Service - Have I Been Pwned
 *
 * Verifica se uma senha foi exposta em vazamentos de dados conhecidos
 * usando a API k-Anonymity do HaveIBeenPwned.
 *
 * A senha NUNCA é enviada completa — apenas os primeiros 5 caracteres
 * do hash SHA-1 são transmitidos (k-Anonymity model).
 *
 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

/**
 * Converte uma string para SHA-1 hex usando a Web Crypto API nativa.
 */
async function sha1(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
}

export interface HibpCheckResult {
  isPwned: boolean;
  count: number;
}

export class HibpService {
  private static readonly API_URL = "https://api.pwnedpasswords.com/range/";

  /**
   * Verifica se a senha aparece em vazamentos conhecidos.
   *
   * Usa k-Anonymity: envia apenas os primeiros 5 chars do hash SHA-1.
   * A comparação do sufixo é feita localmente — a senha nunca sai do dispositivo.
   *
   * @returns { isPwned: boolean, count: number }
   *   - isPwned: true se a senha foi encontrada em algum vazamento
   *   - count: número de vezes que apareceu nos vazamentos
   */
  static async checkPassword(password: string): Promise<HibpCheckResult> {
    const hash = await sha1(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    const response = await fetch(`${this.API_URL}${prefix}`, {
      headers: { "Add-Padding": "true" },
    });

    if (!response.ok) {
      // Em caso de falha na API, não bloqueamos o usuário
      throw new Error(`HIBP API error: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split("\r\n");

    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix === suffix) {
        const count = parseInt(countStr, 10);
        return { isPwned: true, count };
      }
    }

    return { isPwned: false, count: 0 };
  }
}
