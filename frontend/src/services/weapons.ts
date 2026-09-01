import { apiClient } from '../config/authenticatedApiClient';

export type Weapon = {
  id: number;
  name: string;
  [key: string]: any;
};

function normalize(res: any): Weapon[] {
  const arr = (res?.data ?? res?.body ?? res?.items ?? res) as any;
  if (Array.isArray(arr)) return arr as Weapon[];
  if (arr?.data && Array.isArray(arr.data)) return arr.data as Weapon[];
  return [];
}

export const WeaponsService = {
  async getAll(params?: { id?: number | string }): Promise<Weapon[]> {
    const res: any = await apiClient.get('/Weapons', params);
    return normalize(res);
  },
};
