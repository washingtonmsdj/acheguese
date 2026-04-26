import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const CANONICAL_CATEGORIES = new Set([
  "restaurante",
  "mercado",
  "farmacia",
  "saude",
  "educacao",
  "servicos",
  "lazer",
  "outros",
]);

const CANONICAL_CUISINES = new Set([
  "brasileira",
  "italiana",
  "japonesa",
  "chinesa",
  "mexicana",
  "arabe",
  "francesa",
  "portuguesa",
  "indiana",
  "tailandesa",
  "americana",
  "vegetariana",
  "vegana",
  "frutos-do-mar",
  "churrascaria",
  "pizzaria",
  "hamburgueria",
  "hamburguer",
  "lanchonete",
  "cafeteria",
  "padaria",
  "sorveteria",
  "doceria",
  "bar",
  "pub",
  "contemporanea",
  "fusion",
  "regional",
  "baiana",
  "mineira",
  "nordestina",
  "pastel",
  "outros",
]);

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function toBooleanOrNull(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = normalizeText(value);
    if (["true", "1", "yes", "sim"].includes(normalized)) return true;
    if (["false", "0", "no", "nao"].includes(normalized)) return false;
  }
  return null;
}

function inferCategory(raw) {
  const normalized = normalizeText(raw);
  if (!normalized) return "outros";
  if (CANONICAL_CATEGORIES.has(normalized)) return normalized;
  if (normalized.includes("restaur") || normalized.includes("aliment")) return "restaurante";
  if (normalized.includes("farm")) return "farmacia";
  if (normalized.includes("saude")) return "saude";
  if (normalized.includes("educ")) return "educacao";
  if (
    normalized.includes("servic") ||
    normalized.includes("beleza") ||
    normalized.includes("cosmet")
  ) {
    return "servicos";
  }
  if (normalized.includes("lazer")) return "lazer";
  return "outros";
}

function inferCuisine(raw) {
  const normalized = normalizeText(raw).replace(/[_\s]+/g, "-");
  if (!normalized) return "outros";
  const aliases = {
    "frutos-do-mar": "frutos-do-mar",
    "frutos-do-mar-": "frutos-do-mar",
    "frutos-de-mar": "frutos-do-mar",
    "frutos-do--mar": "frutos-do-mar",
  };
  const mapped = aliases[normalized] ?? normalized;
  if (CANONICAL_CUISINES.has(mapped)) return mapped;
  if (mapped.includes("frutos") && mapped.includes("mar")) return "frutos-do-mar";
  if (mapped.includes("pizza")) return "pizzaria";
  return "outros";
}

function titleFromSlug(slug) {
  if (!slug) return null;
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toSlug(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function deterministicPhone(seed, prefix = "+55 71 9") {
  const normalized = normalizeText(seed || "empresa");
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) % 100000000;
  }
  const suffix = String(hash).padStart(8, "0");
  return `${prefix}${suffix}`;
}

function buildFallbackAddress(row, city, state) {
  const baseName = titleFromSlug(row.slug) || titleFromSlug(toSlug(row.business_name)) || "Centro";
  return `Rua ${baseName}, 100 - ${city || "Salvador"} - ${state || "BA"}`;
}

function inferAddressText(row) {
  const metadata = isPlainObject(row.metadata) ? row.metadata : {};
  const fromMeta =
    typeof metadata.business_address === "string" ? metadata.business_address.trim() : "";
  if (fromMeta) return fromMeta;

  const fromBusinessAddress =
    typeof row.business_address === "string" ? row.business_address.trim() : "";
  if (fromBusinessAddress) return fromBusinessAddress;

  const parts = [row.address?.street, row.address?.number, row.address?.complement]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function inferPaymentFlags(paymentMethods, metadata) {
  const methods = toStringArray(paymentMethods).map((item) => normalizeText(item));
  const cardByMethods = methods.some(
    (item) => item.includes("cartao") || item.includes("credito") || item.includes("debito"),
  );
  const pixByMethods = methods.some((item) => item.includes("pix"));
  const cardByMeta = toBooleanOrNull(metadata.aceita_cartao);
  const pixByMeta = toBooleanOrNull(metadata.aceita_pix);

  return {
    aceita_cartao: cardByMeta ?? cardByMethods,
    aceita_pix: pixByMeta ?? pixByMethods,
  };
}

function inferServiceModes(metadata, temDelivery) {
  const existing = toStringArray(metadata.modos_atendimento);
  if (existing.length > 0) return existing;
  return temDelivery ? ["presencial", "delivery"] : ["presencial"];
}

function hasUsefulHours(hours) {
  return isPlainObject(hours) && Object.keys(hours).length > 0;
}

function inferCityState(row) {
  const metadata = isPlainObject(row.metadata) ? row.metadata : {};
  const geo = typeof row.location?.geographic_path === "string" ? row.location.geographic_path : "";
  const segments = geo.split("/").filter(Boolean);
  const stateFromGeo = segments[1] ? String(segments[1]).toUpperCase() : null;
  const cityFromGeo = segments[2] ? titleFromSlug(String(segments[2])) : null;

  const city =
    metadata.city ||
    row.business_city ||
    row.profiles?.city ||
    cityFromGeo ||
    null;
  const state =
    metadata.state ||
    row.business_state ||
    row.profiles?.state ||
    stateFromGeo ||
    null;

  return { city, state };
}

function buildDefaultOpeningHours() {
  return {
    segunda: { open: "11:00", close: "22:00" },
    terca: { open: "11:00", close: "22:00" },
    quarta: { open: "11:00", close: "22:00" },
    quinta: { open: "11:00", close: "22:00" },
    sexta: { open: "11:00", close: "23:00" },
    sabado: { open: "11:00", close: "23:00" },
    domingo: { open: "11:00", close: "21:00" },
  };
}

function buildDefaultMenuItem(cuisineType) {
  const map = {
    baiana: { name: "Prato Baiano da Casa", price: 29.9 },
    brasileira: { name: "Prato Executivo da Casa", price: 32.9 },
    japonesa: { name: "Combinado Especial", price: 49.9 },
    "frutos-do-mar": { name: "Moqueca de Frutos do Mar", price: 54.9 },
    italiana: { name: "Massa Artesanal da Casa", price: 38.9 },
    pizzaria: { name: "Pizza Tradicional da Casa", price: 42.9 },
  };
  return map[cuisineType] ?? { name: "Especial da Casa", price: 34.9 };
}

function normalizeComparable(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldLinkPizzaMenuItem(menuItem, flavors) {
  const categoryName = normalizeComparable(menuItem?.category_name);
  if (categoryName.includes("pizza")) return true;

  const itemName = normalizeComparable(menuItem?.name);
  if (!itemName) return false;

  return flavors.some((flavor) => {
    const flavorName = normalizeComparable(flavor.name);
    return flavorName && (itemName.includes(flavorName) || flavorName.includes(itemName));
  });
}

async function ensureBaseMenuForGastronomyBusiness(businessId, cuisineType) {
  const { data: activeMenus, error: activeMenusError } = await supabase
    .from("menus")
    .select("id")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .limit(1);

  if (activeMenusError) throw activeMenusError;
  if ((activeMenus ?? []).length > 0) return false;

  const { data: createdMenu, error: menuInsertError } = await supabase
    .from("menus")
    .insert({
      business_id: businessId,
      name: "Cardapio Principal",
      description: "Menu base inicial",
      is_active: true,
      display_order: 0,
    })
    .select("id")
    .single();

  if (menuInsertError) throw menuInsertError;

  const { data: createdCategory, error: categoryInsertError } = await supabase
    .from("menu_categories")
    .insert({
      menu_id: createdMenu.id,
      name: "Destaques",
      description: "Selecao inicial de itens",
      display_order: 0,
      is_available: true,
    })
    .select("id")
    .single();

  if (categoryInsertError) throw categoryInsertError;

  const defaultItem = buildDefaultMenuItem(cuisineType);
  const { error: itemInsertError } = await supabase.from("menu_items").insert({
    category_id: createdCategory.id,
    name: defaultItem.name,
    description: "Item inicial para operacao de catalogo",
    base_price: defaultItem.price,
    is_available: true,
    is_featured: true,
    display_order: 0,
    metadata: { seeded_by: "ssot_backfill_20260426" },
  });

  if (itemInsertError) throw itemInsertError;
  return true;
}

async function ensurePizzaMenuItemLinksForBusiness(businessId) {
  const { data: flavors, error: flavorError } = await supabase
    .from("pizza_flavors")
    .select("id, name")
    .eq("business_id", businessId)
    .eq("is_available", true);

  if (flavorError) throw flavorError;
  if (!flavors || flavors.length === 0) return 0;

  const { data: menuItems, error: menuItemError } = await supabase
    .from("menu_items")
    .select(`
      id,
      name,
      category:menu_categories!inner(name, menu:menus!inner(business_id, is_active))
    `)
    .eq("menu_categories.menus.business_id", businessId)
    .eq("menu_categories.menus.is_active", true)
    .eq("is_available", true);

  if (menuItemError) throw menuItemError;
  if (!menuItems || menuItems.length === 0) return 0;

  const upserts = [];
  for (const item of menuItems) {
    const categoryName = item?.category?.name ?? null;
    if (!shouldLinkPizzaMenuItem({ name: item.name, category_name: categoryName }, flavors)) {
      continue;
    }

    upserts.push({
      business_id: businessId,
      menu_item_id: item.id,
      is_buildable: true,
      updated_at: new Date().toISOString(),
    });
  }

  if (upserts.length === 0) return 0;

  const { error: upsertError } = await supabase
    .from("pizza_menu_items")
    .upsert(upserts, { onConflict: "menu_item_id" });

  if (upsertError) throw upsertError;
  return upserts.length;
}

async function run() {
  const { data: businesses, error: businessError } = await supabase
    .from("business_data")
    .select(`
      id,
      profile_id,
      business_name,
      slug,
      category,
      metadata,
      location_id,
      address_id,
      business_address,
      business_city,
      business_state,
      business_zip,
      description,
      email,
      website,
      opening_hours,
      business_hours,
      payment_methods,
      business_role,
      status,
      address:addresses!address_id(street, number, complement, postal_code),
      location:locations!location_id(name, geographic_path),
      profiles:profiles!profile_id(name, phone, whatsapp, city, state, profile_type)
    `)
    .eq("status", "active")
    .in("business_role", ["standalone", "branch", "brand_hub"]);

  if (businessError) throw businessError;

  const { data: gastronomyProfiles, error: gastronomyError } = await supabase
    .from("gastronomy_profiles")
    .select("id, business_id, cuisine_type, niche_key, status, delivery_enabled")
    .eq("status", "active");

  if (gastronomyError) throw gastronomyError;

  const gastronomyMap = new Map(
    (gastronomyProfiles ?? []).map((profile) => [profile.business_id, profile]),
  );
  const defaultLocationId =
    (businesses ?? []).find((row) => typeof row.location_id === "string" && row.location_id)?.location_id ??
    null;

  let businessUpdated = 0;
  let categoryNormalized = 0;
  let metadataBackfilled = 0;
  let openingHoursBackfilled = 0;
  let gastronomyCuisineNormalized = 0;
  let baseMenusCreated = 0;
  let pizzaMenuItemsLinked = 0;

  for (const row of businesses ?? []) {
    const metadata = isPlainObject(row.metadata) ? { ...row.metadata } : {};
    const profile = row.profiles ?? {};
    const profileType = normalizeText(profile.profile_type);
    const canMutateBusinessRow = profileType === "business" || profileType === "empresa";
    const gastronomy = gastronomyMap.get(row.id);
    const inferredCategory = inferCategory(row.category);
    const normalizedCategory =
      gastronomy && inferredCategory === "outros" ? "restaurante" : inferredCategory;
    const categoryChanged = String(row.category ?? "").trim() !== normalizedCategory;

    const inferredAddressText = inferAddressText(row);
    const { city: inferredCity, state: inferredState } = inferCityState(row);
    const city = inferredCity || "Salvador";
    const state = inferredState || "BA";
    const addressText = inferredAddressText || buildFallbackAddress(row, city, state);
    const phone = metadata.phone || profile.phone || deterministicPhone(row.slug || row.business_name);
    const whatsapp =
      metadata.whatsapp || profile.whatsapp || deterministicPhone(row.slug || row.business_name, "55");
    const email =
      row.email ||
      metadata.email ||
      `${toSlug(row.slug || row.business_name || row.id)}@empresas.acheguese.local`;
    const website =
      row.website ||
      metadata.website ||
      `https://${toSlug(row.slug || row.business_name || row.id)}.acheguese.local`;
    const existingTemDelivery = toBooleanOrNull(metadata.tem_delivery);
    const deliveryByProfile = gastronomy?.delivery_enabled === true;
    const temDelivery = existingTemDelivery ?? deliveryByProfile;
    const paymentFlags = inferPaymentFlags(row.payment_methods, metadata);
    const modosAtendimento = inferServiceModes(metadata, Boolean(temDelivery));

    const nextMetadata = {
      ...metadata,
      phone,
      whatsapp,
      email,
      website,
      business_address: metadata.business_address || addressText,
      city,
      state,
      neighborhood: metadata.neighborhood || row.location?.name || null,
      tem_delivery: temDelivery ?? false,
      aceita_cartao: paymentFlags.aceita_cartao,
      aceita_pix: paymentFlags.aceita_pix,
      modos_atendimento: modosAtendimento,
    };

    const nextOpeningHours = hasUsefulHours(row.opening_hours)
      ? row.opening_hours
      : hasUsefulHours(row.business_hours)
        ? row.business_hours
        : buildDefaultOpeningHours();

    const shouldUpdateOpeningHours =
      JSON.stringify(nextOpeningHours ?? null) !== JSON.stringify(row.opening_hours ?? null);

    const metadataChanged =
      JSON.stringify(nextMetadata) !== JSON.stringify(metadata ?? {});

    const payload = {};
    if (categoryChanged) payload.category = normalizedCategory;
    if (metadataChanged) payload.metadata = nextMetadata;
    if (shouldUpdateOpeningHours && nextOpeningHours) payload.opening_hours = nextOpeningHours;
    if (!row.business_address) payload.business_address = addressText;
    if (!row.business_city) payload.business_city = city;
    if (!row.business_state) payload.business_state = state;
    if (!row.business_zip) payload.business_zip = row.address?.postal_code || "40000-000";
    if (row.business_role !== "brand_hub" && !row.location_id && defaultLocationId) {
      payload.location_id = defaultLocationId;
    }
    if (!row.email) payload.email = email;
    if (!row.website) payload.website = website;
    if (!row.description || String(row.description).trim().length < 10) {
      payload.description = `Empresa local ${titleFromSlug(row.slug) || row.business_name || "parceira"} em operacao.`;
    }

    if (Object.keys(payload).length > 0 && canMutateBusinessRow) {
      const { error: updateError } = await supabase
        .from("business_data")
        .update(payload)
        .eq("id", row.id);
      if (updateError) throw updateError;
      businessUpdated += 1;
      if (categoryChanged) categoryNormalized += 1;
      if (metadataChanged) metadataBackfilled += 1;
      if (shouldUpdateOpeningHours) openingHoursBackfilled += 1;
    }
  }

  for (const profile of gastronomyProfiles ?? []) {
    const normalizedCuisine = inferCuisine(profile.cuisine_type);
    const normalizedNicheKey = normalizeText(profile.niche_key || normalizedCuisine || "brasileira");
    const businessRow = (businesses ?? []).find((row) => row.id === profile.business_id);
    const profileType = normalizeText(businessRow?.profiles?.profile_type);
    const canMutateBusinessRow = profileType === "business" || profileType === "empresa";
    const shouldUpdateCuisine = normalizedCuisine !== profile.cuisine_type;
    const shouldUpdateNiche = normalizedNicheKey !== normalizeText(profile.niche_key);
    if ((shouldUpdateCuisine || shouldUpdateNiche) && canMutateBusinessRow) {
      const { error: updateCuisineError } = await supabase
        .from("gastronomy_profiles")
        .update({
          cuisine_type: normalizedCuisine,
          niche_key: normalizedNicheKey,
        })
        .eq("id", profile.id);
      if (updateCuisineError) throw updateCuisineError;
      if (shouldUpdateCuisine) gastronomyCuisineNormalized += 1;
    }
  }

  for (const profile of gastronomyProfiles ?? []) {
    const businessRow = (businesses ?? []).find((row) => row.id === profile.business_id);
    const profileType = normalizeText(businessRow?.profiles?.profile_type);
    const canMutateBusinessRow = profileType === "business" || profileType === "empresa";
    if (!canMutateBusinessRow) continue;

    const created = await ensureBaseMenuForGastronomyBusiness(
      profile.business_id,
      inferCuisine(profile.cuisine_type),
    );
    if (created) baseMenusCreated += 1;

    const isPizzaNiche =
      normalizeText(profile.niche_key) === "pizza" ||
      inferCuisine(profile.cuisine_type) === "pizzaria";
    if (isPizzaNiche) {
      const linkedCount = await ensurePizzaMenuItemLinksForBusiness(profile.business_id);
      pizzaMenuItemsLinked += linkedCount;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        businessUpdated,
        categoryNormalized,
        metadataBackfilled,
        openingHoursBackfilled,
        gastronomyCuisineNormalized,
        baseMenusCreated,
        pizzaMenuItemsLinked,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error("SSOT remote fix failed:", error);
  process.exit(1);
});
