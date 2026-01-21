import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { api } from "../services/api";

export default function Login() {
    const [email, setEmail] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        try {
            const { userId } = await api.post('/session', { email });
            // Set session key (userId)
            localStorage.setItem("uz_parking_session", userId);
            // Redirect to onboarding
            navigate("/onboarding");
        } catch (err) {
            console.error(err);
            alert("Login failed. Check console.");
        }
    };

    return (
        <Layout showProfile={false}>
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-sm mx-auto shadow-md">
                    <CardHeader className="text-center space-y-2">
                        <CardTitle className="text-2xl font-bold text-uz-navy">Welcome to Parklee</CardTitle>
                        <CardDescription className="text-base text-gray-500">
                            Find parking faster on campus.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="example@email.com"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-uz-navy focus:outline-none focus:ring-1 focus:ring-uz-navy transition-colors bg-white text-gray-900"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full py-6 text-base" disabled={!email}>
                                Continue
                            </Button>

                            <p className="text-center text-xs text-muted-foreground">
                                Login with your  email address.
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
