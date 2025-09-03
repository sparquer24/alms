import { ApplicationApi } from '../config/APIClient';
import { Application } from '../types/application';
import { ApiResponse } from '../types/api';
import { CreateApplicationParams } from '../config/APIsEndpoints';
import { normalizeRouteStatus } from '../utils/statusNormalize';

// Backend (ApplicationFormController_getApplications) now expects statusIds=<comma separated>
// Adapt single status param to comma separated list for compatibility.

// Synonym expansion so backend matches any stored variant. Adjust as we discover real codes.
const STATUS_SYNONYMS: Record<string, string[]> = {
  forward: ['forward', 'FORWARD', 'forwarded', 'FORWARDED'],
  returned: ['returned', 'RETURNED'],
  red_flagged: ['red_flagged', 'redflagged', 'RED_FLAGGED', 'REDFLAGGED', 'flagged', 'FLAGGED'],
  disposed: ['disposed', 'DISPOSED'],
  closed: ['closed', 'CLOSED'],
  sent: ['sent', 'SENT'],
  initiated: ['initiated', 'INITIATED', 'freshform', 'FRESHFORM'],
  final_disposal: ['final_disposal', 'finaldisposal', 'FINAL_DISPOSAL', 'FINALDISPOSAL']
};

function expandStatusVariants(raw: string | number): string[] {
  const str = String(raw).trim();
  const canonical = normalizeRouteStatus(str) || str.toLowerCase();
  const baseSet = new Set<string>();
  // Always include original, lower & upper
  [str, str.toLowerCase(), str.toUpperCase()].forEach(s => baseSet.add(s));
  // Include canonical & its case variants
  [canonical, canonical.toUpperCase()].forEach(s => baseSet.add(s));
  // Include known synonyms
  (STATUS_SYNONYMS[canonical] || []).forEach(s => baseSet.add(s));
  return Array.from(baseSet);
}

export const getApplicationsByStatus = async (status: string | number): Promise<any[]> => {
  try {
    const variants = expandStatusVariants(status);
    const paramValue = variants.join(',');
    console.log('getApplicationsByStatus - Expanded variants:', { input: status, variants, paramValue });
    const params: Record<string, any> = { statusIds: paramValue };
    const response = await ApplicationApi.getAll(params as any);
    console.log('getApplicationsByStatus - API Response meta:', {
      success: response?.success,
      length: Array.isArray(response?.data) ? response.data.length : 'not array'
    });
    const applications = (response as unknown as ApiResponse<any[]>).data;
    return Array.isArray(applications) ? applications : [];
  } catch (error) {
    console.error('getApplicationsByStatus - Error:', error);
    throw error;
  }
};

export const getApplicationsByStatuses = async (statuses: Array<string | number>): Promise<any[]> => {
  try {
    console.log('status:', statuses);
    const expanded = statuses
      .filter(s => s != null)
      .flatMap(s => expandStatusVariants(s));
    const deduped = Array.from(new Set(expanded));
    const params: Record<string, any> = { statusIds: deduped.join(',') };
    console.log('getApplicationsByStatuses - Expanded API params:, 62', params);
    const response = await ApplicationApi.getAll(params as any);
    const applications = (response as unknown as ApiResponse<any[]>).data;
    return Array.isArray(applications) ? applications : [];
  } catch (e) {
    console.error('getApplicationsByStatuses - Error', e);
    return [];
  }
};

export const getApplicationById = async (id: string): Promise<Application> => {
  try {
    const response = await ApplicationApi.getById(id);
    // Check if response.data is of type Application, otherwise throw an error
    if (typeof (response as any).data === 'boolean') {
      throw new Error('Invalid response: data is boolean, expected Application object');
    }
    return (response as unknown as ApiResponse<Application>).data;
  } catch (error) {
    console.error('Error fetching application:', error);
    throw error;
  }
};

export const createApplication = async (applicationData: CreateApplicationParams): Promise<Application> => {
  try {
    const response = await ApplicationApi.create(applicationData);
    return (response as unknown as ApiResponse<Application>).data;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};
