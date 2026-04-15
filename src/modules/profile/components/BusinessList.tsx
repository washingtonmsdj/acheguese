import React from "react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { motion } from "framer-motion";
import { Store, Star, Settings, Pencil, Crown, Plus, Building2 } from "lucide-react";
import type { Business } from "@/core/profiles/services/types";
import { cn } from "@/shared/utils/cn";

interface BusinessListProps {
  businesses: Business[];
  onBusinessClick: (business: Business) => void;
  onEditClick: (e: React.MouseEvent, business: Business) => void;
  onDashboardClick: (e: React.MouseEvent, businessId: string) => void;
  onCreateNew: () => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function BusinessList({
  businesses,
  onBusinessClick,
  onEditClick,
  onDashboardClick,
  onCreateNew,
}: BusinessListProps) {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <motion.div {...fadeUp} transition={{ duration: 0.3 }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Minhas Empresas
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {businesses.length > 0
                ? `${businesses.length} empresa${businesses.length > 1 ? "s" : ""} cadastrada${businesses.length > 1 ? "s" : ""}`
                : "Cadastre sua primeira empresa"}
            </p>
          </div>
          <Button size="sm" onClick={onCreateNew} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        </div>
      </motion.div>

      {businesses.length === 0 ? (
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="rounded-2xl border border-border bg-card overflow-hidden"
        >
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="h-16 w-16 rounded-2xl bg-secondary/60 flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Nenhuma empresa cadastrada
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
              Cadastre sua primeira empresa e comece a divulgar seus serviços!
            </p>
            <Button onClick={onCreateNew} className="gap-2">
              <Store className="h-4 w-4" />
              Cadastrar Empresa
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {businesses.map((business, i) => (
            <motion.div
              key={business.id}
              {...fadeUp}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.03 }}
              className="rounded-2xl border border-border bg-card hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 relative group overflow-hidden"
            >
              <div className="p-4">
                <div className="flex gap-2 absolute top-3 right-3 z-10">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    onClick={(e) => onDashboardClick(e, business.id)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    onClick={(e) => onEditClick(e, business)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div
                  className="flex gap-3.5 cursor-pointer"
                  onClick={() => onBusinessClick(business)}
                >
                  {business.logo ? (
                    <img
                      src={business.logo}
                      alt={business.name || "Empresa"}
                      className="h-14 w-14 rounded-xl object-cover border border-border"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center text-xl border border-border">
                      🏪
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-foreground truncate">
                        {business.name}
                      </h3>
                      {business.is_premium && (
                        <Badge className="bg-warning/15 text-warning border-0 text-[10px] px-1.5">
                          <Crown className="h-2.5 w-2.5 mr-0.5" />
                          Premium
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="capitalize">{business.category}</span>
                      {business.neighborhood && (
                        <>
                          <span className="text-border">•</span>
                          <span>{business.neighborhood}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-warning fill-warning" />
                        <span className="text-xs font-semibold text-foreground tabular-nums">
                          {Number(business.rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] border-0 px-1.5",
                          business.aberto
                            ? "bg-success/10 text-success"
                            : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {business.aberto ? "Aberto" : "Fechado"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
