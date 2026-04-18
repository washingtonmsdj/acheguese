/**
 * AdvancedSection
 * 
 * Seção de configurações avançadas.
 * Inclui: status, visibilidade, SEO, configurações técnicas.
 */

import { Settings, Eye, EyeOff, Power, Search } from "lucide-react";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

interface AdvancedSettings {
  status: "active" | "paused" | "inactive";
  visibility: "public" | "private" | "unlisted";
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  allow_reviews?: boolean;
  allow_messages?: boolean;
  show_contact_info?: boolean;
}

interface AdvancedSectionProps {
  data: AdvancedSettings;
  onChange: (data: AdvancedSettings) => void;
  className?: string;
}

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Ativa",
    description: "Empresa funcionando normalmente",
    color: "text-emerald-600",
  },
  {
    value: "paused",
    label: "Pausada",
    description: "Temporariamente sem atendimento",
    color: "text-amber-600",
  },
  {
    value: "inactive",
    label: "Inativa",
    description: "Empresa fechada ou desativada",
    color: "text-red-600",
  },
] as const;

const VISIBILITY_OPTIONS = [
  {
    value: "public",
    label: "Pública",
    description: "Visível para todos e nos resultados de busca",
    icon: Eye,
  },
  {
    value: "unlisted",
    label: "Não Listada",
    description: "Acessível por link direto, mas não aparece em buscas",
    icon: EyeOff,
  },
  {
    value: "private",
    label: "Privada",
    description: "Visível apenas para você",
    icon: EyeOff,
  },
] as const;

export function AdvancedSection({
  data,
  onChange,
  className,
}: AdvancedSectionProps) {
  const handleChange = (field: keyof AdvancedSettings, value: any) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === data.status);
  const currentVisibility = VISIBILITY_OPTIONS.find((v) => v.value === data.visibility);

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Configurações Avançadas
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Status, visibilidade e otimização para buscadores
        </p>
      </div>

      <div className="space-y-8">
        {/* Status da Empresa */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Power className="h-4 w-4 text-primary" />
              Status da Empresa
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Define se a empresa está aceitando clientes
            </p>
          </div>

          <Select
            value={data.status}
            onValueChange={(value) => handleChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${option.color}`}>
                      {option.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      - {option.description}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentStatus && (
            <div className={`text-xs ${currentStatus.color} bg-current/10 border border-current/20 rounded-lg p-3`}>
              <p className="font-medium">{currentStatus.label}</p>
              <p className="mt-1 opacity-80">{currentStatus.description}</p>
            </div>
          )}
        </div>

        {/* Visibilidade */}
        <div className="space-y-3 pt-6 border-t border-border">
          <div>
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Visibilidade
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Controla quem pode ver sua empresa
            </p>
          </div>

          <Select
            value={data.visibility}
            onValueChange={(value) => handleChange("visibility", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5" />
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        - {option.description}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {currentVisibility && (
            <div className="text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="font-medium flex items-center gap-2">
                <currentVisibility.icon className="h-3.5 w-3.5" />
                {currentVisibility.label}
              </p>
              <p className="mt-1 opacity-80">{currentVisibility.description}</p>
            </div>
          )}
        </div>

        {/* Permissões */}
        <div className="space-y-4 pt-6 border-t border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Permissões</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configure o que os clientes podem fazer
            </p>
          </div>

          {/* Permitir Avaliações */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
            <div className="flex-1">
              <Label htmlFor="allow_reviews" className="text-sm font-medium cursor-pointer">
                Permitir Avaliações
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clientes podem deixar avaliações e comentários
              </p>
            </div>
            <Switch
              id="allow_reviews"
              checked={data.allow_reviews ?? true}
              onCheckedChange={(checked) => handleChange("allow_reviews", checked)}
            />
          </div>

          {/* Permitir Mensagens */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
            <div className="flex-1">
              <Label htmlFor="allow_messages" className="text-sm font-medium cursor-pointer">
                Permitir Mensagens
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clientes podem enviar mensagens diretas
              </p>
            </div>
            <Switch
              id="allow_messages"
              checked={data.allow_messages ?? true}
              onCheckedChange={(checked) => handleChange("allow_messages", checked)}
            />
          </div>

          {/* Mostrar Informações de Contato */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
            <div className="flex-1">
              <Label htmlFor="show_contact_info" className="text-sm font-medium cursor-pointer">
                Mostrar Informações de Contato
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Exibir telefone, email e redes sociais publicamente
              </p>
            </div>
            <Switch
              id="show_contact_info"
              checked={data.show_contact_info ?? true}
              onCheckedChange={(checked) => handleChange("show_contact_info", checked)}
            />
          </div>
        </div>

        {/* SEO */}
        <div className="space-y-4 pt-6 border-t border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Search className="h-4 w-4 text-primary" />
              SEO (Otimização para Buscadores)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Melhore a visibilidade da sua empresa no Google
            </p>
          </div>

          {/* SEO Title */}
          <div className="space-y-2">
            <Label htmlFor="seo_title" className="text-sm font-medium">
              Título SEO
            </Label>
            <Input
              id="seo_title"
              value={data.seo_title || ""}
              onChange={(e) => handleChange("seo_title", e.target.value)}
              placeholder="Ex: Restaurante Sabor da Bahia - Comida Baiana em Salvador"
              maxLength={60}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Título que aparece nos resultados do Google</span>
              <span className={data.seo_title && data.seo_title.length > 60 ? "text-destructive" : ""}>
                {data.seo_title?.length || 0}/60
              </span>
            </div>
          </div>

          {/* SEO Description */}
          <div className="space-y-2">
            <Label htmlFor="seo_description" className="text-sm font-medium">
              Descrição SEO
            </Label>
            <Textarea
              id="seo_description"
              value={data.seo_description || ""}
              onChange={(e) => handleChange("seo_description", e.target.value)}
              placeholder="Descreva sua empresa de forma atrativa para aparecer nos resultados de busca..."
              rows={3}
              maxLength={160}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Descrição que aparece nos resultados do Google</span>
              <span className={data.seo_description && data.seo_description.length > 160 ? "text-destructive" : ""}>
                {data.seo_description?.length || 0}/160
              </span>
            </div>
          </div>

          {/* SEO Keywords */}
          <div className="space-y-2">
            <Label htmlFor="seo_keywords" className="text-sm font-medium">
              Palavras-chave
            </Label>
            <Input
              id="seo_keywords"
              value={data.seo_keywords || ""}
              onChange={(e) => handleChange("seo_keywords", e.target.value)}
              placeholder="Ex: restaurante, comida baiana, moqueca, acarajé, salvador"
            />
            <p className="text-xs text-muted-foreground">
              Separe as palavras-chave por vírgula
            </p>
          </div>

          {/* SEO Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-600 mb-2">
              💡 Dicas de SEO
            </h4>
            <ul className="text-xs text-blue-600/80 space-y-1.5">
              <li>• Use palavras-chave relevantes no título e descrição</li>
              <li>• Mantenha o título com até 60 caracteres</li>
              <li>• Mantenha a descrição com até 160 caracteres</li>
              <li>• Seja específico sobre localização e serviços</li>
              <li>• Atualize regularmente para manter relevância</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
