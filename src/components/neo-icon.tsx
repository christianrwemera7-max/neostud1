// src/components/neo-icon.tsx
import { cn } from "@/lib/utils";

export function NeoIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("h-10 w-10 text-primary", className)}
            {...props}
        >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            <path d="M6 8h2"></path>
            <path d="M6 12h2"></path>
            <path d="M16 8h2"></path>
            <path d="M16 12h2"></path>
        </svg>
    );
}
