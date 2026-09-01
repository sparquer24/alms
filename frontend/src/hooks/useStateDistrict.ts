import { useState, useEffect } from 'react';
import { locationAPI, toSelectOptions } from '../api/locationApi';
import { State, District } from '../types/location';

interface UseStateDistrictReturn {
  states: State[];
  districts: District[];
  loadingStates: boolean;
  loadingDistricts: boolean;
  error: string | null;
  stateOptions: { value: string; label: string }[];
  districtOptions: { value: string; label: string }[];
  handleStateChange: (stateId: string) => void;
  resetDistricts: () => void;
}

export const useStateDistrict = (): UseStateDistrictReturn => {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load states on hook initialization
  useEffect(() => {
    loadStates();
  }, []);

  const loadStates = async () => {
    setLoadingStates(true);
    setError(null);
    try {
      const statesData = await locationAPI.getAllStates();
      setStates(statesData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load states');
    } finally {
      setLoadingStates(false);
    }
  };

  const loadDistricts = async (stateId: number) => {
    if (!stateId) {
      setDistricts([]);
      return;
    }

    setLoadingDistricts(true);
    setError(null);
    try {
      const districtsData = await locationAPI.getDistrictsByState(stateId);
      setDistricts(districtsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load districts');
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleStateChange = (stateId: string) => {
    if (stateId) {
      loadDistricts(parseInt(stateId));
    } else {
      setDistricts([]);
    }
  };

  const resetDistricts = () => {
    setDistricts([]);
  };

  return {
    states,
    districts,
    loadingStates,
    loadingDistricts,
    error,
    stateOptions: toSelectOptions(states),
    districtOptions: toSelectOptions(districts),
    handleStateChange,
    resetDistricts,
  };
};