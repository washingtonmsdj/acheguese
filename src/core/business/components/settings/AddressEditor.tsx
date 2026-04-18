/**
 * AddressEditor
 * 
 * Editor de endereço completo com busca automática por CEP.
 * Integra com API ViaCEP e permite seleção de coordenadas no mapa.
 */

import { useState } from "react";
import { MapPin, Search, Loader2, Check, X, Map as MapIcon } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";

interface Address {
  street?: string;
  number?: string;
  complement?: string;
  postal_code?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressEditorProps {
  address: Address;
  onChange: (address: Address) => void;
  features?: {
    cepLookup?: boolean;
    mapPicker?: boolean;
    coordinates?: boolean;
  };
  className?: string;
}

interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export function AddressEditor({
  address,
  onChange,
  features = {
    cepLookup: true,
    mapPicker: false,
    coordinates: true,
  },
  className,
}: AddressEditorProps) {
  const [loading, setLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const handleChange = (field: keyof Address, value: string | number) => {
    onChange({
      ...address,
      [field]: value,
    });
  };

  const formatCEP = (value: string): string => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    // Aplica máscara 00000-000
    if (numbers.length <= 5) {
      return numbers;
    }
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCEPChange = (value: string) => {
    const formatted = formatCEP(value);
    handleChange("postal_code", formatted);
    setCepError(null);
  };

  const searchCEP = async () => {
    const cep = address.postal_code?.replace(/\D/g, "");
    
    if (!cep || cep.length !== 8) {
      setCepError("CEP deve ter 8 dígitos");
      return;
    }

    setLoading(true);
    setCepError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data: ViaCEPResponse = await response.json();

      if (data.erro) {
        setCepError("CEP não encontrado");
        toast.error("CEP não encontrado");
        return;
      }

      // Preencher campos automaticamente
      onChange({
        ...address,
        postal_code: formatCEP(data.cep),
        street: data.logradouro || address.street,
        neighborhood: data.bairro || address.neighborhood,
        city: data.localidade || address.city,
        state: data.uf || address.state,
      });

      toast.success("Endereço encontrado!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      setCepError("Erro ao buscar CEP");
      toast.error("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo navegador");
      return;
    }

    toast.info("Obtendo localização...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          ...address,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        toast.success("Localização obtida!");
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        toast.error("Erro ao obter localização. Verifique as permissões.");
      }
    );
  };

  const isAddressComplete = Boolean(
    address.postal_code &&
    address.street &&
    address.number &&
    address.neighborhood &&
    address.city &&
    address.state
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Endereço
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Preencha o endereço completo da empresa
        </p>
      </div>

      {/* CEP with search */}
      {features.cepLookup && (
        <div className="space-y-2">
          <Label htmlFor="postal_code" className="text-sm font-medium">
            CEP
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="postal_code"
                value={address.postal_code || ""}
                onChange={(e) => handleCEPChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className={cn(
                  cepError && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {address.postal_code && address.postal_code.replace(/\D/g, "").length === 8 && !cepError && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
              )}
            </div>
            <Button
              type="button"
              onClick={searchCEP}
              disabled={loading || !address.postal_code}
              className="gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>
          {cepError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <X className="h-3 w-3" />
              {cepError}
            </p>
          )}
        </div>
      )}

      {/* Street */}
      <div className="space-y-2">
        <Label htmlFor="street" className="text-sm font-medium">
          Rua/Avenida
        </Label>
        <Input
          id="street"
          value={address.street || ""}
          onChange={(e) => handleChange("street", e.target.value)}
          placeholder="Ex: Rua das Palmeiras"
        />
      </div>

      {/* Number and Complement */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="number" className="text-sm font-medium">
            Número
          </Label>
          <Input
            id="number"
            value={address.number || ""}
            onChange={(e) => handleChange("number", e.target.value)}
            placeholder="123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complement" className="text-sm font-medium">
            Complemento
          </Label>
          <Input
            id="complement"
            value={address.complement || ""}
            onChange={(e) => handleChange("complement", e.target.value)}
            placeholder="Loja A"
          />
        </div>
      </div>

      {/* Neighborhood */}
      <div className="space-y-2">
        <Label htmlFor="neighborhood" className="text-sm font-medium">
          Bairro
        </Label>
        <Input
          id="neighborhood"
          value={address.neighborhood || ""}
          onChange={(e) => handleChange("neighborhood", e.target.value)}
          placeholder="Ex: Pituba"
        />
      </div>

      {/* City and State */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="city" className="text-sm font-medium">
            Cidade
          </Label>
          <Input
            id="city"
            value={address.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Ex: Salvador"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state" className="text-sm font-medium">
            Estado (UF)
          </Label>
          <Input
            id="state"
            value={address.state || ""}
            onChange={(e) => handleChange("state", e.target.value.toUpperCase())}
            placeholder="BA"
            maxLength={2}
          />
        </div>
      </div>

      {/* Coordinates */}
      {features.coordinates && (
        <div className="pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <MapIcon className="h-4 w-4 text-primary" />
                Coordenadas (Opcional)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Para exibir localização precisa no mapa
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGetCurrentLocation}
              className="gap-2"
            >
              <MapPin className="h-3.5 w-3.5" />
              Usar Localização Atual
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-sm font-medium">
                Latitude
              </Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={address.latitude || ""}
                onChange={(e) => handleChange("latitude", parseFloat(e.target.value) || 0)}
                placeholder="-12.975"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-sm font-medium">
                Longitude
              </Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={address.longitude || ""}
                onChange={(e) => handleChange("longitude", parseFloat(e.target.value) || 0)}
                placeholder="-38.476"
              />
            </div>
          </div>
        </div>
      )}

      {/* Status indicator */}
      {isAddressComplete ? (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-xs text-emerald-600 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span className="font-medium">Endereço completo</span>
        </div>
      ) : (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-600">
          <p className="font-medium">Preencha todos os campos obrigatórios</p>
          <p className="mt-1 text-amber-600/80">
            CEP, Rua, Número, Bairro, Cidade e Estado são obrigatórios
          </p>
        </div>
      )}
    </div>
  );
}
