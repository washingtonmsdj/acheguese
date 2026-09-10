import { supabase as generatedSupabase, type Json } from '@/integrations/supabase';
import { MEDIA_STORAGE_BUCKETS } from '@/core/media/config/storageBuckets';
import { mediaService } from '@/core/media/services/MediaService';
import { SAFETY_EVIDENCE_UPLOAD_POLICY } from '@/core/safety/config/evidencePolicy';
import { logger } from '@/shared/utils/logger';
import type {
  SafetyEvidence,
  SafetyEvidenceType,
  SafetyResult,
  UploadSafetyEvidenceInput,
} from '../types';

const BUCKET = MEDIA_STORAGE_BUCKETS.SAFETY_EVIDENCE;
const STORAGE_PREFIX = `storage://${BUCKET}/`;
const ALLOWED_MIME_TYPES: readonly string[] = SAFETY_EVIDENCE_UPLOAD_POLICY.allowedMimeTypes;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
};

type SafetyEvidenceRow = {
  id: string;
  incident_id: string;
  evidence_type: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type RegisterSafetyEvidenceArgs = {
  p_incident_id: string;
  p_evidence_type: SafetyEvidenceType;
  p_object_path: string;
  p_file_name: string;
  p_metadata: Json;
};

type SafetyEvidenceRpcClient = {
  rpc(
    functionName: 'register_safety_evidence',
    args: RegisterSafetyEvidenceArgs,
  ): Promise<{ data: SafetyEvidenceRow | null; error: unknown }>;
};

// The deployed command predates the current generated Database artifact. Keep the
// narrow schema bridge local to this owner instead of weakening the generated client.
const supabase = generatedSupabase as unknown as SafetyEvidenceRpcClient;

function mapRow(row: SafetyEvidenceRow): SafetyEvidence {
  return {
    id: row.id,
    incidentId: row.incident_id,
    evidenceType: row.evidence_type as SafetyEvidenceType,
    fileUrl: row.file_url,
    fileName: row.file_name,
    fileSize: row.file_size,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeMetadataForStorage(metadata: Record<string, unknown> | undefined): Json {
  return JSON.parse(JSON.stringify(metadata ?? {})) as Json;
}

class SafetyEvidenceService {
  async listIncidentEvidence(incidentId: string): Promise<SafetyEvidence[]> {
    if (!isUuid(incidentId)) return [];

    const { data, error } = await generatedSupabase
      .from('safety_evidence')
      .select(
        'id, incident_id, evidence_type, file_url, file_name, file_size, mime_type, uploaded_by, metadata, created_at',
      )
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('[SafetyEvidenceService] Error listing evidence', error);
      throw error;
    }

    return ((data ?? []) as SafetyEvidenceRow[]).map(mapRow);
  }

  async upload(
    input: UploadSafetyEvidenceInput,
    uploadedBy: string,
  ): Promise<SafetyResult<SafetyEvidence>> {
    let uploadedPath: string | null = null;

    try {
      if (!isUuid(input.incidentId) || !isUuid(uploadedBy)) {
        return { success: false, error: 'Identificador de incidente ou perfil inválido' };
      }

      if (
        input.file.size <= 0 ||
        input.file.size > SAFETY_EVIDENCE_UPLOAD_POLICY.maxFileSizeBytes
      ) {
        return {
          success: false,
          error: `Arquivo inválido ou maior que ${SAFETY_EVIDENCE_UPLOAD_POLICY.maxFileSizeLabel}`,
        };
      }

      if (!ALLOWED_MIME_TYPES.includes(input.file.type)) {
        return { success: false, error: 'Tipo de arquivo não permitido para evidência' };
      }

      const extension = EXTENSION_BY_MIME[input.file.type];
      const path = `${input.incidentId}/${crypto.randomUUID()}.${extension}`;
      const upload = await mediaService.uploadPrivateFile(input.file, {
        bucket: BUCKET,
        path,
        upsert: false,
        maxSizeBytes: SAFETY_EVIDENCE_UPLOAD_POLICY.maxFileSizeBytes,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
      uploadedPath = upload.path;

      const { data, error } = await supabase.rpc('register_safety_evidence', {
        p_incident_id: input.incidentId,
        p_evidence_type: input.evidenceType,
        p_object_path: upload.path,
        p_file_name: input.file.name,
        p_metadata: normalizeMetadataForStorage(input.metadata),
      });

      if (error || !data) {
        throw error ?? new Error('Failed to register safety evidence');
      }

      return { success: true, data: mapRow(data) };
    } catch (error) {
      if (uploadedPath) {
        try {
          await mediaService.removePrivateFiles(BUCKET, [uploadedPath]);
        } catch (cleanupError) {
          logger.error('[SafetyEvidenceService] Failed to clean orphan evidence object', cleanupError);
        }
      }

      logger.error('[SafetyEvidenceService] Error uploading evidence', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload da evidência',
      };
    }
  }

  async createSignedUrl(fileUrl: string, expiresInSeconds = 300): Promise<string | null> {
    if (!fileUrl.startsWith(STORAGE_PREFIX)) return null;

    const path = fileUrl.slice(STORAGE_PREFIX.length);
    if (!path || path.includes('..')) return null;

    try {
      return await mediaService.createPrivateSignedUrl(
        BUCKET,
        path,
        expiresInSeconds,
      );
    } catch (error) {
      logger.error('[SafetyEvidenceService] Error signing evidence URL', error);
      return null;
    }
  }
}

export const safetyEvidenceService = new SafetyEvidenceService();