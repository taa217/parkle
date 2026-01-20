import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ParkingEvent {
    id: string;
    zoneId: string;
    createdAt: number;
    plate?: string;
}

interface ParkingState {
    events: ParkingEvent[];
    addEvent: (event: Omit<ParkingEvent, 'id' | 'createdAt'>) => void;
}

export const useParkingStore = create<ParkingState>()(
    persist(
        (set) => ({
            events: [],
            addEvent: (event) => set((state) => ({
                events: [
                    {
                        ...event,
                        id: crypto.randomUUID(),
                        createdAt: Date.now(),
                    },
                    ...state.events
                ]
            })),
        }),
        {
            name: 'parking-storage',
        }
    )
);
