import React from "react";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { BusinessLogo } from "@/shared/components/ui/business-logo";
import { cn } from "@/shared/utils/cn";
interface Biz {
  name: string;
  category: string;
  logo: string | null;
  capa: string | null;
  neighborhood: string | null;
  description: string | null;
}

export default function CatalogBusinessCard({ biz }: { biz: Biz }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      {biz.capa ? (
        <div className="relative h-40">
          <img
            src={biz.capa}
            alt={`Capa de ${biz.name}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
        </div>
      ) : (
        <div className="h-28 bg-secondary" />
      )}

      <div className={cn("p-4", biz.capa ? "-mt-10" : "")}>
        <div className="flex items-start gap-3">
          <div className="h-14 w-14 rounded-2xl bg-card border overflow-hidden shrink-0">
            <BusinessLogo
              name={biz.name}
              logoUrl={biz.logo}
              alt={`Logo de ${biz.name}`}
              initialsClassName="text-2xl"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold font-display truncate">
              {biz.name}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {biz.category}
              {biz.neighborhood ? ` • ${biz.neighborhood}` : ""}
            </p>
            {biz.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {biz.description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className="bg-primary/10 text-primary border-primary/20">
            URL compartilhável
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copiado!");
              } catch {
                toast.error("Não foi possível copiar o link.");
              }
            }}
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar link
          </Button>
        </div>
      </div>
    </div>
  );
}
