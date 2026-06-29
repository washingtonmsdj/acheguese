import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/core/auth/hooks/useAuth';
import { useMultiProfileContext } from '@/core/profiles/contexts/multi-profile-runtime-context';
import { MultiProfileService } from '@/core/profiles/services/multi-profile';
import type {
  BusinessData,
  DriverData,
  ProfessionalData,
  Profile,
  ServiceResponse,
  UpdateProfileInput,
} from '@/core/profiles/services/multi-profile/types';

export type ProfileEditorViewState =
  | 'checking'
  | 'denied'
  | 'not_found'
  | 'error'
  | 'ready';

export function useProfileEditor(profileId?: string) {
  const { user } = useAuth();
  const { allProfiles, refetch: refetchProfiles } = useMultiProfileContext();
  const hydratedKeyRef = useRef<string | null>(null);

  const [baseForm, setBaseForm] = useState<UpdateProfileInput>({});
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [bizForm, setBizForm] = useState<Partial<BusinessData>>({});
  const [proForm, setProForm] = useState<Partial<ProfessionalData>>({});
  const [drvForm, setDrvForm] = useState<Partial<DriverData>>({});

  const editorQuery = useQuery({
    queryKey: [
      'profile',
      'editor',
      profileId,
      user?.id,
      allProfiles.map((profile) => profile.id).join(','),
    ],
    queryFn: async () =>
      MultiProfileService.loadProfileEditor({
        profileId: profileId!,
        userId: user!.id,
        availableProfiles: allProfiles,
      }),
    enabled: Boolean(profileId && user?.id),
    refetchOnWindowFocus: false,
  });

  const snapshot = editorQuery.data?.success ? editorQuery.data.data : undefined;
  const loadKey = snapshot
    ? `${snapshot.profile.id}:${snapshot.profile.updated_at}:${snapshot.originalUsername}`
    : null;

  useEffect(() => {
    if (!snapshot || !loadKey || hydratedKeyRef.current === loadKey) {
      return;
    }

    hydratedKeyRef.current = loadKey;
    setBaseForm(snapshot.baseForm);
    setUsername(snapshot.username);
    setOriginalUsername(snapshot.originalUsername);
    setBizForm(snapshot.bizForm);
    setProForm(snapshot.proForm);
    setDrvForm(snapshot.drvForm);
  }, [snapshot, loadKey]);

  const saveMutation = useMutation({
    mutationFn: async (): Promise<ServiceResponse<Profile>> => {
      if (!snapshot?.profile) {
        return {
          success: false,
          error: 'PROFILE_NOT_FOUND',
        };
      }

      return MultiProfileService.saveProfileEditor({
        profile: snapshot.profile,
        baseForm,
        username,
        originalUsername,
        bizForm,
        proForm,
        drvForm,
      });
    },
  });

  const state = useMemo<ProfileEditorViewState>(() => {
    if (!profileId || !user?.id) {
      return 'denied';
    }

    if (editorQuery.isLoading) {
      return 'checking';
    }

    if (editorQuery.isError) {
      return 'error';
    }

    if (!editorQuery.data?.success) {
      if (editorQuery.data?.error === 'ACCESS_DENIED') {
        return 'denied';
      }

      if (editorQuery.data?.error === 'PROFILE_NOT_FOUND') {
        return 'not_found';
      }

      return 'error';
    }

    return 'ready';
  }, [editorQuery.data, editorQuery.isError, editorQuery.isLoading, profileId, user?.id]);

  const setBaseField = useCallback(
    <K extends keyof UpdateProfileInput>(field: K, value: UpdateProfileInput[K]) => {
      setBaseForm((previous) => ({ ...previous, [field]: value }));
    },
    [],
  );

  const saveProfile = useCallback(async () => {
    const result = await saveMutation.mutateAsync();

    if (result.success) {
      hydratedKeyRef.current = null;
      await refetchProfiles();
      await editorQuery.refetch();
    }

    return result;
  }, [editorQuery, refetchProfiles, saveMutation]);

  return {
    state,
    loading: editorQuery.isLoading,
    error: editorQuery.data && !editorQuery.data.success ? editorQuery.data.error : null,
    profile: snapshot?.profile ?? null,
    editableUsername: snapshot?.editableUsername ?? null,
    baseForm,
    setBaseForm,
    setBaseField,
    username,
    setUsername,
    originalUsername,
    bizForm,
    setBizForm,
    proForm,
    setProForm,
    drvForm,
    setDrvForm,
    extLoading: editorQuery.isLoading,
    saving: saveMutation.isPending,
    saveProfile,
    refetch: editorQuery.refetch,
  };
}

