/* eslint-disable react-hooks/exhaustive-deps */
/**
 * LocationAutocomplete - Componente de seleção hierárquica de localização
 * 
 * Permite seleção de Estado → Cidade → Bairro usando dados oficiais do IBGE
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/shared/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Label } from "@/shared/components/ui/label";
import { IBGEService, type Estado, type Municipio, type Distrito } from "@/shared/services/IBGEService";
import { logger } from "@/shared/utils/logger";

// ============================================================================
// TYPES
// ============================================================================

export interface LocationValue {
  estado?: string;
  estadoNome?: string;
  cidade?: string;
  cidadeId?: number;
  bairro?: string;
}

interface LocationAutocompleteProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  disabled?: boolean;
  required?: boolean;
  showBairro?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LocationAutocomplete({
  value,
  onChange,
  disabled = false,
  required = false,
  showBairro = true,
  className,
}: LocationAutocompleteProps) {
  // Estados
  const [estados, setEstados] = useState<Estado[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [distritos, setDistritos] = useState<Distrito[]>([]);

  // Loading states
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);

  // Popover states
  const [openEstado, setOpenEstado] = useState(false);
  const [openCidade, setOpenCidade] = useState(false);
  const [openBairro, setOpenBairro] = useState(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Carregar estados ao montar
  useEffect(() => {
    loadEstados();
  }, []);

  // Carregar municípios quando estado mudar
  useEffect(() => {
    if (value.estado) {
      loadMunicipios(value.estado);
    } else {
      setMunicipios([]);
      setDistritos([]);
    }
  }, [value.estado]);

  // Carregar distritos quando cidade mudar
  useEffect(() => {
    if (value.cidadeId && showBairro) {
      loadDistritos(value.cidadeId);
    } else {
      setDistritos([]);
    }
  }, [value.cidadeId, showBairro]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const loadEstados = useCallback(async () => {
    setLoadingEstados(true);
    try {
      const data = await IBGEService.getEstados();
      setEstados(data);
    } catch (error) {
      logger.error("Erro ao carregar estados", error as Error);
    } finally {
      setLoadingEstados(false);
    }
  }, []);

  const loadMunicipios = useCallback(async (uf: string) => {
    setLoadingMunicipios(true);
    try {
      const data = await IBGEService.getMunicipiosPorEstado(uf);
      setMunicipios(data);
    } catch (error) {
      logger.error("Erro ao carregar municípios", error as Error);
    } finally {
      setLoadingMunicipios(false);
    }
  }, []);

  const loadDistritos = useCallback(async (municipioId: number) => {
    setLoadingDistritos(true);
    try {
      const data = await IBGEService.getDistritosPorMunicipio(municipioId);
      setDistritos(data);
    } catch (error) {
      logger.error("Erro ao carregar distritos", error as Error);
    } finally {
      setLoadingDistritos(false);
    }
  }, []);

  const handleEstadoSelect = useCallback((estado: Estado) => {
    onChange({
      estado: estado.sigla,
      estadoNome: estado.nome,
      cidade: undefined,
      cidadeId: undefined,
      bairro: undefined,
    });
    setOpenEstado(false);
  }, [onChange]);

  const handleCidadeSelect = useCallback((municipio: Municipio) => {
    onChange({
      ...value,
      cidade: municipio.nome,
      cidadeId: municipio.id,
      bairro: undefined,
    });
    setOpenCidade(false);
  }, [onChange, value]);

  const handleBairroSelect = useCallback((distrito: Distrito) => {
    onChange({
      ...value,
      bairro: distrito.nome,
    });
    setOpenBairro(false);
  }, [onChange, value]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Estado */}
      <div className="space-y-2">
        <Label htmlFor="estado">
          Estado {required && <span className="text-destructive">*</span>}
        </Label>
        <Popover open={openEstado} onOpenChange={setOpenEstado}>
          <PopoverTrigger asChild>
            <Button
              id="estado"
              variant="outline"
              role="combobox"
              aria-expanded={openEstado}
              className="w-full justify-between"
              disabled={disabled || loadingEstados}
            >
              {value.estadoNome || "Selecione o estado..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar estado..." />
              <CommandEmpty>Nenhum estado encontrado.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {estados.map((estado) => (
                  <CommandItem
                    key={estado.id}
                    value={estado.nome}
                    onSelect={() => handleEstadoSelect(estado)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.estado === estado.sigla
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {estado.nome} ({estado.sigla})
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Cidade */}
      <div className="space-y-2">
        <Label htmlFor="cidade">
          Cidade {required && <span className="text-destructive">*</span>}
        </Label>
        <Popover open={openCidade} onOpenChange={setOpenCidade}>
          <PopoverTrigger asChild>
            <Button
              id="cidade"
              variant="outline"
              role="combobox"
              aria-expanded={openCidade}
              className="w-full justify-between"
              disabled={disabled || !value.estado || loadingMunicipios}
            >
              {value.cidade || "Selecione a cidade..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Buscar cidade..." />
              <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {municipios.map((municipio) => (
                  <CommandItem
                    key={municipio.id}
                    value={municipio.nome}
                    onSelect={() => handleCidadeSelect(municipio)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.cidade === municipio.nome
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {municipio.nome}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Bairro (opcional) */}
      {showBairro && (
        <div className="space-y-2">
          <Label htmlFor="bairro">
            Bairro/Distrito
            <span className="text-muted-foreground text-xs ml-2">(opcional)</span>
          </Label>
          <Popover open={openBairro} onOpenChange={setOpenBairro}>
            <PopoverTrigger asChild>
              <Button
                id="bairro"
                variant="outline"
                role="combobox"
                aria-expanded={openBairro}
                className="w-full justify-between"
                disabled={disabled || !value.cidadeId || loadingDistritos}
              >
                {value.bairro || "Selecione o bairro..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Buscar bairro..." />
                <CommandEmpty>
                  {distritos.length === 0
                    ? "Nenhum distrito cadastrado para esta cidade."
                    : "Nenhum bairro encontrado."}
                </CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {distritos.map((distrito) => (
                    <CommandItem
                      key={distrito.id}
                      value={distrito.nome}
                      onSelect={() => handleBairroSelect(distrito)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.bairro === distrito.nome
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {distrito.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          {distritos.length === 0 && value.cidadeId && !loadingDistritos && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Esta cidade não possui distritos cadastrados no IBGE
            </p>
          )}
        </div>
      )}
    </div>
  );
}

