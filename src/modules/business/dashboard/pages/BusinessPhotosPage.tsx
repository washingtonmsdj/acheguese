import { useMemo, useRef, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  ImagePlus,
  Images,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trash2,
} from "lucide-react";

import { businessManagementRoutes } from "@/core/business/utils/businessManagementRoutes";
import { useActiveBusinessDashboardContext } from "@/modules/business/dashboard/businessDashboardContext";
import { useBusinessGallery } from "@/modules/business/dashboard/hooks/useBusinessGallery";
import type { BusinessGalleryPhoto } from "@/modules/business/dashboard/services/businessGalleryService";
import { resolveMediaAssetSource } from "@/shared/media/mediaAssetReference";
import { getBusinessCategoryLabel } from "@/shared/taxonomy/businessCategories";
import "./BusinessPhotosPage.css";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function BusinessPhotosPage() {
  const { businessId, business, publicUrl } = useActiveBusinessDashboardContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const businessDataId = business.business_data_id;
  const gallery = useBusinessGallery(businessDataId, business.profile_id);
  const photos = gallery.query.data ?? [];
  const featuredPhoto = photos.find((photo) => photo.is_featured) ?? photos[0];
  const featuredSource = resolveMediaAssetSource(featuredPhoto?.image_url) ?? resolveMediaAssetSource(business.banner_url);
  const logoSource = resolveMediaAssetSource(business.logo_url);
  const busy = gallery.upload.isPending || gallery.remove.isPending || gallery.feature.isPending || gallery.reorder.isPending;
  const progress = Math.min(100, (photos.length / gallery.maxPhotos) * 100);
  const locationLabel = [business.location?.name, business.business_city, business.business_state]
    .filter(Boolean)
    .join(" · ");

  const addFiles = (files: FileList | File[]) => {
    if (busy || !gallery.query.isSuccess) return;
    const selected = Array.from(files);
    if (selected.some((file) => !ACCEPTED_TYPES.includes(file.type))) {
      toast.error("Selecione somente imagens JPG, PNG ou WEBP.");
      return;
    }
    if (selected.length + photos.length > gallery.maxPhotos) {
      toast.error(`Você pode adicionar mais ${gallery.maxPhotos - photos.length} fotos.`);
      return;
    }
    if (selected.length) gallery.upload.mutate(selected);
  };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = "";
  };
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  };
  const movePhoto = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= photos.length) return;
    const reordered = [...photos];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    gallery.reorder.mutate(reordered.map((photo) => photo.id));
  };
  const previewThumbs = useMemo(() => photos.filter((photo) => photo.id !== featuredPhoto?.id).slice(0, 3), [featuredPhoto?.id, photos]);

  if (!businessDataId) {
    return (
      <section className="business-photos-empty">
        <Images aria-hidden="true" />
        <h1>Galeria indisponível</h1>
        <p>Conclua os dados principais da empresa antes de adicionar fotos.</p>
        <Link to={businessManagementRoutes.edit(businessId)}>Voltar para editar empresa</Link>
      </section>
    );
  }

  return (
    <div className="business-photos-page">
      <header className="business-photos-heading">
        <div className="business-photos-heading__icon"><Images aria-hidden="true" /></div>
        <div className="business-photos-heading__copy">
          <h1>Fotos da empresa</h1>
          <p>Mostre ambientes, produtos e detalhes reais que ajudam as pessoas a reconhecer seu negócio.</p>
        </div>
        <div className="business-photos-heading__count" aria-label={`${photos.length} de ${gallery.maxPhotos} fotos`}>
          <strong>{photos.length} de {gallery.maxPhotos}</strong>
          <span>fotos</span>
          <div><i style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <div className="business-photos-layout">
        <section className="business-photos-main" aria-label="Gerenciar fotos">
          <input ref={inputRef} type="file" multiple hidden accept="image/jpeg,image/png,image/webp" onChange={onInput} />
          {photos.length < gallery.maxPhotos ? (
            <div
              className="business-photo-upload"
              onDragOver={(event) => event.preventDefault()}
              onDrop={onDrop}
            >
              {gallery.upload.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}
              <div>
                <strong>{gallery.upload.isPending ? "Enviando fotos…" : "Adicionar fotos"}</strong>
                <span>JPG, PNG ou WEBP · máximo de 5 MB por foto</span>
              </div>
              <button type="button" disabled={busy || !gallery.query.isSuccess} onClick={() => inputRef.current?.click()}>
                Selecionar fotos
              </button>
            </div>
          ) : null}

          {gallery.query.isPending ? (
            <div className="business-photo-loading"><Loader2 className="animate-spin" aria-hidden="true" /> Carregando galeria…</div>
          ) : gallery.query.isError ? (
            <div className="business-photo-error">Não foi possível carregar as fotos.<button type="button" onClick={() => gallery.query.refetch()}>Tentar novamente</button></div>
          ) : photos.length === 0 ? (
            <div className="business-photo-zero">
              <Camera aria-hidden="true" />
              <strong>Sua galeria ainda está vazia</strong>
              <span>Adicione fotos reais da empresa. A primeira imagem será usada como capa da galeria.</span>
            </div>
          ) : (
            <section aria-label="Galeria da empresa" className="business-photo-grid">
              {photos.map((photo, index) => (
                <PhotoTile
                  key={photo.id}
                  photo={photo}
                  index={index}
                  total={photos.length}
                  busy={busy}
                  onMove={movePhoto}
                  onFeature={(id) => gallery.feature.mutate(id)}
                  onRemove={(id) => {
                    if (window.confirm("Remover esta foto da galeria?")) gallery.remove.mutate(id);
                  }}
                />
              ))}
            </section>
          )}

          <section className="business-photo-tips" aria-labelledby="photo-tips-title">
            <h2 id="photo-tips-title">Dicas para boas fotos</h2>
            <div>
              <PhotoTip icon={Camera} title="Boa iluminação" text="Imagens claras e nítidas chamam mais atenção." />
              <PhotoTip icon={Images} title="Mostre o espaço" text="Inclua fachada, interior, produtos ou serviços." />
              <PhotoTip icon={ShieldCheck} title="Fotos reais" text="Use imagens do próprio negócio, sem dados sensíveis." />
            </div>
          </section>
        </section>

        <aside className="business-photo-preview" aria-label="Pré-visualização pública">
          <div className="business-photo-preview__title">
            <Sparkles aria-hidden="true" />
            <div><strong>Pré-visualização da galeria</strong><span>A capa da galeria é independente da capa do perfil.</span></div>
          </div>
          <div className="business-photo-preview__cover">
            {featuredSource ? <img src={featuredSource} alt="Foto de capa selecionada" /> : <Store aria-hidden="true" />}
            {featuredPhoto ? <span><Star aria-hidden="true" /> Foto de capa</span> : null}
          </div>
          <div className="business-photo-preview__identity">
            <div className="business-photo-preview__logo">{logoSource ? <img src={logoSource} alt="" /> : <Store aria-hidden="true" />}</div>
            <div><strong>{business.name}</strong><span>{getBusinessCategoryLabel(business.category)}</span></div>
          </div>
          {locationLabel ? <p className="business-photo-preview__location"><MapPin aria-hidden="true" />{locationLabel}</p> : null}
          {previewThumbs.length ? (
            <div className="business-photo-preview__thumbs">
              {previewThumbs.map((photo) => {
                const source = resolveMediaAssetSource(photo.image_url);
                return source ? <img key={photo.id} src={source} alt="" /> : null;
              })}
            </div>
          ) : null}
          {publicUrl ? <Link to={publicUrl}>Ver página pública <ArrowUpRight aria-hidden="true" /></Link> : null}
        </aside>
      </div>
    </div>
  );
}

function PhotoTile({ photo, index, total, busy, onMove, onFeature, onRemove }: {
  photo: BusinessGalleryPhoto;
  index: number;
  total: number;
  busy: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onFeature: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const source = resolveMediaAssetSource(photo.image_url);
  return (
    <article className={`business-photo-tile ${photo.is_featured ? "is-featured" : ""}`}>
      <div className="business-photo-tile__media">
      {source ? <img src={source} alt={photo.caption || `Foto ${index + 1} da empresa`} /> : <div className="business-photo-tile__fallback"><Images aria-hidden="true" /></div>}
      <div className="business-photo-tile__shade" />
      {photo.is_featured ? <span className="business-photo-tile__badge"><Check aria-hidden="true" /> Capa</span> : null}
      <span className="business-photo-tile__position">{index + 1}</span>
      </div>
      <div className="business-photo-tile__actions">
        {!photo.is_featured ? <button type="button" disabled={busy} onClick={() => onFeature(photo.id)} aria-label="Usar como foto de capa" title="Usar como capa"><Star aria-hidden="true" /></button> : null}
        <button type="button" disabled={busy || index === 0} onClick={() => onMove(index, -1)} aria-label="Mover foto para trás" title="Mover para trás"><ArrowLeft aria-hidden="true" /></button>
        <button type="button" disabled={busy || index === total - 1} onClick={() => onMove(index, 1)} aria-label="Mover foto para frente" title="Mover para frente"><ArrowRight aria-hidden="true" /></button>
        <button type="button" disabled={busy} onClick={() => onRemove(photo.id)} aria-label="Remover foto" title="Remover foto"><Trash2 aria-hidden="true" /></button>
      </div>
    </article>
  );
}

function PhotoTip({ icon: Icon, title, text }: { icon: typeof Camera; title: string; text: string }) {
  return <article><Icon aria-hidden="true" /><div><strong>{title}</strong><span>{text}</span></div></article>;
}
