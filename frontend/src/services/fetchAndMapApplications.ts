import { getApplicationsByStatus, getApplicationsByStatuses } from './applicationFormService';
import { mapAPIApplicationToTableData } from '../utils/applicationMapper';
import type { ApplicationData } from '../config/mockData';

// Fetch one or multiple statuses and map to table data
export async function fetchMappedApplications(statusOrStatuses: string | string[]): Promise<ApplicationData[]> {
  try {
    const statuses = Array.isArray(statusOrStatuses) ? statusOrStatuses : [statusOrStatuses];
    if (statuses.length === 1) {
      const raw = await getApplicationsByStatus(statuses[0]);
      return Array.isArray(raw) ? raw.map(r => mapAPIApplicationToTableData(r)) : [];
    }
    const raw = await getApplicationsByStatuses(statuses);
    return Array.isArray(raw) ? raw.map(r => mapAPIApplicationToTableData(r)) : [];
  } catch (e) {
    // Surface minimal info; caller can handle
    // eslint-disable-next-line no-console
    console.error('fetchMappedApplications error', e);
    return [];
  }
}
