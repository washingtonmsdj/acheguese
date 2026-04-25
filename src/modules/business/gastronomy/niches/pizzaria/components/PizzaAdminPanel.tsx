import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { PizzaAdminService } from "../PizzaAdminService";
import { toast } from "sonner";
import type { PizzaCatalog, PizzaSize, PizzaFlavor, PizzaEdge, PizzaDough } from "../types";

interface Props {
  businessId: string;
}

type DialogType = "size" | "flavor" | "edge" | "dough" | null;

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">Nenhum registro em {label}.</p>;
}

export function PizzaAdminPanel({ businessId }: Props) {
  const [catalog, setCatalog] = useState<PizzaCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [editingItem, setEditingItem] = useState<PizzaSize | PizzaFlavor | PizzaEdge | PizzaDough | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    base_price: "",
    max_flavors: "",
    price: "",
    price_adjustment: "",
    is_available: true,
  });

  const loadCatalog = async () => {
    try {
      const data = await PizzaAdminService.getCatalog(businessId);
      setCatalog(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar Pizzaria.");
    }
  };

  useEffect(() => {
    let mounted = true;

    PizzaAdminService.getCatalog(businessId)
      .then((data) => {
        if (mounted) setCatalog(data);
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Falha ao carregar Pizzaria.");
        }
      });

    return () => {
      mounted = false;
    };
  }, [businessId]);

  const openDialog = (type: DialogType, item?: PizzaSize | PizzaFlavor | PizzaEdge | PizzaDough) => {
    setDialogType(type);
    setEditingItem(item || null);
    if (item) {
      setFormData({
        name: item.name,
        base_price: "base_price" in item ? String(item.base_price) : "",
        max_flavors: "max_flavors" in item ? String(item.max_flavors) : "",
        price: "price" in item ? String(item.price) : "",
        price_adjustment: "price_adjustment" in item ? String(item.price_adjustment) : "",
        is_available: "is_available" in item ? item.is_available : true,
      });
    } else {
      setFormData({
        name: "",
        base_price: "",
        max_flavors: "",
        price: "",
        price_adjustment: "",
        is_available: true,
      });
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }

    setIsSubmitting(true);
    try {
      switch (dialogType) {
        case "size":
          await PizzaAdminService.upsertSize({
            id: editingItem?.id,
            business_id: businessId,
            name: formData.name,
            base_price: Number(formData.base_price) || 0,
            max_flavors: Number(formData.max_flavors) || 1,
            sort_order: editingItem && "sort_order" in editingItem ? editingItem.sort_order : catalog?.sizes.length || 0,
            is_available: formData.is_available,
          });
          toast.success(editingItem ? "Tamanho atualizado" : "Tamanho criado");
          break;
        case "flavor":
          await PizzaAdminService.upsertFlavor({
            id: editingItem?.id,
            business_id: businessId,
            name: formData.name,
            base_price: Number(formData.base_price) || 0,
            ingredients: [],
            allergens: [],
            is_available: formData.is_available,
          });
          toast.success(editingItem ? "Sabor atualizado" : "Sabor criado");
          break;
        case "edge":
          await PizzaAdminService.upsertEdge({
            id: editingItem?.id,
            business_id: businessId,
            name: formData.name,
            price: Number(formData.price) || 0,
            is_available: formData.is_available,
          });
          toast.success(editingItem ? "Borda atualizada" : "Borda criada");
          break;
        case "dough":
          await PizzaAdminService.upsertDough({
            id: editingItem?.id,
            business_id: businessId,
            name: formData.name,
            price_adjustment: Number(formData.price_adjustment) || 0,
            is_available: formData.is_available,
          });
          toast.success(editingItem ? "Massa atualizada" : "Massa criada");
          break;
      }
      await loadCatalog();
      closeDialog();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (type: DialogType, item: PizzaSize | PizzaFlavor | PizzaEdge | PizzaDough) => {
    try {
      await PizzaAdminService.setAvailability(type, item.id, !item.is_available);
      await loadCatalog();
      toast.success("Status atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pizzaria</CardTitle>
          <CardDescription>Configuracao do nicho completo de pizzaria</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!catalog) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pizzaria</CardTitle>
          <CardDescription>Carregando configuracoes...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Nicho Pizzaria</CardTitle>
              <CardDescription>
                Configure tamanhos, sabores, limites, bordas, massas e regra de preco.
              </CardDescription>
            </div>
            <Badge>Completo</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Regra de preco padrao</p>
            <p className="text-sm text-muted-foreground">{catalog.config.default_price_rule}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Limites ativos</p>
            <p className="text-sm text-muted-foreground">
              2 sabores: {catalog.config.allow_half_half ? "sim" : "nao"} · 3 sabores:{" "}
              {catalog.config.allow_three_flavors ? "sim" : "nao"} · 4 sabores:{" "}
              {catalog.config.allow_four_flavors ? "sim" : "nao"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tamanhos</CardTitle>
            <CardDescription>Broto, pequena, media, grande e familia com limite de sabores.</CardDescription>
          </div>
          <Button size="sm" onClick={() => openDialog("size")}>Adicionar</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {catalog.sizes.length ? (
            catalog.sizes.map((size) => (
              <div key={size.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={size.is_available}
                    onCheckedChange={() => handleToggleAvailability("size", size)}
                  />
                  <span className="font-medium">{size.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    ate {size.max_flavors} sabor(es) · R$ {size.base_price.toFixed(2)}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => openDialog("size", size)}>Editar</Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState label="tamanhos" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sabores</CardTitle>
            <CardDescription>Sabores podem ser marcados como indisponiveis sem remover historico.</CardDescription>
          </div>
          <Button size="sm" onClick={() => openDialog("flavor")}>Adicionar</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {catalog.flavors.length ? (
            catalog.flavors.map((flavor) => (
              <div key={flavor.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={flavor.is_available}
                    onCheckedChange={() => handleToggleAvailability("flavor", flavor)}
                  />
                  <span className="font-medium">{flavor.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    R$ {flavor.base_price.toFixed(2)} · {flavor.is_available ? "disponivel" : "indisponivel"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => openDialog("flavor", flavor)}>Editar</Button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState label="sabores" />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Bordas</CardTitle>
              <CardDescription>Catupiry, cheddar, chocolate e outras.</CardDescription>
            </div>
            <Button size="sm" onClick={() => openDialog("edge")}>Adicionar</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {catalog.edges.length ? (
              catalog.edges.map((edge) => (
                <div key={edge.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={edge.is_available}
                      onCheckedChange={() => handleToggleAvailability("edge", edge)}
                    />
                    <span className="font-medium">{edge.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">R$ {edge.price.toFixed(2)}</span>
                    <Button variant="ghost" size="sm" onClick={() => openDialog("edge", edge)}>Editar</Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState label="bordas" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Massas</CardTitle>
              <CardDescription>Tradicional, fina, pan e outras massas.</CardDescription>
            </div>
            <Button size="sm" onClick={() => openDialog("dough")}>Adicionar</Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {catalog.doughs.length ? (
              catalog.doughs.map((dough) => (
                <div key={dough.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={dough.is_available}
                      onCheckedChange={() => handleToggleAvailability("dough", dough)}
                    />
                    <span className="font-medium">{dough.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      + R$ {dough.price_adjustment.toFixed(2)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => openDialog("dough", dough)}>Editar</Button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState label="massas" />
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar" : "Adicionar"}{" "}
              {dialogType === "size" && "Tamanho"}
              {dialogType === "flavor" && "Sabor"}
              {dialogType === "edge" && "Borda"}
              {dialogType === "dough" && "Massa"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para {editingItem ? "atualizar" : "criar"} o item.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Calabresa"
              />
            </div>
            {(dialogType === "size" || dialogType === "flavor") && (
              <div className="space-y-2">
                <Label htmlFor="base_price">Preco base (R$)</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}
            {dialogType === "size" && (
              <div className="space-y-2">
                <Label htmlFor="max_flavors">Maximo de sabores</Label>
                <Input
                  id="max_flavors"
                  type="number"
                  min={1}
                  max={4}
                  value={formData.max_flavors}
                  onChange={(e) => setFormData({ ...formData, max_flavors: e.target.value })}
                  placeholder="1"
                />
              </div>
            )}
            {dialogType === "edge" && (
              <div className="space-y-2">
                <Label htmlFor="price">Preco (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}
            {dialogType === "dough" && (
              <div className="space-y-2">
                <Label htmlFor="price_adjustment">Ajuste de preco (R$)</Label>
                <Input
                  id="price_adjustment"
                  type="number"
                  step="0.01"
                  value={formData.price_adjustment}
                  onChange={(e) => setFormData({ ...formData, price_adjustment: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                id="is_available"
                checked={formData.is_available}
                onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
              />
              <Label htmlFor="is_available">Disponivel</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : (editingItem ? "Atualizar" : "Criar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
