/**
 * Main App Component
 * 
 * Sets up routing and global providers.
 */

import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';
import { useSocketStore } from './store/socket.store';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { OfflineBanner } from './components/OfflineBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { usePushNotifications } from './hooks/usePushNotifications';

// Lazy load pages for performance
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(module => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const SOSDetailsPage = lazy(() => import('./pages/SOSDetailsPage').then(module => ({ default: module.SOSDetailsPage })));
const VolunteerDashboardPage = lazy(() => import('./pages/VolunteerDashboardPage').then(module => ({ default: module.VolunteerDashboardPage })));
const ActiveSOSPage = lazy(() => import('./pages/ActiveSOSPage').then(module => ({ default: module.ActiveSOSPage })));
const UserSOSStatusPage = lazy(() => import('./pages/UserSOSStatusPage').then(module => ({ default: module.UserSOSStatusPage })));
const SOSHistoryPage = lazy(() => import('./pages/SOSHistoryPage').then(module => ({ default: module.SOSHistoryPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));
const VolunteerVerificationPage = lazy(() => import('./pages/admin/VolunteerVerificationPage').then(module => ({ default: module.VolunteerVerificationPage })));
const AdminRoute = lazy(() => import('./components/auth/AdminRoute').then(module => ({ default: module.AdminRoute })));

import { queryClient } from './lib/query-client';

// remove local instantiation
// const queryClient = new QueryClient({...});

function App() {
    const { loadUser, user, accessToken } = useAuthStore();
    const { initialize, disconnect } = useSocketStore();

    // Load user from localStorage on app start
    useEffect(() => {
        loadUser();
    }, [loadUser]);

    // Initialize Push Notifications
    usePushNotifications();

    // Initialize Socket connection
    useEffect(() => {
        if (user && accessToken && initialize) {
            initialize(accessToken);
        } else if (disconnect) {
            disconnect();
        }
        return () => {
            if (disconnect) disconnect();
        };
    }, [user, accessToken, initialize, disconnect]);

    return (
        <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Suspense fallback={<LoadingSpinner fullScreen />}>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegisterPage />} />

                            {/* Protected Routes - User */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <DashboardPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/sos/:sosId"
                                element={
                                    <ProtectedRoute>
                                        <SOSDetailsPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/history"
                                element={
                                    <ProtectedRoute>
                                        <SOSHistoryPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/sos-status/:sosId"
                                element={
                                    <ProtectedRoute>
                                        <UserSOSStatusPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <ProfilePage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Protected Routes - Volunteer */}
                            <Route
                                path="/volunteer/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <VolunteerDashboardPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/volunteer/active-sos"
                                element={
                                    <ProtectedRoute>
                                        <ActiveSOSPage />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Protected Routes - Admin */}
                            <Route element={<AdminRoute />}>
                                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                                <Route path="/admin/verify-volunteers" element={<VolunteerVerificationPage />} />
                            </Route>

                            {/* Redirect root to dashboard */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />

                            {/* 404 - Redirect to dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </Suspense>

                    {/* Toast Notifications */}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#fff',
                                color: '#363636',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#10b981',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />

                    {/* Offline Banner */}
                    <OfflineBanner />
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    );
}

export default App;
