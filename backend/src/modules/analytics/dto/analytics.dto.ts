export class ApplicationsDataDto {
    week!: string;
    count!: number;
    date?: string;
    fresh?: number;
    renewal?: number;
    cancel?: number;
}

export class RoleLoadDataDto {
    name!: string;
    value!: number;
    code?: string;
    fresh?: number;
    renewal?: number;
    cancel?: number;
}

export class StateDataDto {
    state!: string;
    count!: number;
    fresh?: number;
    renewal?: number;
    cancel?: number;
}

export class AdminActivityDto {
    id!: number;
    user!: string;
    action!: string;
    time!: string;
    timestamp?: number;
    almsLicenseId?: string;
    applicantName?: string;
    applicationType?: string;
}

export class AnalyticsResponseDto<T> {
    success!: boolean;
    data!: T;
    message?: string;
    meta?: any;
}

export class ApplicationRecordDto {
    applicationId!: number;
    licenseId?: string | null;
    currentUser?: { id: number; name: string } | null;
    applicantName?: string | null;
    applicantType?: string | null;
    status!: string;
    actionTakenAt?: string | null;
    daysTillToday?: number | null;
    applicationType?: 'FRESH' | 'RENEWAL' | 'CANCEL';
}

