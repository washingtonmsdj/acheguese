/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  ArrowUp,
  Building2,
  Calendar,
  Car,
  CheckCircle2,
  Globe2,
  Home,
  Users,
  XCircle,
} from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useConfirmActionDialog } from "@/shared/hooks/useConfirmActionDialog";
import { SafeImage, SafeLink } from "@/shared/components/security";
import { logger } from "@/shared/utils/logger";
import { useSessionContext } from "@/core/session";
import {
  BannerService,
  type Banner,
  type CreateBannerInput,
} from "@/core/banners/services/BannerService";

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirmActionDialog();
  const { user, activeProfile } = useSessionContext();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    position: "top",
    page: "home",
    priority: 0,
    is_active: true,
    start_date: "",
    end_date: "",
    background_color: "#ffffff",
    text_color: "#000000",
  });

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      const data = await BannerService.getAllBanners();
      setBanners(data);
    } catch (error) {
      logger.error("Error loading banners", error as Error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os banners",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (!user || !activeProfile) {
        throw new Error("Perfil administrativo ativo obrigatorio");
      }

      let imageUrl = formData.image_url;

      // Se tem arquivo novo, fazer upload
      if (imageFile) {
        setUploading(true);
        imageUrl = await BannerService.uploadBannerImage(activeProfile.id, imageFile);
        setUploading(false);
      }

      const bannerData: CreateBannerInput = {
        title: formData.title,
        description: formData.description || undefined,
        image_url: imageUrl,
        link_url: formData.link_url || undefined,
        position: formData.position as Banner["position"],
        priority: formData.priority,
        starts_at: formData.start_date || undefined,
        ends_at: formData.end_date || undefined,
      };

      if (editingBanner) {
        await BannerService.updateBanner(editingBanner.id, bannerData);
        toast({ title: "Banner atualizado com sucesso!" });
      } else {
        await BannerService.createBanner(bannerData);
        toast({ title: "Banner criado com sucesso!" });
      }

      resetForm();
      loadBanners();
    } catch (error) {
      logger.error("Error saving banner", error as Error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o banner",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirm({
      title: "Excluir banner",
      description: "Este banner sera removido da vitrine e nao aparecera mais no app.",
      confirmLabel: "Excluir",
      variant: "destructive",
    });
    if (!confirmed) return;

    try {
      await BannerService.deleteBanner(id);
      toast({ title: "Banner excluído com sucesso!" });
      loadBanners();
    } catch (error) {
      logger.error("Error deleting banner", error as Error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o banner",
        variant: "destructive",
      });
    }
  }

  async function toggleActive(banner: Banner) {
    try {
      await BannerService.toggleBannerStatus(banner.id, !banner.is_active);
      toast({
        title: banner.is_active ? "Banner desativado" : "Banner ativado",
      });
      loadBanners();
    } catch (error) {
      logger.error("Error toggling banner", error as Error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status",
        variant: "destructive",
      });
    }
  }

  function resetForm() {
    setFormData({
      title: "",
      description: "",
      image_url: "",
      link_url: "",
      position: "top",
      page: "home",
      priority: 0,
      is_active: true,
      start_date: "",
      end_date: "",
      background_color: "#ffffff",
      text_color: "#000000",
    });
    setEditingBanner(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview("");
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function startEdit(banner: Banner) {
    setFormData({
      title: banner.title,
      description: banner.description || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      position: banner.position,
      page: "home",
      priority: banner.priority,
      is_active: banner.is_active,
      start_date: banner.starts_at ? banner.starts_at.split("T")[0] : "",
      end_date: banner.ends_at ? banner.ends_at.split("T")[0] : "",
      background_color: banner.background_color || "#ffffff",
      text_color: banner.text_color || "#000000",
    });
    setEditingBanner(banner);
    setImagePreview(banner.image_url);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banners</h1>
          <p className="text-muted-foreground">
            Gerencie os banners exibidos no app
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Banner
        </Button>
      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-bold mb-4">
            {editingBanner ? "Editar Banner" : "Novo Banner"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Preview da Imagem */}
            {imagePreview && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Preview
                </label>
                <SafeImage
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Upload de Imagem */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Imagem do Banner * {uploading && "(Enviando...)"}
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para selecionar ou arraste a imagem
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG ou WEBP (máx. 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    required={!editingBanner && !imagePreview}
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Link (opcional)
                </label>
                <input
                  type="url"
                  value={formData.link_url}
                  onChange={(e) =>
                    setFormData({ ...formData, link_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Seleção Visual de Página */}
            <div>
              <label className="block text-sm font-medium mb-2">Página *</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: "all", label: "Todas", icon: Globe2 },
                  { value: "home", label: "Home", icon: Home },
                  { value: "community", label: "Comunidade", icon: Users },
                  { value: "mobility", label: "Mobilidade", icon: Car },
                  { value: "business", label: "Negócios", icon: Building2 },
                  { value: "events", label: "Eventos", icon: Calendar },
                ].map((page) => {
                  const PageIcon = page.icon;
                  return (
                  <button
                    key={page.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, page: page.value })
                    }
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.page === page.value
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                  >
                    <PageIcon className="mx-auto mb-1 h-7 w-7 text-primary" aria-hidden="true" />
                    <div className="text-sm font-medium">{page.label}</div>
                  </button>
                  );
                })}
              </div>
            </div>

            {/* Seleção Visual de Posição */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Posição *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: "top", label: "Topo", icon: ArrowUp },
                  { value: "middle", label: "Meio", icon: ArrowLeftRight },
                  { value: "bottom", label: "Rodapé", icon: ArrowDown },
                  { value: "sidebar", label: "Sidebar", icon: ArrowRight },
                ].map((pos) => {
                  const PositionIcon = pos.icon;
                  return (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, position: pos.value })
                    }
                    className={`p-3 border-2 rounded-lg text-center transition-all ${
                      formData.position === pos.value
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-primary/50"
                    }`}
                  >
                    <PositionIcon className="mx-auto mb-1 h-6 w-6 text-primary" aria-hidden="true" />
                    <div className="text-sm font-medium">{pos.label}</div>
                  </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Prioridade
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maior número = maior prioridade
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="flex items-center gap-2 h-10">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {formData.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" aria-hidden="true" />
                      )}
                      {formData.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data Início
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Descrição opcional do banner..."
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading}>
                {uploading
                  ? "Enviando..."
                  : editingBanner
                    ? "Atualizar"
                    : "Criar"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="bg-card p-4 rounded-lg border flex items-center gap-4"
          >
            <SafeImage
              src={banner.image_url}
              alt={banner.title}
              className="w-32 h-20 object-cover rounded"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{banner.title}</h3>
                {banner.is_active ? (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                    Ativo
                  </span>
                ) : (
                  <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-1 rounded">
                    Inativo
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {banner.description}
              </p>
              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                <span>Página: n/a</span>
                <span>Posição: {banner.position}</span>
                <span>Prioridade: {banner.priority}</span>
                <span>👁️ {banner.view_count}</span>
                <span>🖱️ {banner.click_count}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => toggleActive(banner)}
              >
                {banner.is_active ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              {banner.link_url && (
                <Button size="sm" variant="outline" asChild>
                  <SafeLink
                    href={banner.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </SafeLink>
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEdit(banner)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(banner.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {banners.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum banner cadastrado
          </div>
        )}
      </div>
      <ConfirmDialog />
    </div>
  );
}
