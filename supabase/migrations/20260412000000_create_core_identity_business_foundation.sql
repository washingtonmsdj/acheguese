-- ============================================================================
-- MIGRATION: Core Identity and Business Foundation
-- ============================================================================
-- This foundation makes a clean local reset deterministic. Several historical
-- migrations from 20260413-20260417 depend on these SSOT tables/functions before
-- the domain migrations that later harden and extend them.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $migration$ BEGIN
  CREATE TYPE public.location_type AS ENUM (
    'country',
    'state',
    'city',
    'district',
    'neighborhood'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.location_status AS ENUM ('active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.business_status AS ENUM (
    'active',
    'inactive',
    'pending',
    'suspended',
    'deleted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.price_range AS ENUM ('$', '$$', '$$$', '$$$$');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.gastronomy_status AS ENUM (
    'active',
    'inactive',
    'temporarily_closed',
    'permanently_closed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.order_source_type AS ENUM (
    'manual',
    'business',
    'gastronomy',
    'service'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.payment_mode AS ENUM (
    'direct_to_merchant',
    'platform_checkout'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.delivery_mode AS ENUM (
    'merchant_own_fleet',
    'platform_courier_network'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.logistics_status AS ENUM (
    'pending',
    'accepted',
    'preparing',
    'ready_for_pickup',
    'picked_up',
    'delivered',
    'canceled',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.financial_status AS ENUM (
    'not_applicable',
    'pending_payment',
    'paid',
    'refunded',
    'partially_refunded',
    'payout_pending',
    'payout_sent',
    'payout_failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.ride_status AS ENUM (
    'pending',
    'accepted',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.route_status AS ENUM (
    'active',
    'full',
    'cancelled',
    'completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.recurrence_type AS ENUM (
    'once',
    'daily',
    'weekdays',
    'weekly'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

DO $migration$ BEGIN
  CREATE TYPE public.review_type AS ENUM (
    'business',
    'professional',
    'service'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $migration$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL DEFAULT 'personal',
  handle CITEXT,
  username TEXT,
  name TEXT,
  display_name TEXT,
  slug TEXT UNIQUE,
  bio TEXT,
  short_bio TEXT,
  avatar_url TEXT,
  contact_email TEXT,
  phone TEXT,
  whatsapp TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  neighborhood TEXT,
  location_id UUID,
  main_territory_location_id UUID,
  pontos INTEGER NOT NULL DEFAULT 0,
  reputation INTEGER NOT NULL DEFAULT 0,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  trust_score INTEGER NOT NULL DEFAULT 0,
  community_reputation_score INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  show_contact_email BOOLEAN NOT NULL DEFAULT false,
  show_phone BOOLEAN NOT NULL DEFAULT false,
  public_location_visibility TEXT NOT NULL DEFAULT 'city_only',
  share_activity_default BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_type
  ON public.profiles(user_id, profile_type)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_profile_type ON public.profiles(profile_type);
CREATE INDEX IF NOT EXISTS idx_profiles_slug_base ON public.profiles(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location_id ON public.profiles(location_id) WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_main_territory_location
  ON public.profiles(main_territory_location_id)
  WHERE main_territory_location_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_base ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_base ON public.user_roles(role);

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
  type public.location_type NOT NULL,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  geographic_path TEXT NOT NULL UNIQUE,
  status public.location_status NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_location_slug_per_parent UNIQUE (parent_id, slug),
  CONSTRAINT valid_geographic_path CHECK (geographic_path ~ '^/[a-z0-9-/]+$'),
  CONSTRAINT valid_slug CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX IF NOT EXISTS idx_locations_parent_id
  ON public.locations(parent_id)
  WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_status ON public.locations(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_locations_geographic_path ON public.locations(geographic_path);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON public.locations(slug);

DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_location_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_location_id_fkey
      FOREIGN KEY (location_id)
      REFERENCES public.locations(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_main_territory_location_id_fkey'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_main_territory_location_id_fkey
      FOREIGN KEY (main_territory_location_id)
      REFERENCES public.locations(id)
      ON DELETE SET NULL;
  END IF;
END $migration$;

CREATE TABLE IF NOT EXISTS public.profile_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_members_unique_membership UNIQUE (profile_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_members_profile_id ON public.profile_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_members_user_id ON public.profile_members(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_members_role ON public.profile_members(role);

DROP TRIGGER IF EXISTS update_profile_members_updated_at ON public.profile_members;
CREATE TRIGGER update_profile_members_updated_at
  BEFORE UPDATE ON public.profile_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profile_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_members pm
    WHERE pm.user_id = p_user_id
      AND pm.role IN ('admin', 'owner')
      AND pm.is_active = true
  );
$$;

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewed_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  review_type public.review_type NOT NULL DEFAULT 'business',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_review UNIQUE (reviewed_profile_id, reviewer_profile_id, review_type),
  CONSTRAINT no_self_review CHECK (reviewed_profile_id <> reviewer_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_profile_id ON public.reviews(reviewed_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_profile_id ON public.reviews(reviewer_profile_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON public.reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_activity_feed
  ON public.reviews(created_at DESC, status)
  WHERE status = 'active';

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.business_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  legal_name TEXT,
  cnpj TEXT,
  company_type TEXT,
  industry TEXT,
  description TEXT,
  slug TEXT UNIQUE,
  category TEXT,
  subcategory TEXT,
  address TEXT,
  business_address TEXT,
  business_city TEXT,
  business_state TEXT,
  address_id UUID,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  email TEXT,
  website TEXT,
  instagram TEXT,
  facebook TEXT,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  specialties JSONB DEFAULT '[]'::jsonb,
  facilities JSONB DEFAULT '[]'::jsonb,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  can_post_vagas BOOLEAN NOT NULL DEFAULT false,
  business_role TEXT NOT NULL DEFAULT 'standalone',
  tem_delivery BOOLEAN NOT NULL DEFAULT false,
  aceita_cartao BOOLEAN NOT NULL DEFAULT false,
  aceita_pix BOOLEAN NOT NULL DEFAULT false,
  status public.business_status NOT NULL DEFAULT 'active',
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER NOT NULL DEFAULT 0 CHECK (total_reviews >= 0),
  total_products INTEGER NOT NULL DEFAULT 0 CHECK (total_products >= 0),
  favorites_count INTEGER NOT NULL DEFAULT 0 CHECK (favorites_count >= 0),
  recommendations_count INTEGER NOT NULL DEFAULT 0 CHECK (recommendations_count >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT business_data_profile_id_unique UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_business_data_profile_id ON public.business_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_business_data_status ON public.business_data(status);
CREATE INDEX IF NOT EXISTS idx_business_data_category ON public.business_data(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_data_is_premium ON public.business_data(is_premium) WHERE is_premium = true;
CREATE INDEX IF NOT EXISTS idx_business_data_location_id
  ON public.business_data(location_id)
  WHERE location_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_business_data_slug ON public.business_data(slug) WHERE slug IS NOT NULL;

DROP TRIGGER IF EXISTS update_business_data_updated_at ON public.business_data;
CREATE TRIGGER update_business_data_updated_at
  BEFORE UPDATE ON public.business_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.business_data ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_favorite_businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.business_data(id) ON DELETE CASCADE,
  notify_on_promotions BOOLEAN NOT NULL DEFAULT true,
  notify_on_new_items BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_favorite UNIQUE (user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_user_id
  ON public.user_favorite_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_business_id
  ON public.user_favorite_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_businesses_created_at
  ON public.user_favorite_businesses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_activity_feed
  ON public.user_favorite_businesses(created_at DESC);

DROP TRIGGER IF EXISTS update_user_favorite_businesses_updated_at ON public.user_favorite_businesses;
CREATE TRIGGER update_user_favorite_businesses_updated_at
  BEFORE UPDATE ON public.user_favorite_businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_favorite_businesses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  active BOOLEAN NOT NULL DEFAULT true,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_subscriptions_status_base_check
    CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  CONSTRAINT user_subscriptions_amount_cents_check CHECK (amount_cents >= 0)
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_base
  ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status_base
  ON public.user_subscriptions(status);

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.driver_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  license_number TEXT,
  license_category TEXT,
  license_expiry DATE,
  license_state TEXT,
  vehicle JSONB NOT NULL DEFAULT '{}'::jsonb,
  vehicle_type TEXT,
  vehicle_plate TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  vehicle_color TEXT,
  documents_verified BOOLEAN NOT NULL DEFAULT false,
  documents_verified_at TIMESTAMPTZ,
  background_check_status TEXT,
  background_check_date TIMESTAMPTZ,
  is_available BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  subscription_active BOOLEAN NOT NULL DEFAULT false,
  can_do_delivery BOOLEAN NOT NULL DEFAULT false,
  can_do_rides BOOLEAN NOT NULL DEFAULT true,
  rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_rides INTEGER NOT NULL DEFAULT 0 CHECK (total_rides >= 0),
  total_rides_completed INTEGER NOT NULL DEFAULT 0 CHECK (total_rides_completed >= 0),
  total_rides_cancelled INTEGER NOT NULL DEFAULT 0 CHECK (total_rides_cancelled >= 0),
  acceptance_rate DECIMAL(5,2) DEFAULT 0 CHECK (acceptance_rate >= 0 AND acceptance_rate <= 100),
  cancellation_rate DECIMAL(5,2) DEFAULT 0 CHECK (cancellation_rate >= 0 AND cancellation_rate <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT driver_data_profile_id_unique UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_data_profile_id ON public.driver_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_data_is_online ON public.driver_data(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_driver_data_is_verified ON public.driver_data(is_verified) WHERE is_verified = true;

DROP TRIGGER IF EXISTS update_driver_data_updated_at ON public.driver_data;
CREATE TRIGGER update_driver_data_updated_at
  BEFORE UPDATE ON public.driver_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.driver_data ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.professional_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE,
  professional_name TEXT,
  service_category TEXT,
  service_subcategory TEXT,
  description TEXT,
  certifications JSONB DEFAULT '[]'::jsonb,
  experience_years INTEGER CHECK (experience_years >= 0),
  education TEXT,
  price_range TEXT,
  service_areas JSONB DEFAULT '[]'::jsonb,
  service_radius_km DECIMAL(5,2) CHECK (service_radius_km > 0),
  available_hours JSONB DEFAULT '{}'::jsonb,
  whatsapp TEXT,
  email TEXT,
  is_accepting_clients BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  address_id UUID,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT professional_data_profile_id_unique UNIQUE (profile_id)
);

CREATE INDEX IF NOT EXISTS idx_professional_data_profile_id ON public.professional_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_professional_data_category
  ON public.professional_data(service_category)
  WHERE service_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_professional_data_accepting
  ON public.professional_data(is_accepting_clients)
  WHERE is_accepting_clients = true;
CREATE INDEX IF NOT EXISTS idx_professional_data_location_id
  ON public.professional_data(location_id)
  WHERE location_id IS NOT NULL;

DROP TRIGGER IF EXISTS update_professional_data_updated_at ON public.professional_data;
CREATE TRIGGER update_professional_data_updated_at
  BEFORE UPDATE ON public.professional_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.professional_data ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.gastronomy_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.business_data(id) ON DELETE CASCADE,
  cuisine_type TEXT NOT NULL DEFAULT 'restaurant',
  cuisine_subtypes TEXT[] DEFAULT '{}',
  price_range public.price_range NOT NULL DEFAULT '$',
  delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  takeout_enabled BOOLEAN NOT NULL DEFAULT false,
  dine_in_enabled BOOLEAN NOT NULL DEFAULT true,
  delivery_fee DECIMAL(10,2),
  delivery_time_min INTEGER CHECK (delivery_time_min > 0),
  delivery_time_max INTEGER CHECK (delivery_time_max > 0),
  minimum_order DECIMAL(10,2),
  accepts_reservations BOOLEAN NOT NULL DEFAULT false,
  has_parking BOOLEAN NOT NULL DEFAULT false,
  has_wifi BOOLEAN NOT NULL DEFAULT false,
  has_accessibility BOOLEAN NOT NULL DEFAULT false,
  has_kids_area BOOLEAN NOT NULL DEFAULT false,
  has_live_music BOOLEAN NOT NULL DEFAULT false,
  seating_capacity INTEGER CHECK (seating_capacity > 0),
  plan_tier TEXT NOT NULL DEFAULT 'free',
  status public.gastronomy_status NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT gastronomy_profiles_business_id_unique UNIQUE (business_id),
  CONSTRAINT delivery_time_valid CHECK (
    delivery_time_max IS NULL
    OR delivery_time_min IS NULL
    OR delivery_time_max >= delivery_time_min
  )
);

CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_business_id ON public.gastronomy_profiles(business_id);
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_cuisine_type ON public.gastronomy_profiles(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_delivery_enabled
  ON public.gastronomy_profiles(delivery_enabled)
  WHERE delivery_enabled = true;
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_status ON public.gastronomy_profiles(status);
CREATE INDEX IF NOT EXISTS idx_gastronomy_profiles_plan_tier ON public.gastronomy_profiles(plan_tier);

DROP TRIGGER IF EXISTS update_gastronomy_profiles_updated_at ON public.gastronomy_profiles;
CREATE TRIGGER update_gastronomy_profiles_updated_at
  BEFORE UPDATE ON public.gastronomy_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.gastronomy_profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  merchant_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  courier_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  source_type public.order_source_type NOT NULL DEFAULT 'manual',
  source_id TEXT,
  source_reference TEXT,
  source_metadata JSONB DEFAULT '{}'::jsonb,
  payment_mode public.payment_mode NOT NULL DEFAULT 'direct_to_merchant',
  delivery_mode public.delivery_mode NOT NULL DEFAULT 'merchant_own_fleet',
  logistics_status public.logistics_status NOT NULL DEFAULT 'pending',
  financial_status public.financial_status NOT NULL DEFAULT 'not_applicable',
  items_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  order_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  platform_fee_amount DECIMAL(10, 2),
  merchant_net_amount DECIMAL(10, 2),
  courier_amount DECIMAL(10, 2),
  payment_method TEXT,
  external_payment_reference TEXT,
  notes TEXT,
  proof_of_delivery JSONB,
  failure_reason TEXT,
  accepted_at TIMESTAMPTZ,
  preparing_at TIMESTAMPTZ,
  ready_for_pickup_at TIMESTAMPTZ,
  picked_up_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON public.orders(merchant_profile_id);
CREATE INDEX IF NOT EXISTS idx_orders_courier
  ON public.orders(courier_profile_id)
  WHERE courier_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_logistics_status ON public.orders(logistics_status);
CREATE INDEX IF NOT EXISTS idx_orders_financial_status ON public.orders(financial_status);
CREATE INDEX IF NOT EXISTS idx_orders_source_type ON public.orders(source_type);

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.driver_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  origin JSONB NOT NULL,
  destination JSONB NOT NULL,
  waypoints JSONB DEFAULT '[]'::jsonb,
  departure_time TIMESTAMPTZ NOT NULL,
  available_seats INTEGER NOT NULL DEFAULT 1 CHECK (available_seats > 0),
  price_per_seat DECIMAL(10,2) NOT NULL CHECK (price_per_seat >= 0),
  status public.route_status NOT NULL DEFAULT 'active',
  recurrence public.recurrence_type DEFAULT 'once',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_routes_driver_id ON public.driver_routes(driver_profile_id);
CREATE INDEX IF NOT EXISTS idx_driver_routes_departure ON public.driver_routes(departure_time DESC);
CREATE INDEX IF NOT EXISTS idx_driver_routes_status ON public.driver_routes(status);

DROP TRIGGER IF EXISTS update_driver_routes_updated_at ON public.driver_routes;
CREATE TRIGGER update_driver_routes_updated_at
  BEFORE UPDATE ON public.driver_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.driver_routes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  driver_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  route_id UUID REFERENCES public.driver_routes(id) ON DELETE SET NULL,
  origin JSONB,
  destination JSONB,
  pickup_location JSONB NOT NULL,
  dropoff_location JSONB NOT NULL,
  status public.ride_status NOT NULL DEFAULT 'pending',
  suggested_price DECIMAL(10,2) CHECK (suggested_price >= 0),
  final_price DECIMAL(10,2) CHECK (final_price >= 0),
  available_seats INTEGER DEFAULT 1 CHECK (available_seats > 0),
  share_token TEXT UNIQUE,
  share_view_count INTEGER NOT NULL DEFAULT 0 CHECK (share_view_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ride_requests_passenger_id ON public.ride_requests(passenger_profile_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_driver_id
  ON public.ride_requests(driver_profile_id)
  WHERE driver_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON public.ride_requests(status);
CREATE INDEX IF NOT EXISTS idx_ride_requests_share_token
  ON public.ride_requests(share_token)
  WHERE share_token IS NOT NULL;

DROP TRIGGER IF EXISTS update_ride_requests_updated_at ON public.ride_requests;
CREATE TRIGGER update_ride_requests_updated_at
  BEFORE UPDATE ON public.ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.profiles IS 'SSOT for user and organization profiles.';
COMMENT ON TABLE public.user_roles IS 'User role assignments.';
COMMENT ON TABLE public.locations IS 'SSOT for canonical territorial hierarchy.';
COMMENT ON TABLE public.business_data IS 'SSOT for business identity and public business data.';
COMMENT ON TABLE public.profile_members IS 'Profile membership and ownership registry.';
COMMENT ON TABLE public.reviews IS 'Profile and business reviews.';
COMMENT ON TABLE public.user_favorite_businesses IS 'Saved business favorites by user.';
COMMENT ON TABLE public.user_subscriptions IS 'Canonical user subscription foundation extended by billing migrations.';
COMMENT ON TABLE public.driver_data IS 'Driver capability extension for profiles.';
COMMENT ON TABLE public.professional_data IS 'Professional service extension for profiles.';
COMMENT ON TABLE public.gastronomy_profiles IS 'Gastronomy extension for business_data.';
COMMENT ON TABLE public.orders IS 'Order foundation used by delivery requests.';
COMMENT ON TABLE public.driver_routes IS 'Driver route foundation used by ride requests.';
COMMENT ON TABLE public.ride_requests IS 'Ride request foundation used by ride offers.';
