-- Safety email delivery must never overload the phone field. Existing
-- email-shaped values are migrated; new/updated rows require a canonical email.

ALTER TABLE public.emergency_contacts
  ADD COLUMN IF NOT EXISTS email TEXT;

ALTER TABLE public.emergency_contacts
  ALTER COLUMN phone DROP NOT NULL;

UPDATE public.emergency_contacts
SET email = lower(btrim(phone)),
    phone = NULL,
    updated_at = now()
WHERE email IS NULL
  AND phone ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';

ALTER TABLE public.emergency_contacts
  DROP CONSTRAINT IF EXISTS emergency_contacts_target_contract,
  DROP CONSTRAINT IF EXISTS emergency_contacts_email_required,
  DROP CONSTRAINT IF EXISTS emergency_contacts_email_contract,
  DROP CONSTRAINT IF EXISTS emergency_contacts_phone_contract;

ALTER TABLE public.emergency_contacts
  ADD CONSTRAINT emergency_contacts_email_required CHECK (
    email IS NOT NULL
  ) NOT VALID,
  ADD CONSTRAINT emergency_contacts_email_contract CHECK (
    email IS NULL
    OR (
      char_length(email) BETWEEN 3 AND 254
      AND email = lower(btrim(email))
      AND email !~ '[<>[:cntrl:]]'
      AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    )
  ) NOT VALID,
  ADD CONSTRAINT emergency_contacts_phone_contract CHECK (
    phone IS NULL
    OR (
      char_length(btrim(phone)) BETWEEN 7 AND 32
      AND phone ~ '^[+0-9 ()-]+$'
    )
  ) NOT VALID;

COMMENT ON COLUMN public.emergency_contacts.email IS
  'Canonical destination for the active emergency email channel.';
COMMENT ON COLUMN public.emergency_contacts.phone IS
  'Optional phone number reserved for a future server-owned SMS/voice channel.';
