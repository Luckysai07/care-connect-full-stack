import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ fullScreen = false, size = 'md' }: { fullScreen?: boolean; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    if (fullScreen) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center p-4">
            <Loader2 className={`${sizeClasses[size]} text-primary-600 animate-spin`} />
        </div>
    );
}
