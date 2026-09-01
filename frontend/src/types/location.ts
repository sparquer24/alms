// Location-related type definitions

export interface LocationOption {
  id: number;
  name: string;
}

export interface State extends LocationOption {
  districts?: District[];
}

export interface District extends LocationOption {
  stateId: number;
  state?: State;
  rangeOffices?: RangeOffice[];
}

export interface RangeOffice extends LocationOption {
  districtId: number;
  district?: District;
  zones?: Zone[];
}

export interface Zone extends LocationOption {
  rangeOfficeId?: number;
  rangeOffice?: RangeOffice;
  divisions?: Division[];
}

export interface Division extends LocationOption {
  zoneId: number;
  zone?: Zone;
  stations?: PoliceStation[];
}

export interface PoliceStation extends LocationOption {
  divisionId: number;
  division?: Division;
}

export interface LocationAPIResponse<T> {
  success: boolean;
  message: string;
  data: T;
  count?: number;
  filters?: Record<string, any>;
}

// Form data interfaces for address details
export interface AddressLocationData {
  state: string;
  district: string;
  rangeOffice: string;
  zone: string;
  division: string;
  policeStation: string;
  stateName?: string;
  districtName?: string;
  rangeOfficeName?: string;
  zoneName?: string;
  divisionName?: string;
  policeStationName?: string;
}

export interface AddressFormData {
  presentAddress: string;
  presentState: string;
  presentDistrict: string;
  presentRangeOffice: string;
  presentZone: string;
  presentDivision: string;
  presentPoliceStation: string;
  presentStateName?: string;
  presentDistrictName?: string;
  presentRangeOfficeName?: string;
  presentZoneName?: string;
  presentDivisionName?: string;
  presentPoliceStationName?: string;
  presentSince: string;
  sameAsPresent: boolean;
  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  permanentRangeOffice: string;
  permanentZone: string;
  permanentDivision: string;
  permanentPoliceStation: string;
  permanentStateName?: string;
  permanentDistrictName?: string;
  permanentRangeOfficeName?: string;
  permanentZoneName?: string;
  permanentDivisionName?: string;
  permanentPoliceStationName?: string;
  telephoneOffice: string;
  telephoneResidence: string;
  officeMobileNumber: string;
  alternativeMobile: string;
}

// Location hierarchy hook state interface
export interface LocationHierarchyState {
  states: State[];
  districts: District[];
  rangeOffices: RangeOffice[];
  zones: Zone[];
  divisions: Division[];
  policeStations: PoliceStation[];
  selectedState: string;
  selectedDistrict: string;
  selectedRangeOffice: string;
  selectedZone: string;
  selectedDivision: string;
  selectedPoliceStation: string;
  loadingStates: boolean;
  loadingDistricts: boolean;
  loadingRangeOffices: boolean;
  loadingZones: boolean;
  loadingDivisions: boolean;
  loadingPoliceStations: boolean;
  error: string | null;
}