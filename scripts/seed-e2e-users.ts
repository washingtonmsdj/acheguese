#!/usr/bin/env tsx
/**
 * Script para criar usuários de teste E2E no Supabase
 * 
 * Uso:
 *   npm run seed:e2e          # Criar usuários (idempotente)
 *   npm run seed:e2e:reset    # Deletar e recriar usuários
 *   npm run seed:e2e:verbose  # Logs detalhados
 */

import type { User } from "@supabase/supabase-js";
import {
  createServiceRoleClient,
  issuePrivateAlphaInvite,
  loadSupabaseScriptEnv,
} from "./lib/supabase-client";

// Carregar variáveis de ambiente
const E2E_ENV_FILES = [".env.test", ".env.local"];
loadSupabaseScriptEnv(E2E_ENV_FILES);

interface SeedOptions {
  reset?: boolean;
  verbose?: boolean;
}

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: "user" | "admin";
}

interface SeedStateRow {
  id: string;
  name: string;
}

interface SeedCityRow {
  id: string;
  name: string;
  state_id: string | null;
  states?: SeedStateRow | SeedStateRow[] | null;
}

interface SeedNeighborhoodRow {
  id: string;
  name: string;
  city_id: string | null;
  cities?: SeedCityRow | SeedCityRow[] | null;
}

function resolveSeedCity(row: SeedNeighborhoodRow | null): SeedCityRow | null {
  if (!row?.cities) return null;
  return Array.isArray(row.cities) ? (row.cities[0] ?? null) : row.cities;
}

function resolveSeedStateName(city: SeedCityRow | null): string | null {
  if (!city?.states) return null;
  const state = Array.isArray(city.states) ? city.states[0] : city.states;
  return state?.name ?? null;
}

const TEST_USERS: TestUser[] = [
  {
    email: process.env.E2E_USER_EMAIL || "e2e-user@example.com",
    password: process.env.E2E_USER_PASSWORD || "E2eTest@2024!",
    fullName: "E2E Test User",
    role: "user",
  },
  {
    email: process.env.E2E_ADMIN_EMAIL || "e2e-admin@example.com",
    password: process.env.E2E_ADMIN_PASSWORD || "E2eAdmin@2024!",
    fullName: "E2E Test Admin",
    role: "admin",
  },
];

async function seedE2EUsers(options: SeedOptions = {}) {
  const { reset = false, verbose = false } = options;

  // Validar variáveis de ambiente
  const supabase = createServiceRoleClient({ envFiles: E2E_ENV_FILES });

  console.log("🚀 Iniciando seed de usuários E2E...\n");

  // Buscar um bairro de teste para associar aos perfis (opcional)
  const { data: neighborhoods } = await supabase
    .from("neighborhoods")
    .select("id, name, city_id, cities(id, name, state_id, states(id, name))")
    .limit(1)
    .single();

  let neighborhoodId = null;
  let cityId = null;
  let stateId = null;
  const seedNeighborhood = (neighborhoods as SeedNeighborhoodRow | null) ?? null;
  const seedCity = resolveSeedCity(seedNeighborhood);
  const seedStateName = resolveSeedStateName(seedCity);

  if (seedNeighborhood) {
    neighborhoodId = seedNeighborhood.id;
    cityId = seedNeighborhood.city_id;
    stateId = seedCity?.state_id ?? null;

    if (verbose) {
      console.log(`📍 Usando localização de teste:`);
      console.log(`   Bairro: ${seedNeighborhood.name}`);
      console.log(`   Cidade: ${seedCity?.name ?? "N/A"}`);
      console.log(`   Estado: ${seedStateName ?? "N/A"}\n`);
    }
  } else {
    console.log(`⚠️  Aviso: Nenhum bairro encontrado no banco`);
    console.log(`   Criando usuários sem dados territoriais\n`);
  }

  for (const testUser of TEST_USERS) {
    console.log(`👤 Processando: ${testUser.email} (${testUser.role})`);

    // Verificar se usuário já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = ((existingUsers?.users ?? []) as User[]).find(
      (u) => u.email === testUser.email
    );

    if (existingUser && !reset) {
      console.log(`   ℹ️  Usuário já existe (ID: ${existingUser.id})`);
      console.log(`   ✅ Pulando criação (use --reset para recriar)\n`);
      continue;
    }

    if (existingUser && reset) {
      console.log(`   🗑️  Deletando usuário existente...`);
      
      // Deletar role primeiro (se existir)
      const { error: roleDeleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", existingUser.id);

      if (roleDeleteError && verbose) {
        console.log(`   ⚠️  Aviso ao deletar role: ${roleDeleteError.message}`);
      }

      // Deletar perfil (devido a foreign key)
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", existingUser.id);

      if (profileError && verbose) {
        console.log(`   ⚠️  Aviso ao deletar perfil: ${profileError.message}`);
      }

      // Deletar usuário
      const { error: userError } = await supabase.auth.admin.deleteUser(
        existingUser.id
      );

      if (userError) {
        console.error(`   ❌ Erro ao deletar usuário: ${userError.message}`);
        throw new Error(`Erro ao deletar usuário existente: ${userError.message}`);
      }

      console.log(`   ✅ Usuário deletado`);
    }

    // Criar novo usuário
    console.log(`   📝 Criando usuário...`);
    await issuePrivateAlphaInvite(supabase, testUser.email, "e2e_seed");
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: testUser.email,
        password: testUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: testUser.fullName,
        },
      });

    if (createError || !newUser.user) {
      console.error(`   ❌ Erro ao criar usuário: ${createError?.message}`);
      throw new Error(`Erro ao criar usuário E2E: ${createError?.message}`);
    }

    console.log(`   ✅ Usuário criado (ID: ${newUser.user.id})`);

    // O trigger handle_new_user cria o perfil pessoal; aqui garantimos os dados E2E.
    console.log(`   📝 Atualizando perfil...`);
    const { data: savedProfile, error: profileError } = await supabase.from("profiles").update({
      name: testUser.fullName,
      display_name: testUser.fullName,
      profile_type: "personal",
      neighborhood: neighborhoodId ? seedNeighborhood?.name ?? null : null,
      city: neighborhoodId ? seedCity?.name ?? null : null,
      location_id: neighborhoodId,
    }).eq("user_id", newUser.user.id).eq("profile_type", "personal").select("id").maybeSingle();

    if (profileError || !savedProfile) {
      const errorMessage = profileError?.message ?? "perfil pessoal nao encontrado apos criar usuario";
      console.error(`   ❌ Erro ao criar perfil: ${errorMessage}`);
      
      // Tentar deletar usuário órfão
      await supabase.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Erro ao salvar perfil E2E: ${errorMessage}`);
    }

    console.log(`   ✅ Perfil atualizado`);

    // Se for admin, adicionar role na tabela user_roles
    if (testUser.role === "admin") {
      console.log(`   📝 Adicionando role de admin...`);
      const { data: existingAdminRole, error: roleLookupError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", newUser.user.id)
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();

      if (roleLookupError) {
        console.error(`   ❌ Erro ao buscar role: ${roleLookupError.message}`);
        await supabase.from("profiles").delete().eq("user_id", newUser.user.id);
        await supabase.auth.admin.deleteUser(newUser.user.id);
        throw new Error(`Erro ao buscar role admin E2E: ${roleLookupError.message}`);
      }

      const rolePayload = {
        user_id: newUser.user.id,
        role: "admin",
        role_enum: "admin",
        is_active: true,
        granted_at: new Date().toISOString(),
      };

      const { error: roleError } = existingAdminRole
        ? await supabase.from("user_roles").update(rolePayload).eq("id", existingAdminRole.id)
        : await supabase.from("user_roles").insert(rolePayload);

      if (roleError) {
        console.error(`   ❌ Erro ao adicionar role: ${roleError.message}`);
        
        // Tentar deletar perfil e usuário órfãos
        await supabase.from("profiles").delete().eq("user_id", newUser.user.id);
        await supabase.auth.admin.deleteUser(newUser.user.id);
        throw new Error(`Erro ao adicionar role admin E2E: ${roleError.message}`);
      }

      console.log(`   ✅ Role de admin adicionada`);
    }

    console.log(`   ✅ ${testUser.role === "admin" ? "Admin" : "Usuário"} de teste pronto!\n`);
  }

  console.log("✨ Seed concluído!\n");
  console.log("📋 Credenciais criadas:");
  console.log("─".repeat(50));
  
  for (const testUser of TEST_USERS) {
    console.log(`\n${testUser.role === "admin" ? "🔐 ADMIN" : "👤 USUÁRIO"}:`);
    console.log(`   Email:    ${testUser.email}`);
    console.log(`   Senha:    ${testUser.password}`);
    console.log(`   Role:     ${testUser.role}`);
  }
  
  console.log("\n" + "─".repeat(50));
  console.log("\n✅ Usuários prontos para testes E2E!");
  console.log("   Execute: npx playwright test\n");
}

// Parse argumentos da linha de comando
const args = process.argv.slice(2);
const options: SeedOptions = {
  reset: args.includes("--reset"),
  verbose: args.includes("--verbose"),
};

// Executar seed
seedE2EUsers(options).catch((error) => {
  console.error("❌ Erro fatal:", error.message);
  process.exit(1);
});
