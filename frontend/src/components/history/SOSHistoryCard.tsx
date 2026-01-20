/**
 * SOS History Card Component
 * Displays a single SOS request in history view
 */

import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import {
    AlertCircle,
    Clock,
    User,
    CheckCircle,
    XCircle,
    Timer,
    Flame,
    Heart,
    Car,
    Shield,
    Wind
} from 'lucide-react';
import { Card } from '../ui/Card';

interface SOSHistoryCardProps {
    request: {
        id: string;
        emergencyType: string;
        priority: string;
        status: string;
        createdAt: string;
        resolvedAt?: string | null;
        volunteerName?: string | null;
        user?: {
            name: string;
            phone: string;
        };
    };
    isVolunteerView?: boolean;
}

const emergencyIcons: Record<string, any> = {
    MEDICAL: Heart,
    FIRE: Flame,
    ACCIDENT: Car,
    CRIME: Shield,
    NATURAL_DISASTER: Wind,
    OTHER: AlertCircle,
};

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Timer, label: 'Pending' },
    ACCEPTED: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' },
    IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'In Progress' },
    RESOLVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resolved' },
    EXPIRED: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Expired' },
    CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
};

const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-600 text-white',
    HIGH: 'bg-orange-500 text-white',
    MEDIUM: 'bg-yellow-500 text-white',
    LOW: 'bg-green-500 text-white',
};

export function SOSHistoryCard({ request, isVolunteerView = false }: SOSHistoryCardProps) {
    const Icon = emergencyIcons[request.emergencyType] || AlertCircle;
    const status = statusConfig[request.status] || statusConfig.PENDING;
    const StatusIcon = status.icon;
    const timeAgo = formatDistanceToNow(new Date(request.createdAt), { addSuffix: true });
    const formattedDate = format(new Date(request.createdAt), 'MMM d, yyyy h:mm a');

    const navigate = useNavigate();

    return (
        <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
                {/* Emergency Icon */}
                <div className="p-3 bg-gray-100 rounded-lg flex-shrink-0">
                    <Icon className="w-6 h-6 text-gray-700" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">
                            {request.emergencyType.replace('_', ' ')}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[request.priority]}`}>
                            {request.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                        </span>
                    </div>

                    {/* Person Info */}
                    {isVolunteerView && request.user ? (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                            <User className="w-4 h-4" />
                            <span>Helped: {request.user.name}</span>
                        </div>
                    ) : request.volunteerName && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                            <User className="w-4 h-4" />
                            <span>Volunteer: {request.volunteerName}</span>
                        </div>
                    )}

                    {/* Time Info */}
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{formattedDate}</span>
                        <span className="text-gray-400">•</span>
                        <span>{timeAgo}</span>
                    </div>

                    {/* Resolved Time */}
                    {request.resolvedAt && (
                        <p className="text-xs text-green-600 mt-1">
                            Resolved: {format(new Date(request.resolvedAt), 'MMM d, yyyy h:mm a')}
                        </p>
                    )}
                </div>
            </div>

            {/* Action Button for Active Requests */}
            {isVolunteerView && (request.status === 'ACCEPTED' || request.status === 'IN_PROGRESS') && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={() => navigate('/volunteer/active-sos')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Clock className="w-4 h-4" />
                        Continue Request
                    </button>
                </div>
            )}
        </Card>
    );
}
