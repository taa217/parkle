import * as React from "react"
import { cn } from "../../lib/utils"

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
    steps: number
    currentStep: number
}

export function Stepper({ steps, currentStep, className, ...props }: StepperProps) {
    return (
        <div className={cn("flex items-center space-x-2", className)} {...props}>
            {Array.from({ length: steps }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        i < currentStep
                            ? "bg-uz-navy"
                            : "bg-gray-200"
                    )}
                />
            ))}
        </div>
    )
}
