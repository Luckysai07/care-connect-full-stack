/**
 * Volunteer Dashboard Page
 * Main dashboard for volunteers to view and respond to SOS requests
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Power, MapPin, History, User } from 'lucide-react';
import toast from 'react-hot-toast';
import volunteerService from '../services/volunteer.service';
import { EnhancedSOSCard } from '../components/volunteer/EnhancedSOSCard';
import { VolunteerStatsCards } from '../components/volunteer/VolunteerStatsCards';
import { SOSHistoryCard } from '../components/history/SOSHistoryCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useAuthStore } from '../store/auth.store';
import { useSocketStore } from '../store/socket.store';
import { useVolunteerLocationTracking } from '../hooks/useVolunteerLocationTracking';

export function VolunteerDashboardPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [isAvailable, setIsAvailable] = useState(true);

    // Location tracking
    const { latitude, longitude, isTracking, error: locationError } = useVolunteerLocationTracking(isAvailable);
    // const isTracking = false;

    // Fetch volunteer stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['volunteer-stats'],
        queryFn: volunteerService.getStats,
    });

    // Fetch incoming SOS requests
    const { data: incomingRequests, isLoading: requestsLoading } = useQuery({
        queryKey: ['incoming-sos'],
        queryFn: volunteerService.getIncomingRequests,
        refetchInterval: 5000, // Refresh every 5 seconds
    });

    const { socket } = useSocketStore();

    // Listen for new SOS requests via Socket.io
    useEffect(() => {
        if (!socket) return;

        const handleNewSOS = (data: any) => {
            console.log('New SOS received via socket:', data);
            toast((t) => (
                <div className="flex items-center gap-3" onClick={() => toast.dismiss(t.id)}>
                    <div className="bg-red-100 p-2 rounded-full">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">New SOS Request!</p>
                        <p className="text-sm text-gray-600">{data.priority} priority - {data.emergencyType}</p>
                    </div>
                </div>
            ), { duration: 5000, position: 'top-right' });

            // Refresh the list immediately
            queryClient.invalidateQueries({ queryKey: ['incoming-sos'] });
        };

        socket.on('sos:new_request', handleNewSOS);

        return () => {
            socket.off('sos:new_request', handleNewSOS);
        };
    }, [socket, queryClient]);

    // Fetch volunteer SOS history
    const { data: sosHistory, isLoading: historyLoading } = useQuery({
        queryKey: ['volunteer-sos-history'],
        queryFn: volunteerService.getSOSHistory,
    });

    // Accept SOS mutation
    const acceptMutation = useMutation({
        mutationFn: volunteerService.acceptSOS,
        onSuccess: () => {
            toast.success('SOS request accepted!');
            queryClient.invalidateQueries({ queryKey: ['incoming-sos'] });
            queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
            // Navigate to active SOS page
            navigate('/volunteer/active-sos');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to accept SOS');
        },
    });

    // Decline SOS mutation
    const declineMutation = useMutation({
        mutationFn: volunteerService.declineSOS,
        onSuccess: () => {
            toast.success('SOS request declined');
            queryClient.invalidateQueries({ queryKey: ['incoming-sos'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to decline SOS');
        },
    });

    // Update availability mutation
    const availabilityMutation = useMutation({
        mutationFn: volunteerService.updateAvailability,
        onSuccess: () => {
            toast.success(`You are now ${isAvailable ? 'available' : 'unavailable'}`);
        },
        onError: () => {
            toast.error('Failed to update availability');
            setIsAvailable(!isAvailable); // Revert on error
        },
    });

    const handleAvailabilityToggle = () => {
        const newAvailability = !isAvailable;
        setIsAvailable(newAvailability);
        availabilityMutation.mutate(newAvailability);
    };

    if (statsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Show verification pending state
    if (stats && !stats.verified) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-10 h-10 text-yellow-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Pending</h2>
                    <p className="text-gray-600 mb-8">
                        Thanks for signing up to volunteer! Your account is currently under review by our admin team. You'll be notified via email once approved.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-xl font-medium transition-colors"
                        >
                            Refresh Status
                        </button>
                        <button
                            onClick={() => {
                                useAuthStore.getState().logout();
                                navigate('/login');
                            }}
                            className="w-full py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Volunteer Dashboard</h1>
                            <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Actions */}
                            <div className="flex items-center gap-2 mr-4">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                                    title="My Profile"
                                >
                                    <User className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={() => {
                                        useAuthStore.getState().logout();
                                        navigate('/login');
                                    }}
                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Logout"
                                >
                                    <Power className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Availability Toggle */}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">Availability</span>
                                <button
                                    onClick={handleAvailabilityToggle}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${isAvailable ? 'bg-green-600' : 'bg-gray-300'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAvailable ? 'translate-x-7' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                                <Power className={`w-5 h-5 ${isAvailable ? 'text-green-600' : 'text-gray-400'}`} />

                                {/* Location Status */}
                                {isAvailable && (
                                    <div className="ml-4 flex items-center gap-2 text-sm">
                                        <MapPin className={`w-4 h-4 ${isTracking ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
                                        <span className={isTracking ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                            {isTracking ? 'Location Active' : 'Getting location...'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                {stats && (
                    <div className="mb-8">
                        <VolunteerStatsCards stats={stats} />
                    </div>
                )}

                {/* Incoming SOS Requests */}
                <div>
                    <div className="flex items-center gap-2 mb-6">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Incoming SOS Requests</h2>
                    </div>

                    {requestsLoading ? (
                        <div className="flex justify-center py-12">
                            <LoadingSpinner size="md" />
                        </div>
                    ) : incomingRequests && incomingRequests.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {incomingRequests.map((request) => (
                                <EnhancedSOSCard
                                    key={request.id}
                                    request={request}
                                    onAccept={(id) => acceptMutation.mutate(id)}
                                    onDecline={(id) => declineMutation.mutate(id)}
                                    isLoading={acceptMutation.isPending || declineMutation.isPending}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Incoming Requests</h3>
                            <p className="text-gray-600">
                                {isAvailable
                                    ? 'You\'re all set! New SOS requests will appear here.'
                                    : 'Turn on availability to receive SOS requests.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Response History Section */}
                <div className="mt-12">
                    <div className="flex items-center gap-2 mb-6">
                        <History className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-gray-900">Response History</h2>
                    </div>

                    {historyLoading ? (
                        <div className="flex justify-center py-8">
                            <LoadingSpinner size="md" />
                        </div>
                    ) : sosHistory && sosHistory.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sosHistory.slice(0, 6).map((request) => (
                                <SOSHistoryCard
                                    key={request.id}
                                    request={request}
                                    isVolunteerView={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Response History</h3>
                            <p className="text-gray-600">
                                Your completed SOS responses will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
