import React from "react";

import { useState } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Badge } from "@/shared/components/ui/badge";
import {
  Plus,
  Percent,
  DollarSign,
  Gift,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Users,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { toast } from "sonner";
import { SUBSCRIPTION_PLAN } from "@/shared/types/constants";
interface Coupon {
  id: string;
  codigo: string;
  titulo: string;
  description: string;
  tipo: "porcentagem" | "valor" | "brinde";
  desconto: string;
  validade: string;
  usos: number;
  maxUsos: number;
  active: boolean;
}

interface CouponManagerProps {
  businessId: string;
  planType: "basico" | "profissional" | "premium_20";
}

export default function CouponManager({
  businessId,
  planType,
}: CouponManagerProps) {
  const [cupons, setCupons] = useState<Coupon[]>([
    {
      id: "1",
      codigo: "BEMVINDO20",
      titulo: "20% OFF na primeira compra",
      description: "Desconto de 20% para novos clientes",
      tipo: "porcentagem",
      desconto: "20%",
      validade: "2026-04-30",
      usos: 23,
      maxUsos: 100,
      active: true,
    },
    {
      id: "2",
      codigo: "FRETEGRATIS",
      titulo: "Frete Grátis",
      description: "Frete grátis em compras acima de R$ 50",
      tipo: "brinde",
      desconto: "Frete grátis",
      validade: "2026-03-31",
      usos: 45,
      maxUsos: 200,
      active: true,
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    titulo: "",
    description: "",
    tipo: "porcentagem" as "porcentagem" | "valor" | "brinde",
    desconto: "",
    validade: "",
    maxUsos: "100",
  });

  // Limites por plano
  const limites = {
    basico: 1,
    profissional: 3,
    premium: -1, // ilimitado
  };

  const limite = limites[planType];
  const cuponsAtivos = cupons.filter((c) => c.active).length;
  const podeAdicionar = limite === -1 || cuponsAtivos < limite;

  const handleSubmit = () => {
    if (!formData.codigo || !formData.titulo) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    if (editingCoupon) {
      setCupons(
        cupons.map((c) =>
          c.id === editingCoupon.id
            ? {
                ...c,
                ...formData,
                maxUsos: parseInt(formData.maxUsos),
              }
            : c,
        ),
      );
      toast.success("Cupom updated!");
    } else {
      const novoCupom: Coupon = {
        id: Date.now().toString(),
        ...formData,
        maxUsos: parseInt(formData.maxUsos),
        usos: 0,
        active: true,
      };
      setCupons([...cupons, novoCupom]);
      toast.success("Cupom created! 🎉");
    }

    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      titulo: "",
      description: "",
      tipo: "porcentagem",
      desconto: "",
      validade: "",
      maxUsos: "100",
    });
    setEditingCoupon(null);
  };

  const handleEdit = (cupom: Coupon) => {
    setEditingCoupon(cupom);
    setFormData({
      codigo: cupom.codigo,
      titulo: cupom.titulo,
      description: cupom.description,
      tipo: cupom.tipo,
      desconto: cupom.desconto,
      validade: cupom.validade,
      maxUsos: cupom.maxUsos.toString(),
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setCupons(cupons.map((c) => (c.id === id ? { ...c, active: false } : c)));
    toast.success("Cupom desativado");
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast.success("Código copiado!");
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "porcentagem":
        return Percent;
      case "valor":
        return DollarSign;
      case "brinde":
        return Gift;
      default:
        return Percent;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "porcentagem":
        return "bg-blue-500/10 text-blue-600";
      case "valor":
        return "bg-green-500/10 text-green-600";
      case "brinde":
        return "bg-purple-500/10 text-purple-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cupons e Promoções</h2>
          <p className="text-muted-foreground">
            Crie cupons para atrair e fidelizar clientes
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} disabled={!podeAdicionar}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cupom
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Editar Cupom" : "Criar Novo Cupom"}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="sr-only">
              Gerenciar cupons de desconto
            </DialogDescription>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Código do Cupom *</Label>
                  <Input
                    placeholder="Ex: BEMVINDO20"
                    value={formData.codigo}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        codigo: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Tipo de Desconto *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(v: "porcentagem" | "valor" | "brinde") =>
                      setFormData({ ...formData, tipo: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="porcentagem">
                        Porcentagem (%)
                      </SelectItem>
                      <SelectItem value="valor">Valor Fixo (R$)</SelectItem>
                      <SelectItem value="brinde">Brinde/Benefício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Título do Cupom *</Label>
                <Input
                  placeholder="Ex: 20% OFF na primeira compra"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva as condições do cupom..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Desconto *</Label>
                  <Input
                    placeholder={
                      formData.tipo === "porcentagem"
                        ? "20"
                        : formData.tipo === "valor"
                          ? "50.00"
                          : "Frete grátis"
                    }
                    value={formData.desconto}
                    onChange={(e) =>
                      setFormData({ ...formData, desconto: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Validade *</Label>
                  <Input
                    type="date"
                    value={formData.validade}
                    onChange={(e) =>
                      setFormData({ ...formData, validade: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Máx. Usos</Label>
                  <Input
                    type="number"
                    value={formData.maxUsos}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUsos: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingCoupon ? "Atualizar" : "Criar Cupom"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Limite do Plano */}
      {limite !== -1 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>
              Plano{" "}
              {planType === SUBSCRIPTION_PLAN.BASICO
                ? "Básico"
                : "Profissional"}
              :
            </strong>{" "}
            Você pode ter até {limite} cupom(ns) active(s).
            {cuponsAtivos >= limite && " Faça upgrade para create mais cupons!"}
          </p>
        </Card>
      )}

      {/* Lista de Cupons */}
      <div className="grid md:grid-cols-2 gap-4">
        {cupons
          .filter((c) => c.active)
          .map((cupom) => {
            const Icon = getTipoIcon(cupom.tipo);
            const percentualUso = (cupom.usos / cupom.maxUsos) * 100;

            return (
              <Card key={cupom.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${getTipoColor(cupom.tipo)}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">{cupom.titulo}</h3>
                      <p className="text-sm text-muted-foreground">
                        {cupom.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(cupom)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(cupom.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <code className="font-mono font-bold text-lg">
                      {cupom.codigo}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copiarCodigo(cupom.codigo)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Desconto
                      </p>
                      <p className="font-bold">{cupom.desconto}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Validade
                      </p>
                      <p className="font-bold">
                        {new Date(cupom.validade).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Usos
                      </p>
                      <p className="font-bold">
                        {cupom.usos}/{cupom.maxUsos}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {percentualUso.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${percentualUso}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
      </div>

      {cupons.filter((c) => c.active).length === 0 && (
        <Card className="p-12 text-center">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold mb-2">Nenhum cupom created</h3>
          <p className="text-muted-foreground mb-4">
            Crie cupons para atrair novos clientes e aumentar suas vendas
          </p>
          <Button onClick={() => setDialogOpen(true)} disabled={!podeAdicionar}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Cupom
          </Button>
        </Card>
      )}
    </div>
  );
}
