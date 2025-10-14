import { fetchData } from './axiosConfig';
import { locations } from '../config/apiConfig';
import {
  LocationOption,
  State,
  District,
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
  Zone,
  Division,
  PoliceStation,
  LocationAPIResponse
};

// API functions for fetching location data
export const locationAPI = {
  // States
  getAllStates: async (): Promise<State[]> => {
    const response: LocationAPIResponse<State[]> = await fetchData(locationEndpoints.states);
    return response.data;
  },

  getStateById: async (id: number): Promise<State> => {
    const response: LocationAPIResponse<State> = await fetchData(`${locationEndpoints.states}/${id}`);
    return response.data;
  },

  // Districts
  getAllDistricts: async (): Promise<District[]> => {
    const response: LocationAPIResponse<District[]> = await fetchData(locationEndpoints.districts);
    return response.data;
  },

  getDistrictsByState: async (stateId: number): Promise<District[]> => {
    const response: LocationAPIResponse<District[]> = await fetchData(
      `${locationEndpoints.districts}?stateId=${stateId}`
    );
    return response.data;
  },

  getDistrictById: async (id: number): Promise<District> => {
    const response: LocationAPIResponse<District> = await fetchData(`${locationEndpoints.districts}/${id}`);
    return response.data;
  },

  // Zones
  getAllZones: async (): Promise<Zone[]> => {
    const response: LocationAPIResponse<Zone[]> = await fetchData(locationEndpoints.zones);
    return response.data;
  },

  getZonesByDistrict: async (districtId: number): Promise<Zone[]> => {
    const response: LocationAPIResponse<Zone[]> = await fetchData(
      `${locationEndpoints.zones}?districtId=${districtId}`
    );
    return response.data;
  },

  getZoneById: async (id: number): Promise<Zone> => {
    const response: LocationAPIResponse<Zone> = await fetchData(`${locationEndpoints.zones}/${id}`);
    return response.data;
  },

  // Divisions
  getAllDivisions: async (): Promise<Division[]> => {
    const response: LocationAPIResponse<Division[]> = await fetchData(locationEndpoints.divisions);
    return response.data;
  },

  getDivisionsByZone: async (zoneId: number): Promise<Division[]> => {
    const response: LocationAPIResponse<Division[]> = await fetchData(
      `${locationEndpoints.divisions}?zoneId=${zoneId}`
    );
    return response.data;
  },

  getDivisionById: async (id: number): Promise<Division> => {
    const response: LocationAPIResponse<Division> = await fetchData(`${locationEndpoints.divisions}/${id}`);
    return response.data;
  },

  // Police Stations
  getAllPoliceStations: async (): Promise<PoliceStation[]> => {
    const response: LocationAPIResponse<PoliceStation[]> = await fetchData(locationEndpoints.policeStations);
    return response.data;
  },

  getPoliceStationsByDivision: async (divisionId: number): Promise<PoliceStation[]> => {
    const response: LocationAPIResponse<PoliceStation[]> = await fetchData(
      `${locationEndpoints.policeStations}?divisionId=${divisionId}`
    );
    return response.data;
  },

  getPoliceStationById: async (id: number): Promise<PoliceStation> => {
    const response: LocationAPIResponse<PoliceStation> = await fetchData(`${locationEndpoints.policeStations}/${id}`);
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