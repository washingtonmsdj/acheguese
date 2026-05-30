import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { useSessionContext } from "@/core/session";
import { useAppUrls } from "@/core/routing/hooks/useAppUrls";
import { classifiedUrlService, getClassifiedById, updateClassified } from "@/modules/classifieds/services";

export default function EditarClassificadoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeProfile } = useSessionContext();
  const appUrls = useAppUrls();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "sold">("active");

  const { data, isLoading, error } = useQuery({
    queryKey: ["classified-edit", id],
    queryFn: async () => {
      if (!id) {
        return null;
      }
      return getClassifiedById(id);
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!data) return;
    setTitle(data.title || "");
    setDescription(data.description || "");
    setPrice(String(data.price ?? ""));
    setCategory(data.category || "");
    setCondition(data.condition || "");
    setNeighborhood(data.neighborhood || "");
    setStatus((data.status as "active" | "inactive" | "sold") || "active");
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!id || !activeProfile?.id) {
        throw new Error("Perfil ativo obrigatório");
      }

      return updateClassified(id, activeProfile.id, {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category: category.trim(),
        condition: condition.trim(),
        neighborhood: neighborhood.trim(),
        status,
      });
    },
    onSuccess: (updatedClassified) => {
      toast.success("Classificado atualizado com sucesso");
      navigate(classifiedUrlService.buildPublicUrl(updatedClassified) ?? appUrls.classifieds.list);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar classificado");
    },
  });

  useEffect(() => {
    if (!activeProfile) {
      navigate(appUrls.auth.login);
    }
  }, [activeProfile, navigate, appUrls.auth.login]);

  if (!activeProfile) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        <h1 className="text-2xl font-bold">Editar classificado</h1>
        <p className="text-sm text-destructive">Não foi possível carregar o anúncio.</p>
        <Button variant="outline" onClick={() => navigate(appUrls.classifieds.list)}>
          Voltar para classificados
        </Button>
      </div>
    );
  }

  if (data.seller_id !== activeProfile.id) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-3">
        <h1 className="text-2xl font-bold">Acesso negado</h1>
        <p className="text-sm text-muted-foreground">
          Você só pode editar classificados vinculados ao perfil ativo.
        </p>
        <Button variant="outline" onClick={() => navigate(appUrls.classifieds.list)}>
          Voltar para classificados
        </Button>
      </div>
    );
  }

  const disabled =
    mutation.isPending ||
    !title.trim() ||
    !description.trim() ||
    !category.trim() ||
    !condition.trim() ||
    Number(price) <= 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold font-display">Editar Classificado</h1>
        <p className="text-sm text-muted-foreground">
          Atualize os dados públicos e o status operacional do anúncio.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do anúncio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input id="title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              rows={5}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as "active" | "inactive" | "sold")}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="sold">Vendido</option>
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="condition">Condição</Label>
              <Input
                id="condition"
                value={condition}
                onChange={(event) => setCondition(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input
              id="neighborhood"
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => navigate(classifiedUrlService.buildPublicUrl(data) ?? appUrls.classifieds.list)}
            >
              Cancelar
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={disabled}>
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
