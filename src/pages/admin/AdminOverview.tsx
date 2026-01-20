
import { useState, useEffect } from 'react'; // removed useEffect
import { api } from '../../services/api';
import type { AdminZoneData } from '../../types';
import { useZoneStore } from '../../store/zoneStore';
import { useZoneStream } from '../../hooks/useZoneStream';

export default function AdminOverview() {
    const { zones } = useZoneStore();
    useZoneStream(); // Ensure stream is active

    // We can still keep issues count separate or move to store, keeping separate for now
    const [issuesCount, setIssuesCount] = useState(0);
    // Fetch issues on mount
    useState(() => {
        api.get('/admin/issues?status=OPEN').then(data => setIssuesCount(data.length)).catch(console.error);
    });

    const refresh = () => {
        // validation refresh if needed, but SSE handles zones
        api.get('/admin/issues?status=OPEN').then(data => setIssuesCount(data.length)).catch(console.error);
        // Force snapshot
        api.get('/zones/snapshot').then(data => useZoneStore.getState().applySnapshot(data));
    };

    // Calculate derived stats
    const extendedZones = zones.map(z => {
        const now = Date.now();
        const diffMs = now - new Date(z.lastUpdated).getTime(); // or effectiveLastUpdated? sensor health is based on actual last heartbeat/update
        // Wait, store zone has lastUpdated.
        // Backend stale logic: <30s healthy, <120s warning.
        let staleLevel = 'OFFLINE';
        if (diffMs < 30 * 1000) staleLevel = 'HEALTHY';
        else if (diffMs < 120 * 1000) staleLevel = 'WARNING';

        return { ...z, staleLevel };
    });

    const totalAvailable = extendedZones.reduce((acc, z) => acc + (z.effectiveAvailableCount ?? z.availableCount ?? 0), 0);
    const fullZones = extendedZones.filter(z => (z.effectiveStatus || z.status) === 'Full').length;
    const staleSensors = extendedZones.filter(z => z.staleLevel !== 'HEALTHY').length;

    // Loading check removal: we rely on store. If empty, maybe show loading? OR just show empty dashboard.
    // if (zones.length === 0) return <div className="p-8">Loading dashboard...</div>; 

    return (
        <div className="p-4 md:p-8 space-y-8">
            <header className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#0A1A2F]">Dashboard Overview</h1>
                <button onClick={refresh} className="text-sm text-[#C5A059] hover:underline">Refresh Now</button>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard label="Total Available" value={totalAvailable} sub="Across all zones" />
                <KpiCard label="Full Zones" value={fullZones} sub={`${zones.length > 0 ? (fullZones / zones.length * 100).toFixed(0) : 0}% of logical zones`} />
                <KpiCard
                    label="Stale Sensors"
                    value={staleSensors}
                    sub="Offline or Warning"
                    alert={staleSensors > 0}
                />
                <KpiCard
                    label="Open Issues"
                    value={issuesCount}
                    sub="User reports"
                    alert={issuesCount > 0}
                />
            </div>

            {/* Zones Table */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-[#0A1A2F]">Zone Statuses</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Zone Name</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3">Available</th>
                                <th className="px-6 py-3">Confidence</th>
                                <th className="px-6 py-3">Sensor Health</th>
                                <th className="px-6 py-3">Last Update</th>
                                <th className="px-6 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {extendedZones.map(zone => (
                                <tr key={zone.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-[#0A1A2F]">
                                        {zone.name}
                                        {zone.overrideActive && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded border border-amber-200">OVERRIDE</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={zone.effectiveStatus || zone.status} />
                                    </td>
                                    <td className="px-6 py-4">{zone.effectiveAvailableCount ?? zone.availableCount ?? '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${zone.confidence === 'High' ? 'bg-green-500' :
                                            zone.confidence === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}></span>
                                        {zone.confidence}
                                    </td>
                                    <td className="px-6 py-4">
                                        <HealthBadge level={zone.staleLevel} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-400">
                                        {zone.lastUpdated ? new Date(zone.lastUpdated).toLocaleTimeString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <OverrideButton zone={zone as any} onRefresh={refresh} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function OverrideButton({ zone, onRefresh }: { zone: AdminZoneData, onRefresh: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<string>(zone.effectiveStatus || zone.status || 'UNKNOWN');
    const [count, setCount] = useState<string>(zone.effectiveAvailableCount?.toString() || '');
    const [reason, setReason] = useState('');
    const [expiryMode, setExpiryMode] = useState<'30m' | '2h' | 'today' | 'forever' | 'custom'>('2h');
    const [customExpiry, setCustomExpiry] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (isOpen && showHistory) {
            api.get(`/admin/zones/${zone.id}/override-events?limit=10`).then(setHistory).catch(console.error);
        }
    }, [isOpen, showHistory, zone.id]);

    const handleApply = async () => {
        if (!reason) return alert('Reason is required');
        setLoading(true);

        let expiresAt = null;
        const now = new Date();
        if (expiryMode === '30m') expiresAt = new Date(now.getTime() + 30 * 60000).toISOString();
        else if (expiryMode === '2h') expiresAt = new Date(now.getTime() + 2 * 60 * 60000).toISOString();
        else if (expiryMode === 'today') {
            const d = new Date(); d.setHours(18, 0, 0, 0);
            if (d < now) d.setDate(d.getDate() + 1); // If past 18:00, tomorrow
            expiresAt = d.toISOString();
        }
        else if (expiryMode === 'custom' && customExpiry) expiresAt = new Date(customExpiry).toISOString();

        try {
            await api.patch(`/admin/zones/${zone.id}/override`, {
                forcedStatus: status === 'NO_CHANGE' ? null : status,
                forcedAvailableCount: count === '' ? null : parseInt(count),
                reason,
                expiresAt
            });
            setIsOpen(false);
            onRefresh();
        } catch (e) {
            alert('Failed to apply override');
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = async () => {
        if (!confirm('Clear override?')) return;
        setLoading(true);
        try {
            await api.patch(`/admin/zones/${zone.id}/override`, {
                forcedStatus: null,
                forcedAvailableCount: null,
                reason: 'Manual clear'
            });
            setIsOpen(false);
            onRefresh();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="px-3 py-1 text-xs font-bold text-white bg-uz-navy rounded hover:opacity-90">
                Override
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Override {zone.name}</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        {!showHistory ? (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-3 rounded text-sm mb-4">
                                    <div><span className="font-bold">Sensor Status:</span> {zone.status} ({zone.availableCount ?? '-'})</div>
                                    <div><span className="font-bold">Current Effective:</span> {zone.effectiveStatus} ({zone.effectiveAvailableCount ?? '-'})</div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Force Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value)} className="w-full border rounded p-2">
                                        <option value="AVAILABLE">AVAILABLE</option>
                                        <option value="LIMITED">LIMITED</option>
                                        <option value="FULL">FULL</option>
                                        <option value="UNKNOWN">UNKNOWN</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Force Count (Optional)</label>
                                    <input type="number" value={count} onChange={e => setCount(e.target.value)} className="w-full border rounded p-2" placeholder="Leave empty to ignore" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expires</label>
                                    <div className="flex gap-2 flex-wrap mb-2">
                                        {(['30m', '2h', 'today', 'forever', 'custom'] as const).map(m => (
                                            <button key={m} onClick={() => setExpiryMode(m)} className={`px-2 py-1 text-xs rounded border ${expiryMode === m ? 'bg-uz-navy text-white border-uz-navy' : 'bg-white text-gray-600'}`}>
                                                {m.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                    {expiryMode === 'custom' && (
                                        <input
                                            type="datetime-local"
                                            value={customExpiry}
                                            onChange={e => setCustomExpiry(e.target.value)}
                                            className="w-full border rounded p-2 mb-2 text-sm"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason (Required)</label>
                                    <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full border rounded p-2 h-20" placeholder="Why are you overriding?" />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={handleApply} disabled={loading} className="flex-1 bg-uz-navy text-white py-2 rounded font-bold hover:opacity-90 disabled:opacity-50">
                                        {loading ? 'Applying...' : 'Apply Override'}
                                    </button>
                                    {zone.overrideActive && (
                                        <button onClick={handleClear} disabled={loading} className="px-4 py-2 border border-red-200 text-red-600 rounded font-bold hover:bg-red-50 disabled:opacity-50">
                                            Clear
                                        </button>
                                    )}
                                </div>

                                <div className="text-center pt-2">
                                    <button onClick={() => setShowHistory(true)} className="text-xs text-gray-500 underline">View Audit History</button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-sm">Recent Events</h4>
                                    <button onClick={() => setShowHistory(false)} className="text-xs text-blue-600">Back to Edit</button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                                    {history.length === 0 ? <div className="text-gray-400">Loading history...</div> : history.map((h: any) => (
                                        <div key={h.id} className="border-b pb-2">
                                            <div className="flex justify-between font-bold">
                                                <span>{h.action}</span>
                                                <span className="text-gray-400">{new Date(h.createdAt).toLocaleString()}</span>
                                            </div>
                                            <div className="text-gray-600 truncate">{h.reason}</div>
                                            <div className="text-gray-400 italic">By {h.performedByEmail || 'System'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function KpiCard({ label, value, sub, alert }: { label: string, value: number, sub: string, alert?: boolean }) {
    return (
        <div className={`p-5 rounded-2xl shadow-sm border ${alert ? 'bg-red-50 border-red-100' : 'bg-white border-transparent'}`}>
            <div className="text-gray-500 text-sm font-medium mb-1">{label}</div>
            <div className={`text-3xl font-bold mb-2 ${alert ? 'text-red-600' : 'text-[#0A1A2F]'}`}>{value}</div>
            <div className={`text-xs ${alert ? 'text-red-400' : 'text-gray-400'}`}>{sub}</div>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        AVAILABLE: 'bg-green-100 text-green-700',
        LIMITED: 'bg-yellow-100 text-yellow-700',
        FULL: 'bg-red-100 text-red-700',
        UNKNOWN: 'bg-gray-100 text-gray-700',
    } as any;
    return (
        <span className={`px-2 py-1 rounded-md text-xs font-bold ${styles[status] || styles.UNKNOWN}`}>
            {status}
        </span>
    )
}

function HealthBadge({ level }: { level: string }) {
    if (level === 'HEALTHY') return <span className="text-green-600 font-medium text-xs">● Healthy</span>;
    if (level === 'WARNING') return <span className="text-yellow-600 font-medium text-xs">● Warning</span>;
    return <span className="text-red-600 font-bold text-xs">● OFFLINE</span>;
}
