/**
 * Enhanced SOS Request Card for Volunteers
 * Shows detailed SOS information with accept/decline actions
 */

import { formatDistanceToNow } from 'date-fns';
import {
    AlertCircle,
    MapPin,
    Clock,
    User,
    Phone,
    Navigation,
    Flame,
    Heart,
    Car,
    Shield,
    Wind
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { SOSCountdownTimer } from './SOSCountdownTimer';
import { MapView } from '../map/MapView';

interface EnhancedSOSCardProps {
    request: {
        id: string;
        emergencyType: string;
        priority: string;
        userName: string;
        userPhone: string;
        description?: string;
        latitude: number;
        longitude: number;
        distance: number | null;
        createdAt: string;
        expiresAt: string;
    };
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    isLoading: boolean;
}

const emergencyIcons: Record<string, any> = {
    MEDICAL: Heart,
    FIRE: Flame,
    ACCIDENT: Car,
    CRIME: Shield,
    NATURAL_DISASTER: Wind,
    OTHER: AlertCircle,
};

const emergencyColors: Record<string, string> = {
    MEDICAL: 'bg-red-100 text-red-800 border-red-200',
    FIRE: 'bg-orange-100 text-orange-800 border-orange-200',
    ACCIDENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CRIME: 'bg-purple-100 text-purple-800 border-purple-200',
    NATURAL_DISASTER: 'bg-blue-100 text-blue-800 border-blue-200',
    OTHER: 'bg-gray-100 text-gray-800 border-gray-200',
};

const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white',
};

export function EnhancedSOSCard({ request, onAccept, onDecline, isLoading }: EnhancedSOSCardProps) {
    const Icon = emergencyIcons[request.emergencyType] || AlertCircle;
    const timeAgo = formatDistanceToNow(new Date(request.createdAt), { addSuffix: true });

    return (
        <Card className="hover:shadow-lg transition-shadow">
            {/* Header with Emergency Type */}
            <div className={`flex items-center gap-3 p-4 rounded-t-xl border-b-2 ${emergencyColors[request.emergencyType]}`}>
                <Icon className="w-6 h-6" />
                <div className="flex-1">
                    <h3 className="font-bold text-lg">{request.emergencyType.replace('_', ' ')}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[request.priority]}`}>
                            {request.priority}
                        </span>
                        <span className="text-xs opacity-75">
                            <Clock className="inline w-3 h-3 mr-1" />
                            {timeAgo}
                        </span>
                        <SOSCountdownTimer expiresAt={request.expiresAt} />
                    </div>
                </div>
            </div>

            {/* Body with Details */}
            <div className="p-4 space-y-3">
                {/* User Info */}
                <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-medium text-gray-900">{request.userName}</p>
                        <a
                            href={`tel:${request.userPhone}`}
                            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                        >
                            <Phone className="w-3 h-3" />
                            {request.userPhone}
                        </a>
                    </div>
                </div>

                {/* Description */}
                {request.description && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700">{request.description}</p>
                    </div>
                )}

                {/* Location & Distance */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>
                        {request.latitude.toFixed(4)}, {request.longitude.toFixed(4)}
                    </span>
                    {request.distance !== null && (
                        <span className="ml-auto flex items-center gap-1 font-medium text-primary-600">
                            <Navigation className="w-4 h-4" />
                            {(request.distance / 1000).toFixed(1)} km away
                        </span>
                    )}
                </div>

                {/* Mini Map Preview */}
                <MapView
                    center={{ latitude: request.latitude, longitude: request.longitude }}
                    markers={[
                        {
                            position: { latitude: request.latitude, longitude: request.longitude },
                            title: 'Emergency Location',
                            description: request.emergencyType.replace('_', ' '),
                            type: 'emergency'
                        }
                    ]}
                    zoom={15}
                    height="150px"
                    showUserLocation={false}
                />
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-50 rounded-b-xl flex gap-3">
                <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => onDecline(request.id)}
                    disabled={isLoading}
                >
                    Decline
                </Button>
                <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => onAccept(request.id)}
                    disabled={isLoading}
                    isLoading={isLoading}
                >
                    Accept & Respond
                </Button>
            </div>
        </Card>
    );
}
