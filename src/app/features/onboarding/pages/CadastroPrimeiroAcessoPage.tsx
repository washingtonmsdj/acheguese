import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";

import { AuthBrandHeader } from "@/app/components/auth/AuthBrandHeader";
import { AuthConceptIcon } from "@/app/components/auth/AuthConceptIcon";
import { AuthFooter } from "@/app/components/auth/AuthFooter";
import { useAuth } from "@/core/auth/hooks/useAuth";
import {
  clearPendingSignupContext,
  getPendingSignupRedirect,
} from "@/core/auth/utils/pendingSignup";
import { useLocationCascade } from "@/core/location/hooks/useLocationCascade";
import { profileService } from "@/core/profiles/services/ProfileService";
import type { ProfileRow } from "@/core/profiles/services/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import { resolveSafeInternalPath } from "@/shared/utils/safeRedirect";

export default function CadastroPrimeiroAcessoPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [showTerritoryForm, setShowTerritoryForm] = useState(false);
  const [stateId, setStateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [neighborhoodId, setNeighborhoodId] = useState("");
  const [saving, setSaving] = useState(false);
  const [territorySaved, setTerritorySaved] = useState(false);

  const redirectTo = useMemo(
    () => resolveSafeInternalPath(getPendingSignupRedirect(), "/"),
    [],
  );
  const { states, cities, neighborhoods, loadingStates, loadingCities, loadingNeighborhoods } =
    useLocationCascade(stateId || null, cityId || null);

  useEffect(() => {
    if (!user) {
      navigate("/login?confirmed=1", { replace: true });
      return;
    }

    let active = true;
    setLoadingProfile(true);
    profileService
      .getRequiredActiveProfile(user.id)
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch(() => {
        if (active) setProfile(null);
      })
      .finally(() => {
        if (active) setLoadingProfile(false);
      });

    return () => {
      active = false;
    };
  }, [navigate, user]);

  const leaveFirstAccess = (target: string) => {
    clearPendingSignupContext();
    navigate(target, { replace: true });
  };

  const saveTerritory = async () => {
    if (!profile || !stateId || !cityId || !neighborhoodId) {
      toast({
        title: "Escolha estado, cidade e bairro",
        variant: "destructive",
      });
      return;
    }

    const state = states.find((item) => item.id === stateId);
    const city = cities.find((item) => item.id === cityId);
    const neighborhood = neighborhoods.find((item) => item.id === neighborhoodId);
    if (!state || !city || !neighborhood) return;

    setSaving(true);
    try {
      const updated = await profileService.updateProfile(profile.id, {
        state: state.name,
        city: city.name,
        neighborhood: neighborhood.name,
        location_id: neighborhood.id,
        main_territory_location_id: neighborhood.id,
        public_location_visibility: "hidden",
      });
      setProfile(updated);
      await refreshUser();
      setTerritorySaved(true);
      setShowTerritoryForm(false);
      toast({ title: "Território atualizado" });
    } catch {
      toast({
        title: "Não foi possível salvar agora",
        description: "Você pode tentar novamente ou completar seu perfil depois.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#fffdfa] text-[#486367]">
        <div role="status" className="flex items-center gap-3 text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#cbd5d3] border-t-[#0b5b59]" />
          Preparando sua conta…
        </div>
      </div>
    );
  }

  const displayName = profile?.display_name || profile?.name || user?.email?.split("@")[0] || "você";
  const username = profile?.username ? `@${profile.username.replace(/^@/, "")}` : null;

  return (
    <>
      <Helmet>
        <title>Primeiro acesso | Achegue-se</title>
      </Helmet>
      <div className="min-h-[100dvh] bg-[#fffdfa] text-[#102f33]">
        <AuthBrandHeader showBack={false} />
        <main
          id="main-content"
          tabIndex={-1}
          className="mx-auto w-full max-w-[430px] px-6 pb-5 pt-2 focus:outline-none lg:max-w-[520px] lg:pt-8"
        >
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#dff5e8] text-[#0b5b59]">
              <span style={{ transform: "scale(1.35)" }}><AuthConceptIcon name="check" /></span>
            </span>
            <h1 className="mt-3 font-heading text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-[#0b3b3f]">
              Tudo pronto, {displayName.split(" ")[0]}.
            </h1>
            <p className="mt-1 text-[13px] text-[#405b5e]">Sua conta foi criada com sucesso.</p>
          </div>

          <section className="mt-4 flex items-center gap-3 rounded-xl border border-[#d5dcda] bg-white p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8eeec] text-[#0b5b59]">
              <AuthConceptIcon name="person" />
            </span>
            <div>
              <p className="text-[13px] font-bold">{displayName}</p>
              {username ? <p className="text-[11px] text-[#607477]">{username}</p> : null}
              <p className="text-[11px] text-[#607477]">Perfil pessoal</p>
            </div>
          </section>

          {redirectTo !== "/" ? (
            <section className="mt-3 rounded-xl bg-[#eef8f2] p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dff3e8] text-[#0b5b59]">
                  <AuthConceptIcon name="chat" />
                </span>
                <div>
                  <p className="text-[12px] font-bold">Sua conversa está esperando</p>
                  <p className="text-[11px] leading-4 text-[#4c6862]">Continue de onde parou sem precisar completar seu perfil agora.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => leaveFirstAccess(redirectTo)}
                className="mt-3 h-10 w-full rounded-[9px] bg-[#ffc91a] text-[13px] font-extrabold text-[#102f33] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/40"
              >
                Continuar para a conversa
              </button>
              <button
                type="button"
                onClick={() => leaveFirstAccess(redirectTo)}
                className="mx-auto mt-1 block min-h-9 rounded px-2 text-[11px] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35"
              >
                Completar meu perfil depois
              </button>
            </section>
          ) : null}

          <section className="mt-3 rounded-xl border border-[#d5dcda] bg-white p-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8eeec] text-[#0b5b59]">
                <AuthConceptIcon name="pin" />
              </span>
              <div className="flex-1">
                <p className="text-[12px] font-bold">Seu vínculo com o território</p>
                <p className="mt-0.5 text-[11px] leading-4 text-[#607477]">
                  Conte pra gente sua cidade e bairro para ver conteúdos mais relevantes.
                </p>
              </div>
            </div>

            {territorySaved ? (
              <div role="status" className="mt-3 rounded-lg bg-[#eaf7ef] px-3 py-2 text-[11px] font-medium text-[#276a4d]">
                Cidade e bairro salvos. A localização pública continua oculta por padrão.
              </div>
            ) : null}

            {showTerritoryForm ? (
              <div className="mt-4 space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold" htmlFor="first-access-state">Estado</label>
                  <Select value={stateId} onValueChange={(value) => { setStateId(value); setCityId(""); setNeighborhoodId(""); }} disabled={loadingStates || saving}>
                    <SelectTrigger id="first-access-state" className="h-10"><SelectValue placeholder={loadingStates ? "Carregando…" : "Selecione"} /></SelectTrigger>
                    <SelectContent>{states.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold" htmlFor="first-access-city">Cidade</label>
                  <Select value={cityId} onValueChange={(value) => { setCityId(value); setNeighborhoodId(""); }} disabled={!stateId || loadingCities || saving}>
                    <SelectTrigger id="first-access-city" className="h-10"><SelectValue placeholder={loadingCities ? "Carregando…" : "Selecione"} /></SelectTrigger>
                    <SelectContent>{cities.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold" htmlFor="first-access-neighborhood">Bairro</label>
                  <Select value={neighborhoodId} onValueChange={setNeighborhoodId} disabled={!cityId || loadingNeighborhoods || saving}>
                    <SelectTrigger id="first-access-neighborhood" className="h-10"><SelectValue placeholder={loadingNeighborhoods ? "Carregando…" : "Selecione"} /></SelectTrigger>
                    <SelectContent>{neighborhoods.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <button type="button" onClick={() => void saveTerritory()} disabled={saving || !neighborhoodId} className="h-10 w-full rounded-[9px] bg-[#0b5b59] text-[12px] font-bold text-white disabled:opacity-55">
                  {saving ? "Salvando…" : "Salvar cidade e bairro"}
                </button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <button type="button" onClick={() => setShowTerritoryForm(true)} className="h-10 w-full rounded-[9px] border border-[#31575a] bg-white text-[12px] font-bold text-[#173d41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                  Informar cidade e bairro
                </button>
                <button type="button" onClick={() => leaveFirstAccess(redirectTo)} className="h-10 w-full rounded-[9px] border border-[#31575a] bg-white text-[12px] font-bold text-[#173d41] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
                  Agora não
                </button>
              </div>
            )}
            <p className="mt-2 text-[10.5px] leading-4 text-[#607477]">Você pode explorar o Achegue-se mesmo morando em outro lugar.</p>
          </section>

          <Link to="/conta" onClick={() => clearPendingSignupContext()} className="mt-3 flex min-h-11 items-center gap-3 rounded-xl bg-[#f3f1ea] px-3 text-[11px] font-medium text-[#315356] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5b59]/35">
            <AuthConceptIcon name="users" className="text-[#0b5b59]" />
            Outros perfis ficam em Meus perfis.
          </Link>
        </main>
        <AuthFooter />
      </div>
    </>
  );
}
