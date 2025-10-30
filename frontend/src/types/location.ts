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
  zones?: Zone[];
}

export interface Zone extends LocationOption {
  districtId: number;
  district?: District;
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
  zone: string;
  division: string;
  policeStation: string;
}

export interface AddressFormData {
  presentAddress: string;
  presentState: string;
  presentDistrict: string;
  presentZone: string;
  presentDivision: string;
  presentPoliceStation: string;
  presentSince: string;
  sameAsPresent: boolean;
  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  permanentZone: string;
  permanentDivision: string;
  permanentPoliceStation: string;
  telephoneOffice: string;
  telephoneResidence: string;
  officeMobileNumber: string;
  alternativeMobile: string;
}

// Location hierarchy hook state interface
export interface LocationHierarchyState {
  states: State[];
  districts: District[];
  zones: Zone[];
  divisions: Division[];
  policeStations: PoliceStation[];
  selectedState: string;
  selectedDistrict: string;
  selectedZone: string;
  selectedDivision: string;
  selectedPoliceStation: string;
  loadingStates: boolean;
  loadingDistricts: boolean;
  loadingZones: boolean;
  loadingDivisions: boolean;
  loadingPoliceStations: boolean;
  error: string | null;
}