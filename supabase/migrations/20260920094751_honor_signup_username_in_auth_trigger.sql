-- Conta e acesso: fazer o username escolhido no cadastro chegar ao perfil pessoal.
--
-- A implementação anterior de public.handle_new_user() ignorava
-- raw_user_meta_data.handle, embora o frontend envie esse campo no signup.
-- Isso fazia o usuário escolher um @ no formulário e receber outro identificador
-- derivado de nome + UUID. OAuth continua recebendo um fallback seguro.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'pg_temp'
AS $$
DECLARE
  v_display_name text;
  v_requested_username text;
  v_username text;
  v_base text;
  v_suffix text;
  v_attempt integer := 0;
BEGIN
  v_display_name := left(
    btrim(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(COALESCE(NEW.email, ''), '@', 1),
        'Pessoa'
      )
    ),
    160
  );

  IF v_display_name = '' THEN
    v_display_name := 'Pessoa';
  END IF;

  -- Cadastro por e-mail envia `handle`; aceitar `username` mantém compatibilidade
  -- com clientes antigos. A normalização é a mesma família usada pelo domínio
  -- de identidade pública: minúsculas, hífen/espaço -> underscore, 3..30.
  v_requested_username := lower(
    btrim(
      COALESCE(
        NEW.raw_user_meta_data->>'handle',
        NEW.raw_user_meta_data->>'username',
        ''
      )
    )
  );
  v_requested_username := regexp_replace(v_requested_username, '^@+', '', 'g');
  v_requested_username := regexp_replace(v_requested_username, '[[:space:]-]+', '_', 'g');
  v_requested_username := regexp_replace(v_requested_username, '_+', '_', 'g');
  v_requested_username := regexp_replace(v_requested_username, '^_+|_+$', '', 'g');

  IF v_requested_username ~ '^[a-z][a-z0-9_]{2,29}$'
     AND NOT private.profile_username_is_reserved(v_requested_username)
  THEN
    -- Serializar signups concorrentes que escolheram o mesmo identificador.
    PERFORM pg_advisory_xact_lock(
      hashtextextended('signup-username:' || v_requested_username, 0)
    );

    IF NOT EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE lower(profile.username) = v_requested_username
    ) THEN
      v_username := v_requested_username;
    END IF;
  END IF;

  -- OAuth e qualquer metadata inválida/ocupada recebem fallback canônico e
  -- estável. O sufixo do UUID evita depender de uma consulta externa.
  IF v_username IS NULL THEN
    v_base := lower(v_display_name);
    v_base := regexp_replace(v_base, '[^a-z0-9]+', '_', 'g');
    v_base := regexp_replace(v_base, '_+', '_', 'g');
    v_base := regexp_replace(v_base, '^_+|_+$', '', 'g');

    IF v_base = '' OR v_base !~ '^[a-z]' THEN
      v_base := 'user_' || v_base;
    END IF;

    v_base := left(v_base, 20);
    v_suffix := substr(replace(NEW.id::text, '-', ''), 1, 8);
    v_username := left(v_base || '_' || v_suffix, 30);

    WHILE private.profile_username_is_reserved(v_username)
       OR EXISTS (
         SELECT 1
         FROM public.profiles AS profile
         WHERE lower(profile.username) = v_username
       )
    LOOP
      v_attempt := v_attempt + 1;
      IF v_attempt > 8 THEN
        RAISE EXCEPTION 'Could not allocate signup username';
      END IF;

      v_suffix := substr(
        md5(NEW.id::text || ':' || v_attempt::text),
        1,
        8
      );
      v_username := left(v_base || '_' || v_suffix, 30);
    END LOOP;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles AS profile WHERE profile.user_id = NEW.id
  ) THEN
    INSERT INTO public.profiles (
      user_id,
      username,
      display_name,
      name
    )
    VALUES (
      NEW.id,
      v_username,
      v_display_name,
      v_display_name
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles AS role_row WHERE role_row.user_id = NEW.id
  ) THEN
    INSERT INTO public.user_roles (
      user_id,
      role,
      role_enum,
      reason
    )
    VALUES (
      NEW.id,
      'user',
      'user',
      'Role padrão no signup'
    );
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
'Cria perfil/role no signup; honra raw_user_meta_data.handle quando disponível e usa fallback canônico para OAuth.';
