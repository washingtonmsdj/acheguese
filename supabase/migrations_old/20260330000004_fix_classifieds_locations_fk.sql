-- ============================================================================
-- Migration: Fix tables -> locations foreign key relationships
-- Descrição: Adiciona FK constraints para tabelas que têm location_id sem FK
-- Data: 2026-03-30
-- Problema: Queries com join locations() falhavam com erro PGRST200
-- Solução: Adicionar FK constraints para permitir joins via PostgREST
-- Tabelas com location_id: profiles, posts, community_posts,
--   business_data, professional_data, classifieds, events
-- ============================================================================

-- 1. Limpar location_ids inválidos (orphans)
UPDATE profiles SET location_id = NULL 
WHERE location_id IS NOT NULL AND location_id NOT IN (SELECT id FROM locations);

UPDATE posts SET location_id = NULL 
WHERE location_id IS NOT NULL AND location_id NOT IN (SELECT id FROM locations);

UPDATE community_posts SET location_id = NULL 
WHERE location_id IS NOT NULL AND location_id NOT IN (SELECT id FROM locations);

UPDATE business_data SET location_id = NULL 
WHERE location_id IS NOT NULL AND location_id NOT IN (SELECT id FROM locations);

UPDATE professional_data SET location_id = NULL 
WHERE location_id IS NOT NULL AND location_id NOT IN (SELECT id FROM locations);

UPDATE classifieds SET location_id = NULL 
WHERE location_id IS NOT NULL AND location_id NOT IN (SELECT id FROM locations);

UPDATE events SET location_id = NULL 
WHERE location_id IS NOT NULL AND location_id NOT IN (SELECT id FROM locations);

-- 2. Adicionar foreign key constraints
ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_location_id
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE posts
  ADD CONSTRAINT fk_posts_location_id
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE community_posts
  ADD CONSTRAINT fk_community_posts_location_id
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE business_data
  ADD CONSTRAINT fk_business_data_location_id
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE professional_data
  ADD CONSTRAINT fk_professional_data_location_id
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE classifieds
  ADD CONSTRAINT fk_classifieds_location_id
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;

ALTER TABLE events
  ADD CONSTRAINT fk_events_location_id
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
