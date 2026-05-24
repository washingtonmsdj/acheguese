-- Reconcile pricing SSOT in active migrations.
-- Pricing rules are public for reads, but writes are administrative only.

CREATE TABLE IF NOT EXISTS public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode TEXT NOT NULL,
  name TEXT NOT NULL,
  base_fare NUMERIC(10,2) NOT NULL CHECK (base_fare >= 0),
  price_per_km NUMERIC(10,2) NOT NULL CHECK (price_per_km >= 0),
  price_per_minute NUMERIC(10,2) NOT NULL CHECK (price_per_minute >= 0),
  minimum_fare NUMERIC(10,2) NOT NULL CHECK (minimum_fare >= 0),
  maximum_fare NUMERIC(10,2) CHECK (maximum_fare IS NULL OR maximum_fare >= minimum_fare),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT pricing_rules_mode_check
    CHECK (mode IN ('ride', 'delivery', 'mototaxi', 'motoboy', 'custom')),
  CONSTRAINT pricing_rules_valid_period_check
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until > valid_from)
);

CREATE TABLE IF NOT EXISTS public.pricing_peak_hour_multipliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.pricing_rules(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL,
  multiplier NUMERIC(5,2) NOT NULL CHECK (multiplier >= 1.0 AND multiplier <= 5.0),
  start_hour INTEGER CHECK (start_hour >= 0 AND start_hour < 24),
  end_hour INTEGER CHECK (end_hour >= 0 AND end_hour <= 24),
  days_of_week INTEGER[] CHECK (
    array_length(days_of_week, 1) IS NULL
    OR (days_of_week <@ ARRAY[0,1,2,3,4,5,6] AND array_length(days_of_week, 1) > 0)
  ),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pricing_peak_hour_multipliers_period_type_check
    CHECK (period_type IN ('morning', 'afternoon', 'evening', 'night', 'weekend', 'custom')),
  CONSTRAINT pricing_peak_hour_multipliers_hours_check
    CHECK (start_hour IS NULL OR end_hour IS NULL OR start_hour < end_hour)
);

CREATE TABLE IF NOT EXISTS public.pricing_additional_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.pricing_rules(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  fee_type TEXT NOT NULL CHECK (fee_type IN ('fixed', 'percentage')),
  reason TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pricing_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL CHECK (
    action IN (
      'rule_created',
      'rule_updated',
      'rule_activated',
      'rule_deactivated',
      'rule_deleted',
      'fee_added',
      'fee_updated',
      'fee_removed',
      'multiplier_added',
      'multiplier_updated',
      'multiplier_removed'
    )
  ),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('rule', 'fee', 'multiplier')),
  entity_id UUID NOT NULL,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_mode ON public.pricing_rules(mode);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_is_active ON public.pricing_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_valid_period ON public.pricing_rules(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_pricing_peak_hour_multipliers_rule_id ON public.pricing_peak_hour_multipliers(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_additional_fees_rule_id ON public.pricing_additional_fees(rule_id);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_entity ON public.pricing_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_pricing_audit_log_created_at ON public.pricing_audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION public.update_pricing_rules_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pricing_rules_updated_at_trigger ON public.pricing_rules;
CREATE TRIGGER pricing_rules_updated_at_trigger
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pricing_rules_updated_at();

CREATE OR REPLACE FUNCTION public.validate_pricing_rule_conflict()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    IF EXISTS (
      SELECT 1
      FROM public.pricing_rules pr
      WHERE pr.id <> NEW.id
        AND pr.mode = NEW.mode
        AND pr.is_active = TRUE
        AND (
          (pr.valid_from IS NULL AND pr.valid_until IS NULL)
          OR (NEW.valid_from IS NULL AND NEW.valid_until IS NULL)
          OR (
            (NEW.valid_from IS NULL OR pr.valid_until IS NULL OR NEW.valid_from < pr.valid_until)
            AND (NEW.valid_until IS NULL OR pr.valid_from IS NULL OR NEW.valid_until > pr.valid_from)
          )
        )
    ) THEN
      RAISE EXCEPTION 'pricing_active_rule_conflict';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pricing_rule_conflict_trigger ON public.pricing_rules;
CREATE TRIGGER pricing_rule_conflict_trigger
  BEFORE INSERT OR UPDATE ON public.pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pricing_rule_conflict();

CREATE OR REPLACE FUNCTION public.audit_pricing_rule_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_actor UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_actor := NEW.created_by;
    IF v_actor IS NOT NULL THEN
      INSERT INTO public.pricing_audit_log (action, entity_type, entity_id, performed_by, new_values)
      VALUES ('rule_created', 'rule', NEW.id, v_actor, to_jsonb(NEW));
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_actor := NEW.updated_by;
    IF v_actor IS NOT NULL THEN
      INSERT INTO public.pricing_audit_log (action, entity_type, entity_id, performed_by, old_values, new_values)
      VALUES (
        CASE
          WHEN OLD.is_active IS DISTINCT FROM NEW.is_active AND NEW.is_active THEN 'rule_activated'
          WHEN OLD.is_active IS DISTINCT FROM NEW.is_active THEN 'rule_deactivated'
          ELSE 'rule_updated'
        END,
        'rule',
        NEW.id,
        v_actor,
        to_jsonb(OLD),
        to_jsonb(NEW)
      );
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_actor := OLD.updated_by;
    IF v_actor IS NOT NULL THEN
      INSERT INTO public.pricing_audit_log (action, entity_type, entity_id, performed_by, old_values)
      VALUES ('rule_deleted', 'rule', OLD.id, v_actor, to_jsonb(OLD));
    END IF;
    RETURN OLD;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS pricing_rule_audit_trigger ON public.pricing_rules;
CREATE TRIGGER pricing_rule_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_pricing_rule_changes();

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_peak_hour_multipliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_additional_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  p RECORD;
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pricing_rules',
    'pricing_peak_hour_multipliers',
    'pricing_additional_fees',
    'pricing_audit_log'
  ]
  LOOP
    FOR p IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;

CREATE POLICY pricing_rules_public_read
  ON public.pricing_rules
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY pricing_rules_admin_manage
  ON public.pricing_rules
  FOR ALL
  TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), FALSE))
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), FALSE));

CREATE POLICY pricing_multipliers_public_read
  ON public.pricing_peak_hour_multipliers
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY pricing_multipliers_admin_manage
  ON public.pricing_peak_hour_multipliers
  FOR ALL
  TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), FALSE))
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), FALSE));

CREATE POLICY pricing_fees_public_read
  ON public.pricing_additional_fees
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

CREATE POLICY pricing_fees_admin_manage
  ON public.pricing_additional_fees
  FOR ALL
  TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), FALSE))
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), FALSE));

CREATE POLICY pricing_audit_admin_read
  ON public.pricing_audit_log
  FOR SELECT
  TO authenticated
  USING (coalesce(public.is_admin_from_roles(auth.uid()), FALSE));

CREATE POLICY pricing_audit_admin_insert
  ON public.pricing_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (coalesce(public.is_admin_from_roles(auth.uid()), FALSE));

CREATE OR REPLACE FUNCTION public.create_active_pricing_rule(
  p_mode TEXT,
  p_name TEXT,
  p_base_fare NUMERIC,
  p_price_per_km NUMERIC,
  p_price_per_minute NUMERIC,
  p_minimum_fare NUMERIC,
  p_maximum_fare NUMERIC DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT TRUE,
  p_valid_from TIMESTAMPTZ DEFAULT NULL,
  p_valid_until TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_performed_by UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule_id UUID;
BEGIN
  IF auth.role() <> 'service_role' AND NOT coalesce(public.is_admin_from_roles(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  IF p_is_active THEN
    UPDATE public.pricing_rules
    SET is_active = FALSE,
        updated_by = p_performed_by
    WHERE mode = p_mode
      AND is_active = TRUE;
  END IF;

  INSERT INTO public.pricing_rules (
    mode,
    name,
    base_fare,
    price_per_km,
    price_per_minute,
    minimum_fare,
    maximum_fare,
    is_active,
    valid_from,
    valid_until,
    metadata,
    created_by,
    updated_by
  )
  VALUES (
    p_mode,
    p_name,
    p_base_fare,
    p_price_per_km,
    p_price_per_minute,
    p_minimum_fare,
    p_maximum_fare,
    p_is_active,
    p_valid_from,
    p_valid_until,
    coalesce(p_metadata, '{}'::jsonb),
    p_performed_by,
    p_performed_by
  )
  RETURNING id INTO v_rule_id;

  RETURN v_rule_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.activate_pricing_rule(
  p_rule_id UUID,
  p_performed_by UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_mode TEXT;
BEGIN
  IF auth.role() <> 'service_role' AND NOT coalesce(public.is_admin_from_roles(auth.uid()), FALSE) THEN
    RAISE EXCEPTION 'admin_required';
  END IF;

  SELECT mode INTO v_mode
  FROM public.pricing_rules
  WHERE id = p_rule_id;

  IF v_mode IS NULL THEN
    RAISE EXCEPTION 'pricing_rule_not_found';
  END IF;

  UPDATE public.pricing_rules
  SET is_active = FALSE,
      updated_by = p_performed_by
  WHERE mode = v_mode
    AND is_active = TRUE
    AND id <> p_rule_id;

  UPDATE public.pricing_rules
  SET is_active = TRUE,
      updated_by = p_performed_by
  WHERE id = p_rule_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_active_pricing_rule(
  TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, JSONB, UUID
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_pricing_rule(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_active_pricing_rule(
  TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, BOOLEAN, TIMESTAMPTZ, TIMESTAMPTZ, JSONB, UUID
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.activate_pricing_rule(UUID, UUID) TO authenticated, service_role;

INSERT INTO public.pricing_rules (mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active, metadata)
SELECT 'ride', 'Corrida Padrao', 5.00, 2.50, 0.50, 8.00, TRUE, '{"source":"pricing_ssot_seed"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE mode = 'ride' AND is_active = TRUE);

INSERT INTO public.pricing_rules (mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active, metadata)
SELECT 'delivery', 'Entrega Padrao', 4.00, 2.00, 0.30, 7.00, TRUE, '{"source":"pricing_ssot_seed"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE mode = 'delivery' AND is_active = TRUE);

INSERT INTO public.pricing_rules (mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active, metadata)
SELECT 'mototaxi', 'Mototaxi Padrao', 4.00, 2.00, 0.40, 6.00, TRUE, '{"source":"pricing_ssot_seed"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE mode = 'mototaxi' AND is_active = TRUE);

INSERT INTO public.pricing_rules (mode, name, base_fare, price_per_km, price_per_minute, minimum_fare, is_active, metadata)
SELECT 'motoboy', 'Motoboy Padrao', 3.50, 1.80, 0.30, 6.00, TRUE, '{"source":"pricing_ssot_seed"}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_rules WHERE mode = 'motoboy' AND is_active = TRUE);

NOTIFY pgrst, 'reload schema';
