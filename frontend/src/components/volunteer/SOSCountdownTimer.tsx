/**
 * SOS Countdown Timer Component
 * 
 * Displays a live countdown timer showing time remaining until SOS expires
 */

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface SOSCountdownTimerProps {
    expiresAt: string;
    onExpired?: () => void;
}

export function SOSCountdownTimer({ expiresAt, onExpired }: SOSCountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = Math.max(0, expiry - now);
            return diff;
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        // Update every second
        const interval = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);

            if (remaining === 0) {
                clearInterval(interval);
                onExpired?.();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onExpired]);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    // Determine color based on time remaining
    const getColorClass = () => {
        if (timeLeft < 30000) return 'text-red-600 bg-red-50'; // < 30 seconds
        if (timeLeft < 60000) return 'text-orange-600 bg-orange-50'; // < 1 minute
        return 'text-blue-600 bg-blue-50'; // >= 1 minute
    };

    const colorClass = getColorClass();

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${colorClass}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold text-sm">
                {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
        </div>
    );
}
