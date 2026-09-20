ALTER TABLE public.community_interest_registrations
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.community_interest_registrations
  DROP CONSTRAINT IF EXISTS community_interest_registrations_email_check;

ALTER TABLE public.community_interest_registrations
  ADD CONSTRAINT community_interest_registrations_email_check
  CHECK (
    email IS NULL
    OR (
      char_length(btrim(email)) BETWEEN 3 AND 255
      AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  );

ALTER TABLE public.community_interest_registrations
  DROP CONSTRAINT IF EXISTS community_interest_registrations_phone_digits_check;

ALTER TABLE public.community_interest_registrations
  ADD CONSTRAINT community_interest_registrations_phone_digits_check
  CHECK (
    phone IS NULL
    OR char_length(regexp_replace(phone, '[^0-9]', '', 'g')) BETWEEN 10 AND 15
  );

ALTER TABLE public.community_interest_registrations
  DROP CONSTRAINT IF EXISTS community_interest_registrations_contact_required;

ALTER TABLE public.community_interest_registrations
  ADD CONSTRAINT community_interest_registrations_contact_required
  CHECK (email IS NOT NULL OR phone IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS community_interest_unique_phone_per_community
  ON public.community_interest_registrations (
    COALESCE(community_slug, ''),
    regexp_replace(phone, '[^0-9]', '', 'g')
  )
  WHERE phone IS NOT NULL;

COMMENT ON COLUMN public.community_interest_registrations.email IS
  'Optional real email contact. Never synthesize placeholder email identities for phone-only registrations.';

COMMENT ON COLUMN public.community_interest_registrations.phone IS
  'Optional real phone/WhatsApp contact. At least one of email or phone is required.';

COMMENT ON INDEX public.community_interest_unique_phone_per_community IS
  'Deduplicates phone-only community interest registrations per community using normalized digits.';
