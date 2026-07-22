/**
 * Document Service
 * Service for interacting with the Documents API endpoints
 *
 * GET /api/documents?id={applicationId}&type={Fresh|Renewal|Cancellation}
 */
import { apiClient } from '../config/authenticatedApiClient';

export interface DocumentItem {
  id: number;
  applicationId: number;
  applicationType: 'Fresh' | 'Renewal' | 'Cancellation';
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface DocumentsResponse {
  success: boolean;
  message: string;
  data: DocumentItem[];
}

/**
 * Normalize the application type from the License GET API (uppercase like "FRESH")
 * to the Documents API format (title case like "Fresh").
 */
function normalizeType(rawType: string): string {
  const type = String(rawType).trim().toLowerCase();
  if (type === 'fresh' || type === 'freshapplication') return 'Fresh';
  if (type === 'renewal' || type === 'renewalapplication') return 'Renewal';
  if (type === 'cancellation' || type === 'cancel') return 'Cancellation';
  // Default fallback — capitalise first letter
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Fetch documents for an application by applicationId and lastModifiedAppType.
 */
export async function getDocuments(
  applicationId: number,
  lastModifiedAppType: string,
): Promise<DocumentItem[]> {
  try {
    const normalizedType = normalizeType(lastModifiedAppType);

    const response = await apiClient.get<DocumentsResponse>('/documents', {
      id: applicationId,
      type: normalizedType,
    });

    // The API client returns the response directly; unwrap depending on shape.
    const payload = (response as any)?.data ?? response;
    if (Array.isArray(payload)) return payload as DocumentItem[];
    if (payload?.data && Array.isArray(payload.data)) return payload.data as DocumentItem[];
    return [];
  } catch (error) {
    console.error('[DocumentService] Failed to fetch documents:', error);
    return [];
  }
}
