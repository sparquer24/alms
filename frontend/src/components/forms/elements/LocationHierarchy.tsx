import React from 'react';
import { Select } from './Select';
import { useLocationHierarchy } from '../../../hooks/useLocationHierarchy';
import { AddressLocationData } from '../../../types/location';

interface LocationHierarchyProps {
  // Prefix for field names (e.g., 'present' or 'permanent')
  namePrefix: string;
  
  // Values from parent component
  values: AddressLocationData;
  
  // Change handler
  onChange: (field: string, value: string) => void;
  
  // Optional props
  disabled?: boolean;
  required?: boolean;
  className?: string;
  // Disable specific fields
  disabledFields?: {
    state?: boolean;
    district?: boolean;
    zone?: boolean;
  };
}

export const LocationHierarchy: React.FC<LocationHierarchyProps> = ({
  namePrefix,
  values,
  onChange,
  disabled = false,
  required = false,
  className = '',
  disabledFields = {},
}) => {
  const [locationState, locationActions] = useLocationHierarchy();
  
  // Sync internal state with parent values
  React.useEffect(() => {
    if (values.state !== locationState.selectedState) {
      locationActions.setSelectedState(values.state);
    }
  }, [values.state]);

  React.useEffect(() => {
    if (values.district !== locationState.selectedDistrict) {
      locationActions.setSelectedDistrict(values.district);
    }
  }, [values.district]);

  React.useEffect(() => {
    if (values.zone !== locationState.selectedZone) {
      locationActions.setSelectedZone(values.zone);
    }
  }, [values.zone]);

  React.useEffect(() => {
    if (values.division !== locationState.selectedDivision) {
      locationActions.setSelectedDivision(values.division);
    }
  }, [values.division]);

  React.useEffect(() => {
    if (values.policeStation !== locationState.selectedPoliceStation) {
      locationActions.setSelectedPoliceStation(values.policeStation);
    }
  }, [values.policeStation]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    locationActions.setSelectedState(value);
    onChange(`${namePrefix}State`, value);
    
    // Clear dependent fields
    onChange(`${namePrefix}District`, '');
    onChange(`${namePrefix}Zone`, '');
    onChange(`${namePrefix}Division`, '');
    onChange(`${namePrefix}PoliceStation`, '');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    locationActions.setSelectedDistrict(value);
    onChange(`${namePrefix}District`, value);
    
    // Clear dependent fields
    onChange(`${namePrefix}Zone`, '');
    onChange(`${namePrefix}Division`, '');
    onChange(`${namePrefix}PoliceStation`, '');
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    locationActions.setSelectedZone(value);
    onChange(`${namePrefix}Zone`, value);
    
    // Clear dependent fields
    onChange(`${namePrefix}Division`, '');
    onChange(`${namePrefix}PoliceStation`, '');
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    locationActions.setSelectedDivision(value);
    onChange(`${namePrefix}Division`, value);
    
    // Clear dependent field
    onChange(`${namePrefix}PoliceStation`, '');
  };

  const handlePoliceStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    locationActions.setSelectedPoliceStation(value);
    onChange(`${namePrefix}PoliceStation`, value);
  };

  const options = locationActions.getSelectOptions();

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <Select
        label="State"
        name={`${namePrefix}State`}
        value={values.state}
        onChange={handleStateChange}
        options={options.stateOptions}
        placeholder={locationState.loadingStates ? "Loading states..." : "Select state"}
        required={required}
        disabled={disabled || disabledFields.state || locationState.loadingStates}
      />
      
      <Select
        label="District"
        name={`${namePrefix}District`}
        value={values.district}
        onChange={handleDistrictChange}
        options={options.districtOptions}
        placeholder={
          locationState.loadingDistricts 
            ? "Loading districts..." 
            : !values.state 
            ? "Select state first" 
            : "Select district"
        }
        required={required}
        disabled={disabled || disabledFields.district || !values.state || locationState.loadingDistricts}
      />
      
      <Select
        label="Zone"
        name={`${namePrefix}Zone`}
        value={values.zone}
        onChange={handleZoneChange}
        options={options.zoneOptions}
        placeholder={
          locationState.loadingZones 
            ? "Loading zones..." 
            : !values.district 
            ? "Select district first" 
            : "Select zone"
        }
        required={required}
        disabled={disabled || disabledFields.zone || !values.district || locationState.loadingZones}
      />
      
      <Select
        label="Division"
        name={`${namePrefix}Division`}
        value={values.division}
        onChange={handleDivisionChange}
        options={options.divisionOptions}
        placeholder={
          locationState.loadingDivisions 
            ? "Loading divisions..." 
            : !values.zone 
            ? "Select zone first" 
            : "Select division"
        }
        required={required}
        disabled={disabled || !values.zone || locationState.loadingDivisions}
      />
      
      <div className="col-span-2">
        <Select
          label="Jurisdiction police station"
          name={`${namePrefix}PoliceStation`}
          value={values.policeStation}
          onChange={handlePoliceStationChange}
          options={options.policeStationOptions}
          placeholder={
            locationState.loadingPoliceStations 
              ? "Loading police stations..." 
              : !values.division 
              ? "Select division first" 
              : "Select police station"
          }
          required={required}
          disabled={disabled || !values.division || locationState.loadingPoliceStations}
        />
      </div>
      
      {locationState.error && (
        <div className="col-span-2 text-red-500 text-sm mt-1">
          Error: {locationState.error}
        </div>
      )}
    </div>
  );
};