import { create } from 'zustand';

export type ZoneStatus = 'Available' | 'Limited' | 'Full' | 'Unknown';
export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface Zone {
    id: string;
    name: string;
    lat: number;
    lng: number;
    status: ZoneStatus;
    confidence: ConfidenceLevel;
    walkingMinutes: number;
    availableCount?: number;
    lastUpdated: number; // unix ms timestamp
    overrideActive?: boolean;
    expiresAt?: string; // ISO
    reason?: string;

    // Effective fields (frontend convenience)
    effectiveStatus?: ZoneStatus;
    effectiveAvailableCount?: number;
    effectiveLastUpdated?: number;
}

interface ZoneState {
    zones: Zone[];
    selectedZoneId: string | null;
    destination: string | null;
    setSelectedZone: (id: string | null) => void;
    setDestination: (dest: string | null) => void;
    getRecommendedZones: () => Zone[];
    updateZone: (id: string, updates: Partial<Zone>) => void;
    setZones: (zones: Zone[]) => void;
    applySnapshot: (zones: any[]) => void;
    applyPatch: (zone: any) => void;
}

const mapBackendToZone = (z: any): Zone => ({
    id: z.id,
    name: z.name,
    lat: z.lat,
    lng: z.lng,
    status: (z.effectiveStatus || z.status || 'UNKNOWN') as ZoneStatus,
    confidence: (z.confidence || 'LOW') as ConfidenceLevel,
    walkingMinutes: 1, // TODO: calculate this
    availableCount: z.effectiveAvailableCount ?? z.availableCount,
    lastUpdated: z.effectiveLastUpdated ? new Date(z.effectiveLastUpdated).getTime() : Date.now(),
    overrideActive: z.overrideActive,
    expiresAt: z.expiresAt,
    reason: z.reason
});

const getStatusScore = (status: ZoneStatus): number => {
    switch (status) {
        case 'Available': return 4;
        case 'Limited': return 3;
        case 'Unknown': return 2;
        case 'Full': return 1;
        default: return 0;
    }
};

export const useZoneStore = create<ZoneState>((set, get) => ({
    zones: [],
    selectedZoneId: null,
    destination: null,
    setSelectedZone: (id) => set({ selectedZoneId: id }),
    setDestination: (dest) => set({ destination: dest }),
    getRecommendedZones: () => {
        const zones = get().zones;
        return [...zones].sort((a, b) => {
            const scoreA = getStatusScore(a.status) * 10 - a.walkingMinutes;
            const scoreB = getStatusScore(b.status) * 10 - b.walkingMinutes;
            return scoreB - scoreA;
        });
    },
    updateZone: (id, updates) => set((state) => ({
        zones: state.zones.map((z) => (z.id === id ? { ...z, ...updates } : z))
    })),
    setZones: (zones) => set({ zones }),

    applySnapshot: (rawZones: any[]) => {
        const zones = rawZones.map(mapBackendToZone);
        set({ zones });
    },

    applyPatch: (rawZone) => {
        const updated = mapBackendToZone(rawZone);
        set((state) => ({
            zones: state.zones.map(z => z.id === updated.id ? updated : z)
        }));
    }
}));

