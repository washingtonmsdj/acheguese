import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  Wrench,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveBusinessDashboardContext } from "../businessDashboardContext";
import {
  BusinessManagementIdentity,
  type BusinessManagementIdentityData,
} from "../components/BusinessManagementIdentity";
import {
  businessCatalogService,
  type BusinessCatalogItem,
  type CatalogInput,
} from "@/core/business/services/businessCatalogService";
import { businessGalleryService } from "@/core/business/services/BusinessGalleryService";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/shared/components/ui/alert-dialog";
import { resolveMediaAssetSource } from "@/shared/media/mediaAssetReference";
import "./BusinessCatalogPage.css";

const EMPTY_ITEM: CatalogInput = {
  kind: "product",
  name: "",
  description: "",
  price: null,
  active: true,
  category: "",
  image: null,
};
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
function catalogPrice(price: number | null) {
  return price === null
    ? "Consultar preço"
    : price === 0
      ? "Gratuito"
      : currency.format(price);
}

export default function BusinessCatalogPage() {
  const { businessId, business, publicUrl } =
    useActiveBusinessDashboardContext();
  const client = useQueryClient();
  const catalog = useQuery({
    queryKey: ["business", "catalog", businessId],
    queryFn: () => businessCatalogService.list(businessId),
  });
  const gallery = useQuery({
    queryKey: ["business-gallery-management", business.business_data_id],
    queryFn: () => businessGalleryService.list(business.business_data_id!),
    enabled: !!business.business_data_id,
  });
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({
        queryKey: ["business", "catalog", businessId],
      }),
      client.invalidateQueries({
        queryKey: ["business", "products", businessId],
      }),
    ]);
  };
  return (
    <BusinessCatalogView
      business={business}
      publicUrl={publicUrl}
      items={catalog.data ?? []}
      isLoading={catalog.isLoading}
      error={catalog.error?.message}
      onRetry={() => void catalog.refetch()}
      photos={(gallery.data ?? []).map((photo) => ({
        value: photo.image_url,
        label: photo.caption || "Foto da galeria",
      }))}
      onSave={async (input, id) => {
        await businessCatalogService.save(businessId, input, id);
        await refresh();
      }}
      onRemove={async (item) => {
        await businessCatalogService.remove(businessId, item);
        await refresh();
      }}
    />
  );
}

interface CatalogViewProps {
  business: BusinessManagementIdentityData;
  publicUrl?: string | null;
  items: BusinessCatalogItem[];
  photos?: { value: string; label: string }[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  onSave: (input: CatalogInput, id?: string) => Promise<void>;
  onRemove: (item: BusinessCatalogItem) => Promise<void>;
}

export function BusinessCatalogView({
  business,
  publicUrl,
  items,
  photos = [],
  isLoading,
  error,
  onRetry,
  onSave,
  onRemove,
}: CatalogViewProps) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [sort, setSort] = useState("recent");
  const [editing, setEditing] = useState<BusinessCatalogItem | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<CatalogInput>(EMPTY_ITEM);
  const [price, setPrice] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState("");
  const [removing, setRemoving] = useState<BusinessCatalogItem | null>(null);
  const filtered = items
    .filter(
      (item) =>
        (kind === "all" || item.kind === kind) &&
        `${item.name} ${item.description} ${item.category}`
          .toLocaleLowerCase("pt-BR")
          .includes(search.trim().toLocaleLowerCase("pt-BR")),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "pt-BR")
        : b.createdAt.localeCompare(a.createdAt),
    );
  const startEditing = (item: BusinessCatalogItem | null) => {
    setEditing(item);
    setDraft(item ?? { ...EMPTY_ITEM });
    setPrice(item?.price == null ? "" : String(item.price));
    setFormError("");
    setOpen(true);
  };
  const run = async (action: () => Promise<void>, success: string) => {
    setPending(true);
    try {
      await action();
      toast.success(success);
      return true;
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir. Tente novamente.",
      );
      return false;
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="business-catalog">
      <BusinessManagementIdentity business={business} publicUrl={publicUrl} />
      <div className="business-catalog__grid">
        <section className="business-catalog__panel">
          <header className="business-catalog__heading">
            <Package aria-hidden="true" />
            <div>
              <h1>Produtos e serviços</h1>
              <p>
                Mostre o que sua empresa oferece. Adicione itens e mantenha a
                disponibilidade atualizada.
              </p>
            </div>
            <Button
              onClick={() => startEditing(null)}
              disabled={pending || isLoading || !!error}
            >
              <Plus size={16} aria-hidden="true" />
              Adicionar item
            </Button>
          </header>
          <div className="business-catalog__filters">
            <label className="business-catalog__search">
              <Search size={16} aria-hidden="true" />
              <Input
                aria-label="Buscar produtos e serviços"
                placeholder="Buscar no catálogo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="Filtrar por tipo"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="all">Todos os tipos</option>
              <option value="product">Produtos</option>
              <option value="service">Serviços</option>
            </select>
            <select
              aria-label="Ordenar catálogo"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Mais recentes</option>
              <option value="name">Nome A–Z</option>
            </select>
          </div>
          <p className="business-catalog__count" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "item" : "itens"}
          </p>
          {isLoading ? (
            <p role="status">Carregando catálogo…</p>
          ) : error ? (
            <div role="alert">
              <p>Não foi possível carregar o catálogo.</p>
              <Button variant="outline" onClick={onRetry}>
                Tentar novamente
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="business-catalog__empty">
              <Package size={32} aria-hidden="true" />
              <h2>
                {items.length
                  ? "Nenhum item encontrado"
                  : "Seu catálogo começa aqui"}
              </h2>
              <p>
                {items.length
                  ? "Tente outro nome ou tipo."
                  : "Cadastre seu primeiro produto ou serviço, sem precisar montar uma loja online."}
              </p>
            </div>
          ) : (
            <ul className="business-catalog__list">
              {filtered.map((item) => (
                <li key={`${item.kind}:${item.id}`}>
                  <CatalogImage item={item} />
                  <div className="business-catalog__copy">
                    <span>
                      {item.kind === "product" ? "Produto" : "Serviço"}
                      {item.category ? ` · ${item.category}` : ""}
                    </span>
                    <h2>{item.name}</h2>
                    {item.description && <p>{item.description}</p>}
                    <strong>{catalogPrice(item.price)}</strong>
                  </div>
                  <div className="business-catalog__actions">
                    <label>
                      <span>{item.active ? "Ativo" : "Inativo"}</span>
                      <Switch
                        checked={item.active}
                        disabled={pending}
                        aria-label={`Disponibilidade de ${item.name}`}
                        onCheckedChange={(active) =>
                          void run(
                            () => onSave({ ...item, active }, item.id),
                            active ? "Item ativado." : "Item desativado.",
                          )
                        }
                      />
                    </label>
                    <div>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Editar ${item.name}`}
                        disabled={pending}
                        onClick={() => startEditing(item)}
                      >
                        <Pencil size={17} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remover ${item.name}`}
                        disabled={pending}
                        onClick={() => setRemoving(item)}
                      >
                        <Trash2 size={17} />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="business-catalog__note">
            <Info size={17} aria-hidden="true" />
            <p>
              As alterações são salvas por item. Preço vazio significa
              “Consultar preço”; zero significa “Gratuito”.
            </p>
          </div>
        </section>
        <aside className="business-catalog__panel business-catalog__preview">
          <header className="business-catalog__heading">
            <Eye aria-hidden="true" />
            <div>
              <h2>Pré-visualização do catálogo</h2>
              <p>Apenas itens ativos são mostrados nesta prévia.</p>
            </div>
          </header>
          <strong className="business-catalog__business-name">
            {business.name}
          </strong>
          <ul>
            {items
              .filter((item) => item.active)
              .slice(0, 4)
              .map((item) => (
                <li key={`${item.kind}:${item.id}`}>
                  <CatalogImage item={item} />
                  <div>
                    <strong>{item.name}</strong>
                    <p>{catalogPrice(item.price)}</p>
                  </div>
                </li>
              ))}
          </ul>
          {!items.some((item) => item.active) && (
            <p>Nenhum item ativo no momento.</p>
          )}
          <div className="business-catalog__note">
            <Info size={17} aria-hidden="true" />
            <p>
              Use descrições claras e fotos reais. Serviços não precisam ter
              preço definido.
            </p>
          </div>
        </aside>
      </div>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!pending) setOpen(value);
        }}
      >
        <DialogContent className="business-catalog__dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar item" : "Adicionar produto ou serviço"}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações que seus clientes precisam saber.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (pending) return;
              const parsed = price.trim()
                ? Number(price.replace(",", "."))
                : null;
              if (parsed !== null && (!Number.isFinite(parsed) || parsed < 0)) {
                setFormError("Informe um preço válido, como 25,50.");
                return;
              }
              setFormError("");
              if (
                await run(
                  () => onSave({ ...draft, price: parsed }, editing?.id),
                  "Item salvo.",
                )
              )
                setOpen(false);
            }}
          >
            <label>
              Tipo
              <select
                value={draft.kind}
                disabled={!!editing || pending}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    kind: e.target.value as CatalogInput["kind"],
                    image: null,
                    category: "",
                  })
                }
              >
                <option value="product">Produto</option>
                <option value="service">Serviço</option>
              </select>
            </label>
            <label>
              Nome
              <Input
                required
                maxLength={120}
                value={draft.name}
                disabled={pending}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <label>
              Descrição curta
              <Textarea
                maxLength={500}
                rows={3}
                value={draft.description}
                disabled={pending}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </label>
            <label>
              Preço (opcional)
              <Input
                inputMode="decimal"
                placeholder="Consultar preço"
                value={price}
                disabled={pending}
                onChange={(e) => setPrice(e.target.value)}
              />
            </label>
            {draft.kind === "product" && (
              <>
                <label>
                  Categoria (opcional)
                  <Input
                    maxLength={80}
                    value={draft.category}
                    disabled={pending}
                    onChange={(e) =>
                      setDraft({ ...draft, category: e.target.value })
                    }
                  />
                </label>
                <label>
                  Foto da galeria (opcional)
                  <select
                    value={draft.image ?? ""}
                    disabled={pending}
                    onChange={(e) =>
                      setDraft({ ...draft, image: e.target.value || null })
                    }
                  >
                    <option value="">Sem foto</option>
                    {draft.image &&
                      !photos.some((photo) => photo.value === draft.image) && (
                        <option value={draft.image}>Foto atual</option>
                      )}
                    {photos.map((photo, index) => (
                      <option key={photo.value} value={photo.value}>
                        {index + 1}. {photo.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="business-catalog__hint">
                  Adicione fotos na seção Fotos da empresa para usá-las aqui.
                </p>
              </>
            )}
            <label className="business-catalog__availability">
              Disponível
              <Switch
                checked={draft.active}
                disabled={pending}
                onCheckedChange={(active) => setDraft({ ...draft, active })}
              />
            </label>
            {formError && <p role="alert">{formError}</p>}
            <footer>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending || !draft.name.trim()}>
                {pending ? "Salvando…" : "Salvar item"}
              </Button>
            </footer>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!removing}
        onOpenChange={(value) => {
          if (!value && !pending) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este item?</AlertDialogTitle>
            <AlertDialogDescription>
              “{removing?.name}” será removido do catálogo. Você também pode
              apenas desativá-lo para mantê-lo cadastrado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={async (event) => {
                event.preventDefault();
                if (
                  removing &&
                  (await run(() => onRemove(removing), "Item removido."))
                )
                  setRemoving(null);
              }}
            >
              {pending ? "Removendo…" : "Remover item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CatalogImage({ item }: { item: BusinessCatalogItem }) {
  const source = resolveMediaAssetSource(item.image);
  const Icon = item.kind === "service" ? Wrench : Package;
  return (
    <div className="business-catalog__image">
      {source ? (
        <img src={source} alt="" loading="lazy" />
      ) : (
        <Icon size={24} aria-hidden="true" />
      )}
    </div>
  );
}
