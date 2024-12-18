// Define your types here

export interface Item {
    id: string; // Ensure you have all necessary properties
    name: string;
    quantity: number;
    createdDate: string;
    comment: string;
    statusts: string;
}

export interface DispatchedItem {
    name: string;
    quantity: number;
}
export interface Data {
    id: string;
    statusId: string;
    status: string;
    assignedRoleId: string;
    userId: string;
    comment: string;
    items: Item[];
    createdDate: string;
    closeDate: string;
    actionTakenBy: string;
    dispatchedItems: DispatchedItem[]
}
export interface Data {
    name: string;
    id: string;
    nextStatusId: string;
    createdDate: string;
    modifiedDate: string;
    isInProgress: string;
    isApproved: string;
    isRejected: string;
    isCompleted: string;
    isClosed: string;
    
}

export interface FormState {
    statusId: string;
    assignedRoleId: string;
    userId: string;
    comment: string;
    items: Item[];
}

// types.ts

export interface TrackerEntry {
    date: string;
    status: string;
    remarks: string;
}

export interface Data {
    createdDate: string;
    comment: string;
    // items: { name: string; quantity: number }[];
    status: string;
    tracker: TrackerEntry[]; // Add this line
}

// types.ts

export interface Item {
    name: string;
    id: string;
    quantity: number;
    stockAvailability?: number;
}

export interface TrackerEntry {
    userId: string;
    statusId: string;
    indentId: string;
    userRoleId: string;
    modifiedDate: string;
    createdDate: string;
    nextRoleId: string;
    remarks: string;
    id: string;
    status: string;
    nextRole: string;
    userRole: string;
    actionTakenBy: string;  // Ensure this is included
}

export interface Data {
    id: string;
    status: string;
    statusId: string;
    assignedRole: string;
    assignedRoleId: string;
    userId: string;
    userName: string;
    comment: string;
    stateId: string;
    districtId: string;
    wingsId: string;
    zoneId: string;
    divisionId: string;
    psId: string;
    // items: Item[];
    tracker: TrackerEntry[];
    createdDate: string;
    closeDate: string;
    modifiedDate: string;
}
