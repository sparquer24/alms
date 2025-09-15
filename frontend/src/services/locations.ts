import { apiClient } from '../config/authenticatedApiClient';

// Minimal shared type
export type BasicItem = { id: number; name: string; [key: string]: any };

// Some backends return {data: [...]} or {body: [...]} or raw array; normalize it
function normalizeList(res: any): BasicItem[] {
  // apiClient.get returns whatever axiosConfig.fetchData returned; try common shapes
  if (!res) return [];
  const maybe = (res.data ?? res.body ?? res.items ?? res) as any;
  if (Array.isArray(maybe)) return maybe as BasicItem[];
  // Some endpoints might return { data: { items: [] } }
  if (maybe && Array.isArray(maybe.items)) return maybe.items as BasicItem[];
  if (maybe && Array.isArray(maybe.data)) return maybe.data as BasicItem[];
  return [] as BasicItem[];
}

export const LocationService = {
  // GET /locations/states
  async getStates(): Promise<BasicItem[]> {
    const res: any = await apiClient.get('/locations/states');
    return normalizeList(res);
  },

  // GET /locations/districts?stateId={stateId}
  async getDistricts(stateId: number | string): Promise<BasicItem[]> {
    const res: any = await apiClient.get('/locations/districts', { stateId });
    return normalizeList(res);
  },

  // GET /locations/zones?districtId={districtId}&stateId={stateId}
  async getZones(params: { districtId: number | string; stateId?: number | string }): Promise<BasicItem[]> {
    const res: any = await apiClient.get('/locations/zones', params);
    return normalizeList(res);
  },

  // GET /locations/divisions?zoneId={zoneId}&districtId={districtId}
  async getDivisions(params: { zoneId: number | string; districtId?: number | string }): Promise<BasicItem[]> {
    const res: any = await apiClient.get('/locations/divisions', params);
    return normalizeList(res);
  },

  // Prefer new endpoint; fallback to legacy /locations/police-stations when needed
  // GET /locations/stations?divisionId={divisionId}&zoneId={zoneId}
  async getStations(params: { divisionId?: number | string; zoneId?: number | string }): Promise<BasicItem[]> {
    try {
      const res: any = await apiClient.get('/locations/stations', params);
      const list = normalizeList(res);
      if (list.length) return list;
    } catch (e) {
      // fall through to legacy
    }

    try {
      const legacy: any = await apiClient.get('/locations/police-stations', params as any);
      return normalizeList(legacy);
    } catch (e) {
      return [];
    }
  },
};

export type LocationSelection = {
  state?: BasicItem | null;
  district?: BasicItem | null;
  zone?: BasicItem | null;
  division?: BasicItem | null;
  station?: BasicItem | null;
};
