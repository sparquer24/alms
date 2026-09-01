import { fetchData } from './axiosConfig';
import { locations } from '../config/apiConfig';
import {
  LocationOption,
  State,
  District,
  RangeOffice,
  Zone,
  Division,
  PoliceStation,
  LocationAPIResponse
} from '../types/location';

// Location API endpoints
export const locationEndpoints = locations;

// Re-export types for convenience
export type {
  LocationOption,
  State,
  District,
  RangeOffice,
  Zone,
  Division,
  PoliceStation,
  LocationAPIResponse
};

// API cache
const cache: Record<string, any> = {};

async function fetchWithCache<T>(url: string): Promise<T> {
  if (cache[url]) return cache[url];
  const response = await fetchData(url);
  cache[url] = response;
  return response;
}

// API functions for fetching location data
export const locationAPI = {
  // States
  getAllStates: async (): Promise<State[]> => {
    const response: LocationAPIResponse<State[]> = await fetchWithCache(locationEndpoints.states);
    return response.data;
  },

  getStateById: async (id: number): Promise<State> => {
    const response: LocationAPIResponse<State> = await fetchWithCache(
      `${locationEndpoints.states}?id=${id}`
    );
    return response.data;
  },

  // Districts
  getAllDistricts: async (): Promise<District[]> => {
    const response: LocationAPIResponse<District[]> = await fetchWithCache(locationEndpoints.districts);
    return response.data;
  },

  getDistrictsByState: async (stateId: number): Promise<District[]> => {
    const response: LocationAPIResponse<District[]> = await fetchWithCache(
      `${locationEndpoints.districts}?stateId=${stateId}`
    );
    return response.data;
  },

  getDistrictById: async (id: number): Promise<District> => {
    const response: LocationAPIResponse<District> = await fetchWithCache(
      `${locationEndpoints.districts}?id=${id}`
    );
    return response.data;
  },

  // Range Offices
  getAllRangeOffices: async (): Promise<RangeOffice[]> => {
    const response: LocationAPIResponse<RangeOffice[]> = await fetchWithCache(locationEndpoints.rangeOffices);
    return response.data;
  },

  getRangeOfficesByDistrict: async (districtId: number): Promise<RangeOffice[]> => {
    const response: LocationAPIResponse<RangeOffice[]> = await fetchWithCache(
      `${locationEndpoints.rangeOffices}?districtId=${districtId}`
    );
    return response.data;
  },

  getRangeOfficeById: async (id: number): Promise<RangeOffice> => {
    const response: LocationAPIResponse<RangeOffice> = await fetchWithCache(
      `${locationEndpoints.rangeOffices}?id=${id}`
    );
    return response.data;
  },

  // Zones
  getAllZones: async (): Promise<Zone[]> => {
    const response: LocationAPIResponse<Zone[]> = await fetchWithCache(locationEndpoints.zones);
    return response.data;
  },

  getZonesByDistrict: async (districtId: number): Promise<Zone[]> => {
    const response: LocationAPIResponse<Zone[]> = await fetchWithCache(
      `${locationEndpoints.zones}?districtId=${districtId}`
    );
    return response.data;
  },

  getZonesByRangeOffice: async (rangeOfficeId: number): Promise<Zone[]> => {
    const response: LocationAPIResponse<Zone[]> = await fetchWithCache(
      `${locationEndpoints.zones}?rangeOfficeId=${rangeOfficeId}`
    );
    return response.data;
  },

  getZoneById: async (id: number): Promise<Zone> => {
    const response: LocationAPIResponse<Zone> = await fetchWithCache(`${locationEndpoints.zones}/${id}`);
    return response.data;
  },

  // Divisions
  getAllDivisions: async (): Promise<Division[]> => {
    const response: LocationAPIResponse<Division[]> = await fetchWithCache(locationEndpoints.divisions);
    return response.data;
  },

  getDivisionsByZone: async (zoneId: number): Promise<Division[]> => {
    const response: LocationAPIResponse<Division[]> = await fetchWithCache(
      `${locationEndpoints.divisions}?zoneId=${zoneId}`
    );
    return response.data;
  },

  getDivisionById: async (id: number): Promise<Division> => {
    const response: LocationAPIResponse<Division> = await fetchWithCache(`${locationEndpoints.divisions}/${id}`);
    return response.data;
  },

  // Police Stations
  getAllPoliceStations: async (): Promise<PoliceStation[]> => {
    const response: LocationAPIResponse<PoliceStation[]> = await fetchWithCache(locationEndpoints.policeStations);
    return response.data;
  },

  getPoliceStationsByDivision: async (divisionId: number): Promise<PoliceStation[]> => {
    const response: LocationAPIResponse<PoliceStation[]> = await fetchWithCache(
      `${locationEndpoints.policeStations}?divisionId=${divisionId}`
    );
    return response.data;
  },

  getPoliceStationById: async (id: number): Promise<PoliceStation> => {
    const response: LocationAPIResponse<PoliceStation> = await fetchWithCache(
      `${locationEndpoints.policeStations}/${id}`
    );
    return response.data;
  },

  // Hierarchy
  getLocationHierarchy: async () => {
    const response = await fetchData(locationEndpoints.hierarchy);
    return response.data;
  }
};

// Helper function to convert location data to dropdown options
export const toSelectOptions = (locations: LocationOption[]): { value: string; label: string }[] => {
  return locations.map(location => ({
    value: location.id.toString(),
    label: location.name
  }));
};