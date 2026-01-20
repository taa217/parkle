
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { AdminIssue } from '../../types';

export default function AdminIssues() {
    const [issues, setIssues] = useState<AdminIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIssue, setSelectedIssue] = useState<AdminIssue | null>(null);

    const loadIssues = () => {
        setLoading(true);
        api.get('/admin/issues?status=OPEN')
            .then(data => {
                setIssues(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        loadIssues();
    }, []);

    const handleResolve = async (id: string) => {
        if (!confirm('Mark this issue as resolved?')) return;
        try {
            await api.patch(`/admin/issues/${id}`, { status: 'RESOLVED' });
            setSelectedIssue(null);
            loadIssues();
        } catch (e) {
            alert('Failed to resolve issue');
        }
    };

    if (loading && issues.length === 0) return <div className="p-8">Loading issues...</div>;

    return (
        <div className="p-4 md:p-8 space-y-6">
            <h1 className="text-3xl font-bold text-[#0A1A2F]">Issue Reports</h1>

            {issues.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl text-center text-gray-400 shadow-sm">
                    No open issues. Great job!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {issues.map(issue => (
                        <div
                            key={issue.id}
                            onClick={() => setSelectedIssue(issue)}
                            className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-[#C5A059]/20"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">OPEN</span>
                                <span className="text-xs text-gray-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
                            </div>
                            <h3 className="font-semibold text-[#0A1A2F] mb-1">{issue.type.replace(/_/g, ' ')}</h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{issue.note || 'No details provided.'}</p>
                            <div className="text-xs text-gray-400">
                                Reported in <span className="text-[#0A1A2F] font-medium">{issue.zoneId}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal/Drawer for Details */}
            {selectedIssue && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-[#0A1A2F]">{selectedIssue.type.replace(/_/g, ' ')}</h2>
                                <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                                    <span>{new Date(selectedIssue.createdAt).toLocaleString()}</span>
                                    <span>•</span>
                                    <span>{selectedIssue.zoneId}</span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedIssue(null)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl mb-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reporter Note</h4>
                            <p className="text-[#0A1A2F]">{selectedIssue.note || 'No written note.'}</p>
                        </div>

                        <div className="mb-8">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reporter</h4>
                            <p className="text-sm">{selectedIssue.reporterEmail || 'Anonymous'}</p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setSelectedIssue(null)}
                                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => handleResolve(selectedIssue.id)}
                                className="px-6 py-2 bg-[#0A1A2F] text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-900/20 hover:bg-[#1a2f4a] active:scale-95 transition-all"
                            >
                                Resolve Issue
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
