/**
 * PublicarVagaPage — Formulário de cadastro de vagas
 *
 * Multi-step wizard: Informações básicas → Detalhes → Contato → Revisão
 * Dark theme editorial, consistente com o design system.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase, Building2, MapPin, ArrowRight, ArrowLeft, Check,
  DollarSign, Tag, GraduationCap, Award, Phone, Mail, Globe,
  ExternalLink, Eye, Send, Sparkles, X, Plus,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { LAUNCH_URLS } from "@/config/territory";
import { useToast } from "@/shared/hooks/use-toast";
import {
  JOB_CATEGORIES,
  CONTRACT_LABELS,
  MODALITY_LABELS,
  LEVEL_LABELS,
  type JobContractType,
  type JobModality,
  type JobLevel,
} from "../types/job.types";

// ── Steps ────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "Informações",  icon: Briefcase },
  { id: 2, label: "Detalhes",     icon: Tag },
  { id: 3, label: "Contato",      icon: Phone },
  { id: 4, label: "Revisão",      icon: Eye },
];

const fadeSlide = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

// ═════════════════════════════════════════════════════════════════════
export default function PublicarVagaPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [titulo, setTitulo] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [descricao, setDescricao] = useState("");
  const [contrato, setContrato] = useState<JobContractType>("CLT");
  const [modalidade, setModalidade] = useState<JobModality>("presencial");
  const [nivel, setNivel] = useState<JobLevel>("pleno");
  const [categoria, setCategoria] = useState("");
  const [bairro, setBairro] = useState("");
  const [salarioMin, setSalarioMin] = useState("");
  const [salarioMax, setSalarioMax] = useState("");
  const [ocultarSalario, setOcultarSalario] = useState(false);
  const [vagasQtd, setVagasQtd] = useState("");

  // Arrays
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [requisitos, setRequisitos] = useState<string[]>([]);
  const [reqInput, setReqInput] = useState("");
  const [beneficios, setBeneficios] = useState<string[]>([]);
  const [benInput, setBenInput] = useState("");

  // Contact
  const [contatoEmail, setContatoEmail] = useState("");
  const [contatoWhatsapp, setContatoWhatsapp] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [linkExterno, setLinkExterno] = useState("");

  // Helpers
  const addToList = (list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const trimmed = input.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
      setInput("");
    }
  };

  const removeFromList = (list: string[], setList: (v: string[]) => void, index: number) => {
    setList(list.filter((_, i) => i !== index));
  };

  const canAdvance = () => {
    if (step === 1) return titulo.trim() && empresa.trim() && descricao.trim();
    if (step === 2) return true;
    if (step === 3) return contatoEmail.trim() || contatoWhatsapp.trim() || contatoTelefone.trim();
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    // Mock submit — will be replaced by Supabase insert
    await new Promise((r) => setTimeout(r, 1500));
    toast({
      title: "✅ Vaga publicada!",
      description: `"${titulo}" está ativa e visível para candidatos.`,
    });
    setSubmitting(false);
    navigate(LAUNCH_URLS.jobs);
  };

  return (
    <>
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(LAUNCH_URLS.jobs)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar às vagas
          </button>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Publicar Vaga</span>
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  step > s.id
                    ? "bg-primary border-primary text-primary-foreground"
                    : step === s.id
                    ? "border-primary text-primary bg-primary/10"
                    : "border-border text-muted-foreground bg-card"
                }`}>
                  {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium ${
                  step >= s.id ? "text-primary" : "text-muted-foreground"
                }`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded ${
                  step > s.id ? "bg-primary" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" {...fadeSlide} className="space-y-5">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Informações da Vaga
                </h2>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Título da vaga *</Label>
                  <Input
                    placeholder="Ex: Desenvolvedor Full Stack, Vendedor Externo..."
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="bg-background border-border h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Nome da empresa *</Label>
                  <Input
                    placeholder="Ex: TechBa Solutions"
                    value={empresa}
                    onChange={(e) => setEmpresa(e.target.value)}
                    className="bg-background border-border h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Descrição da vaga *</Label>
                  <Textarea
                    placeholder="Descreva as responsabilidades, o ambiente de trabalho e o que torna esta vaga especial..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="bg-background border-border rounded-xl min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Contrato</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(CONTRACT_LABELS) as [JobContractType, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setContrato(key)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            contrato === key
                              ? "bg-primary/15 border-primary/50 text-primary"
                              : "bg-card border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Modalidade</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(MODALITY_LABELS) as [JobModality, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setModalidade(key)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            modalidade === key
                              ? "bg-accent/15 border-accent/50 text-accent"
                              : "bg-card border-border text-muted-foreground hover:border-accent/30"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Nível</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(Object.entries(LEVEL_LABELS) as [JobLevel, string][]).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setNivel(key)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                            nivel === key
                              ? "bg-success/15 border-success/50 text-success"
                              : "bg-card border-border text-muted-foreground hover:border-success/30"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Categoria</Label>
                  <div className="flex flex-wrap gap-2">
                    {JOB_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategoria(categoria === cat.id ? "" : cat.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          categoria === cat.id
                            ? "bg-primary/15 border-primary/50 text-primary"
                            : "bg-card border-border text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <span>{cat.icone}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Bairro</Label>
                    <Input
                      placeholder="Ex: Pituba"
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      className="bg-background border-border h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Quantidade de vagas</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 3"
                      value={vagasQtd}
                      onChange={(e) => setVagasQtd(e.target.value)}
                      className="bg-background border-border h-11 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" {...fadeSlide} className="space-y-5">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Tag className="h-5 w-5 text-accent" />
                  Detalhes e Remuneração
                </h2>

                {/* Salary */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Faixa salarial</Label>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ocultarSalario}
                        onChange={(e) => setOcultarSalario(e.target.checked)}
                        className="rounded border-border"
                      />
                      Ocultar salário
                    </label>
                  </div>
                  {!ocultarSalario && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Mínimo"
                          value={salarioMin}
                          onChange={(e) => setSalarioMin(e.target.value)}
                          className="pl-9 bg-background border-border h-11 rounded-xl"
                        />
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="Máximo"
                          value={salarioMax}
                          onChange={(e) => setSalarioMax(e.target.value)}
                          className="pl-9 bg-background border-border h-11 rounded-xl"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Habilidades / Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: React, Excel..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(tags, setTags, tagInput, setTagInput))}
                      className="bg-background border-border h-10 rounded-xl flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => addToList(tags, setTags, tagInput, setTagInput)}
                      className="rounded-xl h-10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded-full flex items-center gap-1">
                          {tag}
                          <button onClick={() => removeFromList(tags, setTags, i)}><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Requisitos */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Requisitos
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: 3+ anos de experiência"
                      value={reqInput}
                      onChange={(e) => setReqInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(requisitos, setRequisitos, reqInput, setReqInput))}
                      className="bg-background border-border h-10 rounded-xl flex-1"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => addToList(requisitos, setRequisitos, reqInput, setReqInput)} className="rounded-xl h-10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {requisitos.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {requisitos.map((r, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center justify-between bg-card border border-border rounded-lg px-3 py-2">
                          <span className="flex items-center gap-2"><span className="text-accent">•</span>{r}</span>
                          <button onClick={() => removeFromList(requisitos, setRequisitos, i)}><X className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Benefícios */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" />
                    Benefícios
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Plano de Saúde, VR, Gympass..."
                      value={benInput}
                      onChange={(e) => setBenInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(beneficios, setBeneficios, benInput, setBenInput))}
                      className="bg-background border-border h-10 rounded-xl flex-1"
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => addToList(beneficios, setBeneficios, benInput, setBenInput)} className="rounded-xl h-10">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {beneficios.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {beneficios.map((b, i) => (
                        <span key={i} className="text-xs bg-success/10 text-success border border-success/20 px-2 py-1 rounded-full flex items-center gap-1">
                          {b}
                          <button onClick={() => removeFromList(beneficios, setBeneficios, i)}><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" {...fadeSlide} className="space-y-5">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Phone className="h-5 w-5 text-success" />
                  Informações de Contato
                </h2>
                <p className="text-xs text-muted-foreground">Preencha ao menos um canal de contato para que candidatos possam se candidatar.</p>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="rh@empresa.com"
                    value={contatoEmail}
                    onChange={(e) => setContatoEmail(e.target.value)}
                    className="bg-background border-border h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                  </Label>
                  <Input
                    placeholder="71999990001"
                    value={contatoWhatsapp}
                    onChange={(e) => setContatoWhatsapp(e.target.value)}
                    className="bg-background border-border h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> Telefone
                  </Label>
                  <Input
                    placeholder="7133001234"
                    value={contatoTelefone}
                    onChange={(e) => setContatoTelefone(e.target.value)}
                    className="bg-background border-border h-11 rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <ExternalLink className="h-3.5 w-3.5" /> Link externo (site, formulário)
                  </Label>
                  <Input
                    placeholder="https://empresa.com/vagas"
                    value={linkExterno}
                    onChange={(e) => setLinkExterno(e.target.value)}
                    className="bg-background border-border h-11 rounded-xl"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" {...fadeSlide} className="space-y-5">
              <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Eye className="h-5 w-5 text-warning" />
                  Revisão da Vaga
                </h2>

                <div className="space-y-3">
                  <div className="bg-background border border-border rounded-xl p-4">
                    <h3 className="text-base font-bold text-foreground">{titulo}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{empresa}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">{contrato}</span>
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">{MODALITY_LABELS[modalidade]}</span>
                      <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">{LEVEL_LABELS[nivel]}</span>
                      {bairro && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />{bairro}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-background border border-border rounded-xl p-4">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Salário</p>
                    <p className="text-sm text-primary font-bold">
                      {ocultarSalario
                        ? "A combinar"
                        : salarioMin && salarioMax
                        ? `R$ ${Number(salarioMin).toLocaleString("pt-BR")} – R$ ${Number(salarioMax).toLocaleString("pt-BR")}`
                        : salarioMin
                        ? `A partir de R$ ${Number(salarioMin).toLocaleString("pt-BR")}`
                        : "A combinar"}
                    </p>
                  </div>

                  <div className="bg-background border border-border rounded-xl p-4">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">Descrição</p>
                    <p className="text-sm text-muted-foreground">{descricao}</p>
                  </div>

                  {tags.length > 0 && (
                    <div className="bg-background border border-border rounded-xl p-4">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Tags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {requisitos.length > 0 && (
                    <div className="bg-background border border-border rounded-xl p-4">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Requisitos</p>
                      <ul className="space-y-1">
                        {requisitos.map((r) => (
                          <li key={r} className="text-sm text-muted-foreground">• {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {beneficios.length > 0 && (
                    <div className="bg-background border border-border rounded-xl p-4">
                      <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Benefícios</p>
                      <div className="flex flex-wrap gap-1.5">
                        {beneficios.map((b) => (
                          <span key={b} className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">{b}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-background border border-border rounded-xl p-4">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Contato</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {contatoEmail && <p>📧 {contatoEmail}</p>}
                      {contatoWhatsapp && <p>📱 {contatoWhatsapp}</p>}
                      {contatoTelefone && <p>📞 {contatoTelefone}</p>}
                      {linkExterno && <p>🔗 {linkExterno}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => step > 1 ? setStep(step - 1) : navigate(LAUNCH_URLS.jobs)}
            className="rounded-xl gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canAdvance()}
              className="rounded-xl bg-primary text-primary-foreground gap-2"
            >
              Próximo
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-primary text-primary-foreground gap-2 min-w-[160px]"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Publicando...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publicar vaga
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
