import { useNavigate, useLocation } from "react-router-dom"
import { User } from "lucide-react"
import { cn } from "../lib/utils"

interface LayoutProps {
    children: React.ReactNode
    showProfile?: boolean
}

export function Layout({ children, showProfile = true }: LayoutProps) {
    const navigate = useNavigate()
    const location = useLocation()

    // Only show profile on Home and Results, not Login or Onboarding
    const shouldShowProfile = showProfile && !['/login', '/onboarding'].includes(location.pathname)

    return (
        <div className="min-h-screen w-full bg-uz-bg flex justify-center">
            <div className="w-full max-w-md bg-uz-bg min-h-screen relative flex flex-col">
                {/* Header */}
                <header className={cn(
                    "w-full px-6 py-4 flex items-center justify-between",
                    !shouldShowProfile && "justify-center"
                )}>
                    <h1 className="text-xl font-bold text-uz-navy">UZ Parking</h1>

                    {shouldShowProfile && (
                        <button
                            onClick={() => navigate('/onboarding')}
                            className="p-2 rounded-full hover:bg-uz-navy/5 text-uz-navy transition-colors"
                        >
                            <User className="w-5 h-5" />
                        </button>
                    )}
                </header>

                {/* Content */}
                <main className="flex-1 px-4 pb-8 flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    )
}
