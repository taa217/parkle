/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import Map, { Marker, NavigationControl, Source, Layer, type ViewState } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Link, useNavigate } from "react-router-dom";
import { useParkingStore } from "../store/parkingStore";
import { useZoneStore } from "../store/zoneStore";
import { AlertCircle, AlertTriangle, Car, CheckCircle, ChevronDown, ChevronUp, Layers, Navigation, User, X } from "lucide-react";
import { ReportIssueModal } from "../components/ReportIssueModal";
import { api } from "../services/api";

import { useZoneStream } from "../hooks/useZoneStream";

// Fallback to strict Mapbox token check
// Vite usually requires VITE_ prefix, but we check both as per plan
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapPage() {
    const navigate = useNavigate();
    // const [searchParams] = useSearchParams(); // Unused
    // const destId = searchParams.get("dest"); // Unused

    const { zones, getRecommendedZones, selectedZoneId, setSelectedZone } = useZoneStore();
    const { status: connectionStatus } = useZoneStream();

    const addParkingEvent = useParkingStore(state => state.addEvent);

    // Local state for map view
    const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/satellite-streets-v12");
    const [viewState, setViewState] = useState<ViewState>({
        latitude: -17.7830, // Centered on UZ roughly
        longitude: 31.0525,
        zoom: 15,
        bearing: 0,
        pitch: 0,
        padding: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const [isSheetExpanded, setIsSheetExpanded] = useState(false);
    
    // Navigation State
    const [isNavigating, setIsNavigating] = useState(false);
    const [route, setRoute] = useState<any>(null);
    const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

    // UI States
    const [showReportModal, setShowReportModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

    // (Polling removed in favor of SSE)
    // (Mock sensor feed toggle removed or hidden as we have real SSE now, 
    // although for dev it might still be useful, keeping it simple per plan)

    // Recommendations
    const recommendedZones = useMemo(() => {
        return getRecommendedZones();
    }, [zones, getRecommendedZones]); // Re-calc when zones change (mock updates)

    // Select recommended zone on load
    useEffect(() => {
        if (recommendedZones.length > 0 && !selectedZoneId) {
            setSelectedZone(recommendedZones[0].id);
            setViewState(prev => ({
                ...prev,
                latitude: recommendedZones[0]?.lat || -17.7830,
                longitude: recommendedZones[0]?.lng || 31.0525,
                zoom: 16
            }));
        }
    }, [recommendedZones, selectedZoneId]);

    // Handle Toast Timer
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Handle Token Missing
    if (!MAPBOX_TOKEN) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50 text-slate-800 p-6">
                <h1 className="text-2xl font-bold mb-4">Mapbox Token Not Configured</h1>
                <p className="text-center max-w-md mb-6">
                    Please add <code className="bg-slate-200 px-1 py-0.5 rounded">VITE_MAPBOX_TOKEN</code> to your <code className="bg-slate-200 px-1 py-0.5 rounded">.env</code> file to enable the map.
                </p>
                <button
                    onClick={() => navigate("/")}
                    className="px-4 py-2 bg-uz-navy text-white rounded-lg hover:opacity-90 transition"
                >
                    Go Back Home
                </button>
            </div>
        );
    }

    const selectedZone = zones.find(z => z.id === selectedZoneId);

    const handleNavigate = () => {
        if (!selectedZone) return;

        if (isNavigating) {
            setIsNavigating(false);
            setRoute(null);
            setUserLocation(null);
            return;
        }

        if (!navigator.geolocation) {
            setToast({ message: "Geolocation not supported", type: 'info' });
            // Fallback to Google Maps
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedZone.lat},${selectedZone.lng}`, '_blank');
            return;
        }

        setToast({ message: "Calculating route...", type: 'info' });

        navigator.geolocation.getCurrentPosition(async (position) => {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;
            setUserLocation([userLng, userLat]);

            try {
                const response = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${selectedZone.lng},${selectedZone.lat}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`
                );
                const data = await response.json();
                
                if (data.routes && data.routes.length > 0) {
                    setRoute(data.routes[0].geometry);
                    setIsNavigating(true);
                    
                    // Center map on user to start
                    setViewState(prev => ({
                        ...prev,
                        latitude: userLat,
                        longitude: userLng,
                        zoom: 15,
                        pitch: 45 // Add some pitch for navigation feel
                    }));
                } else {
                     setToast({ message: "No route found", type: 'info' });
                }
            } catch (error) {
                console.error("Error fetching directions:", error);
                setToast({ message: "Failed to load directions", type: 'info' });
            }
        }, (error) => {
             console.error("Geolocation error:", error);
             if (error.message.includes("secure origins")) {
                 setToast({ message: "HTTPS required for location", type: 'info' });
             } else if (error.code === 1) {
                 setToast({ message: "Please enable location permission", type: 'info' });
             } else {
                 setToast({ message: "Location unavailable", type: 'info' });
             }
        });
    };

    const handleParkedHere = async () => {
        if (selectedZoneId) {
            try {
                // Fire and forget to API
                await api.post('/parking-events', { zoneId: selectedZoneId });
                // Also store locally if we want to show "Last parked at..." logic, but for now just API
                addParkingEvent({ zoneId: selectedZoneId });
                setToast({ message: "Saved. Thanks!", type: 'success' });
            } catch (err) {
                console.error("Failed to save parking event", err);
                setToast({ message: "Failed to save.", type: 'info' });
            }
        }
    };

    const handleReportSuccess = () => {
        setToast({ message: "Report submitted", type: 'success' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Available': return 'bg-green-500';
            case 'Limited': return 'bg-amber-500';
            case 'Full': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Available': return 'text-green-700 bg-green-50 border-green-200';
            case 'Limited': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Full': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-slate-700 bg-slate-50 border-slate-200';
        }
    };

    // Global "Live" Freshness Logic
    // We'll base "Live" badge on the most recently updated zone across the system
    const systemLastUpdated = Math.max(...zones.map(z => z.lastUpdated));
    const secondsAgo = Math.floor((Date.now() - systemLastUpdated) / 1000);

    let freshnessConfig = { text: `Updated ${secondsAgo}s ago`, color: "text-green-600 bg-white/90" };
    if (secondsAgo > 30) freshnessConfig = { text: `Updated ${secondsAgo}s ago`, color: "text-amber-600 bg-white/90" };
    if (secondsAgo > 120) freshnessConfig = { text: "Stale data", color: "text-red-600 bg-white/90" };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-slate-100">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-4 pt-12 md:pt-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none">
                <div className="pointer-events-auto flex flex-col items-start gap-2">
                    <h1 className="text-xl font-bold text-uz-navy drop-shadow-sm bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                        UZ Parking
                    </h1>
                    {/* Map Style Toggle */}
                    <button
                        onClick={() => setMapStyle(prev => prev.includes('satellite') ? 'mapbox://styles/mapbox/streets-v12' : 'mapbox://styles/mapbox/satellite-streets-v12')}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur transition-all bg-white/90 text-uz-navy hover:bg-white"
                    >
                        <Layers size={14} />
                        {mapStyle.includes('satellite') ? 'Map View' : 'Satellite'}
                    </button>
                    {/* Status Badges */}
                    <div className="flex items-center gap-2">
                        {/* Freshness Badge */}
                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur transition-all ${freshnessConfig.color}`}>
                            <div className={`w-2 h-2 rounded-full ${secondsAgo < 120 ? 'bg-current animate-pulse' : 'bg-current'}`} />
                            {freshnessConfig.text}
                        </div>

                        {/* Connection Badge */}
                        {connectionStatus !== 'CONNECTED' && (
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm backdrop-blur transition-all bg-white/90 text-slate-500`}>
                                <div className={`w-2 h-2 rounded-full bg-slate-400 ${connectionStatus === 'CONNECTING' ? 'animate-pulse' : ''}`} />
                                {connectionStatus === 'CONNECTING' ? 'Connecting...' : connectionStatus === 'FALLBACK' ? 'Fallback Mode' : 'Offline'}
                            </div>
                        )}
                        {connectionStatus === 'CONNECTED' && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm backdrop-blur bg-green-500/10 text-green-700 border border-green-200">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Live
                            </div>
                        )}
                    </div>
                </div>
                <Link to="/onboarding" className="pointer-events-auto w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-uz-navy hover:bg-white transition">
                    <User size={20} />
                </Link>
            </header>

            {/* Toast */}
            {toast && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-uz-navy text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        <CheckCircle size={16} className="text-green-400" />
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Map */}
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: "100%", height: "100%" }}
                mapStyle={mapStyle}
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                <NavigationControl position="top-right" style={{ marginTop: '90px' }} />

                {/* Navigation Route Layer */}
                {isNavigating && route && (
                    <Source id="route-source" type="geojson" data={{
                        type: 'Feature',
                        properties: {},
                        geometry: route
                    }}>
                        <Layer
                            id="route-line"
                            type="line"
                            layout={{
                                'line-join': 'round',
                                'line-cap': 'round'
                            }}
                            paint={{
                                'line-color': '#3b82f6', // blue-500
                                'line-width': 6,
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* User Location Marker */}
                {userLocation && (
                    <Marker longitude={userLocation[0]} latitude={userLocation[1]} anchor="center">
                         <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md shadow-blue-500/50 animate-pulse" />
                    </Marker>
                )}

                {zones.map(zone => {
                    const isSelected = selectedZoneId === zone.id;
                    return (
                        <Marker
                            key={zone.id}
                            latitude={zone.lat}
                            longitude={zone.lng}
                            anchor="center"
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                setSelectedZone(zone.id);
                                setViewState(v => ({ ...v, latitude: zone.lat, longitude: zone.lng }));
                            }}
                        >
                            <div
                                className={`
                  w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer transition-all duration-500
                  ${getStatusColor(zone.status)}
                  ${isSelected ? 'scale-150 ring-4 ring-uz-gold/50' : 'hover:scale-110'}
                `}
                            />
                        </Marker>
                    );
                })}
            </Map>

            {/* Bottom Sheet */}
            <div
                className={`
          absolute left-0 right-0 bottom-0 z-30 bg-white rounded-t-3xl shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.15)] 
          transition-transform duration-300 ease-out max-w-md mx-auto
          ${isSheetExpanded ? 'h-[75vh]' : 'h-auto'}
        `}
            >
                {/* Handle */}
                <div
                    className="w-full flex justify-center pt-3 pb-1 cursor-pointer"
                    onClick={() => setIsSheetExpanded(!isSheetExpanded)}
                >
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                <div className="px-6 pb-8 pt-2 overflow-y-auto h-full max-h-[calc(75vh-20px)] hide-scrollbar">
                    {selectedZone ? (
                        <>
                            {/* Full Status Banner */}
                            {selectedZone.status === 'Full' && (
                                <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex items-center justify-between animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle size={18} className="text-red-500" />
                                        <div className="text-xs font-semibold text-red-800">
                                            This zone is full. Swap plan?
                                        </div>
                                    </div>
                                    {/* Find next available recommended that isn't full */}
                                    {(() => {
                                        const alt = recommendedZones.find(z => z.id !== selectedZoneId && z.status !== 'Full');
                                        return alt ? (
                                            <button
                                                onClick={() => {
                                                    setSelectedZone(alt.id);
                                                    setViewState(v => ({ ...v, latitude: alt.lat, longitude: alt.lng }));
                                                }}
                                                className="text-xs bg-white border border-red-200 text-red-700 px-3 py-1.5 rounded-lg font-bold shadow-sm"
                                            >
                                                Switch to {alt.name}
                                            </button>
                                        ) : null;
                                    })()}
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-white bg-uz-navy px-2 py-0.5 rounded-full uppercase tracking-wider">
                                            Plan {String.fromCharCode(65 + recommendedZones.findIndex(z => z.id === selectedZoneId))}
                                        </span>
                                        {/* Only show Recommended if it's the top one */}
                                        {selectedZoneId === recommendedZones[0]?.id && (
                                            <span className="text-xs font-bold text-uz-navy bg-uz-gold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-2xl font-bold text-uz-navy leading-tight">
                                        {selectedZone.name}
                                    </h2>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className={`px-2 py-1 rounded-lg border text-xs font-bold uppercase tracking-wide ${getStatusText(selectedZone.status)}`}>
                                        {selectedZone.status}
                                    </div>
                                    {selectedZone.overrideActive && (
                                        <div className="flex items-center gap-1">
                                            <span className="px-1.5 py-0.5 rounded border border-amber-300 text-[10px] font-bold text-amber-700 bg-amber-50 uppercase tracking-wider">
                                                Override Active
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Zone Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <span className="text-lg font-bold text-uz-navy">{selectedZone.walkingMinutes} min</span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">Walk Time</span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <div className="flex items-center gap-1">
                                        <div className={`w-2 h-2 rounded-full ${selectedZone.confidence === 'High' ? 'bg-green-500' :
                                            selectedZone.confidence === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
                                            }`} />
                                        <span className="text-lg font-bold text-uz-navy">{selectedZone.confidence}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">Confidence</span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    {/* Just showing generic available count or capacity logic if needed, else last update */}
                                    <span className="text-lg font-bold text-uz-navy">
                                        {Math.floor((Date.now() - selectedZone.lastUpdated) / 1000)}s
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">Freshness</span>
                                </div>
                            </div>

                            <button
                                onClick={handleNavigate}
                                className={`w-full py-3.5 ${isNavigating ? 'bg-red-600 shadow-red-600/20' : 'bg-uz-navy shadow-uz-navy/20'} text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition flex items-center justify-center gap-2 mb-3`}
                            >
                                {isNavigating ? <X size={20} /> : <Navigation size={20} />}
                                {isNavigating ? "Stop Navigation" : "Start Navigation"}
                            </button>


                            {/* Trust Loop Actions */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    onClick={handleParkedHere}
                                    className="py-2.5 bg-white border border-slate-200 text-uz-navy rounded-xl font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
                                >
                                    <Car size={16} />
                                    I parked here
                                </button>
                                <button
                                    onClick={() => setShowReportModal(true)}
                                    className="py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition flex items-center justify-center gap-2"
                                >
                                    <AlertCircle size={16} />
                                    Report issue
                                </button>
                            </div>

                            {/* Toggle for expansion */}
                            {!isSheetExpanded && (
                                <button
                                    onClick={() => setIsSheetExpanded(true)}
                                    className="w-full py-2 mb-2 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1 hover:text-uz-navy transition"
                                >
                                    View Alternatives <ChevronUp size={14} />
                                </button>
                            )}

                            {/* Additional Details & Alternatives (Expanded View) */}
                            {isSheetExpanded && (
                                <div className="border-t pt-5 animate-in slide-in-from-bottom-4 fade-in duration-500">
                                    <div className="mb-6">
                                        <div
                                            className="flex items-center justify-between text-sm font-bold text-uz-navy mb-2 cursor-pointer"
                                            onClick={() => setIsSheetExpanded(false)}
                                        >
                                            <h3>ALTERNATIVE PLANS</h3>
                                            <ChevronDown size={16} />
                                        </div>

                                        <div className="space-y-3">
                                            {recommendedZones.filter(z => z.id !== selectedZoneId).slice(0, 3).map((zone) => {
                                                // Calculate Plan Letter based on sorted index
                                                const originalIdx = recommendedZones.findIndex(r => r.id === zone.id);
                                                const planLetter = String.fromCharCode(65 + originalIdx);

                                                return (
                                                    <div
                                                        key={zone.id}
                                                        onClick={() => {
                                                            setSelectedZone(zone.id);
                                                            setViewState(v => ({ ...v, latitude: zone.lat, longitude: zone.lng }));
                                                        }}
                                                        className="bg-white border rounded-xl p-3 flex items-center justify-between shadow-sm cursor-pointer hover:border-uz-navy/30 transition group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full shadow-sm ${getStatusColor(zone.status)}`} />
                                                            <div>
                                                                <div className="font-bold text-uz-navy text-sm group-hover:text-uz-gold transition-colors">{zone.name}</div>
                                                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                                                    <span>{zone.walkingMinutes} min walk</span>
                                                                    <span>•</span>
                                                                    <span>{zone.confidence} conf.</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">PLAN {planLetter}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-8 text-center pb-4">
                                        <Link to="/" className="text-sm text-uz-navy font-semibold hover:underline">
                                            Change Destination
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                            {zones.length === 0 ? (
                                <>
                                    <div className="w-6 h-6 border-2 border-slate-300 border-t-uz-navy rounded-full animate-spin" />
                                    <span>Loading live parking data...</span>
                                    {connectionStatus === 'FALLBACK' && <span className="text-xs text-amber-500">Using fallback connection...</span>}
                                    {connectionStatus === 'DISCONNECTED' && <span className="text-xs text-red-500">Connection lost. Retrying...</span>}
                                </>
                            ) : "Select a parking zone"}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showReportModal && selectedZoneId && (
                <ReportIssueModal
                    zoneId={selectedZoneId}
                    onClose={() => setShowReportModal(false)}
                    onSuccess={handleReportSuccess}
                />
            )}
        </div>
    );
}

