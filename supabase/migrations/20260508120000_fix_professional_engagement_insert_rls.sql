-- ============================================================================
-- FIX: Allow trigger-based insert into professional_service_engagements
-- ============================================================================
-- Context:
-- When a quote is accepted, trigger create_professional_service_engagement_from_quote
-- inserts into professional_service_engagements. Without INSERT policy for
-- authenticated participants, RLS blocks the insert and the funnel breaks.
-- ============================================================================

DROP POLICY IF EXISTS professional_service_engagements_participant_insert
  ON professional_service_engagements;

CREATE POLICY professional_service_engagements_participant_insert
  ON professional_service_engagements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM professional_data pd
      JOIN profiles p ON p.id = pd.profile_id
      WHERE pd.id = professional_service_engagements.professional_id
        AND p.user_id = auth.uid()
    )
  );

