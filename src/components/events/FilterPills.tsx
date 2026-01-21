import React from 'react';

type FilterType = 'today' | 'week' | 'all';

interface FilterPillsProps {
    currentFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

export const FilterPills: React.FC<FilterPillsProps> = ({ currentFilter, onFilterChange }) => {
    const filters: { id: FilterType; label: string }[] = [
        { id: 'today', label: 'Today' },
        { id: 'week', label: 'This Week' },
        { id: 'all', label: 'All' },
    ];

    return (
        <div className="flex gap-2 mb-6">
            {filters.map((filter) => (
                <button
                    key={filter.id}
                    onClick={() => onFilterChange(filter.id)}
                    className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-colors
                        ${currentFilter === filter.id 
                            ? 'bg-uz-navy text-white shadow-md' 
                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'}
                    `}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
};
