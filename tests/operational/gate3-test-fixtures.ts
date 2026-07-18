import { type User } from "@supabase/supabase-js";
import { supabase as runtimeSupabase } from "@/integrations/supabase";
import {
  createOperationalAdminClient,
  createOperationalAnonClient,
  requireOperationalEnv,
  type OperationalSupabaseClient,
} from "../helpers/operational-env";
import {
  createConfirmedOperationalUser,
  deleteOperationalUser,
} from "../helpers/operational-auth-fixture";

export interface Gate3UserFixture {
  email: string;
  password: string;
  userId: string;
  profileId: string;
  client: OperationalSupabaseClient;
  pickupAddressId?: string;
  dropoffAddressId?: string;
  pickupLocationId?: string;
  dropoffLocationId?: string;
}

export interface Gate3Clients {
  anon: OperationalSupabaseClient;
  admin: OperationalSupabaseClient;
}

export function createGate3Clients(): Gate3Clients {
  return {
    anon: createOperationalAnonClient(),
    admin: createOperationalAdminClient(),
  };
}

export async function authenticateGate3Driver(
  anon: OperationalSupabaseClient,
): Promise<Gate3UserFixture> {
  const { driverEmail: email, driverPassword: password } =
    requireOperationalEnv({
      requireDriverCredentials: true,
    });

  const { data: auth, error } = await anon.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !auth.user) {
    throw new Error(
      `Falha na autenticacao do motorista: ${error?.message ?? "usuario ausente"}`,
    );
  }

  const { data: profile, error: profileError } = await anon
    .from("profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (profileError || !profile?.id) {
    throw new Error(
      `Perfil do motorista nao encontrado: ${profileError?.message ?? "sem profile"}`,
    );
  }

  return {
    email,
    password,
    userId: auth.user.id,
    profileId: profile.id as string,
    client: anon,
  };
}

export async function createGate3PassengerFixture(
  admin: OperationalSupabaseClient,
  prefix: string,
): Promise<Gate3UserFixture> {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${prefix}-${suffix}@acheguese.local`;
  const password = "Gate3Passenger@2026!";

  const user = await createConfirmedOperationalUser(admin, {
    email,
    password,
    handle: `${prefix}${suffix}`.replace(/[^a-z0-9]/gi, "").slice(0, 48),
    name: "Gate 3 Passenger",
    userMetadata: { e2e_fixture: "gate3-passenger" },
  });

  const profileId = await ensureGate3PersonalProfile(admin, user, prefix);
  const routeFixture = await createGate3RouteFixture(admin, user.id);
  const client = createOperationalAnonClient();

  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    throw new Error(
      `Falha ao autenticar passageiro fixture: ${signInError.message}`,
    );
  }

  return {
    email,
    password,
    userId: user.id,
    profileId,
    client,
    pickupAddressId: routeFixture.pickupAddressId,
    dropoffAddressId: routeFixture.dropoffAddressId,
    pickupLocationId: routeFixture.pickupLocationId,
    dropoffLocationId: routeFixture.dropoffLocationId,
  };
}

export async function cleanupGate3UserFixture(
  admin: OperationalSupabaseClient | undefined,
  fixture: Gate3UserFixture | undefined,
): Promise<void> {
  if (!admin || !fixture) return;
  await fixture.client.auth.signOut();
  await deleteGate3Address(admin, fixture.pickupAddressId);
  await deleteGate3Address(admin, fixture.dropoffAddressId);
  await admin.from("profiles").delete().eq("id", fixture.profileId);
  await deleteOperationalUser(admin, fixture.userId);
}

export async function authenticateGate3RuntimeAs(
  fixture: Gate3UserFixture,
): Promise<void> {
  await runtimeSupabase.auth.signOut();
  const { error } = await runtimeSupabase.auth.signInWithPassword({
    email: fixture.email,
    password: fixture.password,
  });

  if (error) {
    throw new Error(
      `Falha ao autenticar runtime Gate3 como ${fixture.email}: ${error.message}`,
    );
  }
}

export async function signOutGate3Runtime(): Promise<void> {
  await runtimeSupabase.auth.signOut();
}

export function createGate3RidePayload(
  passengerProfileId: string,
  passengerFixture: Gate3UserFixture,
  status: string,
  suggestedPrice: number,
  driverProfileId?: string | null,
): Record<string, unknown> {
  if (
    !passengerFixture.pickupAddressId ||
    !passengerFixture.dropoffAddressId ||
    !passengerFixture.pickupLocationId ||
    !passengerFixture.dropoffLocationId
  ) {
    throw new Error("Fixture de rota Gate3 incompleta.");
  }

  return {
    passenger_profile_id: passengerProfileId,
    driver_profile_id: driverProfileId ?? null,
    pickup_address_id: passengerFixture.pickupAddressId,
    dropoff_address_id: passengerFixture.dropoffAddressId,
    pickup_location_id: passengerFixture.pickupLocationId,
    dropoff_location_id: passengerFixture.dropoffLocationId,
    origin: "Origem Teste",
    destination: "Destino Teste",
    origin_lat: -12.975,
    origin_lng: -38.501,
    destination_lat: -12.985,
    destination_lng: -38.491,
    status,
    suggested_price: suggestedPrice,
    ride_mode: "ride",
  };
}

async function ensureGate3PersonalProfile(
  admin: OperationalSupabaseClient,
  user: User,
  prefix: string,
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .eq("profile_type", "personal")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data?.id) return data.id as string;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  const { data, error } = await admin
    .from("profiles")
    .insert({
      user_id: user.id,
      username: `${prefix}_${user.id.slice(0, 8)}`,
      name: "Gate 3 Passenger",
      profile_type: "personal",
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(
      `Falha ao criar perfil do passageiro: ${error?.message ?? "sem profile"}`,
    );
  }

  return data.id as string;
}

async function createGate3RouteFixture(
  admin: OperationalSupabaseClient,
  ownerUserId: string,
): Promise<{
  pickupAddressId: string;
  dropoffAddressId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
}> {
  const { data: location, error: locationError } = await admin
    .from("locations")
    .select("id")
    .eq("status", "active")
    .in("type", ["neighborhood", "district", "city"])
    .order("type", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (locationError || !location?.id) {
    throw new Error(
      `Localidade ativa nao encontrada para fixture Gate3: ${locationError?.message ?? "sem localidade"}`,
    );
  }

  const pickupAddressId = await createGate3Address(
    admin,
    ownerUserId,
    location.id as string,
    {
      street: "Origem Teste Gate3",
      latitude: -12.975,
      longitude: -38.501,
    },
  );
  const dropoffAddressId = await createGate3Address(
    admin,
    ownerUserId,
    location.id as string,
    {
      street: "Destino Teste Gate3",
      latitude: -12.985,
      longitude: -38.491,
    },
  );

  return {
    pickupAddressId,
    dropoffAddressId,
    pickupLocationId: location.id as string,
    dropoffLocationId: location.id as string,
  };
}

async function createGate3Address(
  admin: OperationalSupabaseClient,
  ownerUserId: string,
  locationId: string,
  data: { street: string; latitude: number; longitude: number },
): Promise<string> {
  const { data: address, error } = await admin
    .from("addresses")
    .insert({
      owner_user_id: ownerUserId,
      location_id: locationId,
      address_type: "exact",
      street: data.street,
      latitude: data.latitude,
      longitude: data.longitude,
      metadata: { source: "gate3-operational-test" },
      verification_status: "verified",
      is_verified: true,
    })
    .select("id")
    .single();

  if (error || !address?.id) {
    throw new Error(
      `Falha ao criar endereco Gate3: ${error?.message ?? "sem id"}`,
    );
  }

  return address.id as string;
}

async function deleteGate3Address(
  admin: OperationalSupabaseClient,
  addressId: string | undefined,
): Promise<void> {
  if (!addressId) return;
  await admin.from("addresses").delete().eq("id", addressId);
}
