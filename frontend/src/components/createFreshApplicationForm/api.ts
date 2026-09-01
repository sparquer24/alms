// Lightweight API wrappers for FreshApplicationForm
// Purpose: centralize API calls used by the form and make them easy to mock/test.

import { ApplicationApi } from '../../config/APIClient';
import { WeaponsService } from '../../services/weapons';

export const getStates = async () => {
    const { apiClient } = await import('../../config/authenticatedApiClient');
    const res: any = await apiClient.get('/locations/states');
    return Array.isArray(res?.data) ? res.data : res?.body || res;
};

export const getDistricts = async (stateId: number) => {
    const { apiClient } = await import('../../config/authenticatedApiClient');
    const res: any = await apiClient.get('/locations/districts', { stateId });
    return Array.isArray(res?.data) ? res.data : res?.body || res;
};

export const getPoliceStations = async () => {
    const { apiClient } = await import('../../config/authenticatedApiClient');
    const res: any = await apiClient.get('/locations/police-stations');
    const list = Array.isArray(res?.data) ? res.data : res?.body || res;
    return (list || []).map((s: any) => ({ id: s.id, name: s.name }));
};

export const getWeapons = async () => {
    try {
        const list = await WeaponsService.getAll();
        return (list || []).map((w: any) => ({ id: w.id, name: w.name }));
    } catch (err) {
        return [
            { id: 1, name: 'Pistol' },
            { id: 2, name: 'Revolver' },
            { id: 3, name: 'Rifle' },
            { id: 4, name: 'Shotgun' }
        ];
    }
};

export const createApplication = async (payload: any) => {
    return ApplicationApi.create(payload as any);
};
