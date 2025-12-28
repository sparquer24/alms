export class ApplicationsDataDto {
    week!: string;
    count!: number;
    date?: string;
}

export class RoleLoadDataDto {
    name!: string;
    value!: number;
}

export class StateDataDto {
    state!: string;
    count!: number;
}

export class AdminActivityDto {
    id!: number;
    user!: string;
    action!: string;
    time!: string;
    timestamp?: number;
    almsLicenseId?: string;
    applicantName?: string;
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
}

