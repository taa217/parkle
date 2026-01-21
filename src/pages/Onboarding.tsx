import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { api } from "../services/api";
import { Stepper } from "../components/ui/Stepper";
import { MOCK_ZONES } from "../lib/data";
import { Check, Car, GraduationCap, Briefcase, User as UserIcon } from "lucide-react";
import { cn } from "../lib/utils";

type UserRole = 'Student' | 'Staff' | 'Visitor';

export default function Onboarding() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    // Form State
    const [role, setRole] = useState<UserRole | null>(null);
    const [primaryZone, setPrimaryZone] = useState<string>("");
    const [plate, setPlate] = useState("");

    // Redirect visitors
    useEffect(() => {
        if (localStorage.getItem("uz_parking_visitor")) {
            navigate("/", { replace: true });
        }
    }, [navigate]);

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Finish
            try {
                // Save to Backend
                await api.put('/me/profile', {
                    role: role?.toUpperCase(),
                    primaryZoneId: primaryZone,
                    plate: plate || null,
                    preference: 'FASTEST_WALK' // Default for now
                });

                // Keep local storage for quick access if needed (or remove if fully relying on API state)
                localStorage.setItem("uz_parking_user_role", role || "");
                localStorage.setItem("uz_parking_primary_zone", primaryZone || "");
                localStorage.setItem("uz_parking_plate", plate || "");

                navigate("/");
            } catch (err) {
                console.error("Failed to save profile", err);
                alert("Failed to save profile. See console.");
            }
        }
    };

    const isStepValid = () => {
        if (step === 1) return !!role;
        if (step === 2) return !!primaryZone;
        if (step === 3) return true; // Optional
        return false;
    };

    return (
        <Layout showProfile={false}>
            <div className="space-y-6 pt-4">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-uz-navy">Step {step} of 3</p>
                    <Stepper steps={3} currentStep={step} />
                </div>

                <Card className="border-0 shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="text-2xl text-uz-navy">
                            {step === 1 && "Who are you?"}
                            {step === 2 && "Where do you usually park?"}
                            {step === 3 && "Vehicle Details"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 space-y-6">

                        {/* Step 1: User Type */}
                        {step === 1 && (
                            <div className="grid gap-4">
                                {[
                                    { id: 'Student', icon: GraduationCap, label: 'Student' },
                                    { id: 'Staff', icon: Briefcase, label: 'Staff' },
                                    { id: 'Visitor', icon: UserIcon, label: 'Visitor' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setRole(item.id as UserRole)}
                                        className={cn(
                                            "flex items-center p-4 rounded-xl border-2 transition-all w-full text-left",
                                            role === item.id
                                                ? "border-uz-navy bg-uz-navy/5 ring-1 ring-uz-navy"
                                                : "border-gray-200 bg-white hover:border-uz-navy/50"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-full mr-4",
                                            role === item.id ? "bg-uz-navy text-white" : "bg-gray-100 text-gray-500"
                                        )}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-lg text-uz-navy">{item.label}</span>
                                        {role === item.id && <Check className="ml-auto w-5 h-5 text-uz-navy" />}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Step 2: Primary Zone */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-gray-700">Select Primary Zone</label>
                                <div className="grid gap-3">
                                    {MOCK_ZONES.map((zone) => (
                                        <button
                                            key={zone.id}
                                            onClick={() => setPrimaryZone(zone.id)}
                                            className={cn(
                                                "w-full p-4 rounded-xl border text-left transition-all",
                                                primaryZone === zone.id
                                                    ? "border-uz-navy bg-uz-navy/5 ring-1 ring-uz-navy"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            )}
                                        >
                                            <div className="font-semibold text-uz-navy">{zone.name}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Vehicle */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="plate" className="text-sm font-medium text-gray-700">
                                        Number Plate (Optional)
                                    </label>
                                    <div className="relative">
                                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            id="plate"
                                            type="text"
                                            placeholder="ABC-1234"
                                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-uz-navy focus:outline-none focus:ring-1 focus:ring-uz-navy uppercase bg-white text-gray-900"
                                            value={plate}
                                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">We use this to learn your parking habits.</p>
                                </div>
                            </div>
                        )}

                        <Button onClick={handleNext} disabled={!isStepValid()} className="w-full py-6 text-base mt-8">
                            {step === 3 ? "Finish setup" : "Continue"}
                        </Button>

                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
