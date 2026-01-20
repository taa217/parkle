
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AdminZoneData } from '../../types';

export default function AdminSensors() {
    const [zones, setZones] = useState<AdminZoneData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/admin/sensors')
            .then(data => {
                // Backend returns sensors with derived 'health'. We need to map to local structure expected by UI if different.
                // UI expects: AdminZoneData with 'staleLevel'
                // Backend returns: { ...sensor, zoneId, name, health: 'HEALTHY'|'WARNING'|'OFFLINE' }
                // We need to map this to the component's state or update component to use sensor data directly.
                // Let's update the component to use Sensor data.
                // But wait, the existing code uses `zones` state variable.
                // I'll refactor the component to use `Sensor` type.
                setZones(data.map((s: any) => ({
                    id: s.id,
                    name: s.name || 'Unbound Sensor',
                    status: s.status, // This is sensor status (HEALTHY, etc in DB) but we want computed health
                    staleLevel: s.health, // Backend endpoint returns 'health' field
                    lastUpdated: s.lastHeartbeat ? new Date(s.lastHeartbeat).getTime() : 0,
                    confidence: 'High', // Placeholder or add to backend
                    // availableCount etc? AdminSensors list doesn't show counts in the table cols shown in diff?
                    // Table cols: Zone Name, Last Heartbeat, Confidence, ID
                })));
                setLoading(false);
            })
            .catch(console.error);
    }, []);

    const grouped = {
        OFFLINE: zones.filter(z => z.staleLevel === 'OFFLINE'),
        WARNING: zones.filter(z => z.staleLevel === 'WARNING'),
        HEALTHY: zones.filter(z => z.staleLevel === 'HEALTHY'),
    };

    if (loading) return <div className="p-8">Loading sensors...</div>;

    return (
        <div className="p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-[#0A1A2F]">Sensor Health</h1>

            {/* Offline Section */}
            {grouped.OFFLINE.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <h2 className="text-xl font-bold text-red-700">Offline ({grouped.OFFLINE.length})</h2>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-2xl overflow-hidden">
                        <SensorList zones={grouped.OFFLINE} />
                    </div>
                </section>
            )}

            {/* Warning Section */}
            {grouped.WARNING.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <h2 className="text-xl font-bold text-yellow-700">Warning ({grouped.WARNING.length})</h2>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 rounded-2xl overflow-hidden">
                        <SensorList zones={grouped.WARNING} />
                    </div>
                </section>
            )}

            {/* Healthy Section */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <h2 className="text-xl font-bold text-green-700">Healthy ({grouped.HEALTHY.length})</h2>
                </div>
                {grouped.HEALTHY.length === 0 ? (
                    <div className="text-gray-400 italic">No healthy sensors found.</div>
                ) : (
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <SensorList zones={grouped.HEALTHY} />
                    </div>
                )}
            </section>
        </div>
    );
}

function SensorList({ zones }: { zones: AdminZoneData[] }) {
    return (
        <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-black/5">
                <tr>
                    <th className="px-6 py-3 font-semibold text-gray-700">Zone Name</th>
                    <th className="px-6 py-3 font-semibold text-gray-700">Last heartbeat</th>
                    <th className="px-6 py-3 font-semibold text-gray-700">Confidence</th>
                    <th className="px-6 py-3 font-semibold text-gray-700">ID</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
                {zones.map(z => (
                    <tr key={z.id}>
                        <td className="px-6 py-4 font-medium text-[#0A1A2F]">{z.name}</td>
                        <td className="px-6 py-4">
                            {z.lastUpdated ? (
                                <span>{new Date(z.lastUpdated).toLocaleTimeString()} ({Math.floor((Date.now() - new Date(z.lastUpdated).getTime()) / 1000)}s ago)</span>
                            ) : 'Never'}
                        </td>
                        <td className="px-6 py-4">{z.confidence}</td>
                        <td className="px-6 py-4 font-mono text-gray-400 text-xs">{z.id}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
