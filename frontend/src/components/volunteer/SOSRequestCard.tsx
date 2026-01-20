/**
 * SOS Request Card Component
 * Displays an incoming SOS request for volunteers
 */

import { Clock, MapPin, AlertCircle } from 'lucide-react';
import { IncomingSOSRequest } from '../../services/volunteer.service';
import { Button } from '../ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface SOSRequestCardProps {
    request: IncomingSOSRequest;
    onAccept: (id: string) => void;
    onDecline: (id: string) => void;
    isLoading?: boolean;
}

const emergencyTypeColors: Record<string, string> = {
    MEDICAL: 'bg-red-100 text-red-800',
    FIRE: 'bg-orange-100 text-orange-800',
    ACCIDENT: 'bg-yellow-100 text-yellow-800',
    CRIME: 'bg-purple-100 text-purple-800',
    OTHER: 'bg-gray-100 text-gray-800',
};

export function SOSRequestCard({ request, onAccept, onDecline, isLoading }: SOSRequestCardProps) {
    const typeColor = emergencyTypeColors[request.emergencyType] || emergencyTypeColors.OTHER;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{request.userName}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${typeColor}`}>
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {request.emergencyType}
                    </span>
                </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="text-sm">{request.distance.toFixed(1)} km away</span>
                </div>
                <div className="flex items-center text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span className="text-sm">{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}</span>
                </div>
            </div>

            {/* Description */}
            {request.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{request.description}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <Button
                    variant="primary"
                    size="md"
                    onClick={() => onAccept(request.id)}
                    disabled={isLoading}
                    className="flex-1"
                >
                    Accept
                </Button>
                <Button
                    variant="outline"
                    size="md"
                    onClick={() => onDecline(request.id)}
                    disabled={isLoading}
                    className="flex-1"
                >
                    Decline
                </Button>
            </div>
        </div>
    );
}
