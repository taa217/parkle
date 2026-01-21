
import { useZoneStore } from '../store/zoneStore';
import { api } from './api';

const POLLING_INTERVAL = 10000; // 10s

export const ZoneStatusService = {
    /**
     * Polls the backend for the latest zone snapshot
     */
    fetchSnapshot: async () => {
        try {
            const zones = await api.get('/zones/snapshot');
            // Transform API data to match Store Zone interface if needed
            // API returns: { id, name, lat, lng, capacity, status, confidence, availableCount, lastUpdated }
            // Store expects: { ..., tes } (walkingMinutes is static for now in frontend or needs to be calculated/merged)

            // We need to merge with existing static data (like walkingMinutes, which might not be in DB yet or we just preserve it)
            // For now, let's assume we merge with current store state to keep `walkingMinutes`
            const currentZones = useZoneStore.getState().zones;

            const mergedZones = zones.map((apiZone: any) => {
                const existing = currentZones.find(z => z.id === apiZone.id);
                // Use effective values from API if present (backend logic handles precedence, here we just use what's sent)
                // Actually backend sends { ..., effectiveStatus, effectiveAvailableCount, effectiveLastUpdated ... }
                // We map them to the main fields for the frontend to consume transparently

                return {
                    ...existing,
                    ...apiZone,
                    status: apiZone.effectiveStatus || apiZone.status, // Fallback just in case
                    availableCount: apiZone.effectiveAvailableCount ?? apiZone.availableCount,
                    lastUpdated: new Date(apiZone.effectiveLastUpdated || apiZone.lastUpdated).getTime(),

                    overrideActive: apiZone.overrideActive,
                    expiresAt: apiZone.expiresAt, // This comes from backend join if we want to show it, or we rely on effective values
                    // Wait, `snapshot` returns `expiresAt` from `zoneOverrides` join.

                    walkingMinutes: existing?.walkingMinutes || 5 // Fallback
                };
            });

            const store = useZoneStore.getState();
            store.setZones(mergedZones);

            // Cache
            localStorage.setItem('zones_cache', JSON.stringify(mergedZones));
            console.log('[ZoneStatusService] Synced with backend');
        } catch (err) {
            console.error('[ZoneStatusService] Failed to fetch snapshot', err);
            // Offline Fallback
            const cached = localStorage.getItem('zones_cache');
            if (cached) {
                const zones = JSON.parse(cached);
                useZoneStore.getState().setZones(zones);
                console.log('[ZoneStatusService] Loaded from cache');
            }
        }
    },

    startPolling: () => {
        ZoneStatusService.fetchSnapshot(); // Initial
        const interval = setInterval(ZoneStatusService.fetchSnapshot, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }
};
