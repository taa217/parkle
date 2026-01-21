import React from 'react';
import { MapPin, Clock, AlertTriangle, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ParkingEvent } from '../../lib/events';

interface EventCardProps {
    event: ParkingEvent;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const navigate = useNavigate();

    const handleGetParking = () => {
        navigate(`/map?dest=${event.destinationZoneId}&event=${event.id}`);
    };

    const isHighTraffic = event.priority && event.priority <= 1;
    const isFeatured = event.priority === 1;

    // Format time
    const startTime = new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const endTime = new Date(event.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    return (
        <div className={`bg-white rounded-2xl p-4 shadow-sm border ${isFeatured ? 'border-uz-gold/50' : 'border-gray-100'} mb-4 relative overflow-hidden`}>
            {/* Featured Stripe */}
            {isFeatured && <div className="absolute top-0 left-0 w-1 h-full bg-uz-gold" />}

            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-lg font-bold text-uz-navy flex items-center gap-2">
                        <span>{event.icon}</span>
                        {event.title}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin size={14} className="mr-1" />
                        <span>{event.destinationZoneId.replace(/-/g, ' ').replace('parking', '')}</span> 
                        {/* Simple formatting for zone name, could be better with a lookup */}
                    </div>
                </div>
                {/* Badges */}
                <div className="flex flex-col items-end gap-1">
                     {isHighTraffic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                             <AlertTriangle size={10} className="mr-1" /> High Traffic
                        </span>
                     )}
                     {isFeatured && (
                         <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-uz-gold/10 text-uz-navy border border-uz-gold/20">
                             <Star size={10} className="mr-1 text-uz-gold" /> Featured
                         </span>
                     )}
                </div>
            </div>

            <div className="flex items-center text-gray-400 text-sm mb-4">
                <Clock size={14} className="mr-1" />
                <span>{startTime} – {endTime}</span>
            </div>

            <button 
                onClick={handleGetParking}
                className="w-full bg-uz-navy text-white py-3 rounded-xl font-semibold shadow-uz-navy/10 shadow-lg active:scale-[0.98] transition-transform flex justify-center items-center"
            >
                Get parking
            </button>
        </div>
    );
};
