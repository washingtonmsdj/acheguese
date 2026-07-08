-- Harden community social write policies so inserted/updated rows must keep
-- the canonical author profile tied to the authenticated user.

DO $$
BEGIN
  IF to_regclass('public.posts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authors manage own posts" ON public.posts;
    CREATE POLICY "Authors manage own posts"
      ON public.posts FOR ALL
      TO authenticated
      USING (
        author_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        author_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.community_questions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authors manage own community posts" ON public.community_questions;
    DROP POLICY IF EXISTS "Authors manage own community questions" ON public.community_questions;
    CREATE POLICY "Authors manage own community questions"
      ON public.community_questions FOR ALL
      TO authenticated
      USING (
        author_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        author_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.community_posts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authors manage own community posts" ON public.community_posts;
    CREATE POLICY "Authors manage own community posts"
      ON public.community_posts FOR ALL
      TO authenticated
      USING (
        author_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        author_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.post_likes_new') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users manage own likes" ON public.post_likes_new;
    CREATE POLICY "Users manage own likes"
      ON public.post_likes_new FOR ALL
      TO authenticated
      USING (
        liker_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        liker_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.saved_posts_new') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users manage own saved posts" ON public.saved_posts_new;
    CREATE POLICY "Users manage own saved posts"
      ON public.saved_posts_new FOR ALL
      TO authenticated
      USING (
        saver_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        saver_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.comments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authors manage own comments" ON public.comments;
    CREATE POLICY "Authors manage own comments"
      ON public.comments FOR ALL
      TO authenticated
      USING (
        author_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        author_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.groups') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authenticated users create groups" ON public.groups;
    CREATE POLICY "Authenticated users create groups"
      ON public.groups FOR INSERT
      TO authenticated
      WITH CHECK (
        created_by IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );

    DROP POLICY IF EXISTS "Creators update own groups" ON public.groups;
    CREATE POLICY "Creators update own groups"
      ON public.groups FOR UPDATE
      TO authenticated
      USING (
        created_by IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        created_by IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.group_members_new') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users manage own memberships" ON public.group_members_new;
    CREATE POLICY "Users manage own memberships"
      ON public.group_members_new FOR ALL
      TO authenticated
      USING (
        member_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        member_profile_id IN (
          SELECT id FROM public.profiles WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF to_regclass('public.lost_found_posts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Authors update own posts" ON public.lost_found_posts;
    CREATE POLICY "Authors update own posts"
      ON public.lost_found_posts
      FOR UPDATE
      TO authenticated
      USING (
        autor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      )
      WITH CHECK (
        autor_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
      );
  END IF;
END $$;
