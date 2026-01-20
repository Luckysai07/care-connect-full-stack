/**
 * Protected Route Component
 * 
 * Wrapper for routes that require authentication.
 */

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuthStore();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
