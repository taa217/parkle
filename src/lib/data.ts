export type ZoneStatus = 'Available' | 'Limited' | 'Full' | 'Unknown';

export interface ParkingZone {
    id: string;
    name: string;
    status: ZoneStatus;
    walkingTime: number; // in minutes
}

export const MOCK_ZONES: ParkingZone[] = [
    { id: 'library', name: 'Library Lot', status: 'Limited', walkingTime: 5 },
    { id: 'admin', name: 'Admin Block', status: 'Available', walkingTime: 7 },
    { id: 'engineering', name: 'Engineering Lot', status: 'Full', walkingTime: 6 },
    { id: 'cs', name: 'CS Lot', status: 'Available', walkingTime: 4 },
    { id: 'sports', name: 'Sports Centre', status: 'Unknown', walkingTime: 9 },
];
