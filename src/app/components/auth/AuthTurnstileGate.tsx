/**
 * AuthTurnstileGate
 * SSOT do desafio Cloudflare Turnstile nas telas de autenticação.
 *
 * - Só é ativado quando `VITE_TURNSTILE_SITE_KEY` está configurado.
 * - Quando desativado, `enabled = false` e o gate não bloqueia o submit
 *   (compat com ambientes de dev / preview sem a chave).
 */
import { TurnstileWidget } from "@/shared/components/security/TurnstileWidget";
import { cn } from "@/shared/utils/cn";

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "").trim();

export interface AuthTurnstileGateProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  action?: string;
  className?: string;
}

export function AuthTurnstileGate({
  onVerify,
  onExpire,
  onError,
  action,
  className,
}: AuthTurnstileGateProps) {
  if (!SITE_KEY) return null;
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-background/60 p-3",
        className,
      )}
      data-testid="auth-turnstile-gate"
    >
      <TurnstileWidget
        siteKey={SITE_KEY}
        onVerify={onVerify}
        onExpire={onExpire}
        onError={onError}
        action={action}
      />
      <p className="text-[0.7rem] text-muted-foreground">
        Protegido por Cloudflare Turnstile
      </p>
    </div>
  );
}
