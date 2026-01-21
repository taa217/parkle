import { useState } from 'react';
import { X, LogIn } from 'lucide-react';
import { type IssueType } from '../store/issuesStore';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface ReportIssueModalProps {
    zoneId: string;
    onClose: () => void;
    onSuccess: () => void;
}

const ISSUE_TYPES: IssueType[] = [
    'Marked available but actually full',
    'Bay/zone blocked',
    'Wrong recommendation',
    'Other'
];

export function ReportIssueModal({ zoneId, onClose, onSuccess }: ReportIssueModalProps) {
    const [selectedType, setSelectedType] = useState<IssueType | null>(null);
    const [note, setNote] = useState('');
    const navigate = useNavigate();
    const isVisitor = localStorage.getItem("uz_parking_visitor");

    if (isVisitor) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 animate-in zoom-in-95 duration-200 text-center">
                     <div className="flex justify-end mb-2">
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex flex-col items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-uz-navy/10 rounded-full flex items-center justify-center text-uz-navy">
                            <LogIn size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-uz-navy">Login Required</h3>
                        <p className="text-slate-500 text-sm">
                            Please login to report issues and help the community.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                localStorage.removeItem("uz_parking_visitor");
                                navigate('/login');
                            }}
                            className="w-full py-3 bg-uz-navy text-white rounded-xl font-semibold hover:bg-uz-navy/90 transition"
                        >
                            Login Now
                        </button>
                         <button
                            onClick={onClose}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const handleSubmit = async () => {
        if (!selectedType) return;

        const typeMapping: Record<string, string> = {
            'Marked available but actually full': 'MARKED_AVAILABLE_BUT_FULL',
            'Bay/zone blocked': 'BLOCKED',
            'Wrong recommendation': 'WRONG_RECOMMENDATION',
            'Other': 'OTHER'
        };

        try {
            await api.post('/issues', {
                zoneId,
                type: typeMapping[selectedType],
                note: note.trim() || undefined,
            });
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to report issue', err);
            alert('Failed to submit report.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-uz-navy">Report an Issue</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    {ISSUE_TYPES.map((type) => (
                        <div key={type} className="flex items-center gap-3">
                            <input
                                type="radio"
                                id={type}
                                name="issueType"
                                value={type}
                                checked={selectedType === type}
                                onChange={() => setSelectedType(type)}
                                className="w-5 h-5 text-uz-navy focus:ring-uz-gold border-gray-300"
                            />
                            <label htmlFor={type} className="text-sm font-medium text-slate-700 cursor-pointer flex-1 py-1" onClick={() => setSelectedType(type)}>
                                {type}
                            </label>
                        </div>
                    ))}
                </div>

                <textarea
                    className="w-full text-sm p-3 border rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-uz-navy/20 mb-6 resize-none"
                    rows={3}
                    placeholder="Optional note (max 200 chars)..."
                    maxLength={200}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />

                <button
                    disabled={!selectedType}
                    onClick={handleSubmit}
                    className="w-full py-3 bg-uz-navy text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-uz-navy/90 transition"
                >
                    Submit Report
                </button>
            </div>
        </div>
    );
}
