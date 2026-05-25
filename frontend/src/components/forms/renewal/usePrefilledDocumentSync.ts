import { useEffect, useMemo, useRef, useState } from 'react';

import {
  getDocumentUploadMeta,
  RENEWAL_DOCUMENT_FIELD_KEYS,
  syncPendingRenewalDocuments,
} from './renewalFileUpload';



export type PrefillDocumentSyncScope = 'documents' | 'evidence' | 'all';



const EVIDENCE_FIELD_KEYS = ['specialEvidenceUploaded', 'specialEvidenceFiles'] as const;



function getScopeFieldKeys(scope: PrefillDocumentSyncScope): readonly string[] {

  if (scope === 'documents') return RENEWAL_DOCUMENT_FIELD_KEYS;

  if (scope === 'evidence') return EVIDENCE_FIELD_KEYS;

  return [...RENEWAL_DOCUMENT_FIELD_KEYS, ...EVIDENCE_FIELD_KEYS];

}



/** Stable key for prefilled files that still need POST upload-file */

export function buildPendingDocumentsSignature(

  formData: Record<string, any>,

  scope: PrefillDocumentSyncScope = 'all',

): string {

  const parts: string[] = [];

  const fieldKeys = getScopeFieldKeys(scope);



  for (const key of fieldKeys) {

    if (key === 'specialEvidenceFiles') continue;

    const meta = getDocumentUploadMeta(formData[key]);

    if (meta.fileUrl && !meta.id) {

      parts.push(`${key}:${meta.fileUrl}`);

    }

  }



  if (scope === 'documents') {

    return parts.join('|');

  }



  const evidenceList: any[] = Array.isArray(formData.specialEvidenceFiles)

    ? formData.specialEvidenceFiles

    : formData.specialEvidenceUploaded

    ? [formData.specialEvidenceUploaded]

    : [];



  evidenceList.forEach((file, index) => {

    const meta = getDocumentUploadMeta(file);

    if (meta.fileUrl && !meta.id) {

      parts.push(`evidence-${index}:${meta.fileUrl}`);

    }

  });



  return parts.join('|');

}



/**

 * When prefilled documents load (fileUrl, no renewal file id), POST each to upload-file automatically.

 */

export function usePrefilledDocumentSync(

  renewalId: string,

  formData: Record<string, any>,

  onPatch: (patch: Record<string, unknown>) => void,

  onError?: (message: string) => void,

  onStatus?: (message: string | null) => void,

  scope: PrefillDocumentSyncScope = 'all',

) {

  const [isSyncingPrefilled, setIsSyncingPrefilled] = useState(false);

  const syncedSignaturesRef = useRef<Set<string>>(new Set());



  const pendingSignature = useMemo(

    () => buildPendingDocumentsSignature(formData, scope),

    [formData, scope],

  );

  const hasPending = Boolean(renewalId && pendingSignature);

  const scopeFieldKeys = useMemo(() => getScopeFieldKeys(scope), [scope]);



  useEffect(() => {

    if (!renewalId || !pendingSignature) return;

    if (syncedSignaturesRef.current.has(pendingSignature)) return;



    let cancelled = false;



    (async () => {

      setIsSyncingPrefilled(true);

      onStatus?.('Uploading prefilled documents to renewal...');



      try {

        const patch = await syncPendingRenewalDocuments(renewalId, formData, {

          fieldKeys: scopeFieldKeys,

        });



        if (cancelled) return;



        if (Object.keys(patch).length > 0) {

          onPatch(patch);

          syncedSignaturesRef.current.add(pendingSignature);

          const count = Object.keys(patch).length;

          onStatus?.(

            count === 1

              ? '1 prefilled document saved via upload-file.'

              : `${count} prefilled document section(s) saved via upload-file.`,

          );

        }

      } catch (err: any) {

        if (!cancelled) {

          onError?.(err?.message || 'Failed to upload prefilled documents.');

        }

      } finally {

        if (!cancelled) setIsSyncingPrefilled(false);

      }

    })();



    return () => {

      cancelled = true;

    };

  }, [renewalId, pendingSignature, formData, onPatch, onError, onStatus, scopeFieldKeys]);



  return { isSyncingPrefilled, hasPendingPrefilled: hasPending };

}

