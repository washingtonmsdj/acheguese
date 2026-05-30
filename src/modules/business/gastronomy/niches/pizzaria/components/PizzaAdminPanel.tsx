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
import { getRecordValue } from "@/shared/utils/recordLookup";
import type { PizzaCatalog, PizzaSize, PizzaFlavor, PizzaEdge, PizzaDough, PizzaPriceRuleType } from "../types";

interface Props {
  businessId: string;
  userId: string;
}

type DialogType = "size" | "flavor" | "edge" | "dough" | "config" | null;

interface ConfigFormData {
  default_price_rule: PizzaPriceRuleType;
  allow_half_half: boolean;
  allow_three_flavors: boolean;
  allow_four_flavors: boolean;
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground">Nenhum registro em {label}.</p>;
}

export function PizzaAdminPanel({ businessId, userId }: Props) {
  const [catalog, setCatalog] = useState<PizzaCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [editingItem, setEditingItem] = useState<PizzaSize | PizzaFlavor | PizzaEdge | PizzaDough | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    max_flavors: "",
    price: "",
    price_adjustment: "",
    is_available: true,
    ingredients: "",
    allergens: "",
    slices: "",
    diameter_cm: "",
    slug: "",
  });

  const [configForm, setConfigForm] = useState<ConfigFormData>({
    default_price_rule: "highest_price",
    allow_half_half: true,
    allow_three_flavors: true,
    allow_four_flavors: true,
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
        description: "description" in item && item.description ? item.description : "",
        base_price: "base_price" in item ? String(item.base_price) : "",
        max_flavors: "max_flavors" in item ? String(item.max_flavors) : "",
        price: "price" in item ? String(item.price) : "",
        price_adjustment: "price_adjustment" in item ? String(item.price_adjustment) : "",
        is_available: "is_available" in item ? item.is_available : true,
        ingredients: "ingredients" in item && item.ingredients ? item.ingredients.join(", ") : "",
        allergens: "allergens" in item && item.allergens ? item.allergens.join(", ") : "",
        slices: "slices" in item && item.slices ? String(item.slices) : "",
        diameter_cm: "diameter_cm" in item && item.diameter_cm ? String(item.diameter_cm) : "",
        slug: "slug" in item && item.slug ? item.slug : "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        base_price: "",
        max_flavors: "",
        price: "",
        price_adjustment: "",
        is_available: true,
        ingredients: "",
        allergens: "",
        slices: "",
        diameter_cm: "",
        slug: "",
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
      toast.error("Nome é obrigatório");
      return;
    }

    setIsSubmitting(true);
    try {
      switch (dialogType) {
        case "size":
          await PizzaAdminService.upsertSize(businessId, {
            id: editingItem?.id,
            name: formData.name,
            slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
            base_price: Number(formData.base_price) || 0,
            max_flavors: Number(formData.max_flavors) || 1,
            slices: formData.slices ? Number(formData.slices) : null,
            diameter_cm: formData.diameter_cm ? Number(formData.diameter_cm) : null,
            display_order: editingItem && "display_order" in editingItem ? editingItem.display_order : catalog?.sizes.length || 0,
            is_available: formData.is_available,
          }, userId);
          toast.success(editingItem ? "Tamanho atualizado" : "Tamanho criado");
          break;
        case "flavor":
          await PizzaAdminService.upsertFlavor(businessId, {
            id: editingItem?.id,
            name: formData.name,
            description: formData.description || null,
            base_price: Number(formData.base_price) || 0,
            ingredients: formData.ingredients.split(",").map((i) => i.trim()).filter(Boolean),
            allergens: formData.allergens.split(",").map((a) => a.trim()).filter(Boolean),
            is_available: formData.is_available,
            is_vegetarian: false,
            is_vegan: false,
            is_spicy: false,
            display_order: editingItem && "display_order" in editingItem ? editingItem.display_order : catalog?.flavors.length || 0,
          }, userId);
          toast.success(editingItem ? "Sabor atualizado" : "Sabor criado");
          break;
        case "edge":
          await PizzaAdminService.upsertEdge(businessId, {
            id: editingItem?.id,
            name: formData.name,
            description: formData.description || null,
            price: Number(formData.price) || 0,
            is_available: formData.is_available,
            display_order: editingItem && "display_order" in editingItem ? editingItem.display_order : catalog?.edges.length || 0,
          }, userId);
          toast.success(editingItem ? "Borda atualizada" : "Borda criada");
          break;
        case "dough":
          await PizzaAdminService.upsertDough(businessId, {
            id: editingItem?.id,
            name: formData.name,
            description: formData.description || null,
            price_adjustment: Number(formData.price_adjustment) || 0,
            is_available: formData.is_available,
            display_order: editingItem && "display_order" in editingItem ? editingItem.display_order : catalog?.doughs.length || 0,
          }, userId);
          toast.success(editingItem ? "Massa atualizada" : "Massa criada");
          break;
        case "config":
          await PizzaAdminService.upsertConfig(businessId, {
            default_price_rule: configForm.default_price_rule,
            allow_half_half: configForm.allow_half_half,
            allow_three_flavors: configForm.allow_three_flavors,
            allow_four_flavors: configForm.allow_four_flavors,
          }, userId);
          toast.success("Configuracoes atualizadas");
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
      if (!type || type === "config") return;

      const tableMap: Record<Exclude<DialogType, null | "config">, "pizza_sizes" | "pizza_flavors" | "pizza_edges" | "pizza_doughs"> = {
        size: "pizza_sizes",
        flavor: "pizza_flavors",
        edge: "pizza_edges",
        dough: "pizza_doughs",
      };

      const tableName = getRecordValue(tableMap, type);
      if (!tableName) return;

      await PizzaAdminService.setAvailability(tableName, item.id, !item.is_available, businessId, userId);
      await loadCatalog();
      toast.success("Status atualizado");
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  const openConfigDialog = () => {
    if (!catalog) return;
    setConfigForm({
      default_price_rule: catalog.config.default_price_rule,
      allow_half_half: catalog.config.allow_half_half,
      allow_three_flavors: catalog.config.allow_three_flavors,
      allow_four_flavors: catalog.config.allow_four_flavors,
    });
    setDialogType("config");
    setDialogOpen(true);
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pizzaria</CardTitle>
          <CardDescription>Configuração do nicho completo de pizzaria</CardDescription>
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
          <CardDescription>Carregando configurações...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Nicho Pizzaria</CardTitle>
            <CardDescription>
              Configure tamanhos, sabores, limites, bordas, massas e regra de preço.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Completo</Badge>
            <Button size="sm" variant="outline" onClick={openConfigDialog}>
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Regra de preço padrão</p>
            <p className="text-sm text-muted-foreground">{catalog.config.default_price_rule}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">Limites ativos</p>
            <p className="text-sm text-muted-foreground">
              2 sabores: {catalog.config.allow_half_half ? "sim" : "não"} · 3 sabores:{" "}
              {catalog.config.allow_three_flavors ? "sim" : "não"} · 4 sabores:{" "}
              {catalog.config.allow_four_flavors ? "sim" : "não"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tamanhos</CardTitle>
            <CardDescription>Broto, pequena, média, grande e família com limite de sabores.</CardDescription>
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
                    até {size.max_flavors} sabor(es) · R$ {size.base_price.toFixed(2)}
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
                    R$ {flavor.base_price.toFixed(2)} · {flavor.is_available ? "disponível" : "indisponível"}
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
              {dialogType === "config"
                ? "Editar Configuracoes"
                : editingItem
                  ? "Editar"
                  : "Adicionar"}{" "}
              {dialogType === "size" && "Tamanho"}
              {dialogType === "flavor" && "Sabor"}
              {dialogType === "edge" && "Borda"}
              {dialogType === "dough" && "Massa"}
            </DialogTitle>
            <DialogDescription>
              {dialogType === "config"
                ? "Configure as regras de preço e limites de sabores."
                : `Preencha os dados abaixo para ${editingItem ? "atualizar" : "criar"} o item.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {dialogType === "config" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="default_price_rule">Regra de preço padrão</Label>
                  <select
                    id="default_price_rule"
                    value={configForm.default_price_rule}
                    onChange={(e) => setConfigForm({ ...configForm, default_price_rule: e.target.value as PizzaPriceRuleType })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="highest_price">Maior preço (padrão)</option>
                    <option value="average_price">Média simples</option>
                    <option value="weighted_average">Média ponderada</option>
                    <option value="fixed_base_plus_flavors">Preço base + sabores</option>
                  </select>
                </div>
                <div className="space-y-3 rounded-lg border p-4">
                  <p className="text-sm font-medium">Limites de sabores permitidos</p>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_half_half" className="text-sm">Permitir 2 sabores (meio a meio)</Label>
                    <Switch
                      id="allow_half_half"
                      checked={configForm.allow_half_half}
                      onCheckedChange={(checked) => setConfigForm({ ...configForm, allow_half_half: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_three_flavors" className="text-sm">Permitir 3 sabores</Label>
                    <Switch
                      id="allow_three_flavors"
                      checked={configForm.allow_three_flavors}
                      onCheckedChange={(checked) => setConfigForm({ ...configForm, allow_three_flavors: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow_four_flavors" className="text-sm">Permitir 4 sabores</Label>
                    <Switch
                      id="allow_four_flavors"
                      checked={configForm.allow_four_flavors}
                      onCheckedChange={(checked) => setConfigForm({ ...configForm, allow_four_flavors: checked })}
                    />
                  </div>
                </div>
              </>
            )}

            {dialogType !== "config" && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Calabresa"
                />
              </div>
            )}

            {(dialogType === "flavor" || dialogType === "edge" || dialogType === "dough") && (
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: molho de tomate, mussarela e manjericão"
                />
              </div>
            )}

            {(dialogType === "size" || dialogType === "flavor") && (
              <div className="space-y-2">
                <Label htmlFor="base_price">Preço base (R$)</Label>
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (identificador único)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Ex: grande-familia (opcional)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_flavors">Máximo de sabores</Label>
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
                  <div className="space-y-2">
                    <Label htmlFor="slices">Número de fatias</Label>
                    <Input
                      id="slices"
                      type="number"
                      min={1}
                      max={24}
                      value={formData.slices}
                      onChange={(e) => setFormData({ ...formData, slices: e.target.value })}
                      placeholder="8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="diameter_cm">Diâmetro (cm)</Label>
                  <Input
                    id="diameter_cm"
                    type="number"
                    min={10}
                    max={80}
                    value={formData.diameter_cm}
                    onChange={(e) => setFormData({ ...formData, diameter_cm: e.target.value })}
                    placeholder="35"
                  />
                </div>
              </>
            )}

            {dialogType === "flavor" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ingredients">Ingredientes (separados por vírgula)</Label>
                  <Input
                    id="ingredients"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="Ex: tomate, mussarela, manjericão"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergens">Alérgenos (separados por vírgula)</Label>
                  <Input
                    id="allergens"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    placeholder="Ex: lactose, glúten"
                  />
                </div>
              </>
            )}

            {dialogType === "edge" && (
              <div className="space-y-2">
                <Label htmlFor="price">Preço (R$)</Label>
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
                <Label htmlFor="price_adjustment">Ajuste de preço (R$)</Label>
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

            {dialogType !== "config" && (
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="is_available">Disponível</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : (dialogType === "config" ? "Salvar" : (editingItem ? "Atualizar" : "Criar"))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
