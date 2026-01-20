/**
 * User SOS Status Page
 * Shows volunteer location and status for users who created SOS
 * Enhanced with live volunteer tracking, waiting timer, and full-screen map
 * Robust error handling and edge case management
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    MapPin,
    Phone,
    User,
    Star,
    Navigation,
    Clock,
    CheckCircle,
    AlertCircle,
    ArrowLeft,
    Timer,
    XCircle,
    RefreshCw,
    Home,
    PhoneCall
} from 'lucide-react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import sosService from '../services/sos.service';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MapView } from '../components/map/MapView';

import { useSocket } from '../hooks/useSocket';

export function UserSOSStatusPage() {
    const { sosId } = useParams<{ sosId: string }>();
    const navigate = useNavigate();
    const [waitingSeconds, setWaitingSeconds] = useState(0);
    const { socket, isConnected, emit, on, off } = useSocket();
    const [volunteerLocation, setVolunteerLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // Fetch SOS details with volunteer info - refresh every 3 seconds for live updates
    const { data: sos, isLoading, error, refetch, isError } = useQuery({
        queryKey: ['sos-status', sosId],
        queryFn: () => sosService.getSOSDetails(sosId!),
        refetchInterval: 3000,
        enabled: !!sosId,
        retry: 3,
    });

    // Sync socket location with initial fetch
    useEffect(() => {
        if (sos?.volunteer?.location) {
            setVolunteerLocation(sos.volunteer.location);
        }
    }, [sos?.volunteer?.location]);

    // Socket connection for live tracking
    useEffect(() => {
        if (isConnected && sosId) {
            // Join the SOS room to receive updates
            emit('chat:join', { sosId });

            // Listen for volunteer location updates
            const handleLocationUpdate = (data: any) => {
                console.log('Volunteer moved:', data);
                setVolunteerLocation({
                    latitude: data.latitude,
                    longitude: data.longitude
                });
            };

            on('location:volunteer_moved', handleLocationUpdate);

            return () => {
                off('location:volunteer_moved', handleLocationUpdate);
                emit('chat:leave', { sosId });
            };
        }
    }, [isConnected, sosId, emit, on, off]);

    // Waiting timer effect
    useEffect(() => {
        if (sos && sos.status === 'PENDING') {
            const interval = setInterval(() => {
                const seconds = differenceInSeconds(new Date(), new Date(sos.createdAt));
                setWaitingSeconds(Math.max(0, seconds));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [sos]);

    // Format waiting time
    const formatWaitingTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Check if waiting too long (> 2 minutes)
    const isWaitingTooLong = waitingSeconds > 120;

    // Loading state with nice UI
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-lg">Loading your SOS request...</p>
            </div>
        );
    }

    // Error state with retry option
    if (isError || !sos) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {error ? 'Connection Error' : 'SOS Not Found'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {error
                            ? 'Unable to connect to the server. Please check your internet connection.'
                            : 'This SOS request may have expired or been cancelled.'
                        }
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => refetch()} className="w-full">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                        <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                            <Home className="w-4 h-4 mr-2" />
                            Go to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Status checks
    const isPending = sos.status === 'PENDING';
    const isAccepted = sos.status === 'ACCEPTED' || sos.status === 'IN_PROGRESS';
    const isCompleted = sos.status === 'RESOLVED';
    const isExpired = sos.status === 'EXPIRED';
    const isCancelled = sos.status === 'CANCELLED';

    // Build map markers with null safety
    const mapMarkers: Array<{
        position: { latitude: number; longitude: number };
        title: string;
        description?: string;
        type?: 'default' | 'emergency';
    }> = [];

    // Add user's emergency location
    if (sos.location?.latitude && sos.location?.longitude) {
        mapMarkers.push({
            position: { latitude: sos.location.latitude, longitude: sos.location.longitude },
            title: 'Your Location',
            description: 'Emergency location',
            type: 'emergency',
        });
    }

    // Add volunteer marker if available (prefer live socket data)
    const activeVolunteerLocation = volunteerLocation || sos.volunteer?.location;

    if (activeVolunteerLocation?.latitude && activeVolunteerLocation?.longitude && sos.volunteer) {
        mapMarkers.push({
            position: {
                latitude: activeVolunteerLocation.latitude,
                longitude: activeVolunteerLocation.longitude
            },
            title: sos.volunteer.name || 'Volunteer',
            description: 'Volunteer Location',
            type: 'default',
        });
    }

    // Expired or Cancelled State
    if (isExpired || isCancelled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <Card className="max-w-md w-full text-center">
                    <XCircle className={`w-16 h-16 mx-auto mb-4 ${isExpired ? 'text-orange-500' : 'text-gray-500'}`} />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {isExpired ? 'SOS Request Expired' : 'SOS Request Cancelled'}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {isExpired
                            ? 'No volunteers were available in your area. Please try again or call emergency services.'
                            : 'This SOS request has been cancelled.'
                        }
                    </p>
                    <div className="space-y-3">
                        <a
                            href="tel:112"
                            className="flex items-center justify-center gap-2 w-full p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        >
                            <PhoneCall className="w-5 h-5" />
                            Call Emergency (112)
                        </a>
                        <Button variant="outline" onClick={() => navigate('/dashboard')} className="w-full">
                            <Home className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            {isPending ? (
                /* ======== WAITING STATE - Full Screen ======== */
                <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 text-white p-6 relative">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="absolute top-4 left-4 p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition"
                        aria-label="Back to dashboard"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    {/* Emergency Call Button - Top Right */}
                    <a
                        href="tel:112"
                        className="absolute top-4 right-4 px-4 py-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition flex items-center gap-2"
                    >
                        <PhoneCall className="w-5 h-5" />
                        <span className="text-sm font-medium">Call 112</span>
                    </a>

                    {/* Pulsing Animation */}
                    <div className="relative mb-8">
                        <div className="w-32 h-32 rounded-full bg-white/20 animate-ping absolute" />
                        <div className="w-32 h-32 rounded-full bg-white/30 flex items-center justify-center relative">
                            <AlertCircle className="w-16 h-16" />
                        </div>
                    </div>

                    {/* Main Text */}
                    <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">
                        Finding Nearby Volunteers
                    </h1>
                    <p className="text-lg sm:text-xl opacity-90 mb-8 text-center max-w-md">
                        We're notifying volunteers in your area. Please stay calm and wait for assistance.
                    </p>

                    {/* Waiting Timer */}
                    <div className={`backdrop-blur-sm rounded-2xl p-6 mb-6 ${isWaitingTooLong ? 'bg-yellow-500/30 border-2 border-yellow-300' : 'bg-white/20'}`}>
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <Timer className="w-6 h-6" />
                            <span className="text-lg font-medium">Waiting Time</span>
                        </div>
                        <p className="text-5xl font-bold font-mono text-center">
                            {formatWaitingTime(waitingSeconds)}
                        </p>
                        {isWaitingTooLong && (
                            <p className="text-sm mt-2 text-center opacity-90">
                                Taking longer than usual. Consider calling 112.
                            </p>
                        )}
                    </div>

                    {/* Emergency Type Badge */}
                    <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
                        <span className="text-lg font-medium">
                            {sos.emergencyType?.replace('_', ' ') || 'Emergency'} Request
                        </span>
                    </div>

                    {/* Safety Tips */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 max-w-md w-full">
                        <p className="text-sm opacity-90 text-center">
                            💡 <strong>Tip:</strong> Keep your phone nearby, stay in a safe location, and ensure location services are enabled.
                        </p>
                    </div>

                    {/* Cancel Option */}
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mt-8 text-white/70 hover:text-white underline text-sm"
                    >
                        Cancel and go back
                    </button>
                </div>
            ) : (
                /* ======== ACCEPTED/COMPLETED STATE - Map View ======== */
                <div className="h-screen flex flex-col">
                    {/* Header Bar */}
                    <div className="bg-white shadow-lg z-10 flex-shrink-0">
                        <div className="max-w-7xl mx-auto px-4 py-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="p-2 hover:bg-gray-100 rounded-full transition"
                                        aria-label="Back"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div>
                                        <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                                            {isAccepted ? '🚑 Help is on the way!' : '✅ Emergency Resolved'}
                                        </h1>
                                        <p className="text-xs sm:text-sm text-gray-600">
                                            {sos.emergencyType?.replace('_', ' ') || 'Emergency'} • {formatDistanceToNow(new Date(sos.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${isAccepted ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {isAccepted ? 'In Progress' : 'Completed'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Large Map */}
                        <div className="flex-1 h-[40vh] sm:h-[50vh] lg:h-full">
                            {mapMarkers.length > 0 ? (
                                <MapView
                                    center={mapMarkers[0].position}
                                    markers={mapMarkers}
                                    zoom={14}
                                    height="100%"
                                    showUserLocation={false}
                                />
                            ) : (
                                <div className="h-full flex items-center justify-center bg-gray-200">
                                    <p className="text-gray-500">Location not available</p>
                                </div>
                            )}
                        </div>

                        {/* Side Panel */}
                        <div className="lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto flex-shrink-0">
                            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                                {/* Volunteer Card */}
                                {sos.volunteer ? (
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border border-blue-200">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <User className="w-5 h-5 text-blue-600" />
                                            Your Volunteer
                                        </h3>
                                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-7 h-7 sm:w-8 sm:h-8 text-blue-700" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                                                    {sos.volunteer.name || 'Volunteer'}
                                                </p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                    <span className="text-sm text-gray-600">
                                                        {sos.volunteer.rating?.toFixed(1) || '5.0'} rating
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Call Button */}
                                        {sos.volunteer.phone ? (
                                            <a
                                                href={`tel:${sos.volunteer.phone}`}
                                                className="flex items-center gap-3 p-3 sm:p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition w-full justify-center"
                                            >
                                                <Phone className="w-5 h-5" />
                                                <span className="font-medium">Call {sos.volunteer.phone}</span>
                                            </a>
                                        ) : (
                                            <div className="p-3 bg-gray-100 text-gray-500 rounded-xl text-center">
                                                Phone number not available
                                            </div>
                                        )}

                                        {/* Live Location Status */}
                                        {sos.volunteer.location && (
                                            <div className="mt-4 flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                                                <Navigation className="w-4 h-4 animate-pulse" />
                                                <span>Live location tracking active</span>
                                            </div>
                                        )}
                                    </div>
                                ) : isAccepted ? (
                                    // Volunteer info loading/missing
                                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-center">
                                        <LoadingSpinner size="sm" />
                                        <p className="mt-2 text-gray-600">Loading volunteer details...</p>
                                    </div>
                                ) : null}

                                {/* Status Timeline */}
                                <Card>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-gray-600" />
                                        Status Updates
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="font-medium text-gray-900">SOS Created</p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDistanceToNow(new Date(sos.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                        {(isAccepted || isCompleted) && sos.acceptedAt && (
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Volunteer Accepted</p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDistanceToNow(new Date(sos.acceptedAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {isCompleted && sos.resolvedAt && (
                                            <div className="flex items-start gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium text-gray-900">Emergency Resolved</p>
                                                    <p className="text-sm text-gray-600">
                                                        {formatDistanceToNow(new Date(sos.resolvedAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Emergency Details */}
                                <Card>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                        Emergency Details
                                    </h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-600">Type</p>
                                            <p className="font-medium text-gray-900">
                                                {sos.emergencyType?.replace('_', ' ') || 'Not specified'}
                                            </p>
                                        </div>
                                        {sos.description && (
                                            <div>
                                                <p className="text-sm text-gray-600">Description</p>
                                                <p className="text-gray-900">{sos.description}</p>
                                            </div>
                                        )}
                                        {sos.location && (
                                            <div>
                                                <p className="text-sm text-gray-600">Location</p>
                                                <div className="flex items-center gap-1 text-gray-900">
                                                    <MapPin className="w-4 h-4 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {sos.location.latitude?.toFixed(4) || '—'}, {sos.location.longitude?.toFixed(4) || '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        {sos.imageUrl && (
                                            <div>
                                                <p className="text-sm text-gray-600">Photo Proof</p>
                                                <img
                                                    src={sos.imageUrl}
                                                    alt="Emergency Proof"
                                                    className="mt-1 rounded-lg border border-gray-200 w-full object-cover max-h-48 cursor-pointer hover:opacity-95 transition"
                                                    onClick={() => window.open(sos.imageUrl, '_blank')}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </Card>

                                {/* Emergency Call Option */}
                                <a
                                    href="tel:112"
                                    className="flex items-center justify-center gap-2 w-full p-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition border border-red-200"
                                >
                                    <PhoneCall className="w-5 h-5" />
                                    <span className="font-medium">Call Emergency Services (112)</span>
                                </a>

                                {/* Safety Tips */}
                                <Card className="bg-orange-50 border-orange-200">
                                    <h3 className="text-base font-bold text-gray-900 mb-2">⚠️ Safety Tips</h3>
                                    <ul className="text-sm text-gray-700 space-y-1">
                                        <li>• Stay in a safe location</li>
                                        <li>• Keep your phone charged</li>
                                        <li>• Follow volunteer instructions</li>
                                    </ul>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
