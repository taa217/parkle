import React, { useState } from 'react';
import { EventCard } from '../components/events/EventCard';
import { FilterPills } from '../components/events/FilterPills';
import { MOCK_EVENTS } from '../lib/events';
import { Layout } from '../components/Layout';
import type { ParkingEvent } from '../lib/events';

type FilterType = 'today' | 'week' | 'all';

export default function Events() {
    const [filter, setFilter] = useState<FilterType>('today');

    // Mock filtering logic - since all mock events are "today" in the data, 
    // we'll just return them all for now, but structure it for future real logic.
    const filteredEvents = MOCK_EVENTS.filter(event => {
        if (filter === 'all') return true;
        // logic for week/today would go here comparing event.startsAt
        return true; 
    });

    return (
        <Layout>
            <div className="pt-4 space-y-6">
                 <header>
                    <h1 className="text-3xl font-bold text-uz-navy mb-2">Events</h1>
                    <p className="text-gray-500 text-sm">Select an event to get parking directions.</p>
                </header>

                <FilterPills currentFilter={filter} onFilterChange={setFilter} />

                <div className="max-w-md mx-auto space-y-4">
                    {filteredEvents.map(event => (
                        <EventCard key={event.id} event={event} />
                    ))}
                </div>
            </div>
        </Layout>
    );
}
