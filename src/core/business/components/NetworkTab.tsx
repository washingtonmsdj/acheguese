import React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Star, MapPin, Loader2, AlertCircle, GitBranch, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/shared/components/ui/dialog';
import { NetworkService, type BranchSummary } from '@/core/business/services/NetworkService';
import { useResolvedBusinessPublicUrl } from '@/core/business/hooks/useResolvedBusinessPublicUrl';
import { useLocationCascade, type LocationOption } from '@/core/location/hooks/useLocationCascade';
import { businessManagementRoutes } from '@/core/business/utils/businessManagementRoutes';
import type {
  ConvertToNetworkPanelProps,
  BrandHubPanelProps,
  BranchPanelProps,
  CreateBranchDialogProps,
} from '@/core/business/types/network';

interface NetworkTabProps {
  profileId: string;
  businessId: string;
  businessRole: 'standalone' | 'brand_hub' | 'branch';
  parentBusinessId?: string | null;
  locationId?: string | null;
}

export default function NetworkTab({
  profileId,
  businessId,
  businessRole,
  parentBusinessId,
  locationId,
}: NetworkTabProps) {
  const { toast } = useToast();

  if (businessRole === 'standalone') {
    return (
      <ConvertToNetworkPanel
        profileId={profileId}
        businessId={businessId}
        locationId={locationId}
        toast={toast}
      />
    );
  }

  if (businessRole === 'brand_hub') {
    return (
      <BrandHubPanel
        brandHubId={businessId}
        toast={toast}
      />
    );
  }

  if (businessRole === 'branch') {
    return (
      <BranchPanel
        branchId={businessId}
        parentBusinessId={parentBusinessId}
        toast={toast}
      />
    );
  }

  return null;
}

// ─── Painel: Converter standalone → rede ─────────────────────────────────────

function ConvertToNetworkPanel({ profileId, businessId, locationId, toast }: ConvertToNetworkPanelProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [unitName, setUnitName] = useState('Unidade Principal');
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!brandName.trim()) {
      toast({ title: 'Nome da marca obrigatório', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await NetworkService.convertToNetwork(profileId, brandName.trim(), unitName.trim());
      toast({ 
        title: 'Rede criada com sucesso', 
        description: 'Redirecionando para o painel da marca...' 
      });
      setOpen(false);
      setTimeout(() => {
        navigate(businessManagementRoutes.overview(result.brand_hub_id));
      }, 500);
    } catch (err) {
      toast({ title: 'Erro ao criar rede', description: (err as Error).message, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30">
        <GitBranch className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Esta empresa ainda não faz parte de uma rede</p>
          <p className="text-xs text-muted-foreground mt-1">
            Transforme em rede para gerenciar múltiplas unidades com a mesma marca.
            Esta unidade se tornará a matriz.
          </p>
        </div>
      </div>

      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="w-4 h-4" />
        Criar rede de filiais
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar rede de filiais</DialogTitle>
            <DialogDescription>
              Esta empresa se tornará a primeira filial (matriz) da nova rede.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome da marca</label>
              <Input
                placeholder="Ex: Marca principal"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Nome público da rede (brand_hub)</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome desta unidade</label>
              <Input
                placeholder="Ex: Unidade Centro"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleConvert} disabled={loading} className="flex-1 gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Criar rede
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Painel: brand_hub — gerenciar filiais ────────────────────────────────────

function BrandHubPanel({ brandHubId, toast }: BrandHubPanelProps) {
  const [branches, setBranches] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [settingHQ, setSettingHQ] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    NetworkService.getBrandBranches(brandHubId).then((data) => {
      setBranches(data);
      setLoading(false);
    });
  }, [brandHubId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSetHQ = async (branchId: string) => {
    setSettingHQ(branchId);
    try {
      await NetworkService.setHeadquarters(branchId, brandHubId);
      toast({ title: 'Matriz atualizada' });
      load();
    } catch (err) {
      toast({ title: 'Erro', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSettingHQ(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Filiais da rede</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{branches.length} unidade{branches.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setOpenCreate(true)} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Nova filial
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando filiais...
        </div>
      ) : branches.length === 0 ? (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-dashed border-border">
          <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">Nenhuma filial cadastrada ainda.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {branches.map((branch) => (
            <li key={branch.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {branch.unit_name || branch.business_name}
                  </p>
                  {branch.location_name && (
                    <p className="text-xs text-muted-foreground">{branch.location_name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {branch.is_headquarters ? (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Star className="w-2.5 h-2.5" />
                    Matriz
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 px-2"
                    disabled={settingHQ === branch.id}
                    onClick={() => handleSetHQ(branch.id)}
                  >
                    {settingHQ === branch.id
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : 'Definir matriz'}
                  </Button>
                )}
                <Badge variant={branch.status === 'active' ? 'default' : 'outline'} className="text-xs">
                  {branch.status === 'active' ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CreateBranchDialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        brandHubId={brandHubId}
        toast={toast}
        onCreated={load}
      />
    </div>
  );
}

// ─── Painel: branch — info da rede ───────────────────────────────────────────

function BranchPanel({ branchId, parentBusinessId, toast }: BranchPanelProps) {
  const [siblings, setSiblings] = useState<BranchSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!parentBusinessId) { setLoading(false); return; }
    NetworkService.getBrandBranches(parentBusinessId).then((data) => {
      setSiblings(data.filter((b) => b.id !== branchId));
      setLoading(false);
    });
  }, [parentBusinessId, branchId]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-muted/30">
        <Building2 className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Esta unidade faz parte de uma rede. Gerencie a rede pelo painel da marca.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando irmãs...
        </div>
      ) : siblings.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Outras unidades da rede</p>
          <ul className="space-y-1.5">
            {siblings.map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-sm text-foreground px-2 py-1.5 rounded-md bg-muted/40">
                <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="truncate">{s.unit_name || s.location_name || s.business_name}</span>
                {s.is_headquarters && <Badge variant="secondary" className="text-xs ml-auto">Matriz</Badge>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Dialog: criar filial ─────────────────────────────────────────────────────

function CreateBranchDialog({ open, onClose, brandHubId, toast, onCreated }: CreateBranchDialogProps) {
  const [form, setForm] = useState({
    businessName: '',
    unitName: '',
    slug: '',
    isHQ: false,
  });

  // Seletor territorial em cascata
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationOption | null>(null);

  const { states, cities, neighborhoods, loadingStates, loadingCities, loadingNeighborhoods } =
    useLocationCascade(selectedStateId, selectedCityId);

  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string | boolean | null) => setForm((f) => ({ ...f, [k]: v }));

  // Auto-gerar slug a partir do nome da unidade
  useEffect(() => {
    if (form.unitName) {
      const slug = form.unitName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      set('slug', slug);
    }
  }, [form.unitName]);

  // Preview da URL pública final
  const previewContext = useMemo(() => {
    if (!selectedDistrict?.geographic_path || !form.slug) return null;
    return {
      id: 'preview',
      slug: form.slug,
      geographic_path: selectedDistrict.geographic_path,
    };
  }, [selectedDistrict, form.slug]);
  const { url: urlPreview } = useResolvedBusinessPublicUrl(previewContext);

  // Validações
  const errors = useMemo(() => {
    const e: string[] = [];
    if (!form.businessName.trim()) e.push('Nome da empresa obrigatório');
    if (!form.unitName.trim()) e.push('Nome da unidade obrigatório');
    if (!form.slug.trim()) e.push('Slug obrigatório');
    if (!selectedDistrict) e.push('Selecione o bairro da filial');
    if (selectedDistrict && selectedDistrict.geographic_path.split('/').filter(Boolean).length < 4) {
      e.push('Território inválido: selecione um bairro (não apenas cidade ou estado)');
    }
    return e;
  }, [form, selectedDistrict]);

  const handleCreate = async () => {
    if (errors.length > 0) {
      toast({ title: errors[0], variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await NetworkService.createBranch({
        brandHubId,
        businessName: form.businessName,
        unitName: form.unitName,
        slug: form.slug,
        locationId: selectedDistrict!.id,
        isHeadquarters: form.isHQ,
      });
      toast({ title: 'Filial criada com sucesso' });
      onCreated();
      onClose();
      setForm({ businessName: '', unitName: '', slug: '', isHQ: false });
      setSelectedStateId(null);
      setSelectedCityId(null);
      setSelectedDistrict(null);
    } catch (err) {
      toast({ title: 'Erro ao criar filial', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova filial</DialogTitle>
          <DialogDescription>Crie uma nova unidade vinculada a esta marca.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">

          {/* Nome da empresa */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome da empresa *</label>
            <Input
              placeholder="Ex: Sabor da Bahia"
              value={form.businessName}
              onChange={(e) => set('businessName', e.target.value)}
            />
          </div>

          {/* Nome da unidade */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Nome da unidade *</label>
            <Input
              placeholder="Ex: Unidade Barra"
              value={form.unitName}
              onChange={(e) => set('unitName', e.target.value)}
            />
          </div>

          {/* Slug (auto-gerado, editável) */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Slug público *</label>
            <Input
              placeholder="Ex: sabor-da-bahia-barra"
              value={form.slug}
              onChange={(e) => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            />
            <p className="text-xs text-muted-foreground">Gerado automaticamente. Edite se necessário.</p>
          </div>

          {/* Seletor territorial em cascata */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Território da filial *
            </label>

            {/* Estado */}
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={selectedStateId ?? ''}
              onChange={(e) => {
                setSelectedStateId(e.target.value || null);
                setSelectedCityId(null);
                setSelectedDistrict(null);
              }}
              disabled={loadingStates}
            >
              <option value="">{loadingStates ? 'Carregando estados…' : 'Selecione o estado'}</option>
              {states.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* Cidade */}
            {selectedStateId && (
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedCityId ?? ''}
                onChange={(e) => {
                  setSelectedCityId(e.target.value || null);
                  setSelectedDistrict(null);
                }}
                disabled={loadingCities}
              >
                <option value="">{loadingCities ? 'Carregando cidades…' : 'Selecione a cidade'}</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            {/* Bairro */}
            {selectedCityId && (
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={selectedDistrict?.id ?? ''}
                onChange={(e) => {
                  const found = neighborhoods.find((n) => n.id === e.target.value) ?? null;
                  setSelectedDistrict(found);
                }}
                disabled={loadingNeighborhoods}
              >
                <option value="">{loadingNeighborhoods ? 'Carregando bairros…' : 'Selecione o bairro'}</option>
                {neighborhoods.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            )}

            {/* Território selecionado */}
            {selectedDistrict && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm text-primary font-medium">{selectedDistrict.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{selectedDistrict.geographic_path}</span>
              </div>
            )}
          </div>

          {/* Preview da URL pública */}
          {urlPreview && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                Preview da URL pública
              </label>
              <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border font-mono text-xs text-foreground break-all">
                {urlPreview}
              </div>
            </div>
          )}

          {/* Matriz */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isHQ}
              onChange={(e) => set('isHQ', e.target.checked)}
              className="rounded"
            />
            Definir como matriz desta rede
          </label>

          {/* Erros */}
          {errors.length > 0 && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
              <p className="text-xs text-destructive">{errors[0]}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={handleCreate}
              disabled={loading || errors.length > 0}
              className="flex-1 gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar filial
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
