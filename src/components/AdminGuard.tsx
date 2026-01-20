
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Outlet } from 'react-router-dom';

export function AdminGuard() {
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        api.get('/me')
            .then((data: any) => {
                if (data.profile?.role === 'ADMIN') {
                    setAuthorized(true);
                } else {
                    setAuthorized(false);
                }
            })
            .catch(() => setAuthorized(false));
    }, []);

    if (authorized === null) return <div className="p-8 text-[#0A1A2F]">Checking authorization...</div>;

    if (!authorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F5F5F0] text-[#0A1A2F]">
                <h1 className="text-2xl font-bold mb-4">Not Authorized</h1>
                <p className="mb-6">You do not have permission to access the Admin Console.</p>
                <a href="/" className="text-[#C5A059] hover:underline font-medium">Return to Map</a>
            </div>
        );
    }

    return <Outlet />;
}
