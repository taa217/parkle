import { NavLink } from 'react-router-dom';
import { Car, Calendar } from 'lucide-react';

export const BottomNav = () => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)] z-40 flex justify-around items-center h-[80px]">
            <NavLink 
                to="/" 
                end
                className={({ isActive }) => `
                    flex flex-col items-center gap-1 transition-colors relative px-4 py-2
                    ${isActive ? 'text-uz-navy' : 'text-gray-400 hover:text-gray-600'}
                `}
            >
                {({ isActive }) => (
                    <>
                        <Car size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-bold tracking-wide">PARKING</span>
                        {isActive && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-uz-gold rounded-b-full shadow-sm" />
                        )}
                    </>
                )}
            </NavLink>

            <NavLink 
                to="/events" 
                className={({ isActive }) => `
                    flex flex-col items-center gap-1 transition-colors relative px-4 py-2
                    ${isActive ? 'text-uz-navy' : 'text-gray-400 hover:text-gray-600'}
                `}
            >
                 {({ isActive }) => (
                    <>
                        <Calendar size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-[10px] font-bold tracking-wide">EVENTS</span>
                        {isActive && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-uz-gold rounded-b-full shadow-sm" />
                        )}
                    </>
                )}
            </NavLink>
        </div>
    );
};
