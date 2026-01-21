import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { MOCK_ZONES } from "../lib/data";
import { getEventsForDate } from "../lib/events";
import { EventChip } from "../components/EventChip";
import { MapPin, Navigation } from "lucide-react";

export default function Home() {
    const navigate = useNavigate();
    const [destination, setDestination] = useState("");
    
    const events = getEventsForDate();

    useEffect(() => {
        // Prefill from onboarding
        const savedZone = localStorage.getItem("uz_parking_primary_zone");
        if (savedZone) setDestination(savedZone);
    }, []);



    return (
        <Layout>
            <div className="space-y-6 pt-4">
                {/* Main Action Card */}
                <Card className="border-0 shadow-lg bg-white overflow-hidden relative">
                    {/* Decorative background element */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-uz-navy" />

                    <CardHeader>
                        <CardTitle className="text-xl text-uz-navy">Where are you going today?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-500 uppercase tracking-wider">Destination</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-uz-navy w-5 h-5" />
                                <select
                                    value={destination}
                                    onChange={(e) => setDestination(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-uz-navy focus:outline-none focus:ring-1 focus:ring-uz-navy appearance-none text-gray-900 font-medium"
                                >
                                    <option value="" disabled>Select a zone</option>
                                    {MOCK_ZONES.map((zone) => (
                                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                className="text-xs text-uz-gold font-medium hover:text-uz-navy transition-colors"
                                onClick={() => setDestination("")}
                            >
                                Not going there? Change destination.
                            </button>
                        </div>

                        <Button
                            onClick={() => {
                                if (destination) {
                                    navigate(`/map?dest=${destination}`);
                                } else {
                                    // Fallback if nothing selected, maybe just go to map without filter
                                    navigate("/map");
                                }
                            }}
                            className="w-full bg-uz-navy text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-uz-navy/20 active:scale-[0.98] transition-transform"
                        >
                            <Navigation className="w-4 h-4 mr-2" />
                            Find me parking
                        </Button>
                    </CardContent>
                </Card>

                {/* Events Section */}
                {events.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Events</h2>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
                            {events.slice(0, 5).map(event => (
                                <EventChip
                                    key={event.id}
                                    event={event}
                                    onClick={(e) => {
                                        navigate(`/map?dest=${e.destinationZoneId}&event=${e.id}`);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Status Overview */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Today's Campus Parking</h2>
                    <div className="space-y-3">
                        {MOCK_ZONES.slice(0, 3).map((zone) => (
                            <div key={zone.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                                <span className="font-medium text-gray-700">{zone.name}</span>
                                <Badge variant={zone.status.toLowerCase() as any}>
                                    {zone.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
