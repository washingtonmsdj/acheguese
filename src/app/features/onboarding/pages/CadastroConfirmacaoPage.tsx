import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { AuthTurnstileGate } from "@/app/components/auth/AuthTurnstileGate";
import { useAuthTurnstile } from "@/app/components/auth/useAuthTurnstile";
import { useAuth } from "@/core/auth/hooks/useAuth";
import { getAuthErrorMessage } from "@/core/auth/utils/authMessages";
import {
  clearPendingSignupEmail,
  getPendingSignupEmail,
  getPendingSignupRedirect,
} from "@/core/auth/utils/pendingSignup";
import { SUPPORT_PATH } from "@/shared/constants/legal";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

const RESEND_COOLDOWN_SECONDS = 60;
type ConfirmationState = { email?: string; redirectTo?: unknown } | null;

export default function CadastroConfirmacaoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resendConfirmationEmail } = useAuth();
  const { toast } = useToast();
  const turnstile = useAuthTurnstile();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const state = location.state as ConfirmationState;
  const email = useMemo(
    () => state?.email || getPendingSignupEmail(),
    [state?.email],
  );
  const redirectTo = useMemo(
    () => resolveSafeInternalPath(state?.redirectTo ?? getPendingSignupRedirect(), "/"),
    [state?.redirectTo],
  );

  useEffect(() => {
    if (cooldown <= 0) {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      toast({
        title: "Não encontramos o e-mail desta inscrição",
        description: "Reinicie o cadastro para solicitar uma nova confirmação.",
        variant: "destructive",
      });
      return;
    }
    if (cooldown > 0 || isResending) return;
    if (!turnstile.isReady) {
      toast({
        title: "Verificação necessária",
        description: "Conclua a verificação de segurança para reenviar.",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      await resendConfirmationEmail(email);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      turnstile.reset();
      toast({
        title: "E-mail reenviado",
        description: "Confira sua caixa de entrada e também a pasta de spam.",
      });
    } catch (error) {
      toast({
        title: "Não foi possível reenviar agora",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const restartSignup = () => {
    clearPendingSignupEmail();
    const query = redirectTo === "/" ? "" : `?redirect=${encodeURIComponent(redirectTo)}`;
    navigate(`/cadastro${query}`, { replace: true });
  };

  const resendDisabled = isResending || cooldown > 0 || !turnstile.isReady;

  return (
    <>
      <Helmet>
        <title>Confirmar e-mail | Achegue-se</title>
        <meta
          name="description"
          content="Confirme seu e-mail para ativar sua conta Achegue-se."
        />
      </Helmet>

      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33]">
        <AuthBrandHeader secondaryHref="/login" secondaryLabel="Entrar" />

        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-5 pt-3 focus:outline-none lg:grid lg:max-w-[1180px] lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-16 lg:px-10 lg:pb-10 lg:pt-8"
        >
          <section className="hidden lg:block" aria-label="Confirmação de e-mail">
            <h1 className="font-heading text-[46px] font-extrabold leading-[.94] tracking-[-0.05em] text-[#0b3b3f]">
              Só falta<br />confirmar<br />seu e-mail.
            </h1>
            <img
              src="/auth/confirm-hero.webp"
              alt="Ilustração de uma mensagem chegando ao território"
              className="mt-5 w-full max-w-[390px] rounded-[24px] object-cover"
            />
          </section>

          <section className="w-full text-center lg:rounded-[18px] lg:bg-white lg:p-7 lg:text-left lg:shadow-[0_18px_55px_rgba(17,55,59,.08)]">
            <img
              src="/auth/confirm-envelope.webp"
              alt="Envelope amarelo com uma mensagem"
              className="mx-auto h-[104px] w-[110px] object-contain lg:hidden"
            />
            <h1 className="mt-2 font-heading text-[29px] font-extrabold leading-tight tracking-[-0.04em] text-[#102f33] lg:mt-0 lg:text-[24px]">
              <span className="lg:hidden">Confira seu e-mail</span>
              <span className="hidden lg:inline">Confira sua caixa de entrada</span>
            </h1>
            <p className="mt-2 text-[14px] leading-5 text-[#3c575a]">
              Enviamos um link para{" "}
              <span className="font-bold text-[#173a3e]">{email || "o e-mail informado"}</span>.
            </p>

            <ol className="mt-6 space-y-3 text-left">
              {["Abra a mensagem do Achegue-se.", "Toque em Confirmar e-mail.", "Volte para continuar."].map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-[13px] text-[#314f52]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eceae2] text-[12px] font-bold text-[#244448]">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-[#f6f2e7] px-4 py-3 text-left">
              <span className="mt-0.5 text-[#d89b00]"><AuthConceptIcon name="info" /></span>
              <div>
                <p className="text-[12px] font-bold">Não encontrou?</p>
                <p className="text-[11.5px] text-[#50686b]">Confira a pasta de spam.</p>
              </div>
            </div>

            {turnstile.enabled ? (
              <div className="mt-4 text-left">
                <AuthTurnstileGate
                  action="signup"
                  onVerify={turnstile.setToken}
                  onExpire={turnstile.reset}
                  onError={turnstile.reset}
                />
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleResend}
              disabled={resendDisabled}
              aria-live="polite"
              className="mt-4 h-11 w-full rounded-[9px] border border-[#31575a] bg-white text-[14px] font-bold text-[#173d41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 disabled:opacity-55"
            >
              {isResending ? "Reenviando…" : cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar e-mail"}
            </button>

            <button
              type="button"
              onClick={restartSignup}
              className="mx-auto mt-2 block min-h-10 rounded px-2 text-[12px] font-medium text-[#0b4e52] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35 lg:mx-0"
            >
              Informei o e-mail errado
            </button>

            <div className="my-5 h-px bg-[#d4d8d5]" />
            <div className="flex items-start gap-3 text-left text-[#526b6e]">
              <AuthConceptIcon name="clock" className="mt-0.5 text-[#174d55]" />
              <p className="text-[11px] leading-4">Sua conta ainda aguarda confirmação.</p>
            </div>
            <div className="my-5 h-px bg-[#d4d8d5]" />

            <div className="space-y-1 text-left">
              <button
                type="button"
                onClick={() => navigate(redirectTo === "/" ? "/login" : `/login?redirect=${encodeURIComponent(redirectTo)}`)}
                className="flex min-h-10 items-center gap-3 rounded px-1 text-[13px] text-[#0b4e52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
              >
                <AuthConceptIcon name="back" />
                Voltar para entrar
              </button>
              <Link
                to={SUPPORT_PATH}
                className="flex min-h-10 items-center gap-3 rounded px-1 text-[13px] text-[#0b4e52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
              >
                <AuthConceptIcon name="help" />
                Preciso de ajuda
              </Link>
            </div>
          </section>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
