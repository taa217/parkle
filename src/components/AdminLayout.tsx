
import { Outlet, Link, useLocation } from 'react-router-dom';

export function AdminLayout() {
    const location = useLocation();

    const navItems = [
        { path: '/admin/overview', label: 'Overview' },
        { path: '/admin/issues', label: 'Issues' },
        { path: '/admin/sensors', label: 'Sensors' },
    ];

    return (
        <div className="flex h-screen bg-[#F5F5F0]">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex flex-col w-64 bg-[#0A1A2F] text-white p-6 shadow-xl z-20">
                <div className="text-xl font-bold text-[#C5A059] mb-8 tracking-wide">Parklee Parking Ops</div>
                <nav className="flex-1 space-y-2">
                    {navItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`block px-4 py-3 rounded-lg transition-colors font-medium ${location.pathname === item.path ? 'bg-[#C5A059] text-[#0A1A2F]' : 'hover:bg-white/10 text-gray-300'}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
                <Link to="/" className="text-sm opacity-60 hover:opacity-100 transition-opacity mt-auto pt-4 border-t border-white/10">
                    ← Exit to App
                </Link>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto w-full relative">
                <Outlet />
                {/* Spacer for mobile bottom nav */}
                <div className="h-20 md:hidden"></div>
            </main>

            {/* Mobile Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0A1A2F] text-white flex justify-around p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {navItems.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${location.pathname === item.path ? 'bg-[#C5A059] text-[#0A1A2F]' : 'opacity-70'}`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}
