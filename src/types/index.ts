
export interface AdminZoneData {
    id: string;
    name: string;
    capacity: number;
    status: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNKNOWN';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    availableCount: number | null;
    lastUpdated: string; // ISO
    staleLevel: 'HEALTHY' | 'WARNING' | 'OFFLINE';
    overrideActive?: boolean;
    effectiveStatus?: 'AVAILABLE' | 'LIMITED' | 'FULL' | 'UNKNOWN';
    effectiveAvailableCount?: number | null;
}

export interface AdminIssue {
    id: string;
    type: string;
    note?: string;
    status: 'OPEN' | 'RESOLVED';
    createdAt: string;
    zoneId: string;
    reporterEmail?: string;
}
