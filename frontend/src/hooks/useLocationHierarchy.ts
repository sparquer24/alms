import { useState, useEffect } from 'react';
import { locationAPI, toSelectOptions } from '../api/locationApi';
import {
  State,
  District,
  Zone,
  Division,
  PoliceStation,
  LocationHierarchyState
} from '../types/location';

export interface AddressLocationValues {
  state: string;
  district: string;
  zone: string;
  division: string;
  policeStation: string;
}

interface LocationHierarchyActions {
  setSelectedState: (stateId: string) => void;
  setSelectedDistrict: (districtId: string) => void;
  setSelectedZone: (zoneId: string) => void;
  setSelectedDivision: (divisionId: string) => void;
  setSelectedPoliceStation: (policeStationId: string) => void;
  hydrateFromValues: (values: AddressLocationValues) => Promise<void>;
  resetHierarchy: () => void;
  getSelectOptions: () => {
    stateOptions: { value: string; label: string }[];
    districtOptions: { value: string; label: string }[];
    zoneOptions: { value: string; label: string }[];
    divisionOptions: { value: string; label: string }[];
    policeStationOptions: { value: string; label: string }[];
  };
}

const initialState: LocationHierarchyState = {
  states: [],
  districts: [],
  zones: [],
  divisions: [],
  policeStations: [],
  selectedState: '',
  selectedDistrict: '',
  selectedZone: '',
  selectedDivision: '',
  selectedPoliceStation: '',
  loadingStates: false,
  loadingDistricts: false,
  loadingZones: false,
  loadingDivisions: false,
  loadingPoliceStations: false,
  error: null,
};

export const useLocationHierarchy = (): [LocationHierarchyState, LocationHierarchyActions] => {
  const [state, setState] = useState<LocationHierarchyState>(initialState);

  // Load states on component mount
  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    setState(prev => ({ ...prev, loadingStates: true, error: null }));
    try {
      const states = await locationAPI.getAllStates();
      setState(prev => ({ ...prev, states, loadingStates: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loadingStates: false, 
        error: error instanceof Error ? error.message : 'Failed to load states' 
      }));
    }
  };

  const loadDistricts = async (stateId: string) => {
    if (!stateId) return;
    
    setState(prev => ({ ...prev, loadingDistricts: true, error: null }));
    try {
      const districts = await locationAPI.getDistrictsByState(parseInt(stateId));
      setState(prev => ({ ...prev, districts, loadingDistricts: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loadingDistricts: false, 
        error: error instanceof Error ? error.message : 'Failed to load districts' 
      }));
    }
  };

  const loadZones = async (districtId: string) => {
    if (!districtId) return;
    
    setState(prev => ({ ...prev, loadingZones: true, error: null }));
    try {
      const zones = await locationAPI.getZonesByDistrict(parseInt(districtId));
      setState(prev => ({ ...prev, zones, loadingZones: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loadingZones: false, 
        error: error instanceof Error ? error.message : 'Failed to load zones' 
      }));
    }
  };

  const loadDivisions = async (zoneId: string) => {
    if (!zoneId) return;
    
    setState(prev => ({ ...prev, loadingDivisions: true, error: null }));
    try {
      const divisions = await locationAPI.getDivisionsByZone(parseInt(zoneId));
      setState(prev => ({ ...prev, divisions, loadingDivisions: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loadingDivisions: false, 
        error: error instanceof Error ? error.message : 'Failed to load divisions' 
      }));
    }
  };

  const loadPoliceStations = async (divisionId: string) => {
    if (!divisionId) return;
    
    setState(prev => ({ ...prev, loadingPoliceStations: true, error: null }));
    try {
      const policeStations = await locationAPI.getPoliceStationsByDivision(parseInt(divisionId));
      setState(prev => ({ ...prev, policeStations, loadingPoliceStations: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loadingPoliceStations: false, 
        error: error instanceof Error ? error.message : 'Failed to load police stations' 
      }));
    }
  };

  const setSelectedState = (stateId: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedState: stateId,
      selectedDistrict: '',
      selectedZone: '',
      selectedDivision: '',
      selectedPoliceStation: '',
      districts: [],
      zones: [],
      divisions: [],
      policeStations: []
    }));
    
    if (stateId) {
      loadDistricts(stateId);
    }
  };

  const setSelectedDistrict = (districtId: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedDistrict: districtId,
      selectedZone: '',
      selectedDivision: '',
      selectedPoliceStation: '',
      zones: [],
      divisions: [],
      policeStations: []
    }));
    
    if (districtId) {
      loadZones(districtId);
    }
  };

  const setSelectedZone = (zoneId: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedZone: zoneId,
      selectedDivision: '',
      selectedPoliceStation: '',
      divisions: [],
      policeStations: []
    }));
    
    if (zoneId) {
      loadDivisions(zoneId);
    }
  };

  const setSelectedDivision = (divisionId: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedDivision: divisionId,
      selectedPoliceStation: '',
      policeStations: []
    }));
    
    if (divisionId) {
      loadPoliceStations(divisionId);
    }
  };

  const setSelectedPoliceStation = (policeStationId: string) => {
    setState(prev => ({ ...prev, selectedPoliceStation: policeStationId }));
  };

  const hydrateFromValues = async (values: AddressLocationValues) => {
    if (!values.state) return;

    setState(prev => ({
      ...prev,
      selectedState: values.state,
      selectedDistrict: values.district || '',
      selectedZone: values.zone || '',
      selectedDivision: values.division || '',
      selectedPoliceStation: values.policeStation || '',
    }));

    await loadDistricts(values.state);

    if (values.district) {
      await loadZones(values.district);
    }

    if (values.zone) {
      await loadDivisions(values.zone);
    }

    if (values.division) {
      await loadPoliceStations(values.division);
    }
  };

  const resetHierarchy = () => {
    setState(prev => ({
      ...prev,
      selectedState: '',
      selectedDistrict: '',
      selectedZone: '',
      selectedDivision: '',
      selectedPoliceStation: '',
      districts: [],
      zones: [],
      divisions: [],
      policeStations: []
    }));
  };

  const getSelectOptions = () => ({
    stateOptions: toSelectOptions(state.states),
    districtOptions: toSelectOptions(state.districts),
    zoneOptions: toSelectOptions(state.zones),
    divisionOptions: toSelectOptions(state.divisions),
    policeStationOptions: toSelectOptions(state.policeStations),
  });

  const actions: LocationHierarchyActions = {
    setSelectedState,
    setSelectedDistrict,
    setSelectedZone,
    setSelectedDivision,
    setSelectedPoliceStation,
    hydrateFromValues,
    resetHierarchy,
    getSelectOptions,
  };

  return [state, actions];
};