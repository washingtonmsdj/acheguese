type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptMomentNotification = {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
};

type GoogleIdentityClient = {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    nonce: string;
    auto_select: boolean;
    cancel_on_tap_outside: boolean;
    use_fedcm_for_prompt: boolean;
  }): void;
  prompt(callback?: (notification: GooglePromptMomentNotification) => void): void;
};

type GoogleIdentityWindow = Window & {
  google?: {
    accounts?: {
      id?: GoogleIdentityClient;
    };
  };
};

export interface GoogleIdentityCredential {
  token: string;
  nonce: string;
}

const GOOGLE_GSI_SCRIPT_URL = "https://accounts.google.com/gsi/client";
let googleIdentityClientPromise: Promise<GoogleIdentityClient> | null = null;

function getBrowserGoogleIdentityClient(): GoogleIdentityClient | null {
  if (typeof window === "undefined") return null;
  return (window as GoogleIdentityWindow).google?.accounts?.id ?? null;
}

function loadGoogleIdentityClient(): Promise<GoogleIdentityClient> {
  const existingClient = getBrowserGoogleIdentityClient();
  if (existingClient) return Promise.resolve(existingClient);
  if (googleIdentityClientPromise) return googleIdentityClientPromise;

  if (typeof document === "undefined") {
    return Promise.reject(
      new Error("Google Identity Services requer um navegador compatível."),
    );
  }

  googleIdentityClientPromise = new Promise<GoogleIdentityClient>(
    (resolve, reject) => {
      const resolveLoadedClient = () => {
        const client = getBrowserGoogleIdentityClient();
        if (!client) {
          reject(
            new Error("Google Identity Services não ficou disponível no navegador."),
          );
          return;
        }
        resolve(client);
      };

      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${GOOGLE_GSI_SCRIPT_URL}"]`,
      );
      if (existingScript) {
        existingScript.addEventListener("load", resolveLoadedClient, { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Não foi possível carregar o login do Google.")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = GOOGLE_GSI_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", resolveLoadedClient, { once: true });
      script.addEventListener(
        "error",
        () => reject(new Error("Não foi possível carregar o login do Google.")),
        { once: true },
      );
      document.head.appendChild(script);
    },
  ).catch((error) => {
    googleIdentityClientPromise = null;
    throw error;
  });

  return googleIdentityClientPromise;
}

async function createNoncePair(): Promise<{
  nonce: string;
  hashedNonce: string;
}> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Este navegador não oferece a segurança exigida pelo login Google.");
  }

  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = Array.from(randomBytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const encodedNonce = new TextEncoder().encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashedNonce = Array.from(new Uint8Array(hashBuffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  return { nonce, hashedNonce };
}

/**
 * Browser adapter for Google Identity Services (GIS).
 *
 * Returns `null` when the prompt cannot be presented so the caller can fall
 * back to the redirect-based OAuth flow without duplicating session authority.
 * The raw nonce never leaves the browser except to Supabase Auth; Google only
 * receives its SHA-256 hexadecimal digest, matching Supabase's documented
 * `signInWithIdToken` contract.
 */
export class GoogleIdentityService {
  static getClientId(): string | null {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    return clientId ? clientId : null;
  }

  static async requestCredential(): Promise<GoogleIdentityCredential | null> {
    const clientId = GoogleIdentityService.getClientId();
    if (!clientId) return null;

    const client = await loadGoogleIdentityClient();
    const { nonce, hashedNonce } = await createNoncePair();

    return new Promise<GoogleIdentityCredential | null>((resolve, reject) => {
      let settled = false;
      const settle = (value: GoogleIdentityCredential | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      try {
        client.initialize({
          client_id: clientId,
          nonce: hashedNonce,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
          callback: (response) => {
            const token = response.credential?.trim();
            if (!token) {
              fail(new Error("O Google não retornou uma credencial válida."));
              return;
            }
            settle({ token, nonce });
          },
        });

        client.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            settle(null);
          }
        });
      } catch (error) {
        fail(error);
      }
    });
  }
}
