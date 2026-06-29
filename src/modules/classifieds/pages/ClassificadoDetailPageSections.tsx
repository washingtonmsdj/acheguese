import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { MapPin, MessageCircle, Package, Phone, Shield } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { CLASSIFIED_STATUS, type ClassifiedStatusValue } from "@/core/classifieds/constants/statuses";
import type { ClassificadoWithVendedor } from "@/core/classifieds/hooks/useClassificados";
import { cn } from "@/shared/utils/cn";
import { formatBrlNoCents } from "@/shared/utils/currency";
import { getClassifiedStatusLabel } from "./ClassificadoDetailStatus";

type Seller = NonNullable<ClassificadoWithVendedor["vendedor"]>;
type MiniAd = Pick<
  ClassificadoWithVendedor,
  "titulo" | "bairro" | "condition" | "created_at" | "fotos" | "preco"
>;

export function MetaChip({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-[11px] font-medium border border-border">
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate max-w-[120px] capitalize">{text}</span>
    </span>
  );
}

export function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3">
      <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide font-semibold">{label}</p>
      <p className="text-xs font-bold text-foreground capitalize">{value}</p>
    </div>
  );
}

export function ClassifiedStatusOwnerPanel({
  status,
  isPending,
  onStatusChange,
}: {
  status?: string;
  isPending: boolean;
  onStatusChange: (status: ClassifiedStatusValue) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">Status do anúncio</p>
          <p className="text-xs text-muted-foreground">
            Atual: {getClassifiedStatusLabel(status)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || status === CLASSIFIED_STATUS.INACTIVE}
            onClick={() => onStatusChange(CLASSIFIED_STATUS.INACTIVE)}
          >
            Pausar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isPending || status === CLASSIFIED_STATUS.ACTIVE}
            onClick={() => onStatusChange(CLASSIFIED_STATUS.ACTIVE)}
          >
            Reativar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending || status === CLASSIFIED_STATUS.SOLD}
            onClick={() => onStatusChange(CLASSIFIED_STATUS.SOLD)}
          >
            Marcar vendido
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SellerCard({
  vendedor,
  onWhatsApp,
  onChat,
  isChatLoading = false,
  activeAdsCount,
}: {
  vendedor: Seller;
  onWhatsApp: () => void;
  onChat?: () => void;
  isChatLoading?: boolean;
  activeAdsCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-3">Vendedor</p>

      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
          {vendedor?.nome?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-foreground text-sm truncate">{vendedor?.nome || "Vendedor"}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3" />
            <span>{activeAdsCount} anúncio{activeAdsCount === 1 ? "" : "s"} ativo{activeAdsCount === 1 ? "" : "s"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button
          onClick={onWhatsApp}
          className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold h-11 rounded-xl"
        >
          <Phone className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
        {onChat ? (
          <Button onClick={onChat} variant="outline" className="w-full h-11 rounded-xl font-bold" disabled={isChatLoading}>
            <MessageCircle className="h-4 w-4 mr-2" />
            {isChatLoading ? "Abrindo..." : "Chat"}
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}

export function SafetyTips() {
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
      <div className="flex items-start gap-2">
        <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground mb-1.5">Dicas de Segurança</p>
          <ul className="text-[10px] text-muted-foreground space-y-1 leading-relaxed">
            <li>- Prefira encontros em locais públicos</li>
            <li>- Verifique o produto antes de pagar</li>
            <li>- Desconfie de preços muito baixos</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function MiniAdCard({ ad, index, onClick }: { ad: MiniAd; index: number; onClick: () => void }) {
  const timeAgo = getRelativeTime(ad.created_at);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 transition-all"
    >
      <div className="relative h-28 sm:h-36 bg-secondary overflow-hidden">
        {ad.fotos?.[0] ? (
          <img src={ad.fotos[0]} alt={ad.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <Package className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute bottom-1.5 left-1.5 text-xs font-bold text-white drop-shadow-lg">
          {ad.preco != null ? formatBrlNoCents(ad.preco) : "Sob consulta"}
        </span>

        {ad.condition && (
          <span className={cn(
            "absolute top-1.5 right-1.5 text-[7px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-sm",
            ad.condition === "novo"
              ? "bg-success/20 text-success border-success/30"
              : ad.condition === "seminovo"
              ? "bg-primary/20 text-primary border-primary/30"
              : "bg-white/20 text-white border-white/30"
          )}>
            {ad.condition === "novo" ? "Novo" : ad.condition === "seminovo" ? "Semi" : "Usado"}
          </span>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="text-[10px] sm:text-[11px] font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors leading-tight">
          {ad.titulo}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          {ad.bairro && (
            <span className="flex items-center gap-0.5 text-muted-foreground text-[8px]">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[50px]">{ad.bairro}</span>
            </span>
          )}
          {timeAgo && <span className="text-[8px] text-muted-foreground">{timeAgo}</span>}
        </div>
      </div>
    </motion.div>
  );
}


function getRelativeTime(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}m`;
  } catch {
    return "";
  }
}
