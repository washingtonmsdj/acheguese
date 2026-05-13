import React from "react";
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  Ban,
  Eye,
  MapPin,
  Megaphone,
  Scale,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
const regras = [
  {
    icon: Ban,
    title: "Não acusar pessoas ou empresas",
    desc: "É proibido acusar qualquer pessoa ou business de crimes ou atividades ilegais. Denúncias devem ser feitas às autoridades competentes.",
  },
  {
    icon: Eye,
    title: "Não divulgar dados pessoais",
    desc: "Não publique endereços, phones, photos ou qualquer dado pessoal de terceiros sem consentimento.",
  },
  {
    icon: AlertTriangle,
    title: "Sem conteúdo ofensivo",
    desc: "Conteúdo discriminatório, ameaçador, de ódio ou assédio não será tolerado.",
  },
  {
    icon: MapPin,
    title: "Não divulgar operações policiais",
    desc: "É proibido informar localização de blitz, operações policiais ou ações de fiscalização.",
  },
  {
    icon: Megaphone,
    title: "Sem informações falsas",
    desc: "Não publique notícias falsas, boatos ou informações que possam causar pânico na comunidade.",
  },
  {
    icon: Scale,
    title: "Respeite as leis",
    desc: "Todo conteúdo publicado deve respeitar a legislação brasileira vigente. Violações podem resultar em remoção e suspensão.",
  },
];

export default function RegrasPage() {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold font-display">
            Regras da Comunidade
          </h1>
        </div>
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display">
              Regras da Comunidade
            </h2>
            <p className="text-xs text-muted-foreground">
              Para um neighborhood mais seguro e respeitoso
            </p>
          </div>
        </div>

        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-foreground leading-relaxed">
            Estas regras existem para proteger todos os moradores. O
            descumprimento pode resultar em
            <strong> remoção de conteúdo</strong>, <strong>advertência</strong>{" "}
            ou <strong>suspensão da conta</strong>.
          </p>
        </div>

        <div className="space-y-4">
          {regras.map((r, i) => (
            <div key={i} className="bg-card rounded-xl border p-4 flex gap-3">
              <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <r.icon className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">{r.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {r.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-muted/50 rounded-xl p-4">
          <h3 className="text-sm font-semibold mb-2">
            O que acontece se eu violar as regras?
          </h3>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-warning/20 text-warning flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              <span>
                <strong>1ª violação:</strong> Conteúdo removido + advertência
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-destructive/20 text-destructive flex items-center justify-center text-[10px] font-bold">
                2
              </span>
              <span>
                <strong>2ª violação:</strong> Suspensão temporária (7 dias)
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-destructive/30 text-destructive flex items-center justify-center text-[10px] font-bold">
                3
              </span>
              <span>
                <strong>3ª violação:</strong> Suspensão permanente da conta
              </span>
            </li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Veja também nossos{" "}
          <Link to="/termos" className="text-primary underline">
            Termos de Uso
          </Link>
        </p>
      </div>
    </div>
  );
}
