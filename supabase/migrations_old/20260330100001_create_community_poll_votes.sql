-- community_poll_votes  (PostService.votePoll / ProfileService.getUserPollVoteActivity)
-- Registra votos de usuários em enquetes da comunidade.
-- Usa user_id (auth.uid) pois votação é por conta, não por perfil.
CREATE TABLE community_poll_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    UUID NOT NULL REFERENCES community_polls(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  option_id  UUID NOT NULL REFERENCES community_poll_options(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_poll_vote UNIQUE (poll_id, user_id)
);

CREATE INDEX idx_community_poll_votes_poll_id ON community_poll_votes(poll_id);
CREATE INDEX idx_community_poll_votes_user_id ON community_poll_votes(user_id);

ALTER TABLE community_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Poll votes viewable by authenticated"
  ON community_poll_votes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users manage own poll votes"
  ON community_poll_votes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
