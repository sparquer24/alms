import RenewalService from '../api/renewalService';
import { getDocumentUploadMeta, resolveFileHref } from '../services/fileHandler';
import jsCookie from 'js-cookie';

export type RenewalFileMeta = {
  id?: number;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
};

export { getDocumentUploadMeta };

/** Collect renewal file upload ids from API payload (not fresh-application file ids). */
export function collectRenewalFileIds(renewalData: any): Set<number> {
  const ids = new Set<number>();
  if (!renewalData || typeof renewalData !== 'object') return ids;

  const sources = [
    renewalData.fileUploads,
    renewalData.renewalFileUploads,
    renewalData.uploads,
    renewalData.file_uploads,
    renewalData.documents,
  ];

  for (const source of sources) {
    if (!Array.isArray(source)) continue;
    for (const file of source) {
      const meta = getDocumentUploadMeta(file);
      if (meta.id) ids.add(meta.id);
    }
  }

  return ids;
}

/**
 * Normalize document meta for renewal form state.
 * Strips source-application file ids so prefilled files go through POST upload-file.
 */
export function asPendingRenewalDocument(
  value: unknown,
  renewalFileIds?: ReadonlySet<number> | null,
): RenewalFileMeta | null {
  const meta = getDocumentUploadMeta(value);
  if (!meta.fileUrl && !meta.fileName) return null;

  const keepId =
    meta.id &&
    renewalFileIds &&
    renewalFileIds.size > 0 &&
    renewalFileIds.has(meta.id);

  const fileTypeFromValue =
    value && typeof value === 'object'
      ? String(
          ((value as { fileType?: string; type?: string }).fileType ??
            (value as { fileType?: string; type?: string }).type) ||
            '',
        )
      : undefined;

  return {
    ...(keepId ? { id: meta.id } : {}),
    fileName: meta.fileName,
    fileUrl: meta.fileUrl,
    fileType: meta.fileType || (fileTypeFromValue || undefined),
  };
}

/** Form field keys mapped to upload-file API (Documents + license evidence) */
export const RENEWAL_DOCUMENT_FIELD_KEYS = [
  'idProofUploaded',
  'panCardUploaded',
  'trainingCertificateUploaded',
  'medicalCertificateUploaded',
  'otherStateLicenseUploaded',
  'existingArmsLicenseUploaded',
  'safeCustodyUploaded',
] as const;

export const toRenewalFileMeta = (uploaded: {
  id?: number;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
}): RenewalFileMeta => ({
  id: uploaded.id,
  fileName: uploaded.fileName,
  fileUrl: uploaded.fileUrl,
  fileType: uploaded.fileType,
});

const getAuthToken = (): string | null => {
  try {
    const authCookie = jsCookie.get('auth');
    if (!authCookie) return null;
    try {
      const parsed = JSON.parse(authCookie);
      return parsed.token || parsed.accessToken || parsed.authToken || authCookie;
    } catch {
      return authCookie;
    }
  } catch {
    return null;
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });

/** Resolve prefilled / fresh-application file URL to base64 for POST upload-file */
export const resolveFileUrlToBase64 = async (fileUrl: string): Promise<{ dataUrl: string; size: number }> => {
  const trimmed = fileUrl.trim();
  if (trimmed.startsWith('data:')) {
    return { dataUrl: trimmed, size: Math.ceil((trimmed.length * 3) / 4) };
  }

  const href = resolveFileHref(trimmed);
  if (!href) {
    throw new Error('Unable to resolve document URL for upload');
  }

  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(href, { method: 'GET', credentials: 'include', headers });
  if (!response.ok) {
    throw new Error(`Failed to read existing document (${response.status})`);
  }

  const blob = await response.blob();
  const dataUrl = await blobToDataUrl(blob);
  return { dataUrl, size: blob.size };
};

/**
 * POST /renewal-forms/:id/upload-file for a document already shown in the UI
 * (e.g. copied from fresh application) but not yet stored on the renewal record.
 */
export async function uploadRenewalDocumentFromExisting(
  renewalId: string,
  fieldName: string,
  meta: { fileName?: string; fileUrl?: string },
): Promise<RenewalFileMeta | null> {
  if (!meta.fileUrl?.trim()) return null;

  const { dataUrl, size } = await resolveFileUrlToBase64(meta.fileUrl);
  const uploaded = await RenewalService.uploadDocumentPayload(renewalId, fieldName, {
    fileUrl: dataUrl,
    fileName: meta.fileName || 'document',
    fileSize: size,
  });
  return toRenewalFileMeta(uploaded);
}

export async function uploadRenewalDocument(
  renewalId: string,
  fieldName: string,
  file: File,
  existingFileId?: number,
) {
  if (existingFileId) {
    await RenewalService.deleteRenewalFile(existingFileId);
  }
  const uploaded = await RenewalService.uploadDocument(renewalId, fieldName, file);
  return toRenewalFileMeta(uploaded);
}

export async function deleteRenewalDocument(fileId: number) {
  await RenewalService.deleteRenewalFile(fileId);
}

/**
 * A document the user picked (or picked as a replacement) that is only held in form
 * state. It is uploaded by commitStagedRenewalDocuments when its section is saved.
 */
export type StagedRenewalDocument = {
  pendingFile: File;
  fileName: string;
  fileUrl: string; // blob: preview URL
  fileSize: number;
  fileType?: string;
  /** Saved document(s) this upload replaces; deleted only after the new upload succeeds. */
  replaces?: unknown;
};

/** Single-file fields outside the Documents step that are also saved only on Save to Draft / Next. */
export const RENEWAL_STAGEABLE_FIELD_KEYS = [
  ...RENEWAL_DOCUMENT_FIELD_KEYS,
  'rejectionDocUploaded',
  'specialEvidenceUploaded',
] as const;

export function isStagedRenewalDocument(value: unknown): value is StagedRenewalDocument {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof File !== 'undefined' &&
      (value as StagedRenewalDocument).pendingFile instanceof File,
  );
}

const collectSavedFileIds = (value: unknown): number[] =>
  (Array.isArray(value) ? value : [value])
    .filter((item) => item && !isStagedRenewalDocument(item))
    .map((item) => getDocumentUploadMeta(item).id)
    .filter((id): id is number => typeof id === 'number' && id > 0);

/**
 * @param previous the saved value being replaced — one document, or a list (evidence).
 */
export function stageRenewalDocument(
  file: File,
  previous: unknown,
  fileType?: string,
): StagedRenewalDocument {
  // Re-staging over an unsaved pick keeps pointing at the originally saved file.
  const replaces = isStagedRenewalDocument(previous) ? previous.replaces : previous;
  if (isStagedRenewalDocument(previous)) URL.revokeObjectURL(previous.fileUrl);
  return {
    pendingFile: file,
    fileName: file.name,
    fileUrl: URL.createObjectURL(file),
    fileSize: file.size,
    fileType,
    ...(collectSavedFileIds(replaces).length ? { replaces } : {}),
  };
}

/** Drop an unsaved pick and fall back to the saved document(s) it would have replaced. */
export function discardStagedRenewalDocument(staged: StagedRenewalDocument): unknown {
  URL.revokeObjectURL(staged.fileUrl);
  return staged.replaces ?? null;
}

export function hasStagedRenewalDocuments(
  formData: Record<string, any>,
  fieldKeys: readonly string[] = RENEWAL_STAGEABLE_FIELD_KEYS,
): boolean {
  return fieldKeys.some((key) => isStagedRenewalDocument(formData[key]));
}

/** Staged entries from form state, so a reload from the server does not drop unsaved picks. */
export function pickStagedRenewalDocuments(formData: Record<string, any>): Record<string, unknown> {
  const staged: Record<string, unknown> = {};
  for (const key of RENEWAL_STAGEABLE_FIELD_KEYS) {
    if (isStagedRenewalDocument(formData[key])) staged[key] = formData[key];
  }
  if (staged.specialEvidenceUploaded) staged.specialEvidenceFiles = formData.specialEvidenceFiles;
  return staged;
}

/**
 * Upload the staged documents among fieldKeys, then delete the saved file(s) each one
 * replaces. Returns a form patch with the saved file meta for each committed field.
 */
export async function commitStagedRenewalDocuments(
  renewalId: string,
  formData: Record<string, any>,
  fieldKeys: readonly string[] = RENEWAL_STAGEABLE_FIELD_KEYS,
  /** Called as each field is saved, so a later failure does not lose earlier uploads. */
  onFieldSaved?: (patch: Record<string, unknown>) => void,
): Promise<Record<string, unknown>> {
  const patch: Record<string, unknown> = {};
  for (const fieldKey of fieldKeys) {
    const staged = formData[fieldKey];
    if (!isStagedRenewalDocument(staged)) continue;

    const uploaded = await RenewalService.uploadDocument(renewalId, fieldKey, staged.pendingFile);
    for (const replacedId of collectSavedFileIds(staged.replaces)) {
      try {
        await RenewalService.deleteRenewalFile(replacedId);
      } catch {
        // The new file is saved; a leftover old file must not fail the save.
      }
    }
    URL.revokeObjectURL(staged.fileUrl);
    const base = toRenewalFileMeta(uploaded);
    const meta = { ...base, fileType: base.fileType || staged.fileType };
    const fieldPatch: Record<string, unknown> = { [fieldKey]: meta };
    // Evidence is a single file shown from the list as well.
    if (fieldKey === 'specialEvidenceUploaded') fieldPatch.specialEvidenceFiles = [meta];
    Object.assign(patch, fieldPatch);
    onFieldSaved?.(fieldPatch);
  }
  return patch;
}

/**
 * Upload any documents that exist in form state (fileUrl) but lack a renewal file id.
 * PATCH save does not carry files — they must be persisted via upload-file first.
 */
export async function syncPendingRenewalDocuments(
  renewalId: string,
  formData: Record<string, any>,
  options?: { fieldKeys?: readonly string[] },
): Promise<Record<string, unknown>> {
  const patch: Record<string, unknown> = {};
  const fieldKeys = options?.fieldKeys ?? RENEWAL_DOCUMENT_FIELD_KEYS;

  for (const fieldKey of fieldKeys) {
    if (isStagedRenewalDocument(formData[fieldKey])) continue;
    const meta = getDocumentUploadMeta(formData[fieldKey]);
    if (!meta.fileUrl || meta.id) continue;

    const uploaded = await uploadRenewalDocumentFromExisting(renewalId, fieldKey, meta);
    if (uploaded) patch[fieldKey] = uploaded;
  }

  const evidenceList: any[] = Array.isArray(formData.specialEvidenceFiles)
    ? formData.specialEvidenceFiles
    : formData.specialEvidenceUploaded
    ? [formData.specialEvidenceUploaded]
    : [];

  const includeEvidence =
    !options?.fieldKeys ||
    options.fieldKeys.includes('specialEvidenceUploaded') ||
    options.fieldKeys.includes('specialEvidenceFiles');

  // An unsaved evidence pick is uploaded by commitStagedRenewalDocuments on save.
  if (!includeEvidence || isStagedRenewalDocument(formData.specialEvidenceUploaded)) {
    return patch;
  }

  const syncedEvidence: RenewalFileMeta[] = [];
  for (const file of evidenceList) {
    const meta = getDocumentUploadMeta(file);
    if (meta.id) {
      syncedEvidence.push({ ...file, ...meta });
      continue;
    }
    if (!meta.fileUrl) continue;

    const uploaded = await uploadRenewalDocumentFromExisting(renewalId, 'specialEvidenceUploaded', meta);
    if (uploaded) syncedEvidence.push(uploaded);
  }

  if (syncedEvidence.length) {
    patch.specialEvidenceFiles = syncedEvidence;
    patch.specialEvidenceUploaded = syncedEvidence[syncedEvidence.length - 1];
  }

  return patch;
}

/** True when UI shows a file (fileUrl) not yet stored on renewal via upload-file */
export function hasPendingRenewalDocuments(formData: Record<string, any>): boolean {
  for (const fieldKey of RENEWAL_DOCUMENT_FIELD_KEYS) {
    if (isStagedRenewalDocument(formData[fieldKey])) continue;
    const meta = getDocumentUploadMeta(formData[fieldKey]);
    if (meta.fileUrl && !meta.id) return true;
  }

  const evidenceList: any[] = Array.isArray(formData.specialEvidenceFiles)
    ? formData.specialEvidenceFiles
    : formData.specialEvidenceUploaded
    ? [formData.specialEvidenceUploaded]
    : [];

  return evidenceList.some((file) => {
    if (isStagedRenewalDocument(file)) return false;
    const meta = getDocumentUploadMeta(file);
    return Boolean(meta.fileUrl && !meta.id);
  });
}

/** POST upload-file for all prefilled documents (fresh app or renewal without file ids) */
export async function applyPrefilledDocumentUploads(
  renewalId: string,
  formData: Record<string, any>,
): Promise<{ formData: Record<string, any>; synced: boolean; count: number }> {
  if (!renewalId || !hasPendingRenewalDocuments(formData)) {
    return { formData, synced: false, count: 0 };
  }

  const patch = await syncPendingRenewalDocuments(renewalId, formData);
  let count = 0;
  for (const fieldKey of RENEWAL_DOCUMENT_FIELD_KEYS) {
    if (patch[fieldKey]) count += 1;
  }
  if (Array.isArray(patch.specialEvidenceFiles)) {
    count += (patch.specialEvidenceFiles as RenewalFileMeta[]).filter((f) => f.id).length;
  }

  if (!count) {
    return { formData, synced: false, count: 0 };
  }

  return {
    formData: { ...formData, ...patch },
    synced: true,
    count,
  };
}
