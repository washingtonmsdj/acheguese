import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  BadgeCheck,
  Bike,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileCheck2,
  FileText,
  History,
  Info,
  LockKeyhole,
  MapPin,
  Navigation,
  ShieldAlert,
  Upload,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import driverAvatar from "@/assets/professional-concept/joao-santos.png";

import { useNeighborhoodBounds } from "@/core/business/hooks/useNeighborhoodBounds";
import { MapLibreAdapter } from "@/core/maps/components/v3/MapLibreAdapter";
import { DEFAULT_TILE_STYLE } from "@/core/maps/providers/MapProvider";
import { useDriverProfileIdentity } from "@/core/mobility/hooks/useDriverProfileIdentity";
import {
  BRAZIL_STATE_OPTIONS,
  createDriverRegistrationFormValues,
  DRIVER_LICENSE_CATEGORIES,
  DRIVER_MAX_VEHICLE_YEAR,
  DRIVER_VEHICLE_TYPES,
  parseDriverRegistrationForm,
  validateDriverRegistrationInput,
  type DriverRegistrationFormValues,
} from "@/modules/mobility/utils/driverRegistration";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn";

type RegistrationStep = 1 | 2 | 3 | 4;
type RegistrationView = "form" | "area" | "status";
type RegistrationStatus = "analysis" | "correction" | "approved" | "suspended";

const AREA_OPTIONS = [
  "Santa Cruz",
  "Nordeste de Amaralina",
  "Vale das Pedrinhas",
  "Chapada",
] as const;

const VEHICLE_LABELS: Record<(typeof DRIVER_VEHICLE_TYPES)[number], string> = {
  car: "Carro",
  motorcycle: "Moto",
  van: "Van",
  truck: "Caminhão",
};

const STEP_ITEMS: Array<{ step: RegistrationStep; label: string; shortLabel: string; icon: LucideIcon }> = [
  { step: 1, label: "Seus dados", shortLabel: "Dados", icon: UserRound },
  { step: 2, label: "Habilitação", shortLabel: "CNH", icon: FileText },
  { step: 3, label: "Veículo", shortLabel: "Veículo", icon: Bike },
  { step: 4, label: "Revisão", shortLabel: "Revisão", icon: CheckCircle2 },
];

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function numberString(value: unknown, fallback: string) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : fallback;
}

function parseStep(value: string | null): RegistrationStep {
  return value === "2" || value === "3" || value === "4" ? Number(value) as RegistrationStep : 1;
}

function parseStatus(value: string | null): RegistrationStatus {
  return value === "correction" || value === "approved" || value === "suspended" ? value : "analysis";
}

function Brand({ light = false }: { light?: boolean }) {
  return <span className={cn("font-heading text-[1.35rem] font-bold tracking-[-0.07em] sm:text-[1.5rem]", light ? "text-white" : "text-territory-brand")}>achegue-se<span className="text-territory-sun">.</span></span>;
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <>
      <header className="hidden h-14 items-center justify-between bg-territory-brand px-6 text-white md:flex lg:px-8">
        <div className="flex items-center gap-10"><Brand light /><nav className="flex items-center gap-6 text-xs font-semibold text-white/90"><a href="#cadastro" className="text-white">Início</a><a href="#cadastro">Entregas</a><a href="#cadastro">Meu cadastro</a><a href="#cadastro">Ajuda</a></nav></div>
        <div className="flex items-center gap-4 text-xs font-semibold"><button type="button" onClick={() => toast.info("As notificações ficarão disponíveis quando conectadas.")} aria-label="Notificações"><CircleHelp className="h-4 w-4 text-white" /></button><span className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-territory-brand">CS</span>Carlos Santos <ChevronDown className="h-3.5 w-3.5" /></span></div>
      </header>
      <header className="flex h-14 items-center justify-between border-b border-territory-border bg-territory-surface px-4 md:hidden"><button type="button" onClick={onBack} className="flex h-9 w-9 items-center justify-center" aria-label="Voltar"><ArrowLeft className="h-5 w-5 text-territory-ink" /></button><Brand /><button type="button" onClick={() => toast.info("A ajuda ficará disponível quando conectada.")} className="flex items-center gap-1 text-xs font-semibold text-territory-ink"><CircleHelp className="h-4 w-4" />Ajuda</button></header>
    </>
  );
}

function DesktopSidebar({ step, view, status, onStep, onArea, onStatus }: { step: RegistrationStep; view: RegistrationView; status: RegistrationStatus; onStep: (step: RegistrationStep) => void; onArea: () => void; onStatus: (status: RegistrationStatus) => void }) {
  const navItem = (active = false) => cn("flex w-full items-center gap-2 rounded-lg px-1.5 py-2 text-left text-xs", active ? "bg-amber-50 font-bold text-territory-ink" : "text-territory-muted");
  const sidebarTop = view === "status" ? status === "correction" ? "pt-1.5" : "pt-[4.25rem]" : "pt-6";
  return <aside className="hidden min-h-0 border-r border-territory-border pr-3 md:block"><div className={cn("sticky top-0", sidebarTop)}>{view === "form" ? <div className="space-y-3">{STEP_ITEMS.map(({ step: itemStep, label, icon: Icon }) => <button type="button" key={itemStep} onClick={() => onStep(itemStep)} className="flex w-full items-center gap-2 text-left"><span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold", step > itemStep ? "border-emerald-600 bg-emerald-600 text-white" : step === itemStep ? "border-territory-sun bg-territory-sun text-territory-ink" : "border-territory-border bg-territory-surface text-territory-muted")}>{step > itemStep ? <Check className="h-4 w-4" /> : itemStep}</span><span className={cn("min-w-0 text-[0.68rem]", step === itemStep ? "font-bold text-territory-ink" : "text-territory-muted")}><Icon className="mr-0.5 inline h-3.5 w-3.5" />{label}</span></button>)}</div> : null}{view === "area" ? <div className="space-y-1"><button type="button" onClick={() => onStep(4)} className={navItem()}><FileCheck2 className="h-4 w-4 shrink-0" />Cadastro</button><button type="button" onClick={onArea} className={navItem(true)}><MapPin className="h-4 w-4 shrink-0" />Área de atuação</button><button type="button" onClick={() => toast.info("A ajuda ficará disponível quando conectada.")} className={navItem()}><CircleHelp className="h-4 w-4 shrink-0" />Ajuda</button></div> : null}{view === "status" ? <div className="space-y-1"><button type="button" onClick={() => onStep(4)} className={navItem(true)}><FileCheck2 className="h-4 w-4 shrink-0" />Cadastro</button><button type="button" onClick={() => onStatus("correction")} className={navItem()}><FileText className="h-4 w-4 shrink-0" />Documentos</button><button type="button" onClick={() => onStatus(status)} className={navItem()}><History className="h-4 w-4 shrink-0" />Histórico</button><button type="button" onClick={() => toast.info("A ajuda ficará disponível quando conectada.")} className={navItem()}><CircleHelp className="h-4 w-4 shrink-0" />Ajuda</button></div> : null}</div></aside>;
}

function MobileProgress({ step }: { step: RegistrationStep }) {
  const [params] = useSearchParams();
  if (params.get("status") || params.get("view") === "area") return null;
  return <div className="px-1 pt-1"><div className="flex items-center justify-center">{STEP_ITEMS.map(({ step: itemStep }, index) => <div key={itemStep} className="flex items-center"><span className={cn("h-2.5 w-2.5 rounded-full", itemStep === step ? "bg-territory-sun" : itemStep < step ? "bg-territory-brand" : "bg-slate-200")} />{index < STEP_ITEMS.length - 1 ? <span className={cn("h-px w-8", itemStep < step ? "bg-territory-brand" : "bg-slate-200")} /> : null}</div>)}</div><p className="mt-1 text-center text-xs text-territory-muted">{step} de 4 · {STEP_ITEMS[step - 1].shortLabel}</p></div>;
}

function RegistrationIdentity({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return <div className="flex items-center gap-3 px-1"><div className="h-14 w-14 overflow-hidden rounded-full bg-slate-200 text-territory-brand">{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <img src={driverAvatar} alt="" className="h-full w-full object-cover" />}</div><div><p className="text-sm font-bold text-territory-ink">{name}</p><p className="text-xs text-territory-muted">Motoboy · Entregas</p></div></div>;
}

function Field({ label, value, onChange, placeholder, type = "text", required = true, maxLength }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean; maxLength?: number }) {
  return <label className="block text-xs font-semibold text-territory-ink">{label}{required ? <span className="ml-0.5 text-rose-600">*</span> : <span className="ml-1 font-normal text-territory-muted">(opcional)</span>}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} maxLength={maxLength} required={required} className="mt-1.5 h-10 w-full rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-normal text-territory-ink outline-none placeholder:text-slate-400 focus:border-territory-brand" /></label>;
}

function SelectField({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (value: string) => void; options: readonly string[]; labels?: Partial<Record<string, string>> }) {
  return <label className="block text-xs font-semibold text-territory-ink">{label}<span className="ml-0.5 text-rose-600">*</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-territory-border bg-territory-surface px-3 text-sm font-normal text-territory-ink outline-none focus:border-territory-brand">{options.map((option) => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}</select></label>;
}

function Notice({ children, tone = "blue", icon: Icon = Info }: { children: ReactNode; tone?: "blue" | "amber" | "red"; icon?: LucideIcon }) {
  const toneClass = tone === "amber" ? "bg-amber-50 text-amber-950" : tone === "red" ? "bg-rose-50 text-rose-900" : "bg-blue-50 text-blue-900";
  return <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs", toneClass)}><Icon className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>;
}

function ActionRow({ onBack, onNext, nextLabel = "Continuar", showBack = true }: { onBack: () => void; onNext: () => void; nextLabel?: string; showBack?: boolean }) {
  return <div className="mt-auto space-y-2 pt-2"><div className={cn("flex flex-col gap-2 sm:flex-row", !showBack && "block")}><Button type="button" onClick={onNext} className="h-11 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85 sm:w-auto sm:flex-1">{nextLabel}<ArrowRight className="ml-2 h-4 w-4" /></Button>{showBack ? <Button type="button" variant="outline" onClick={onBack} className="h-11 w-full rounded-lg border-territory-border bg-territory-surface text-sm font-bold text-territory-ink sm:w-auto sm:flex-1"><ArrowLeft className="mr-2 h-4 w-4" />Voltar</Button> : null}</div><button type="button" onClick={() => toast.info("Rascunho salvo nesta demonstração.")} className="w-full text-center text-xs font-semibold text-territory-brand underline-offset-2 hover:underline">Salvar e sair</button></div>;
}

function ProfileStep({ form, update, avatarName, onAvatarChange, onNext }: { form: DriverRegistrationFormValues; update: <K extends keyof DriverRegistrationFormValues>(field: K, value: DriverRegistrationFormValues[K]) => void; avatarName: string; onAvatarChange: (name: string) => void; onNext: () => void }) {
  return <div className="flex min-h-0 flex-1 flex-col"><div><h1 className="font-heading text-xl font-bold tracking-[-0.045em] text-territory-ink sm:text-2xl"><span className="md:hidden">Seu perfil de entregador</span><span className="hidden md:inline">Seu cadastro de entregador</span></h1><p className="mt-1 text-sm text-territory-muted">Conte um pouco sobre você.</p></div><div className="mt-4 flex flex-col items-center"><div className="relative h-24 w-24 overflow-hidden rounded-full bg-slate-200"><img src={driverAvatar} alt="" className="h-full w-full object-cover" /><span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#e9f4ff] text-territory-brand"><Camera className="h-3.5 w-3.5" aria-hidden="true" /></span></div><label className="mt-2 cursor-pointer rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-territory-brand">{avatarName ? "Trocar foto" : "Adicionar ou trocar foto"}<input type="file" accept="image/*" className="sr-only" onChange={(event) => onAvatarChange(event.target.files?.[0]?.name ?? "")} /></label></div><div className="mt-4 space-y-3"><Field label="Nome completo" value={form.name} onChange={(value) => update("name", value)} placeholder="Carlos Santos" /><div className="rounded-lg border border-territory-border bg-slate-50 p-3"><div className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-territory-brand" /><div><p className="text-xs font-bold text-territory-ink">Contato da conta</p><p className="mt-0.5 text-xs text-territory-muted">(71) 9 9XXX-1234</p></div><ArrowRight className="ml-auto h-4 w-4 text-territory-muted" /></div><button type="button" onClick={() => toast.info("A revisão do contato ficará disponível quando conectada.")} className="mt-1 pl-7 text-xs font-semibold text-territory-brand underline">Revisar contato</button></div><div className="flex items-center gap-2 rounded-lg border border-territory-border px-3 py-3"><Bike className="h-5 w-5 text-territory-brand" /><div><p className="text-xs font-bold text-territory-ink">Motoboy · Entregas</p><p className="text-xs text-territory-muted">Este cadastro é para realizar entregas.</p></div></div><div className="flex items-center gap-2 rounded-lg border border-territory-border px-3 py-3"><BadgeCheck className="h-5 w-5 text-territory-brand" /><div><p className="text-xs font-bold text-territory-ink">Vinculado à sua conta</p><p className="text-xs text-territory-muted">Você poderá alternar entre seus perfis.</p></div></div></div><ActionRow onBack={() => toast.info("Você já está no primeiro passo.")} onNext={onNext} showBack={false} /></div>;
}

function LicenseStep({ form, update, onBack, onNext }: { form: DriverRegistrationFormValues; update: <K extends keyof DriverRegistrationFormValues>(field: K, value: DriverRegistrationFormValues[K]) => void; onBack: () => void; onNext: () => void }) {
  return <div className="flex min-h-0 flex-1 flex-col"><div><h1 className="font-heading text-xl font-bold tracking-[-0.045em] text-territory-ink sm:text-2xl"><span className="md:hidden">Sua habilitação</span><span className="hidden md:inline">Seu cadastro de entregador</span></h1><p className="mt-1 text-sm text-territory-muted">Informe os dados da sua CNH.</p><div className="mt-4 hidden items-center gap-5 border-b border-territory-border text-xs md:flex"><span className="pb-2 text-territory-muted">Seus dados</span><span className="border-b-2 border-territory-sun pb-2 font-bold text-territory-ink">Habilitação</span></div></div><div className="mt-5 space-y-3"><Field label="Número da CNH" value={form.licenseNumber} onChange={(value) => update("licenseNumber", value.replace(/\D/g, ""))} placeholder="••••••••1234" maxLength={11} /><div className="grid grid-cols-2 gap-3"><SelectField label="Categoria" value={form.licenseCategory} onChange={(value) => update("licenseCategory", value as DriverRegistrationFormValues["licenseCategory"])} options={DRIVER_LICENSE_CATEGORIES} /><Field label="Validade" type="date" value={form.licenseExpiry} onChange={(value) => update("licenseExpiry", value)} /></div><SelectField label="UF de emissão" value={form.licenseState} onChange={(value) => update("licenseState", value)} options={BRAZIL_STATE_OPTIONS} /></div><Notice><div><p className="font-bold">Confira os dados do documento.</p><p className="mt-0.5">A validade será conferida antes do envio.</p></div></Notice><ActionRow onBack={onBack} onNext={onNext} /></div>;
}

function VehicleStep({ form, update, onBack, onNext }: { form: DriverRegistrationFormValues; update: <K extends keyof DriverRegistrationFormValues>(field: K, value: DriverRegistrationFormValues[K]) => void; onBack: () => void; onNext: () => void }) {
  return <div className="flex min-h-0 flex-1 flex-col"><div><h1 className="font-heading text-xl font-bold tracking-[-0.045em] text-territory-ink sm:text-2xl">Sua moto</h1><p className="mt-1 text-sm text-territory-muted">Informe os dados da moto que fará as entregas.</p></div><div className="mt-5 space-y-3"><SelectField label="Tipo de veículo" value={form.vehicleType} onChange={(value) => update("vehicleType", value as DriverRegistrationFormValues["vehicleType"])} options={DRIVER_VEHICLE_TYPES} labels={VEHICLE_LABELS} /><Field label="Placa" value={form.vehiclePlate} onChange={(value) => update("vehiclePlate", value.toUpperCase())} placeholder="ABC1D23" maxLength={8} /><Field label="Modelo" value={form.vehicleModel} onChange={(value) => update("vehicleModel", value)} placeholder="Honda CG 160" /><div className="grid grid-cols-2 gap-3"><Field label="Ano" type="number" value={form.vehicleYear} onChange={(value) => update("vehicleYear", value)} placeholder={String(new Date().getFullYear())} /><Field label="Cor" value={form.vehicleColor} onChange={(value) => update("vehicleColor", value)} placeholder="Preta" /></div></div><Notice><div><p className="font-bold">Use os dados do veículo que fará as entregas.</p><p className="mt-0.5">Essas informações serão conferidas antes da análise.</p></div></Notice><ActionRow onBack={onBack} onNext={onNext} /></div>;
}

function ReviewItem({ icon: Icon, title, description, onEdit }: { icon: LucideIcon; title: string; description: string; onEdit: () => void }) {
  return <div className="flex items-start gap-3 rounded-lg border border-territory-border bg-territory-surface px-3 py-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-territory-brand" /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-territory-ink">{title}</p><p className="mt-0.5 text-xs text-territory-muted">{description}</p></div><button type="button" onClick={onEdit} className="text-xs font-semibold text-territory-brand underline">Editar</button></div>;
}

function ReviewStep({ form, onEdit, onArea, onBack, onSubmit }: { form: DriverRegistrationFormValues; onEdit: (step: RegistrationStep) => void; onArea: () => void; onBack: () => void; onSubmit: () => void }) {
  return <div className="flex min-h-0 flex-1 flex-col"><div><h1 className="font-heading text-xl font-bold tracking-[-0.045em] text-territory-ink sm:text-2xl">Revise seu cadastro</h1><p className="mt-1 text-sm text-territory-muted">Confira os dados antes de enviar para análise.</p></div><div className="mt-5 space-y-2.5"><ReviewItem icon={UserRound} title="Perfil" description={`${form.name} · Motoboy · Entregas`} onEdit={() => onEdit(1)} /><ReviewItem icon={FileText} title="CNH" description={`Categoria ${form.licenseCategory} · ${form.licenseState} · Validade ${form.licenseExpiry.split("-").reverse().join("/")}`} onEdit={() => onEdit(2)} /><ReviewItem icon={Bike} title="Veículo" description={`${VEHICLE_LABELS[form.vehicleType]} · ${form.vehicleModel} · ${form.vehiclePlate} · ${form.vehicleYear} · ${form.vehicleColor}`} onEdit={() => onEdit(3)} /><ReviewItem icon={MapPin} title="Área de atuação" description="Salvador · Bahia · Selecionar bairros" onEdit={onArea} /></div><Notice><div><p className="font-bold">O envio não libera as entregas.</p><p className="mt-0.5">Aguarde a análise da equipe.</p></div></Notice><ActionRow onBack={onBack} onNext={onSubmit} nextLabel="Enviar para análise" /></div>;
}

function FormContent({ step, form, update, avatarName, onAvatarChange, onStep, onArea, onSubmit }: { step: RegistrationStep; form: DriverRegistrationFormValues; update: <K extends keyof DriverRegistrationFormValues>(field: K, value: DriverRegistrationFormValues[K]) => void; avatarName: string; onAvatarChange: (name: string) => void; onStep: (step: RegistrationStep) => void; onArea: () => void; onSubmit: () => void }) {
  if (step === 1) return <ProfileStep form={form} update={update} avatarName={avatarName} onAvatarChange={onAvatarChange} onNext={() => onStep(2)} />;
  if (step === 2) return <LicenseStep form={form} update={update} onBack={() => onStep(1)} onNext={() => onStep(3)} />;
  if (step === 3) return <VehicleStep form={form} update={update} onBack={() => onStep(2)} onNext={() => onStep(4)} />;
  return <ReviewStep form={form} onEdit={onStep} onArea={onArea} onBack={() => onStep(3)} onSubmit={onSubmit} />;
}

function AreaMap({ selectedAreas }: { selectedAreas: readonly string[] }) {
  const neighborhoods = useMemo(() => selectedAreas.map((name) => ({ name, city: "Salvador", state: "BA" })), [selectedAreas]);
  const { namedBounds, center, isLoading } = useNeighborhoodBounds({ neighborhoods, enabled: selectedAreas.length > 0 });
  const polygons = useMemo(() => namedBounds.map((area) => ({ name: area.name, coordinates: area.bounds, center: area.center, color: area.color, fillOpacity: 0.22, lineWidth: 3, lineOpacity: 0.95 })), [namedBounds]);
  return <div className="relative min-h-64 overflow-hidden rounded-xl border border-territory-border bg-[#e5eeee] md:h-full"><MapLibreAdapter styleUrl={DEFAULT_TILE_STYLE.styleUrl} initialViewport={{ center: { latitude: center[0], longitude: center[1] }, zoom: 13 }} territoryPolygons={polygons} fitTerritoryBounds={polygons.length > 0} territoryFitPadding={24} territoryFitMaxZoom={14} controls={{}} attribution={false} hideNavigationControl interactive={false} className="h-full w-full" /><div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/95 px-3 py-2 shadow-sm"><p className="flex items-center gap-2 text-xs font-bold text-territory-ink"><span className="h-2.5 w-2.5 rounded-full bg-territory-sun" />Área escolhida</p><p className="mt-0.5 text-[0.7rem] text-territory-muted">{isLoading ? "Carregando delimitações…" : `${polygons.length} bairros selecionados`}</p></div></div>;
}

function AreaContent({ selectedAreas, onToggle, onSave }: { selectedAreas: string[]; onToggle: (area: string) => void; onSave: () => void }) {
  return <div className="flex min-h-0 flex-1 flex-col"><div><h1 className="font-heading text-xl font-bold tracking-[-0.045em] text-territory-ink sm:text-2xl">Onde você quer entregar?</h1><p className="mt-1 text-sm text-territory-muted">Selecione a cidade e os bairros onde deseja atuar.</p></div><div className="mt-4 grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(17rem,0.85fr)_minmax(0,1.15fr)]"><section className="flex min-h-0 flex-col rounded-xl border border-territory-border bg-territory-surface p-4"><div className="grid grid-cols-2 gap-3"><SelectField label="Estado" value="Bahia" onChange={() => undefined} options={["Bahia"]} /><SelectField label="Cidade" value="Salvador" onChange={() => undefined} options={["Salvador"]} /></div><input className="mt-3 h-10 w-full rounded-lg border border-territory-border px-3 text-sm outline-none focus:border-territory-brand" placeholder="Buscar bairro" /> <div className="mt-4 space-y-3">{AREA_OPTIONS.map((area) => <label key={area} className="flex items-center gap-2 text-sm text-territory-ink"><input type="checkbox" checked={selectedAreas.includes(area)} onChange={() => onToggle(area)} className="h-4 w-4 accent-territory-brand" />{area}</label>)}</div><Notice><span>{selectedAreas.length} bairros selecionados</span></Notice><Button type="button" onClick={onSave} className="mt-auto h-11 rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Salvar área de atuação<ArrowRight className="ml-2 h-4 w-4" /></Button></section><AreaMap selectedAreas={selectedAreas} /></div></div>;
}

function StatusTimeline({ status }: { status: RegistrationStatus }) {
  const entries = [{ label: "Cadastro recebido", state: "done" }, { label: "Análise da equipe", state: status === "analysis" ? "current" : "done" }, { label: "Resultado", state: status === "approved" || status === "suspended" ? "done" : "pending" }];
  return <div className="space-y-3">{entries.map((entry) => <div key={entry.label} className="flex items-center gap-3 text-sm"><span className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", entry.state === "done" ? "border-territory-brand bg-territory-brand text-white" : entry.state === "current" ? "border-territory-sun bg-territory-surface" : "border-slate-300 bg-territory-surface text-slate-300")}>{entry.state === "done" ? <Check className="h-3 w-3" /> : null}</span><span className={cn(entry.state !== "pending" ? "font-semibold text-territory-ink" : "text-territory-muted")}>{entry.label}</span></div>)}</div>;
}

function StatusContent({ status, onForm, onArea, onRetry }: { status: RegistrationStatus; onForm: (step?: RegistrationStep) => void; onArea: () => void; onRetry: () => void }) {
  if (status === "correction") return <><div className="flex min-h-0 flex-1 flex-col md:hidden"><StatusTitle icon={AlertTriangle} title="Precisamos de um ajuste" subtitle="Ação necessária" tone="amber" highlighted /><div className="mt-4 space-y-3"><section className="rounded-xl border border-territory-border p-4"><div className="flex items-start gap-3"><FileText className="h-6 w-6 text-territory-brand" /><div><p className="text-sm font-bold">Dados da CNH</p><p className="text-xs text-territory-muted">Confira a validade informada.</p></div></div><Field label="Validade da CNH" value="2029-08-20" onChange={() => undefined} type="date" /></section><section className="rounded-xl border border-territory-border p-4"><div className="flex items-start gap-3"><Upload className="h-6 w-6 text-territory-brand" /><div><p className="text-sm font-bold">Documento solicitado</p><p className="text-xs text-territory-muted">Envie a CNH para complementar a análise.</p></div></div><button type="button" onClick={() => toast.info("O seletor de arquivo será conectado ao envio real.")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-territory-brand px-3 py-4 text-sm font-semibold text-territory-brand"><Upload className="h-4 w-4" />Selecionar arquivo</button><p className="mt-2 flex items-center gap-1 text-xs text-territory-muted"><LockKeyhole className="h-3.5 w-3.5" />Arquivo restrito à análise do cadastro.</p></section></div><div className="mt-auto pt-4"><Button type="button" onClick={onRetry} className="h-11 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Reenviar para análise<ArrowRight className="ml-2 h-4 w-4" /></Button><Button type="button" variant="outline" onClick={() => toast.info("O suporte ficará disponível quando conectado.")} className="mt-2 h-11 w-full rounded-lg border-territory-border bg-territory-surface text-sm font-bold text-territory-ink hover:bg-territory-raised">Falar com suporte</Button></div></div><DesktopStatusCorrection /> </>;
  if (status === "approved") return <div className="flex min-h-0 flex-1 flex-col"><StatusTitle icon={CheckCircle2} title="Cadastro aprovado" subtitle="Seu perfil está habilitado para entregas." tone="green" /><section className="mt-4 rounded-xl border border-territory-border p-4"><h2 className="text-sm font-bold">Antes de ficar online</h2><div className="mt-3 divide-y divide-territory-border">{[{ icon: MapPin, label: "Área de atuação", value: "Salvador · 4 bairros", action: onArea, actionLabel: "Editar" }, { icon: Navigation, label: "Localização", value: "Permissão necessária", action: () => toast.info("A permissão ficará disponível quando conectada."), actionLabel: "Ativar" }, { icon: CircleHelp, label: "Notificações", value: "Configurar", action: () => toast.info("As notificações ficarão disponíveis quando conectadas."), actionLabel: "" }].map(({ icon: Icon, label, value, action, actionLabel }) => <button type="button" key={label} onClick={action} className="flex w-full items-center gap-3 py-3 text-left"><Icon className="h-5 w-5 text-territory-brand" /><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{label}</span><span className="block text-xs text-territory-muted">{value}</span></span>{actionLabel ? <span className="text-xs font-semibold text-blue-700">{actionLabel}</span> : <ArrowRight className="h-4 w-4 text-territory-muted" />}</button>)}</div></section><Notice tone="blue"><span>Você está offline. Escolha quando começar a receber ofertas.</span></Notice><div className="mt-auto pt-4"><Button type="button" onClick={() => window.location.assign("/central/motoboy?concept-mock=1&state=availability")} className="h-11 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Ir para disponibilidade<ArrowRight className="ml-2 h-4 w-4" /></Button></div></div>;
  if (status === "suspended") return <div className="flex min-h-0 flex-1 flex-col"><StatusTitle icon={ShieldAlert} title="Perfil suspenso" subtitle="Entregas indisponíveis" tone="amber" highlighted /><section className="mt-4 rounded-xl border border-territory-border p-4"><h2 className="text-sm font-bold">Motivo informado</h2><p className="mt-2 text-sm text-territory-muted">Dados do cadastro precisam de revisão.</p><button type="button" onClick={() => toast.info("Os detalhes da decisão ficarão disponíveis quando conectados.")} className="mt-3 text-xs font-semibold text-blue-700 underline">Ver detalhes da decisão<ArrowRight className="ml-1 inline h-3 w-3" /></button></section><section className="mt-3 rounded-xl border border-territory-border p-4"><h2 className="text-sm font-bold">Como continuar</h2><p className="mt-2 text-sm text-territory-muted">Revise as informações solicitadas e entre em contato com o suporte.</p></section><div className="mt-auto space-y-2 pt-4"><Button type="button" onClick={() => onForm(2)} className="h-11 w-full rounded-lg bg-territory-brand text-sm font-bold text-white hover:bg-territory-brand/90">Consultar pendências</Button><Button type="button" variant="outline" onClick={() => toast.info("O suporte ficará disponível quando conectado.")} className="h-11 w-full rounded-lg border-territory-border bg-territory-surface text-sm font-bold text-territory-ink hover:bg-territory-raised">Falar com suporte</Button></div><Notice tone="blue"><span>A liberação depende de nova análise.</span></Notice></div>;
  return <div className="flex min-h-0 flex-1 flex-col"><StatusTitle icon={Clock3} title="Cadastro enviado" subtitle="Aguardando aprovação" tone="amber" /><p className="mt-2 text-center text-sm text-territory-muted">Avisaremos quando a análise for concluída.</p><section className="mt-4 rounded-xl border border-territory-border p-4"><StatusTimeline status={status} /><div className="mt-4 border-t border-territory-border pt-4"><p className="text-xs font-bold text-territory-ink">Documentos enviados</p><div className="mt-3 space-y-2 text-sm">{["Perfil de foto", "Dados da CNH", "Dados da moto"].map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}<span className="ml-auto text-xs text-emerald-700">Recebidos</span></div>)}</div></div></section><Notice tone="blue"><span>Você ainda não pode receber entregas.</span></Notice><div className="mt-auto pt-4"><Button type="button" onClick={() => onForm(4)} className="h-11 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Ver cadastro enviado<ArrowRight className="ml-2 h-4 w-4" /></Button><Button type="button" variant="outline" onClick={() => toast.info("O suporte ficará disponível quando conectado.")} className="mt-2 h-11 w-full rounded-lg border-territory-border bg-territory-surface text-sm font-bold text-territory-ink hover:bg-territory-raised">Falar com suporte</Button></div></div>;
}

function DesktopStatusCorrection() {
  return <div className="hidden min-h-0 flex-1 flex-col md:flex"><div className="flex items-start justify-between gap-4"><div><h1 className="font-heading text-xl font-bold tracking-[-0.045em] text-territory-ink">Situação do cadastro</h1><p className="mt-1 text-sm text-territory-muted">Acompanhe o status da sua solicitação.</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-900"><AlertTriangle className="h-4 w-4" />Correção solicitada</span></div><div className="relative mt-5 grid grid-cols-3 gap-3 text-center text-xs"><div className="absolute left-[16%] right-[16%] top-3 h-px bg-territory-border" /><div className="relative"><span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-territory-brand text-white"><Check className="h-3.5 w-3.5" /></span><p className="mt-2 font-semibold text-territory-ink">Enviado</p><p className="mt-0.5 text-territory-muted">12/08/2024</p></div><div className="relative"><span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full border-2 border-territory-sun bg-territory-surface text-territory-ink">!</span><p className="mt-2 font-semibold text-territory-ink">Em análise</p><p className="mt-0.5 text-territory-muted">Em andamento</p></div><div className="relative"><span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-slate-500">•</span><p className="mt-2 font-semibold text-territory-muted">Resultado</p><p className="mt-0.5 text-territory-muted">Pendente</p></div></div><section className="mt-5 flex-1 rounded-xl border border-amber-300 bg-amber-50 p-4"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"><AlertTriangle className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-amber-950">Confira a validade da CNH</h2><p className="mt-1 text-xs leading-5 text-amber-950/80">A data informada não confere com o documento enviado. Envie o documento correto para continuarmos a análise.</p></div></div><div className="mt-4 grid gap-3 lg:grid-cols-[10rem_minmax(0,1fr)]"><Field label="Validade" value="2029-08-20" onChange={() => undefined} type="date" /><div className="rounded-lg border border-territory-border bg-territory-surface p-3"><div className="flex items-start gap-2"><Upload className="mt-0.5 h-5 w-5 text-territory-brand" /><div><p className="text-xs font-bold text-territory-ink">Documento solicitado</p><p className="mt-0.5 text-xs text-territory-muted">Envie a CNH para complementar a análise.</p></div></div><button type="button" onClick={() => toast.info("O seletor de arquivo será conectado ao envio real.")} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-dashed border-territory-brand bg-territory-surface px-3 py-2 text-xs font-bold text-territory-brand"><Upload className="h-4 w-4" />Selecionar arquivo</button><p className="mt-2 flex items-center gap-1 text-[0.68rem] text-territory-muted"><LockKeyhole className="h-3.5 w-3.5" />Acesso restrito à análise.</p></div></div></section></div>;
}

function StatusTitle({ icon: Icon, title, subtitle, tone, highlighted = false }: { icon: LucideIcon; title: string; subtitle: string; tone: "amber" | "green"; highlighted?: boolean }) {
  return <div className={cn("text-center", highlighted && "rounded-xl bg-amber-50 px-3 py-3")}><span className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-full", tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}><Icon className="h-8 w-8" /></span><h1 className="mt-3 font-heading text-xl font-bold tracking-[-0.045em] text-territory-ink sm:text-2xl">{title}</h1><p className={cn("mt-1 text-sm font-semibold", tone === "green" ? "text-emerald-700" : "text-amber-700")}>{subtitle}</p></div>;
}

function DesktopStatusAside({ status }: { status: RegistrationStatus }) {
  return <aside className="hidden h-full flex-col rounded-xl border border-territory-border bg-territory-surface p-4 lg:flex"><h2 className="text-sm font-bold text-territory-ink">Histórico</h2><div className="mt-4 space-y-4 text-xs"><div className="flex items-start gap-2"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-territory-brand" /><div><p className="font-bold text-territory-ink">Cadastro recebido</p><p className="mt-1 text-territory-muted">12/08/2024 · 14:21</p><p className="mt-1 text-territory-muted">Documentação enviada para análise.</p></div></div>{status !== "analysis" ? <div className="flex items-start gap-2"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-territory-sun" /><div><p className="font-bold text-territory-ink">Ajuste solicitado pela equipe</p><p className="mt-1 text-territory-muted">13/08/2024 · 10:03</p><p className="mt-1 text-territory-muted">Confira a validade da CNH.</p></div></div> : null}</div><div className="mt-auto border-t border-territory-border pt-4"><button type="button" onClick={() => toast.info("O suporte ficará disponível quando conectado.")} className="text-xs font-semibold text-territory-brand underline">Falar com suporte</button>{status === "correction" ? <><Button type="button" onClick={() => toast.success("Cadastro reenviado para análise.")} className="mt-4 h-11 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Reenviar para análise<ArrowRight className="ml-2 h-4 w-4" /></Button><Notice tone="red"><span>Você ainda não pode receber entregas.</span></Notice></> : null}</div></aside>;
}

function DesktopProfileCard({ name, avatarUrl, step, onReview, onArea }: { name: string; avatarUrl?: string; step: RegistrationStep; onReview: () => void; onArea: () => void }) {
  const [layoutParams] = useSearchParams();
  const currentStatus = layoutParams.get("status");
  if (currentStatus) return <DesktopStatusAside status={parseStatus(currentStatus)} />;
  if (layoutParams.get("view") === "area") return null;
  if (step === 3) return <aside className="hidden h-full flex-col rounded-xl border border-territory-border bg-territory-surface p-4 lg:flex"><h2 className="text-sm font-bold text-territory-ink">Revisão do cadastro</h2><p className="mt-1 text-xs text-territory-muted">Confira o que será analisado na próxima etapa.</p><div className="mt-4 space-y-3 text-xs"><div className="space-y-2">{["Perfil e foto", "Dados da CNH", "Dados da moto"].map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-territory-brand" /><span>{item}</span></div>)}</div><div className="border-t border-territory-border pt-3"><div className="flex items-start gap-2"><MapPin className="mt-0.5 h-5 w-5 text-territory-brand" /><div><p className="font-bold text-territory-ink">Área de atuação</p><p className="mt-1 text-territory-muted">Salvador · Bahia</p><button type="button" onClick={onArea} className="mt-1 font-semibold text-blue-700 underline">Selecionar bairros<ArrowRight className="ml-1 inline h-3 w-3" /></button></div></div></div></div><div className="mt-auto"><Button type="button" onClick={onReview} className="h-11 w-full rounded-lg bg-territory-sun text-sm font-bold text-territory-ink hover:bg-territory-sun/85">Revisar cadastro<ArrowRight className="ml-2 h-4 w-4" /></Button><p className="mt-2 text-center text-[0.68rem] text-territory-muted">O envio será feito na próxima etapa.</p></div></aside>;
  return <aside className="hidden rounded-xl border border-territory-border bg-territory-surface p-4 lg:block"><div className="flex items-center gap-3 border-b border-territory-border pb-4"><div className="h-14 w-14 overflow-hidden rounded-full bg-slate-200 text-territory-brand">{avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : <img src={driverAvatar} alt="" className="h-full w-full object-cover" />}</div><div><p className="font-heading text-base font-bold text-territory-ink">{name}</p><p className="text-xs text-territory-muted">Motoboy · Entregas</p></div></div><div className="mt-4 flex items-start gap-2"><BadgeCheck className="h-5 w-5 text-territory-brand" /><div><p className="text-xs font-bold">Perfil vinculado à sua conta</p><p className="mt-1 text-xs text-territory-muted">Estas informações identificam seu perfil na plataforma.</p></div></div></aside>;
}

export default function CentralMotoboyCadastroConceptMockPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { driverData } = useDriverProfileIdentity({ queryScope: "central-motoboy-registration-concept" });
  const snapshot = driverData as Record<string, unknown> | null;
  const driverName = stringValue(snapshot?.display_name, "Carlos Santos");
  const view: RegistrationView = searchParams.get("view") === "area" ? "area" : searchParams.get("status") ? "status" : "form";
  const step = parseStep(searchParams.get("step"));
  const status = parseStatus(searchParams.get("status"));
  const [avatarName, setAvatarName] = useState("");
  const [selectedAreas, setSelectedAreas] = useState<string[]>([...AREA_OPTIONS]);
  const [form, setForm] = useState<DriverRegistrationFormValues>(() => {
    const base = createDriverRegistrationFormValues({ name: driverName, state: "BA", vehicleType: "motorcycle" });
    return {
      ...base,
      licenseNumber: stringValue(snapshot?.license_number, "1234"),
      licenseCategory: stringValue(snapshot?.license_category, "A") as DriverRegistrationFormValues["licenseCategory"],
      licenseExpiry: stringValue(snapshot?.license_expiry, "2029-08-20"),
      licenseState: stringValue(snapshot?.license_state, "BA"),
      vehiclePlate: stringValue(snapshot?.vehicle_plate, "ABC1D23"),
      vehicleModel: stringValue(snapshot?.vehicle_model, "Honda CG 160"),
      vehicleYear: numberString(snapshot?.vehicle_year, "2023"),
      vehicleColor: stringValue(snapshot?.vehicle_color, "Preta"),
    };
  });

  useEffect(() => {
    if (!snapshot) return;
    setForm((current) => ({
      ...current,
      name: stringValue(snapshot.display_name, current.name),
      licenseNumber: stringValue(snapshot.license_number, current.licenseNumber),
      licenseCategory: stringValue(snapshot.license_category, current.licenseCategory) as DriverRegistrationFormValues["licenseCategory"],
      licenseExpiry: stringValue(snapshot.license_expiry, current.licenseExpiry),
      licenseState: stringValue(snapshot.license_state, current.licenseState),
      vehiclePlate: stringValue(snapshot.vehicle_plate, current.vehiclePlate),
      vehicleModel: stringValue(snapshot.vehicle_model, current.vehicleModel),
      vehicleYear: numberString(snapshot.vehicle_year, current.vehicleYear),
      vehicleColor: stringValue(snapshot.vehicle_color, current.vehicleColor),
    }));
  }, [snapshot]);

  const updateField = <K extends keyof DriverRegistrationFormValues>(field: K, value: DriverRegistrationFormValues[K]) => setForm((current) => ({ ...current, [field]: value }));
  const updateView = (next: { view?: RegistrationView; step?: RegistrationStep; status?: RegistrationStatus }) => {
    const params = new URLSearchParams(searchParams);
    params.set("concept-mock", "1");
    if (next.view === "area") { params.set("view", "area"); params.delete("status"); params.delete("step"); }
    else if (next.status) { params.set("status", next.status); params.delete("view"); params.delete("step"); }
    else { params.delete("view"); params.delete("status"); params.set("step", String(next.step ?? 1)); }
    setSearchParams(params);
  };
  const goStep = (nextStep: RegistrationStep) => updateView({ step: nextStep });
  const goArea = () => updateView({ view: "area" });
  const goStatus = (nextStatus: RegistrationStatus) => updateView({ status: nextStatus });

  const submitRegistration = () => {
    try {
      const input = parseDriverRegistrationForm(form, { name: form.name, state: form.licenseState });
      validateDriverRegistrationInput(input);
      toast.success("Cadastro enviado para análise.");
      goStatus("analysis");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Confira os dados antes de enviar.");
    }
  };

  const retryAnalysis = () => { toast.success("Cadastro reenviado para análise."); goStatus("analysis"); };
  const toggleArea = (area: string) => setSelectedAreas((current) => current.includes(area) ? current.filter((item) => item !== area) : [...current, area]);

  return <div className="driver-registration-concept-page flex h-dvh min-h-0 flex-col overflow-hidden bg-[#fbfcfb] text-territory-ink"><Helmet><title>Cadastro do entregador | achegue-se.</title></Helmet><Header onBack={() => navigate("/central/motoboy?concept-mock=1&state=overview")} /><main id="cadastro" className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 md:mx-0 md:max-w-[48rem] md:px-4 md:py-5"><div className="mb-3 md:hidden"><MobileProgress step={step} /></div><div className="grid min-h-0 flex-1 gap-5 md:grid-cols-[8rem_minmax(0,1fr)]"><DesktopSidebar step={step} view={view} status={status} onStep={goStep} onArea={goArea} onStatus={goStatus} /><section className="flex min-h-0 flex-1 flex-col">{view === "status" ? <div className="mb-4 md:hidden"><RegistrationIdentity name={driverName} /></div> : null}<div className={cn("grid min-h-0 flex-1 gap-4", view === "area" ? "md:grid-cols-1 lg:grid-cols-1" : "md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_14rem]")}><div className={cn("flex min-h-0 flex-col overflow-hidden rounded-xl border border-territory-border bg-territory-surface p-4 sm:p-5 lg:p-6", view === "status" && "lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0")}>{view === "area" ? <AreaContent selectedAreas={selectedAreas} onToggle={toggleArea} onSave={() => { toast.success("Área de atuação salva na demonstração."); goStep(4); }} /> : view === "status" ? <StatusContent status={status} onForm={(nextStep = 4) => goStep(nextStep)} onArea={goArea} onRetry={retryAnalysis} /> : <FormContent step={step} form={form} update={updateField} avatarName={avatarName} onAvatarChange={setAvatarName} onStep={goStep} onArea={goArea} onSubmit={submitRegistration} />}</div><DesktopProfileCard name={driverName} step={step} onReview={() => goStep(4)} onArea={goArea} /></div></section></div></main><footer className="mx-auto hidden w-full max-w-[1440px] items-center justify-between px-8 pb-4 text-[0.68rem] text-territory-muted md:flex"><span>Conceito proposto · Dados demonstrativos · A análise depende das regras da operação.</span><span>achegue-se<span className="text-territory-sun">.</span></span></footer></div>;
}
