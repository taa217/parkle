export type ZoneStatus = 'Available' | 'Limited' | 'Full' | 'Unknown';

export interface ParkingZone {
    id: string;
    name: string;
    status: ZoneStatus;
    walkingTime: number; // in minutes
}

export const MOCK_ZONES: ParkingZone[] = [
    { id: 'main-admin-parking', name: 'Main Administration Car Park', status: 'Available', walkingTime: 2 },
    { id: 'great-hall-parking', name: 'Great Hall Parking', status: 'Limited', walkingTime: 3 },
    { id: 'library-staff-parking', name: 'Library Staff Parking', status: 'Full', walkingTime: 5 },
    { id: 'engineering-faculty-parking', name: 'Engineering Faculty Parking', status: 'Available', walkingTime: 6 },
    { id: 'science-lecture-theatre-parking', name: 'Science Lecture Theatre Parking', status: 'Available', walkingTime: 4 },
    { id: 'students-union-parking', name: 'Students Union Parking', status: 'Unknown', walkingTime: 5 },
    { id: 'health-sciences-parking', name: 'Health Sciences Parking', status: 'Limited', walkingTime: 8 },
];
