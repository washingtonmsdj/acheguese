import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Accessibility,
  ArrowRight,
  BadgeDollarSign,
  Camera,
  ChevronDown,
  Clock3,
  CreditCard,
  ExternalLink,
  Facebook,
  Globe2,
  Heart,
  Home,
  Info,
  Instagram,
  MapPin,
  Menu,
  MessageCircle,
  Navigation,
  PackageCheck,
  Phone,
  Search,
  Share2,
  ShoppingBag,
  Star,
  Store,
  Utensils,
} from "lucide-react";
import { AUTH_PATHS } from "@/core/auth/constants/authFlow";
import { getPhysicalBusinessCoordinates } from "@/core/business/utils/physicalBusinessCoordinates";
import { LazyMiniMap } from "@/core/maps/components/LazyMiniMap";
import type { PublicSnapshotInstitutional } from "@/core/business/types/publicSnapshots";
import type {
  BusinessExtended,
  NearbyBusiness,
  OpenStatus,
  Product,
} from "@/modules/business/company/sections/types";

import "./TerritoryBusinessDetail.css";

interface TerritoryBusinessDetailProps {
  business: BusinessExtended;
  institutional: PublicSnapshotInstitutional;
  products: readonly Product[];
  nearbyBusinesses: readonly NearbyBusiness[];
  openStatus: OpenStatus;
  territoryName: string;
  territoryUrl: string;
  businessDirectoryUrl: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
  onRoute: () => void;
  onMessage?: () => void;
}

function BrandMark() {
  return (
    <span className="bd-brand-mark" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

function SectionTitle({
  icon: Icon,
  children,
  action,
}: {
  icon: ComponentType<{ className?: string }>;
  children: string;
  action?: ReactNode;
}) {
  return (
    <div className="bd-section-title">
      <div><Icon /><h2>{children}</h2></div>
      {action}
    </div>
  );
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

function normalizeUrl(value?: string) {
  if (!value) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^@/, "")}`;
}

function socialUrl(network: "instagram" | "facebook", value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  const cleaned = value.replace(/^@/, "").replace(/^\/+|\/+$/g, "");
  if (cleaned.includes(`${network}.com`)) return `https://${cleaned}`;
  const handle = cleaned;
  return `https://${network}.com/${handle}`;
}

function whatsappUrl(value?: string) {
  if (!value) return undefined;
  const digits = value.replace(/\D/g, "");
  if (!digits) return undefined;
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}

function humanizeLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function TerritoryBusinessDetail({
  business,
  institutional,
  products,
  nearbyBusinesses,
  openStatus,
  territoryName,
  territoryUrl,
  businessDirectoryUrl,
  isFavorite,
  onToggleFavorite,
  onShare,
  onRoute,
  onMessage,
}: TerritoryBusinessDetailProps) {
  const category = humanizeLabel(business.subcategoria || business.category || "Empresa local");
  const normalizedCategory = `${business.category || ""} ${business.subcategoria || ""}`.toLowerCase();
  const isFoodBusiness = ["aliment", "gastr", "restaurante", "lanch", "padaria"].some((term) => normalizedCategory.includes(term));
  const CatalogIcon = isFoodBusiness ? Utensils : ShoppingBag;
  const PrimaryContactIcon = isFoodBusiness ? Utensils : MessageCircle;
  const primaryContactLabel = isFoodBusiness ? "Fazer pedido" : "Entrar em contato";
  const cover = business.banner_url || institutional.photos[0];
  const gallery = institutional.photos.slice(0, 3);
  const visibleProducts = products.filter((product) => product.active !== false).slice(0, 6);
  const related = nearbyBusinesses.filter((item) => item.id !== business.id).slice(0, 3);
  const phone = institutional.phone || business.phone;
  const whatsapp = institutional.whatsapp || business.whatsapp;
  const address = institutional.addressText || business.business_address || "Endereço não informado";
  const location = institutional.locationText || business.location?.full_name || territoryName;
  const rating = institutional.rating || business.rating || 0;
  const reviewCount = institutional.reviewCount || business.total_reviews || 0;
  const paymentMethods = [
    ...(business.aceita_pix ? ["PIX"] : []),
    ...(business.aceita_cartao ? ["Cartão"] : []),
    ...(business.formas_pagamento || []),
  ].filter((item, index, array) => array.findIndex((value) => value.toLowerCase() === item.toLowerCase()) === index);
  const tags = [category, ...(business.especialidades || []), ...(business.facilidades || [])]
    .map(humanizeLabel)
    .slice(0, 6);
  const todayHours = openStatus.todayHours || "Horário sob consulta";
  const displayedOpenStatus = openStatus.todayHours ? openStatus.open : null;
  const openStatusLabel = displayedOpenStatus === true
    ? "Aberto agora"
    : displayedOpenStatus === false
      ? "Fechado agora"
      : "Horário não informado";
  const headerLocation = [business.business_city, business.business_state]
    .filter(Boolean)
    .join(", ") || "Salvador, BA";
  const whatsappHref = whatsappUrl(whatsapp);
  const serviceModes = (business.modos_atendimento || ["Presencial"])
    .map(humanizeLabel)
    .join(", ");
  const shortDescription = business.description?.split(".")[0]?.trim() || "Negócio local";
  const heroDescription = shortDescription.length > 82
    ? `${shortDescription.slice(0, 79).trimEnd()}…`
    : shortDescription;
  const physicalCoordinates = getPhysicalBusinessCoordinates(business);
  const territoryLatitude = business.location?.canonical_lat;
  const territoryLongitude = business.location?.canonical_lng;
  const territoryCoordinates =
    typeof territoryLatitude === "number" && Number.isFinite(territoryLatitude) &&
    typeof territoryLongitude === "number" && Number.isFinite(territoryLongitude)
      ? { latitude: territoryLatitude, longitude: territoryLongitude }
      : null;
  const mapCoordinates = physicalCoordinates || territoryCoordinates;
  const isTerritoryReference = !physicalCoordinates && Boolean(territoryCoordinates);

  return (
    <div className="bd-page">
      <a className="bd-skip-link" href="#bd-content">Pular para o conteúdo</a>

      <header className="bd-header">
        <div className="bd-container bd-header-inner">
          <Link className="bd-brand" to="/" aria-label="Achegue-se — início">
            <BrandMark /><strong>achegue-se</strong>
          </Link>
          <nav className="bd-main-nav" aria-label="Navegação principal">
            <Link to={`${territoryUrl}/perto-de-mim`}>Por perto</Link>
            <Link to="/como-funciona">Como funciona</Link>
            <Link to={businessDirectoryUrl}>Para negócios</Link>
          </nav>
          <Link className="bd-global-search" to={`${territoryUrl}/busca`}>
            <Search /><span>Buscar empresas, serviços, lugares...</span>
          </Link>
          <Link className="bd-location" to={territoryUrl}>
            <MapPin /><span>{headerLocation}</span><ChevronDown />
          </Link>
          <Link className="bd-login" to={AUTH_PATHS.login}>Entrar <ArrowRight /></Link>
          <details className="bd-mobile-menu">
            <summary aria-label="Abrir menu"><Menu /><span>Menu</span></summary>
            <nav>
              <Link to={territoryUrl}>Território</Link>
              <Link to={businessDirectoryUrl}>Empresas</Link>
              <Link to="/como-funciona">Como funciona</Link>
            </nav>
          </details>
        </div>
      </header>

      <main id="bd-content">
        <section className={`bd-hero ${institutional.photos.length > 0 ? "has-gallery" : ""}`}>
          {cover ? <img className="bd-hero-cover" src={cover} alt="" /> : <div className="bd-hero-cover bd-hero-fallback" />}
          <div className="bd-hero-overlay" />
          <div className="bd-container bd-hero-inner">
            <p className="bd-breadcrumb">
              <Home /><Link to={territoryUrl}>{territoryName}</Link><span>›</span>
              <Link to={businessDirectoryUrl}>Empresas</Link><span>›</span><b>{business.name}</b>
            </p>

            <div className="bd-business-intro">
              <div className="bd-logo-card">
                {business.logo_url ? <img src={business.logo_url} alt={`Logo de ${business.name}`} /> : <Store />}
                <span className={displayedOpenStatus === false ? "is-closed" : ""}>
                  {openStatusLabel}
                </span>
              </div>
              <div className="bd-title-block min-w-0">
                <span className={`bd-mobile-status ${displayedOpenStatus === false ? "is-closed" : ""}`}>{openStatusLabel}</span>
                <h1 className="break-words">{business.name}</h1>
                <p>{category} <i>•</i> {heroDescription}</p>
                <div className="bd-rating-row">
                  <strong><Star /> {rating.toFixed(1)}</strong>
                  <span>({reviewCount} avaliações)</span>
                  <button type="button" onClick={onToggleFavorite} aria-pressed={isFavorite}>
                    <Heart className={isFavorite ? "is-filled" : ""} /> {isFavorite ? "Salvo" : "Salvar"}
                  </button>
                  <button type="button" onClick={onShare}><Share2 /> Compartilhar</button>
                </div>
              </div>
            </div>

            {institutional.photos.length > 0 ? (
              <div className="bd-gallery-preview" aria-label="Fotos da empresa">
                {gallery.map((photo, index) => <img key={photo} src={photo} alt={`${business.name}, foto ${index + 1}`} />)}
                <a href="#fotos" className="bd-more-photos"><Camera /><span>{institutional.photos.length} fotos</span></a>
              </div>
            ) : null}
          </div>
        </section>

        <nav className="bd-section-nav" aria-label="Seções da empresa">
          <div className="bd-container">
            <a className="is-active" href="#visao-geral"><Home /> Visão geral</a>
            <a href="#produtos"><ShoppingBag /> Produtos e serviços</a>
            <a href="#avaliacoes"><Star /> Avaliações</a>
            {institutional.photos.length > 0 ? <a href="#fotos"><Camera /> Fotos</a> : null}
            <a href="#localizacao"><MapPin /> Localização</a>
            <a href="#informacoes"><Info /> Informações</a>
          </div>
        </nav>

        <div className="bd-container bd-content-grid">
          <div className="bd-primary-column">
            <section className="bd-overview-grid" id="visao-geral">
              <article className="bd-card bd-about-card">
                <SectionTitle icon={Store}>Sobre</SectionTitle>
                <p>{business.description || `${business.name} faz parte da rede de negócios locais de ${territoryName}.`}</p>
                <div className="bd-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              </article>

              <article className="bd-card bd-facts-card" id="informacoes">
                <div className="bd-fact"><Clock3 /><span><strong>{displayedOpenStatus === true ? "Aberto agora" : displayedOpenStatus === false ? "Fechado agora" : "Funcionamento"}</strong><small>{todayHours}</small></span></div>
                <div className="bd-fact"><BadgeDollarSign /><span><strong>Faixa de preço</strong><small>{business.price_band_label || "Consulte a empresa"}</small></span></div>
                <div className="bd-fact"><Accessibility /><span><strong>Acessibilidade</strong><small>{business.facilidades?.some((item) => item.toLowerCase().includes("acess")) ? "Entrada acessível" : "Consulte a empresa"}</small></span></div>
                <div className="bd-fact"><CreditCard /><span><strong>Formas de pagamento</strong><small>{paymentMethods.slice(0, 4).map(humanizeLabel).join(", ") || "Consulte a empresa"}</small></span></div>
                <div className="bd-fact"><PackageCheck /><span><strong>Atendimento</strong><small>{serviceModes}</small></span></div>
              </article>
            </section>

            <section className="bd-card bd-products" id="produtos">
              <SectionTitle icon={CatalogIcon}>Produtos e serviços</SectionTitle>
              {visibleProducts.length ? (
                <div className="bd-product-grid">
                  {visibleProducts.map((product) => (
                    <article key={product.id}>
                      <div className="bd-product-image">
                        {product.image_url ? <img src={product.image_url} alt={product.name} /> : <CatalogIcon />}
                      </div>
                      <strong>{product.name}</strong>
                      <span>{formatPrice(product.promotional_price ?? product.price)}</span>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="bd-empty"><ShoppingBag /><span><strong>Catálogo em atualização</strong><small>Entre em contato para conhecer os produtos e serviços.</small></span></div>
              )}
            </section>

            {institutional.photos.length > 0 ? (
              <section className="bd-card bd-photo-section" id="fotos">
                <SectionTitle icon={Camera}>Fotos</SectionTitle>
                <div>{institutional.photos.slice(0, 4).map((photo, index) => <img src={photo} alt={`${business.name}, foto ${index + 1}`} key={photo} />)}</div>
              </section>
            ) : null}

            <section className="bd-card bd-reviews" id="avaliacoes">
              <SectionTitle icon={Star} action={<button type="button">Avaliar</button>}>Avaliações</SectionTitle>
              {reviewCount > 0 ? (
                <div className="bd-review-summary">
                  <div><strong>{rating.toFixed(1)}</strong><span>{Array.from({ length: 5 }).map((_, index) => <Star key={index} className={index < Math.round(rating) ? "is-filled" : ""} />)}</span><small>{reviewCount} avaliações</small></div>
                  <div className="flex flex-col gap-1 text-xs text-[#587276]">
                    <strong className="text-sm text-[#173f43]">Nota média da comunidade</strong>
                    <span>Calculada a partir de {reviewCount} {reviewCount === 1 ? "avaliação publicada" : "avaliações publicadas"}.</span>
                  </div>
                  <p>As avaliações ajudam moradores e visitantes a descobrirem os melhores negócios do território.</p>
                </div>
              ) : (
                <div className="bd-empty"><Star /><span><strong>Ainda não há avaliações</strong><small>Se você conhece este lugar, compartilhe sua experiência.</small></span></div>
              )}
            </section>
          </div>

          <aside className="bd-side-column">
            <section className="bd-card bd-location-card" id="localizacao">
              <SectionTitle icon={MapPin} action={<Link to={`${territoryUrl}/mapa`}>Ver no mapa <ExternalLink /></Link>}>Localização</SectionTitle>
              <Link className="bd-map-preview" to={`${territoryUrl}/mapa`} aria-label="Abrir mapa do território">
                {mapCoordinates ? (
                  <>
                    <LazyMiniMap
                      latitude={mapCoordinates.latitude}
                      longitude={mapCoordinates.longitude}
                      title={physicalCoordinates ? business.name : territoryName}
                      description={physicalCoordinates ? address : "Referência central do território"}
                      zoom={physicalCoordinates ? 16 : 14}
                      height="100%"
                      className="h-full w-full"
                      markerColor={physicalCoordinates ? "#ef4640" : "#078b8f"}
                      showControls={false}
                      interactive={false}
                      fallbackClassName="bg-[#edf3f2]"
                    />
                    <span className={`bd-map-context ${isTerritoryReference ? "is-territory" : ""}`}>
                      {isTerritoryReference ? "Referência do território" : "Localização da empresa"}
                    </span>
                  </>
                ) : (
                  <span className="bd-map-unavailable"><MapPin /><strong>Coordenadas ainda não informadas</strong></span>
                )}
              </Link>
              <div className="bd-address"><MapPin /><span><strong>{address}</strong><small>{location}</small></span></div>
              <button className="bd-route-button" type="button" onClick={onRoute}><Navigation /> Como chegar</button>
            </section>

            {phone || whatsappHref || onMessage ? (
              <section className="bd-card bd-contact-card">
                <SectionTitle icon={Phone}>Contato</SectionTitle>
                {phone ? <a className="bd-phone" href={`tel:${phone.replace(/\D/g, "")}`}><Phone /><span><strong>{phone}</strong><small>Toque para ligar</small></span></a> : null}
                {whatsappHref || (phone && onMessage) ? (
                  <div className={`bd-contact-actions ${phone ? "" : "!mt-0"}`}>
                    {whatsappHref ? <a href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a> : null}
                    {phone && onMessage ? <button type="button" onClick={onMessage}><MessageCircle /> Mensagem</button> : null}
                  </div>
                ) : null}
                {whatsappHref || onMessage ? (
                  <button className="bd-order-button" type="button" onClick={whatsappHref ? () => window.open(whatsappHref, "_blank", "noopener,noreferrer") : onMessage}>
                    <PrimaryContactIcon /> {primaryContactLabel} <ArrowRight />
                  </button>
                ) : null}
              </section>
            ) : null}

            {(business.instagram || business.facebook || institutional.website) ? (
              <section className="bd-card bd-social-card">
                <SectionTitle icon={Globe2}>Redes e site</SectionTitle>
                <div>
                  {business.instagram ? <a href={socialUrl("instagram", business.instagram)} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram /></a> : null}
                  {business.facebook ? <a href={socialUrl("facebook", business.facebook)} target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook /></a> : null}
                  {institutional.website ? <a href={normalizeUrl(institutional.website)} target="_blank" rel="noreferrer" aria-label="Site"><ExternalLink /></a> : null}
                </div>
              </section>
            ) : null}

            {related.length > 0 ? (
              <section className="bd-card bd-related-card">
                <SectionTitle icon={Store} action={<Link to={businessDirectoryUrl}>Ver todas <ArrowRight /></Link>}>Empresas relacionadas</SectionTitle>
                <div className="bd-related-grid">
                  {related.map((item) => (
                    <Link to={item.canonicalUrl || businessDirectoryUrl} key={item.id}>
                      <div>{item.imageUrl || item.logoUrl ? <img src={item.imageUrl || item.logoUrl || ""} alt="" /> : <Store />}</div>
                      <strong>{item.name}</strong><small>{item.category}</small><span>{item.distance || item.locationLabel || territoryName} · <b>★ {item.rating.toFixed(1)}</b></span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}
