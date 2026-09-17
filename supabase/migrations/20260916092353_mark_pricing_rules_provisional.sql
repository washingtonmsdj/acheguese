-- Current mobility pricing values are development placeholders and have not been
-- commercially approved. Persist that state explicitly so production runtime can
-- fail closed instead of treating an active placeholder as an official price.

UPDATE public.pricing_rules
SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
  'commercial_status', 'provisional'
)
WHERE COALESCE(metadata->>'commercial_status', '') <> 'approved';
