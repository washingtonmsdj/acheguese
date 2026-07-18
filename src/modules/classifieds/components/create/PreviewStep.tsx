/**
 * 🔧 STEP: Preview completo do anúncio antes de publicar
 */

import React from "react";
import {
  MapPin,
  CheckCircle2,
  Phone,
  MessageCircle,
} from "lucide-react";
import { getCategoryLabel } from "@/modules/classifieds/constants/categories";
import { getSubcategoryLabel } from "@/modules/classifieds/constants/subcategories";
import { getPriceTypeLabel } from "@/modules/classifieds/constants/price-types";
import { getCategoryFields } from "@/modules/classifieds/constants/category-fields";
import { getRecordValue } from "@/shared/utils/recordLookup";
import { formatBrlNoCents } from "@/shared/utils/currency";

interface PreviewStepProps {
  titulo: string;
  description: string;
  price: string;
  priceType: string;
  category: string;
  subcategory?: string;
  condition: string;
  locationName: string;
  photoPreviews: string[];
  details: Record<string, string>;
  phone: string;
  whatsapp: string;
}

export function PreviewStep({
  titulo,
  description,
  price,
  priceType,
  category,
  subcategory,
  condition,
  locationName,
  photoPreviews,
  details,
  phone,
  whatsapp,
}: PreviewStepProps) {
  const priceDisplay =
    priceType === "gratis"
      ? "Grátis"
      : priceType === "sob_consulta"
      ? "Sob consulta"
      : formatBrlNoCents(parseFloat(price || "0"));

  const categoryFields = getCategoryFields(category);
  const filledDetails = categoryFields.filter((f) => getRecordValue(details, f.key));
  const coverPreviewUrl = photoPreviews.at(0) ?? null;

  return (
    <div className="space-y-4">
      {/* Card Preview */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        {/* Foto principal */}
        {coverPreviewUrl && (
          <div className="relative aspect-[4/3] bg-muted">
            <img
              src={coverPreviewUrl}
              alt={titulo}
              className="w-full h-full object-cover"
            />
            {photoPreviews.length > 1 && (
              <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">
                +{photoPreviews.length - 1} fotos
              </span>
            )}
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Título + Preço */}
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-bold text-foreground flex-1">{titulo}</h2>
            <div className="text-right shrink-0">
              <span className="text-lg font-bold text-primary">{priceDisplay}</span>
              {priceType === "negociavel" && (
                <p className="text-[10px] text-muted-foreground">Negociável</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
              {getCategoryLabel(category)}
            </span>
            {subcategory && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/5 text-primary border border-primary/10">
                {getSubcategoryLabel(category, subcategory)}
              </span>
            )}
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-secondary text-secondary-foreground border border-border">
              {condition === "novo" ? "Novo" : condition === "seminovo" ? "Seminovo" : "Usado"}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-accent text-accent-foreground border border-border">
              {getPriceTypeLabel(priceType)}
            </span>
          </div>

          {/* Descrição */}
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">
            {description}
          </p>

          {/* Detalhes dinâmicos */}
          {filledDetails.length > 0 && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              {filledDetails.map((f) => {
                const detailValue = getRecordValue(details, f.key) ?? "";
                const detailLabel = f.type === "select"
                  ? f.options?.find((o) => o.value === detailValue)?.label ?? detailValue
                  : detailValue;

                return (
                  <div key={f.key} className="text-xs">
                    <span className="text-muted-foreground">{f.label}: </span>
                    <span className="font-medium text-foreground">
                      {detailLabel}
                      {f.suffix ? ` ${f.suffix}` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Localização */}
          {locationName && (
            <div className="flex items-center gap-1.5 text-muted-foreground pt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-xs">
                {locationName}
              </span>
            </div>
          )}

          {/* Contato */}
          {(phone || whatsapp) && (
            <div className="flex gap-3 pt-2 border-t border-border">
              {phone && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {phone}
                </div>
              )}
              {whatsapp && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <MessageCircle className="h-3 w-3" />
                  {whatsapp}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fotos extras */}
      {photoPreviews.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {photoPreviews.slice(1).map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Foto ${i + 2}`}
              className="h-16 w-16 rounded-xl object-cover border border-border shrink-0"
            />
          ))}
        </div>
      )}

      {/* Status */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-primary font-medium">
          Anúncio pronto para ser publicado!
        </p>
      </div>
    </div>
  );
}
