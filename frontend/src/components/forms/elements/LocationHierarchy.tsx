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
    rangeOffice?: boolean;
    zone?: boolean;
  };
  // Error mapping
  errors?: Record<string, string>;
  isRenewal?: boolean;
}

export const LocationHierarchy: React.FC<LocationHierarchyProps> = ({
  namePrefix,
  values,
  onChange,
  disabled = false,
  required = false,
  className = '',
  disabledFields = {},
  errors = {},
  isRenewal = false,
}) => {
  const [locationState, locationActions] = useLocationHierarchy({ isRenewal });

  // Load cascading options when parent pre-fills saved location IDs
  React.useEffect(() => {
    if (!values.state) return;
    
    // Check if the values match our internal state (meaning this was our own change)
    const isInSync = 
      values.state === locationState.selectedState &&
      values.district === locationState.selectedDistrict &&
      values.rangeOffice === locationState.selectedRangeOffice &&
      values.zone === locationState.selectedZone &&
      values.division === locationState.selectedDivision &&
      values.policeStation === locationState.selectedPoliceStation;
      
    if (isInSync) return;
    
    locationActions.hydrateFromValues(values);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    values.state, values.district, values.rangeOffice, values.zone, values.division, values.policeStation,
    values.stateName, values.districtName, values.rangeOfficeName, values.zoneName, values.divisionName, values.policeStationName
  ]);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const opts = locationActions.getSelectOptions();
    const label = opts.stateOptions.find((opt) => opt.value === value)?.label || '';
    locationActions.setSelectedState(value);
    onChange(`${namePrefix}State`, value);
    onChange(`${namePrefix}StateName`, label);
    
    // Clear dependent fields
    onChange(`${namePrefix}District`, '');
    onChange(`${namePrefix}DistrictName`, '');
    onChange(`${namePrefix}RangeOffice`, '');
    onChange(`${namePrefix}RangeOfficeName`, '');
    onChange(`${namePrefix}Zone`, '');
    onChange(`${namePrefix}ZoneName`, '');
    onChange(`${namePrefix}Division`, '');
    onChange(`${namePrefix}DivisionName`, '');
    onChange(`${namePrefix}PoliceStation`, '');
    onChange(`${namePrefix}PoliceStationName`, '');
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const opts = locationActions.getSelectOptions();
    const label = opts.districtOptions.find((opt) => opt.value === value)?.label || '';
    locationActions.setSelectedDistrict(value);
    onChange(`${namePrefix}District`, value);
    onChange(`${namePrefix}DistrictName`, label);
    
    // Clear dependent fields
    onChange(`${namePrefix}RangeOffice`, '');
    onChange(`${namePrefix}RangeOfficeName`, '');
    onChange(`${namePrefix}Zone`, '');
    onChange(`${namePrefix}ZoneName`, '');
    onChange(`${namePrefix}Division`, '');
    onChange(`${namePrefix}DivisionName`, '');
    onChange(`${namePrefix}PoliceStation`, '');
    onChange(`${namePrefix}PoliceStationName`, '');
  };

  const handleRangeOfficeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const opts = locationActions.getSelectOptions();
    const label = opts.rangeOfficeOptions.find((opt) => opt.value === value)?.label || '';
    locationActions.setSelectedRangeOffice(value);
    onChange(`${namePrefix}RangeOffice`, value);
    onChange(`${namePrefix}RangeOfficeName`, label);
    
    // Clear dependent fields
    onChange(`${namePrefix}Zone`, '');
    onChange(`${namePrefix}ZoneName`, '');
    onChange(`${namePrefix}Division`, '');
    onChange(`${namePrefix}DivisionName`, '');
    onChange(`${namePrefix}PoliceStation`, '');
    onChange(`${namePrefix}PoliceStationName`, '');
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const opts = locationActions.getSelectOptions();
    const label = opts.zoneOptions.find((opt) => opt.value === value)?.label || '';
    locationActions.setSelectedZone(value);
    onChange(`${namePrefix}Zone`, value);
    onChange(`${namePrefix}ZoneName`, label);
    
    // Clear dependent fields
    onChange(`${namePrefix}Division`, '');
    onChange(`${namePrefix}DivisionName`, '');
    onChange(`${namePrefix}PoliceStation`, '');
    onChange(`${namePrefix}PoliceStationName`, '');
  };

  const handleDivisionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const opts = locationActions.getSelectOptions();
    const label = opts.divisionOptions.find((opt) => opt.value === value)?.label || '';
    locationActions.setSelectedDivision(value);
    onChange(`${namePrefix}Division`, value);
    onChange(`${namePrefix}DivisionName`, label);
    
    // Clear dependent field
    onChange(`${namePrefix}PoliceStation`, '');
    onChange(`${namePrefix}PoliceStationName`, '');
  };

  const handlePoliceStationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const opts = locationActions.getSelectOptions();
    const label = opts.policeStationOptions.find((opt) => opt.value === value)?.label || '';
    locationActions.setSelectedPoliceStation(value);
    onChange(`${namePrefix}PoliceStation`, value);
    onChange(`${namePrefix}PoliceStationName`, label);
  };

  const handleStateFocus = () => {
    if (locationState.states.length <= 1) {
      locationActions.loadStates();
    }
  };

  const handleDistrictFocus = () => {
    if (values.state && locationState.districts.length <= 1) {
      locationActions.loadDistricts(values.state);
    }
  };

  const handleRangeOfficeFocus = () => {
    if (values.district && locationState.rangeOffices.length <= 1) {
      locationActions.loadRangeOffices(values.district);
    }
  };

  const handleZoneFocus = () => {
    if (values.rangeOffice && locationState.zones.length <= 1) {
      locationActions.loadZones(values.rangeOffice);
    }
  };

  const handleDivisionFocus = () => {
    if (values.zone && locationState.divisions.length <= 1) {
      locationActions.loadDivisions(values.zone);
    }
  };

  const handlePoliceStationFocus = () => {
    if (values.division && locationState.policeStations.length <= 1) {
      locationActions.loadPoliceStations(values.division);
    }
  };

  const options = locationActions.getSelectOptions();

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <Select
        label="State"
        name={`${namePrefix}State`}
        value={values.state}
        onChange={handleStateChange}
        onFocus={handleStateFocus}
        options={options.stateOptions}
        placeholder={locationState.loadingStates ? "Loading states..." : "Select state"}
        required={required}
        disabled={disabled || disabledFields.state || locationState.loadingStates}
        error={errors[`${namePrefix}State`]}
      />
      
      <Select
        label="District"
        name={`${namePrefix}District`}
        value={values.district}
        onChange={handleDistrictChange}
        onFocus={handleDistrictFocus}
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
        disabledMessage={!values.state ? "Please select a State first" : undefined}
        error={errors[`${namePrefix}District`]}
      />

      <Select
        label="Range Office"
        name={`${namePrefix}RangeOffice`}
        value={values.rangeOffice}
        onChange={handleRangeOfficeChange}
        onFocus={handleRangeOfficeFocus}
        options={options.rangeOfficeOptions}
        placeholder={
          locationState.loadingRangeOffices 
            ? "Loading range offices..." 
            : !values.district 
            ? "Select district first" 
            : "Select range office"
        }
        required={required}
        disabled={disabled || disabledFields.rangeOffice || !values.district || locationState.loadingRangeOffices}
        disabledMessage={!values.district ? "Please select a District first" : undefined}
        error={errors[`${namePrefix}RangeOffice`]}
      />
      
      <Select
        label="Zone"
        name={`${namePrefix}Zone`}
        value={values.zone}
        onChange={handleZoneChange}
        onFocus={handleZoneFocus}
        options={options.zoneOptions}
        placeholder={
          locationState.loadingZones 
            ? "Loading zones..." 
            : !values.rangeOffice 
            ? "Select range office first" 
            : "Select zone"
        }
        required={required}
        disabled={disabled || disabledFields.zone || !values.rangeOffice || locationState.loadingZones}
        disabledMessage={!values.rangeOffice ? "Please select a Range Office first" : undefined}
        error={errors[`${namePrefix}Zone`]}
      />
      
      <Select
        label="Division"
        name={`${namePrefix}Division`}
        value={values.division}
        onChange={handleDivisionChange}
        onFocus={handleDivisionFocus}
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
        disabledMessage={!values.zone ? "Please select a Zone first" : undefined}
        error={errors[`${namePrefix}Division`]}
      />
      
      <div className="col-span-2">
        <Select
          label="Jurisdiction police station"
          name={`${namePrefix}PoliceStation`}
          value={values.policeStation}
          onChange={handlePoliceStationChange}
          onFocus={handlePoliceStationFocus}
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
          disabledMessage={!values.division ? "Please select a Division first" : undefined}
          error={errors[`${namePrefix}PoliceStation`]}
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