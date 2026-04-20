import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import {
  Camera,
  X,
  MapPin,
  Tag,
  Users,
  Building,
  Globe,
  AlertCircle,
} from "lucide-react";

interface PostMediaSettingsProps {
  imagens: File[];
  imagensPreview: string[];
  tagsInput: string;
  reach: "street" | "neighborhood" | "city";
  location: { lat: number; lng: number } | null;
  canPostToCity: boolean;
  onImageSelect: () => void;
  onRemoverImagem: (index: number) => void;
  onTagsChange: (value: string) => void;
  onReachChange: (value: "street" | "neighborhood" | "city") => void;
  onLocationSelect: () => void;
  onRemoveLocation: () => void;
}

export function PostMediaSettings({
  imagens,
  imagensPreview,
  tagsInput,
  reach,
  location,
  canPostToCity,
  onImageSelect,
  onRemoverImagem,
  onTagsChange,
  onReachChange,
  onLocationSelect,
  onRemoveLocation,
}: PostMediaSettingsProps) {
  const reachOptions = [
    {
      value: "street" as const,
      label: "Rua",
      icon: Users,
      description: "Apenas vizinhos próximos",
      color: "text-blue-600",
    },
    {
      value: "neighborhood" as const,
      label: "Bairro",
      icon: Building,
      description: "Todo o bairro",
      color: "text-green-600",
    },
    {
      value: "city" as const,
      label: "Cidade",
      icon: Globe,
      description: "Toda a cidade",
      color: "text-purple-600",
      disabled: !canPostToCity,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Mídia e Configurações</h2>
        <p className="text-muted-foreground">
          Adicione imagens, tags e defina o alcance do seu post
        </p>
      </div>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Imagens (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {imagensPreview.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {imagensPreview.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoverImagem(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {imagens.length < 3 && (
            <Button
              variant="outline"
              onClick={onImageSelect}
              className="w-full h-20 border-dashed"
            >
              <div className="text-center">
                <Camera className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                <span className="text-sm">
                  Adicionar Imagem ({imagens.length}/3)
                </span>
              </div>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={tagsInput}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="Ex: segurança, trânsito, evento (separadas por vírgula)"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Use tags para ajudar outras pessoas a encontrar seu post
          </p>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Localização (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {location ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onRemoveLocation}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={onLocationSelect}
              className="w-full"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Adicionar Localização
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Reach */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alcance do Post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {reachOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = reach === option.value;
            const isDisabled = option.disabled;

            return (
              <div
                key={option.value}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : isDisabled
                      ? "border-muted bg-muted/50 cursor-not-allowed opacity-60"
                      : "border-border hover:bg-muted/50"
                }`}
                onClick={() => !isDisabled && onReachChange(option.value)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${option.color}`} />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        {option.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSelected && (
                      <Badge variant="default" className="text-xs">
                        Selecionado
                      </Badge>
                    )}
                    {isDisabled && (
                      <Badge variant="secondary" className="text-xs">
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {!canPostToCity && (
            <div className="flex items-start gap-2 p-3 bg-orange-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm text-orange-800">
                <p className="font-medium">Alcance cidade bloqueado</p>
                <p>
                  Você precisa de 100+ pontos de reputação ou verificação para
                  postar para toda a cidade.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
