/**
 * Enhanced Active SOS Page - Rapido Captain Style
 * Features: Navigation to user, Chat, Call, Live tracking with premium UI
 */

import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MapPin,
    Phone,
    Navigation,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    MessageCircle,
    Send,
    ArrowLeft,
    ExternalLink,
    X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import volunteerService from '../services/volunteer.service';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MapView } from '../components/map/MapView';
import { useVolunteerLocationTracking } from '../hooks/useVolunteerLocationTracking';
import toast from 'react-hot-toast';

// Quick Chat Messages
const QUICK_MESSAGES = [
    "I'm on my way!",
    "Arriving in 5 minutes",
    "Stay calm, help is coming",
    "Can you call me?",
];

export function ActiveSOSPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const chatInputRef = useRef<HTMLInputElement>(null);

    // State
    const [eta, setEta] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [chatMessage, setChatMessage] = useState('');
    const [chatMessages, setChatMessages] = useState<Array<{ id: string; text: string; isMe: boolean; time: Date }>>([]);

    // Track volunteer location
    const { latitude, longitude, isTracking } = useVolunteerLocationTracking(true);
    // const latitude = null;
    // const longitude = null;
    // const isTracking = false;

    // Fetch active SOS
    const { data: activeSOS, isLoading } = useQuery({
        queryKey: ['active-sos'],
        queryFn: volunteerService.getActiveSOS,
        refetchInterval: 3000,
        retry: 3,
    });

    // Complete SOS mutation
    const completeMutation = useMutation({
        mutationFn: volunteerService.completeSOS,
        onSuccess: () => {
            toast.success('Emergency resolved! Great job! 🎉');
            queryClient.invalidateQueries({ queryKey: ['active-sos'] });
            queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
            navigate('/volunteer/dashboard');
        },
        onError: () => {
            toast.error('Failed to complete SOS');
        },
    });

    // Calculate ETA and distance when locations change
    useEffect(() => {
        if (latitude && longitude && activeSOS) {
            const { dist, time } = calculateDistanceAndETA(
                latitude, longitude,
                activeSOS.latitude, activeSOS.longitude
            );
            setDistance(dist);
            setEta(time);
        }
    }, [latitude, longitude, activeSOS]);

    const calculateDistanceAndETA = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * c;
        const timeInMinutes = Math.round((dist / 40) * 60);
        return { dist: Math.round(dist * 10) / 10, time: Math.max(1, timeInMinutes) };
    };

    // Open Google Maps navigation
    const openNavigation = () => {
        if (activeSOS) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${activeSOS.latitude},${activeSOS.longitude}&travelmode=driving`;
            window.open(url, '_blank');
        }
    };

    // Send chat message
    const sendMessage = (text: string) => {
        if (!text.trim()) return;
        const newMessage = {
            id: Date.now().toString(),
            text: text.trim(),
            isMe: true,
            time: new Date()
        };
        setChatMessages(prev => [...prev, newMessage]);
        setChatMessage('');
        toast.success('Message sent!');
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
                <LoadingSpinner size="lg" />
                <p className="mt-4">Loading active emergency...</p>
            </div>
        );
    }

    // No active SOS
    if (!activeSOS) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Emergency</h2>
                    <p className="text-gray-600 mb-6">
                        You don't have any active SOS requests. Check the dashboard for new requests.
                    </p>
                    <Button onClick={() => navigate('/volunteer/dashboard')} className="w-full">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    // Get emergency type icon
    const getEmergencyIcon = (type: string) => {
        const icons: Record<string, string> = {
            MEDICAL: '🏥', FIRE: '🔥', ACCIDENT: '🚗', CRIME: '🚨', NATURAL_DISASTER: '🌪️', OTHER: '⚠️'
        };
        return icons[type] || icons.OTHER;
    };

    // Build map markers
    const mapMarkers: Array<{
        position: { latitude: number; longitude: number };
        title: string;
        description?: string;
        type?: 'default' | 'emergency';
    }> = [
            {
                position: { latitude: activeSOS.latitude, longitude: activeSOS.longitude },
                title: activeSOS.userName || 'User',
                description: 'Emergency Location',
                type: 'emergency',
            },
        ];

    if (latitude && longitude) {
        mapMarkers.push({
            position: { latitude, longitude },
            title: 'You',
            description: 'Your Location',
            type: 'default',
        });
    }

    // Chat Modal
    if (showChat) {
        return (
            <div className="h-screen flex flex-col bg-white">
                {/* Chat Header */}
                <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-200 bg-white">
                    <button onClick={() => setShowChat(false)} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">{activeSOS.userName || 'User'}</p>
                        <p className="text-xs text-green-600">● Online</p>
                    </div>
                    <a href={`tel:${activeSOS.userPhone}`} className="p-2 hover:bg-gray-100 rounded-full">
                        <Phone className="w-5 h-5 text-green-600" />
                    </a>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                    {chatMessages.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Start a conversation with the user</p>
                        </div>
                    ) : (
                        chatMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.isMe
                                    ? 'bg-blue-500 text-white rounded-br-sm'
                                    : 'bg-white text-gray-900 rounded-bl-sm shadow'
                                    }`}>
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Quick Messages */}
                <div className="px-4 py-2 border-t border-gray-200 bg-white overflow-x-auto">
                    <div className="flex gap-2">
                        {QUICK_MESSAGES.map((msg, i) => (
                            <button
                                key={i}
                                onClick={() => sendMessage(msg)}
                                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm whitespace-nowrap"
                            >
                                {msg}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chat Input */}
                <div className="px-4 py-3 border-t border-gray-200 bg-white flex gap-2">
                    <input
                        ref={chatInputRef}
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage(chatMessage)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={() => sendMessage(chatMessage)}
                        disabled={!chatMessage.trim()}
                        className="w-12 h-12 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 rounded-full flex items-center justify-center text-white"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    }

    // Main Page Layout
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white shadow-md">
                <div className="px-4 py-3 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/volunteer/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 text-red-800">
                        <span className="text-xl">{getEmergencyIcon(activeSOS.emergencyType)}</span>
                        <span className="font-bold">{activeSOS.emergencyType?.replace('_', ' ')}</span>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${isTracking ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {isTracking ? '● LIVE' : '...'}
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center justify-around">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{eta || '—'}</p>
                        <p className="text-xs text-gray-500">MIN ETA</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200" />
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{distance || '—'}</p>
                        <p className="text-xs text-gray-500">KM AWAY</p>
                    </div>
                    <div className="w-px h-10 bg-gray-200" />
                    <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{activeSOS.priority || 'HIGH'}</p>
                        <p className="text-xs text-gray-500">PRIORITY</p>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 min-h-[250px]">
                <MapView
                    center={{ latitude: activeSOS.latitude, longitude: activeSOS.longitude }}
                    markers={mapMarkers}
                    zoom={14}
                    height="100%"
                    showUserLocation={false}
                />
            </div>

            {/* Bottom Panel */}
            <div className="bg-white border-t border-gray-200">
                {/* User Info */}
                <div className="px-4 py-3 flex items-center gap-4 border-b border-gray-100">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white">
                        <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{activeSOS.userName || 'User'}</h3>
                        <p className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(activeSOS.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <a
                        href={`tel:${activeSOS.userPhone}`}
                        className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white"
                    >
                        <Phone className="w-5 h-5" />
                    </a>
                    <button
                        onClick={() => setShowChat(true)}
                        className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white"
                    >
                        <MessageCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Description */}
                {activeSOS.description && (
                    <div className="px-4 py-2 bg-yellow-50 text-yellow-800 text-sm">
                        <strong>Note:</strong> {activeSOS.description}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="p-4 grid grid-cols-2 gap-3">
                    <button
                        onClick={openNavigation}
                        className="flex items-center justify-center gap-2 p-4 bg-blue-600 text-white rounded-xl font-medium"
                    >
                        <Navigation className="w-5 h-5" />
                        Navigate
                    </button>
                    <a
                        href={`tel:${activeSOS.userPhone}`}
                        className="flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-xl font-medium"
                    >
                        <Phone className="w-5 h-5" />
                        Call User
                    </a>
                </div>

                {/* Complete Button */}
                <div className="px-4 pb-4">
                    <button
                        onClick={() => completeMutation.mutate(activeSOS.id)}
                        disabled={completeMutation.isPending}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {completeMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <>
                                <CheckCircle className="w-6 h-6" />
                                Mark Emergency Resolved
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
