import React, { useState, useEffect } from "react";
import { adminPickupPointsService } from "@/core/admin/services/AdminPickupPointsService";
import type { PickupPoint } from "@/core/admin/services/AdminPickupPointsService";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Navigation,
  School,
  Church,
  Building2,
  Square,
  Bus,
  Landmark,
  MoreHorizontal,
  Check,
  X,
  Accessibility,
  Lightbulb,
  Armchair,
  Home,
  Shield,
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { toast } from "sonner";
import { useAdminGuard } from "@/modules/admin/hooks/useAdminGuard";

const typeConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string }
> = {
  bus_stop: {
    icon: <Bus className="h-4 w-4" />,
    label: "Ponto de Ônibus",
    color: "text-blue-400 bg-blue-500/10",
  },
  landmark: {
    icon: <Landmark className="h-4 w-4" />,
    label: "Ponto de Referência",
    color: "text-purple-400 bg-purple-500/10",
  },
  square: {
    icon: <Square className="h-4 w-4" />,
    label: "Praça",
    color: "text-green-400 bg-green-500/10",
  },
  school: {
    icon: <School className="h-4 w-4" />,
    label: "Escola",
    color: "text-yellow-400 bg-yellow-500/10",
  },
  church: {
    icon: <Church className="h-4 w-4" />,
    label: "Igreja",
    color: "text-pink-400 bg-pink-500/10",
  },
  commercial: {
    icon: <Building2 className="h-4 w-4" />,
    label: "Comercial",
    color: "text-orange-400 bg-orange-500/10",
  },
  other: {
    icon: <MoreHorizontal className="h-4 w-4" />,
    label: "Outro",
    color: "text-gray-400 bg-gray-500/10",
  },
};

export default function AdminPontosEmbarque() {
  const { canModerate, isChecking } = useAdminGuard();
  const [points, setPoints] = useState<PickupPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPoint, setEditingPoint] = useState<PickupPoint | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    neighborhood: "Nordeste de Amaralina",
    latitude: -12.9833,
    longitude: -38.4667,
    type: "bus_stop",
    capacity: 10,
    has_shelter: false,
    has_bench: false,
    has_lighting: false,
    accessibility: false,
    active: true,
    notes: "",
  });

  useEffect(() => {
    if (!isChecking && canModerate) {
      fetchPoints();
    }
  }, [canModerate, isChecking]);

  // Validação de admin
  if (!isChecking && !canModerate) {
    return (
      <div className="min-h-screen bg-[#0A0F14] flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acesso Negado</h1>
          <p className="text-gray-400">
            Apenas administradores podem acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  const fetchPoints = async () => {
    try {
      const data = await adminPickupPointsService.getAllPickupPoints();
      setPoints(data);
    } catch (error: any) {
      toast.error("Erro ao carregar pontos", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPoint) {
        await adminPickupPointsService.updatePickupPoint(
          editingPoint.id,
          formData,
        );
        toast.success("Ponto atualizado com sucesso!");
      } else {
        await adminPickupPointsService.createPickupPoint(formData);
        toast.success("Ponto criado com sucesso!");
      }

      setShowModal(false);
      setEditingPoint(null);
      resetForm();
      fetchPoints();
    } catch (error: any) {
      toast.error("Erro ao salvar ponto", { description: error.message });
    }
  };

  const handleEdit = (point: PickupPoint) => {
    setEditingPoint(point);
    setFormData({
      name: point.name,
      description: point.description || "",
      address: point.address,
      neighborhood: point.neighborhood,
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
      type: point.type,
      capacity: point.capacity,
      has_shelter: point.has_shelter,
      has_bench: point.has_bench,
      has_lighting: point.has_lighting,
      accessibility: point.accessibility,
      active: point.active,
      notes: point.notes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este ponto?")) return;

    try {
      await adminPickupPointsService.deletePickupPoint(id);
      toast.success("Ponto excluído com sucesso!");
      fetchPoints();
    } catch (error: any) {
      toast.error("Erro ao excluir ponto", { description: error.message });
    }
  };

  const toggleActive = async (point: PickupPoint) => {
    try {
      await adminPickupPointsService.togglePickupPointActive(
        point.id,
        !point.active,
      );
      toast.success(point.active ? "Ponto desativado" : "Ponto ativado");
      fetchPoints();
    } catch (error: any) {
      toast.error("Erro ao atualizar status", { description: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      neighborhood: "Nordeste de Amaralina",
      latitude: -12.9833,
      longitude: -38.4667,
      type: "bus_stop",
      capacity: 10,
      has_shelter: false,
      has_bench: false,
      has_lighting: false,
      accessibility: false,
      active: true,
      notes: "",
    });
  };

  const openCreateModal = () => {
    setEditingPoint(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Carregando...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="h-6 w-6 text-teal-400" />
            Pontos de Embarque
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Gerencie os pontos de embarque do bairro
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="bg-teal-500 hover:bg-teal-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Ponto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-white/10 bg-[#1E2529] p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-teal-400" />
            <span className="text-xs text-gray-400">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{points.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1E2529] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-gray-400">Ativos</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {points.filter((p) => p.active).length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1E2529] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Accessibility className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-gray-400">Acessíveis</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {points.filter((p) => p.accessibility).length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1E2529] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Home className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-gray-400">Com Abrigo</span>
          </div>
          <p className="text-2xl font-bold text-purple-400">
            {points.filter((p) => p.has_shelter).length}
          </p>
        </div>
      </div>

      {/* Points List */}
      {points.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#1E2529] p-12 text-center">
          <MapPin className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">Funcionalidade não disponível</p>
          <p className="text-sm text-gray-500">
            A tabela pickup_points não existe no banco de dados
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {points.map((point) => {
          const typeInfo = typeConfig[point.type] || typeConfig.other;

          return (
            <div
              key={point.id}
              className={cn(
                "rounded-xl border bg-[#1E2529] p-4 transition-all",
                point.active ? "border-white/10" : "border-white/5 opacity-60",
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg", typeInfo.color)}>
                    {typeInfo.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {point.name}
                    </h3>
                    <p className="text-xs text-gray-500">{typeInfo.label}</p>
                  </div>
                </div>
                <Badge
                  className={cn(
                    "text-xs",
                    point.active
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-gray-500/20 text-gray-400",
                  )}
                >
                  {point.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {/* Address */}
              <p className="text-xs text-gray-400 mb-3">{point.address}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {point.has_shelter && (
                  <Badge className="bg-purple-500/10 text-purple-400 text-xs">
                    <Home className="h-3 w-3 mr-1" /> Abrigo
                  </Badge>
                )}
                {point.has_bench && (
                  <Badge className="bg-blue-500/10 text-blue-400 text-xs">
                    <Armchair className="h-3 w-3 mr-1" /> Banco
                  </Badge>
                )}
                {point.has_lighting && (
                  <Badge className="bg-yellow-500/10 text-yellow-400 text-xs">
                    <Lightbulb className="h-3 w-3 mr-1" /> Luz
                  </Badge>
                )}
                {point.accessibility && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 text-xs">
                    <Accessibility className="h-3 w-3 mr-1" /> Acessível
                  </Badge>
                )}
              </div>

              {/* Info */}
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span>Cap: {point.capacity}</span>
                <span>•</span>
                <span>
                  {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(point)}
                  className="flex-1 h-8 text-xs"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleActive(point)}
                  className="h-8 px-3"
                >
                  {point.active ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(point.id)}
                  className="h-8 px-3 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          );
        })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#1E2529] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-400" />
              {editingPoint ? "Editar Ponto" : "Novo Ponto"}
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="sr-only">
            Gerenciar pontos de embarque
          </DialogDescription>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome */}
            <div>
              <Label className="text-xs text-gray-400">Nome do Ponto *</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Ponto da Praça"
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <Label className="text-xs text-gray-400">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional do ponto"
                className="bg-white/5 border-white/10 min-h-[60px]"
              />
            </div>

            {/* Endereço */}
            <div>
              <Label className="text-xs text-gray-400">Endereço *</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Rua, número"
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            {/* Bairro */}
            <div>
              <Label className="text-xs text-gray-400">Bairro *</Label>
              <Input
                value={formData.neighborhood}
                onChange={(e) =>
                  setFormData({ ...formData, neighborhood: e.target.value })
                }
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            {/* Coordenadas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-400">Latitude *</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: parseFloat(e.target.value),
                    })
                  }
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
              <div>
                <Label className="text-xs text-gray-400">Longitude *</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: parseFloat(e.target.value),
                    })
                  }
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
            </div>

            {/* Tipo */}
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Tipo *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: key })}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border-2 text-xs transition-all",
                      formData.type === key
                        ? `${cfg.color} border-opacity-60`
                        : "border-white/10 text-gray-400 hover:bg-white/5",
                    )}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Capacidade */}
            <div>
              <Label className="text-xs text-gray-400">Capacidade *</Label>
              <Input
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    capacity: parseInt(e.target.value),
                  })
                }
                className="bg-white/5 border-white/10"
                required
              />
            </div>

            {/* Features */}
            <div className="space-y-3">
              <Label className="text-xs text-gray-400">Características</Label>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-purple-400" />
                  <span className="text-sm">Possui abrigo/cobertura</span>
                </div>
                <Switch
                  checked={formData.has_shelter}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_shelter: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Armchair className="h-4 w-4 text-blue-400" />
                  <span className="text-sm">Possui banco</span>
                </div>
                <Switch
                  checked={formData.has_bench}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_bench: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-400" />
                  <span className="text-sm">Possui iluminação</span>
                </div>
                <Switch
                  checked={formData.has_lighting}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, has_lighting: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Accessibility className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm">Acessível para cadeirantes</span>
                </div>
                <Switch
                  checked={formData.accessibility}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, accessibility: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-teal-400" />
                  <span className="text-sm">Ponto ativo</span>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
              </div>
            </div>

            {/* Notas */}
            <div>
              <Label className="text-xs text-gray-400">Notas Internas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Observações internas (não visível para usuários)"
                className="bg-white/5 border-white/10 min-h-[60px]"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-500 hover:bg-teal-600"
              >
                {editingPoint ? "Atualizar" : "Criar"} Ponto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
