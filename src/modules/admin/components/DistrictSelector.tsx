/**
 * DistrictSelector
 *
 * Seletor de bairros canonicos para grupos territoriais.
 * Leitura via useLocationOptions (LocationRepository) - sem query direta.
 *
 * Regras:
 * - Apenas locations.type = 'district', status = 'active'
 * - Apenas bairros da cidade ancora selecionada
 * - Sem input manual de texto
 * - Multiselect com busca
 */

import { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { useCities, useDistricts } from '../hooks/useLocationOptions';

interface DistrictSelectorProps {
  anchorCityId: string;
  onAnchorCityChange: (cityId: string) => void;
  selectedDistricts: string[];
  onDistrictsChange: (districtIds: string[]) => void;
  disabled?: boolean;
  /** Existing groups cannot move between anchor cities. */
  anchorCityLocked?: boolean;
}

export function DistrictSelector({
  anchorCityId,
  onAnchorCityChange,
  selectedDistricts,
  onDistrictsChange,
  disabled,
  anchorCityLocked = false,
}: DistrictSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const { data: cities = [], isLoading: loadingCities } = useCities();
  const { data: districts = [], isLoading: loadingDistricts } = useDistricts(anchorCityId || undefined);

  const filtered = districts.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.slug.toLowerCase().includes(searchTerm.toLowerCase());

    if (showOnlySelected) {
      return matchesSearch && selectedDistricts.includes(d.id);
    }

    return matchesSearch;
  });

  // Ao trocar cidade, descartar selecoes que nao pertencem a nova cidade.
  useEffect(() => {
    if (!anchorCityId || selectedDistricts.length === 0 || loadingDistricts) return;
    const validIds = new Set(districts.map((d) => d.id));
    const kept = selectedDistricts.filter((id) => validIds.has(id));
    if (kept.length !== selectedDistricts.length) onDistrictsChange(kept);
  }, [anchorCityId, districts, loadingDistricts, onDistrictsChange, selectedDistricts]);

  const toggle = (id: string) =>
    onDistrictsChange(
      selectedDistricts.includes(id)
        ? selectedDistricts.filter((x) => x !== id)
        : [...selectedDistricts, id],
    );

  return (
    <div className="space-y-5">
      {/* Cidade ancora */}
      <div className="space-y-2">
        <label className="text-sm font-medium block">Cidade ancora</label>
        {loadingCities ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-3 px-4 border border-border rounded-lg bg-muted/20">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando cidades...
          </div>
        ) : (
          <>
            <select
              value={anchorCityId}
              onChange={(e) => onAnchorCityChange(e.target.value)}
              disabled={disabled || anchorCityLocked}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-60"
            >
              <option value="">Selecione uma cidade</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {anchorCityLocked
                ? 'A cidade ancora de um grupo existente nao pode ser alterada.'
                : 'Apenas bairros desta cidade poderao ser selecionados.'}
            </p>
          </>
        )}
      </div>

      {/* Bairros */}
      {anchorCityId && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">
              Bairros Membros
            </label>
            <Badge variant="secondary" className="text-xs">
              {selectedDistricts.length} de {districts.length} selecionados
            </Badge>
          </div>

          {/* Barra de acoes */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar bairro..."
                className="pl-9 h-9"
                disabled={disabled}
              />
            </div>
            <label
              className={`flex items-center gap-2 h-9 px-3 rounded-md border transition-colors cursor-pointer ${
                showOnlySelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-accent'
              } ${disabled || selectedDistricts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Checkbox
                checked={showOnlySelected}
                onCheckedChange={() => !disabled && selectedDistricts.length > 0 && setShowOnlySelected(!showOnlySelected)}
                disabled={disabled || selectedDistricts.length === 0}
                className="pointer-events-none"
              />
              <span className="text-sm whitespace-nowrap">Apenas selecionados</span>
            </label>
          </div>

          {/* Acoes rapidas */}
          <div className="flex gap-2 mb-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 flex-1"
              disabled={disabled || filtered.length === 0}
              onClick={() => {
                const allFilteredIds = filtered.map((d) => d.id);
                const newSelection = [...new Set([...selectedDistricts, ...allFilteredIds])];
                onDistrictsChange(newSelection);
              }}
            >
              Selecionar {showOnlySelected ? 'filtrados' : 'todos'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-7 flex-1"
              disabled={disabled || selectedDistricts.length === 0}
              onClick={() => onDistrictsChange([])}
            >
              Limpar selecao
            </Button>
          </div>

          {loadingDistricts ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground border border-border rounded-lg bg-muted/20">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando bairros...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 border border-border rounded-lg bg-muted/20">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? 'Nenhum bairro encontrado com esse termo'
                  : showOnlySelected
                    ? 'Nenhum bairro selecionado ainda'
                    : 'Nenhum bairro disponivel nesta cidade'}
              </p>
            </div>
          ) : (
            <div className="border border-border rounded-lg max-h-80 overflow-y-auto bg-card">
              <div className="divide-y divide-border">
                {filtered.map((d) => {
                  const isSelected = selectedDistricts.includes(d.id);
                  return (
                    <label
                      key={d.id}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggle(d.id)}
                        disabled={disabled}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{d.name}</span>
                          {isSelected && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">OK</Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate block font-mono">
                          {d.slug}
                        </span>
                      </div>
                      <MapPin className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              Dica: use o filtro "Apenas selecionados" para revisar os bairros ja adicionados ao grupo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
