 
import React from "react";
import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Button } from "@/shared/components/ui/button";
import {
  Save,
  Package,
  ShoppingBag,
  Award,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { BusinessService } from '@/core/business';
import { isLaunchSurfaceEnabled } from "@/config/launchScope";

interface SecoesConfig {
  services: boolean;
  products: boolean;
  cardapio: boolean;
  portfolio: boolean;
  promocoes: boolean;
}

interface Props {
  businessId: string;
  currentConfig: SecoesConfig;
  onSaved: (config: SecoesConfig) => void;
}

const SECOES = [
  {
    id: "services" as const,
    label: "Serviços",
    icon: Briefcase,
    description: "Lista de serviços oferecidos pela empresa",
    color: "text-primary",
  },
  {
    id: "products" as const,
    label: "Produtos",
    icon: Package,
    description: "Catálogo de produtos para venda",
    color: "text-success",
  },
  {
    id: "cardapio" as const,
    label: "Cardápio",
    icon: ShoppingBag,
    description: "Cardápio completo com pratos e bebidas",
    color: "text-warning",
  },
  {
    id: "portfolio" as const,
    label: "Portfólio",
    icon: Award,
    description: "Galeria de trabalhos e projetos realizados",
    color: "text-accent-foreground",
  },
  {
    id: "promocoes" as const,
    label: "Promoções",
    icon: Sparkles,
    description: "Ofertas e descontos especiais",
    color: "text-warning",
  },
];

function toggleSectionConfig(config: SecoesConfig, secao: keyof SecoesConfig): SecoesConfig {
  switch (secao) {
    case "services":
      return { ...config, services: !config.services };
    case "products":
      return { ...config, products: !config.products };
    case "cardapio":
      return { ...config, cardapio: !config.cardapio };
    case "portfolio":
      return { ...config, portfolio: !config.portfolio };
    case "promocoes":
      return { ...config, promocoes: !config.promocoes };
  }

  return config;
}

export default function SecoesAtivasManager({
  businessId,
  currentConfig,
  onSaved,
}: Props) {
  const [config, setConfig] = useState<SecoesConfig>(currentConfig);
  const [saving, setSaving] = useState(false);
  const showPromotions = isLaunchSurfaceEnabled("coupons");
  const visibleSections = SECOES.filter((secao) => secao.id !== "promocoes" || showPromotions);
  const normalizeLaunchConfig = (value: SecoesConfig): SecoesConfig =>
    showPromotions ? value : { ...value, promocoes: false };

  const toggleSecao = (secao: keyof SecoesConfig) => {
    setConfig((prev) => toggleSectionConfig(prev, secao));
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const configToSave = normalizeLaunchConfig(config);
      await BusinessService.updateActiveSections(businessId, configToSave);
      onSaved(configToSave);
    } catch (error) {
      setSaving(false);
      toast.error("Erro ao salvar configurações");
      return;
    }
    setSaving(false);

    toast.success("Seções atualizadas com sucesso!");
  };

  const hasChanges =
    JSON.stringify(normalizeLaunchConfig(config)) !== JSON.stringify(normalizeLaunchConfig(currentConfig));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-1">Gerenciar Seções</h3>
        <p className="text-sm text-muted-foreground">
          Ative ou desative seções conforme o tipo do seu negócio
        </p>
      </div>

      <div className="space-y-3">
        {visibleSections.map((secao) => {
          const Icon = secao.icon;
          const isActive = config[secao.id];

          return (
            <Card
              key={secao.id}
              className={`p-4 border-2 transition-all ${
                isActive ? "border-primary/30 bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-secondary ${secao.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-sm">{secao.label}</h4>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => toggleSecao(secao.id)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {secao.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {hasChanges && (
        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          {saving ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar Alterações
            </>
          )}
        </Button>
      )}
    </div>
  );
}
