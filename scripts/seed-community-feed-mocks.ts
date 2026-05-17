#!/usr/bin/env tsx
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });

const MARKER = "[MOCK_FEED_SEED_V1]";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing env: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type ProfileRow = { id: string; user_id: string | null; name: string | null };
type LocationRow = { id: string; name: string; parent_id: string | null; slug: string | null };
const COMPLEXO_SLUGS = [
  "nordeste-de-amaralina",
  "chapada-do-rio-vermelho",
  "santa-cruz",
  "vale-das-pedrinhas",
];

function addMarker(text: string) {
  return `${MARKER} ${text}`;
}

async function tableExists(table: string): Promise<boolean> {
  const { error } = await sb.from(table).select("id").limit(1);
  if (!error) return true;
  return !String(error.message).includes("schema cache");
}

async function resolveTerritories(): Promise<{ districts: LocationRow[]; cityId: string | null }> {
  const districtResult = await sb
    .from("locations")
    .select("id,name,parent_id,slug")
    .eq("type", "district")
    .eq("status", "active")
    .ilike("geographic_path", "%/ba/salvador/%")
    .in("slug", COMPLEXO_SLUGS)
    .order("name", { ascending: true });

  if (districtResult.error || !districtResult.data?.length) {
    throw new Error(`Could not resolve Complexo districts in Salvador: ${districtResult.error?.message ?? "not found"}`);
  }

  const bySlug = new Map((districtResult.data as LocationRow[]).map((d) => [d.slug, d]));
  const ordered = COMPLEXO_SLUGS.map((slug) => bySlug.get(slug)).filter(Boolean) as LocationRow[];
  if (ordered.length !== 4) {
    throw new Error(`Expected 4 bairros do Complexo, found ${ordered.length}.`);
  }
  return { districts: ordered, cityId: ordered[0].parent_id };
}

async function resolveProfiles(districtIds: string[], cityId: string | null): Promise<ProfileRow[]> {
  const locationIds = cityId ? [...districtIds, cityId] : [...districtIds];
  const firstPass = await sb
    .from("profiles")
    .select("id,user_id,name")
    .eq("profile_type", "personal")
    .in("location_id", locationIds)
    .limit(20);

  if (!firstPass.error && (firstPass.data?.length ?? 0) >= 3) {
    return firstPass.data as ProfileRow[];
  }

  const fallback = await sb
    .from("profiles")
    .select("id,user_id,name")
    .eq("profile_type", "personal")
    .limit(20);

  if (fallback.error || !fallback.data?.length) {
    throw new Error(`Could not resolve personal profiles: ${fallback.error?.message ?? "none found"}`);
  }

  return fallback.data as ProfileRow[];
}

async function cleanupPreviousMocks() {
  await sb.from("posts").delete().ilike("content", `%${MARKER}%`);
  await sb.from("events").delete().ilike("title", `%${MARKER}%`);
  await sb.from("community_alerts").delete().ilike("title", `%${MARKER}%`);
  await sb.from("vagas").delete().ilike("titulo", `%${MARKER}%`);

  if (await tableExists("work_opportunities")) {
    await sb.from("work_opportunities").delete().ilike("headline", `%${MARKER}%`);
  }
}

async function seedEvents(organizerProfileId: string, districts: LocationRow[]) {
  const today = new Date();
  const titles = [
    "Feira gastronomica de bairro",
    "Mutirao de limpeza comunitaria",
    "Encontro de talentos locais",
    "Roda de conversa empreendedora",
  ];
  const rows = [1, 2, 3, 4].map((d, i) => ({
    organizer_profile_id: organizerProfileId,
    title: addMarker(`${titles[i]} • ${districts[i % districts.length].name}`),
    description: "Evento mock para validar distribuicao territorial no feed.",
    date: new Date(today.getTime() + d * 24 * 3600 * 1000).toISOString(),
    location_id: districts[i % districts.length].id,
    location: districts[i % districts.length].name,
    status: "upcoming",
    category: i === 0 ? "gastronomia" : i === 1 ? "comunidade" : "networking",
    current_participants: 0,
    is_free: true,
  }));

  const { error } = await sb.from("events").insert(rows);
  if (error) throw new Error(`Failed to seed events: ${error.message}`);
}

async function seedAlerts(profileId: string, districts: LocationRow[]) {
  const titles = [
    "Falta de agua em algumas ruas desde cedo",
    "Transito intenso proximo ao mercado central",
    "Iluminacao publica oscilando em trecho residencial",
    "Coleta de lixo atrasada na area",
  ];
  const rows = titles.map((title, i) => ({
    profile_id: profileId,
    title: addMarker(`${title} • ${districts[i % districts.length].name}`),
    description: "Alerta mock para testes do feed e filtros de alertas.",
    type: "other",
    status: "open",
    location_id: districts[i % districts.length].id,
    neighborhood_display: districts[i % districts.length].name,
    city: "Salvador",
  }));

  const { error } = await sb.from("community_alerts").insert(rows);
  if (error) throw new Error(`Failed to seed community_alerts: ${error.message}`);
}

async function seedVagas(ownerProfileId: string, districts: LocationRow[]) {
  const slugBase = `mock-feed-${Date.now().toString().slice(-8)}`;
  const rows = [
    {
      owner_profile_id: ownerProfileId,
      titulo: addMarker("Pizzaiolo para turno noturno"),
      descricao: "Vaga mock para operacao local e validacao de circulacao no feed.",
      empresa: "Forno da Esquina",
      categoria: "Alimentacao",
      contrato: "CLT",
      modalidade: "Presencial",
      nivel: "Pleno",
      location_id: districts[0].id,
      bairro_id: districts[0].id,
      bairro_nome: districts[0].name,
      slug: `${slugBase}-pizzaiolo`,
      urgencia: "urgente",
      status: "ativa",
      tags: ["pizzaiolo", "bairro", "noturno"],
      beneficios: ["vale transporte", "alimentacao"],
    },
    {
      owner_profile_id: ownerProfileId,
      titulo: addMarker("Eletricista para manutencao predial"),
      descricao: "Vaga mock para testes de matching economico territorial.",
      empresa: "Condominio Horizonte",
      categoria: "Servicos",
      contrato: "PJ",
      modalidade: "Presencial",
      nivel: "Sênior",
      location_id: districts[1].id,
      bairro_id: districts[1].id,
      bairro_nome: districts[1].name,
      slug: `${slugBase}-eletricista`,
      urgencia: "normal",
      status: "ativa",
      tags: ["eletricista", "manutencao", "predial"],
      beneficios: [],
    },
  ];

  const { data, error } = await sb.from("vagas").insert(rows).select("id,titulo,slug");
  if (error) throw new Error(`Failed to seed vagas: ${error.message}`);
  return data ?? [];
}

async function seedPosts(profiles: ProfileRow[], districts: LocationRow[], vagas: Array<{ id: string; titulo: string; slug: string }>) {
  const pick = (i: number) => profiles[i % profiles.length];
  const districtAt = (i: number) => districts[i % districts.length];
  const vagaPostPayload = vagas[0]
    ? {
        vaga: {
          id: vagas[0].id,
          target_url: `/vagas/${vagas[0].id}`,
          title: vagas[0].titulo,
        },
      }
    : null;

  const rows: Record<string, unknown>[] = [
    {
      author_profile_id: pick(0).id,
      type: "text",
      content: addMarker(`Bom dia, bairro! Como esta o movimento no comercio hoje? • ${districtAt(0).name}`),
      location_id: districtAt(0).id,
      reach: "neighborhood",
      tags: ["moradores", "bairro"],
      content_intent: "discussao",
      distribution_channels: ["moradores", "para_voce", "todos"],
    },
    {
      author_profile_id: pick(1).id,
      type: "text",
      content: addMarker(`Alerta: trecho com agua acumulada apos chuva, redobrem atencao. • ${districtAt(1).name}`),
      location_id: districtAt(1).id,
      reach: "neighborhood",
      tags: ["alerta", "chuva"],
      content_intent: "alerta_urgente",
      distribution_channels: ["alertas", "para_voce", "todos"],
    },
    {
      author_profile_id: pick(2).id,
      type: "text",
      content: addMarker(`Padaria da esquina com promocao de cafe da manha ate 10h. • ${districtAt(2).name}`),
      location_id: districtAt(2).id,
      reach: "neighborhood",
      tags: ["promocao", "empresa_local"],
      content_intent: "promocao",
      distribution_channels: ["empresas", "para_voce", "todos"],
    },
    {
      author_profile_id: pick(3).id,
      type: "text",
      content: addMarker(`Mutirao de sabado confirmado na praca central, participe! • ${districtAt(3).name}`),
      location_id: districtAt(3).id,
      reach: "neighborhood",
      tags: ["evento", "mutirao"],
      content_intent: "evento",
      distribution_channels: ["eventos", "moradores", "para_voce", "todos"],
    },
    {
      author_profile_id: pick(4).id,
      type: "text",
      content: addMarker(`Procuro trabalho como pizzaiolo para inicio imediato na regiao. • ${districtAt(0).name}`),
      location_id: districtAt(0).id,
      reach: "neighborhood",
      tags: ["trabalho", "pizzaiolo"],
      content_intent: "oportunidade",
      display_format: "opportunity_card",
      distribution_channels: ["oportunidades", "moradores", "para_voce", "todos"],
      content_payload: {
        opportunity: {
          id: "mock-opportunity-pizzaiolo",
          type: "looking_for_work",
          headline: "Procuro trabalho como pizzaiolo",
          professional_category: "pizzaiolo",
          territory_location_id: districtAt(0).id,
          territory_name: districtAt(0).name,
          urgency: "24h",
          status: "active",
        },
      },
    },
    {
      author_profile_id: pick(0).id,
      type: "text",
      content: addMarker(`Empresa local contratando auxiliar de cozinha. • ${districtAt(1).name}`),
      location_id: districtAt(1).id,
      reach: "neighborhood",
      tags: ["vaga", "cozinha"],
      content_intent: "vaga",
      distribution_channels: ["oportunidades", "empresas", "para_voce", "todos"],
      ...(vagaPostPayload ? { content_payload: vagaPostPayload } : {}),
    },
  ];

  const { error } = await sb.from("posts").insert(rows);
  if (error) throw new Error(`Failed to seed posts: ${error.message}`);
}

async function seedWorkOpportunities(profiles: ProfileRow[], districts: LocationRow[]) {
  if (!(await tableExists("work_opportunities"))) {
    console.log("work_opportunities table not available in this environment (skipped)");
    return;
  }

  const author = profiles[0];
  const rows = [
    {
      author_profile_id: author.id,
      opportunity_type: "looking_for_work",
      headline: addMarker("Disponivel para servicos de eletricista no bairro"),
      description: "Mock de oportunidade transversal para validar fluxo de economia territorial.",
      professional_category: "eletricista",
      territory_location_id: districts[2].id,
      reach: "neighborhood",
      urgency: "24h",
      availability_notes: "Atendo no mesmo dia",
      visibility: "public_listed",
      status: "active",
      source_context: "community_feed_seed",
      matching_metadata: { seed: true, marker: MARKER },
      published_at: new Date().toISOString(),
    },
    {
      author_profile_id: author.id,
      opportunity_type: "offering_work",
      headline: addMarker("Preciso de pedreiro para diaria de reforma"),
      description: "Mock de demanda local rapida para testes de matching e feed.",
      professional_category: "pedreiro",
      territory_location_id: districts[3].id,
      reach: "neighborhood",
      urgency: "hoje",
      availability_notes: "Inicio imediato",
      visibility: "public_listed",
      status: "active",
      source_context: "community_feed_seed",
      matching_metadata: { seed: true, marker: MARKER },
      published_at: new Date().toISOString(),
    },
  ];

  const { error } = await sb.from("work_opportunities").insert(rows);
  if (error) throw new Error(`Failed to seed work_opportunities: ${error.message}`);
}

async function run() {
  console.log("Seeding feed mocks...");
  const { districts, cityId } = await resolveTerritories();
  const profiles = await resolveProfiles(districts.map((d) => d.id), cityId);

  if (profiles.length < 2) {
    throw new Error("Need at least 2 personal profiles to seed feed mocks.");
  }

  await cleanupPreviousMocks();
  await seedEvents(profiles[0].id, districts);
  await seedAlerts(profiles[1].id, districts);
  const vagas = await seedVagas(profiles[0].id, districts);
  await seedPosts(profiles, districts, vagas as Array<{ id: string; titulo: string; slug: string }>);
  await seedWorkOpportunities(profiles, districts);

  console.log("Feed mock seed completed.");
  console.log(`Marker: ${MARKER}`);
  console.log(`Territories: ${districts.map((d) => `${d.name} (${d.id})`).join(" | ")}`);
}

run().catch((error) => {
  console.error("Seed failed:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
