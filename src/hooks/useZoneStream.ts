import { useEffect, useRef, useState } from 'react';
import { useZoneStore } from '../store/zoneStore';
import { api } from '../services/api';

const getApiBase = () => {
    // In development/local network, use the current hostname but port 3000
    // This allows accessing from 192.168.x.x on mobile
    const hostname = window.location.hostname;
    return `http://${hostname}:3000`;
};

const API_Base = import.meta.env.VITE_API_URL || getApiBase();

export function useZoneStream() {
    const { applySnapshot, applyPatch } = useZoneStore();
    const [status, setStatus] = useState<'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'FALLBACK'>('CONNECTING');
    const eventSourceRef = useRef<EventSource | null>(null);
    const retryCountRef = useRef(0);
    const fallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const connect = () => {
        if (eventSourceRef.current?.readyState === 1) return; // Already open

        console.log('[SSE] Connecting...');
        setStatus('CONNECTING');

        const es = new EventSource(`${API_Base}/api/stream/zones`);
        eventSourceRef.current = es;

        es.onopen = () => {
            console.log('[SSE] Connected');
            setStatus('CONNECTED');
            retryCountRef.current = 0;
            // Clear fallback if active
            if (fallbackIntervalRef.current) {
                clearInterval(fallbackIntervalRef.current);
                fallbackIntervalRef.current = null;
            }
        };

        es.addEventListener('snapshot', (e) => {
            try {
                const data = JSON.parse(e.data);
                applySnapshot(data.zones);
            } catch (err) {
                console.error('[SSE] Failed to parse snapshot', err);
            }
        });

        es.addEventListener('zone_patch', (e) => {
            try {
                const data = JSON.parse(e.data);
                applyPatch(data);
            } catch (err) {
                console.error('[SSE] Failed to parse patch', err);
            }
        });

        es.onerror = (err) => {
            console.error('[SSE] Error', err);
            es.close();
            eventSourceRef.current = null;

            // Reconnect logic
            const timeout = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
            retryCountRef.current++;

            console.log(`[SSE] Reconnecting in ${timeout}ms...`);
            setTimeout(connect, timeout);

            // Fallback logic
            if (!fallbackIntervalRef.current) {
                startFallbackPolling();
            } else {
                setStatus('FALLBACK');
            }
        };
    };

    const startFallbackPolling = () => {
        console.log('[SSE] Starting fallback polling');
        setStatus('FALLBACK');

        const fetchSnapshot = () => {
            api.get('/zones/snapshot')
                .then(zones => applySnapshot(zones))
                .catch(err => {
                    console.error('[Fallback] Poll failed', err);
                    // Use error as opportunity to retry connect? 
                    // No, let interval continue or let user refresh.
                });
        };

        fetchSnapshot(); // Immediate
        fallbackIntervalRef.current = setInterval(fetchSnapshot, 10000);
    };

    useEffect(() => {
        connect();
        return () => {
            eventSourceRef.current?.close();
            if (fallbackIntervalRef.current) clearInterval(fallbackIntervalRef.current);
        };
    }, []);

    return { status };
}
