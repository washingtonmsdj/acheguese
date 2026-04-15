-- Renomear índices
ALTER INDEX IF EXISTS idx_community_posts_author_id RENAME TO idx_community_questions_author_id;
ALTER INDEX IF EXISTS idx_community_posts_type RENAME TO idx_community_questions_type;
ALTER INDEX IF EXISTS idx_community_posts_created_at RENAME TO idx_community_questions_created_at;
ALTER INDEX IF EXISTS idx_community_posts_type_category RENAME TO idx_community_questions_type_category;
ALTER INDEX IF EXISTS idx_community_posts_resolved RENAME TO idx_community_questions_resolved;

-- Renomear constraints
ALTER TABLE community_questions RENAME CONSTRAINT community_posts_author_profile_id_fkey TO community_questions_author_profile_id_fkey;
ALTER TABLE community_questions RENAME CONSTRAINT fk_community_posts_location_id TO fk_community_questions_location_id;

-- Recriar trigger updated_at
DROP TRIGGER IF EXISTS update_community_posts_updated_at ON community_questions;
CREATE TRIGGER update_community_questions_updated_at
  BEFORE UPDATE ON community_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Recriar trigger answers_count (em comments, aponta para community_questions)
DROP TRIGGER IF EXISTS trigger_update_answers_count ON comments;
CREATE OR REPLACE FUNCTION update_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_questions SET answers_count = answers_count + 1
    WHERE id = NEW.post_id AND type = 'question';
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_questions SET answers_count = GREATEST(0, answers_count - 1)
    WHERE id = OLD.post_id AND type = 'question';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trigger_update_answers_count
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_answers_count();

-- Recriar RPC mark_best_answer
CREATE OR REPLACE FUNCTION mark_best_answer(_question_id UUID, _answer_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE comments SET is_best_answer = false WHERE post_id = _question_id;
  UPDATE comments SET is_best_answer = true WHERE id = _answer_id;
  UPDATE community_questions SET resolved = true WHERE id = _question_id AND type = 'question';
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar RLS policies
DROP POLICY IF EXISTS "Community posts viewable" ON community_questions;
DROP POLICY IF EXISTS "Authors manage own community posts" ON community_questions;
CREATE POLICY "Community questions viewable"
  ON community_questions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Authors manage own community questions"
  ON community_questions FOR ALL TO authenticated
  USING (author_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
