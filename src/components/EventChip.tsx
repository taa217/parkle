import React from 'react';
import type { ParkingEvent } from '../lib/events';

interface EventChipProps {
    event: ParkingEvent;
    onClick: (event: ParkingEvent) => void;
}

export const EventChip: React.FC<EventChipProps> = ({ event, onClick }) => {
    return (
        <button
            onClick={() => onClick(event)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-uz-gold/50 active:scale-95 transition-all group"
        >
            <span className="text-xl" role="img" aria-label={event.title}>{event.icon}</span>
            <span className="text-sm font-semibold text-uz-navy group-hover:text-uz-navy/80 whitespace-nowrap">
                {event.title}
            </span>
        </button>
    );
};
