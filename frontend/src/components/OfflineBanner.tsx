import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-center gap-2 fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You are currently offline. Some features may be limited.</span>
        </div>
    );
}
