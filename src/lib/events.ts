export interface ParkingEvent {
    id: string;
    title: string;
    icon: string;
    destinationZoneId: string;
    startsAt: string; // ISO string
    endsAt: string;   // ISO string
    priority?: number;
}

export const MOCK_EVENTS: ParkingEvent[] = [
    {
        id: "grad-2026",
        title: "Graduation",
        icon: "🎓",
        destinationZoneId: "great-hall-parking",
        startsAt: new Date().toISOString(), // Today
        endsAt: new Date(new Date().setHours(23, 59, 59)).toISOString(),
        priority: 1
    },
    {
        id: "career-fair-2026",
        title: "Career Fair",
        icon: "💼",
        destinationZoneId: "main-admin-parking",
        startsAt: new Date().toISOString(),
        endsAt: new Date(new Date().setHours(18, 0, 0)).toISOString(),
        priority: 2
    },
    {
        id: "science-day-2026",
        title: "Science Day",
        icon: "🔬",
        destinationZoneId: "science-lecture-theatre-parking",
        startsAt: new Date().toISOString(),
        endsAt: new Date(new Date().setHours(17, 0, 0)).toISOString(),
        priority: 3
    }
];

export const getEventsForDate = (date: Date = new Date()) => {
    // For mock purposes, we return all events as if they are today
    // In a real app, we would filter by date
    return MOCK_EVENTS;
};

export const getEventById = (id: string) => {
    return MOCK_EVENTS.find(e => e.id === id);
};
