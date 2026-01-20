/**
 * SOS Details Page
 * 
 * Shows detailed information about an SOS request with map.
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { MapView } from '../components/map/MapView';
import sosService from '../services/sos.service';
import { ArrowLeft, MapPin, Clock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface SOSData {
    id: string;
    emergencyType: string;
    latitude: number;
    longitude: number;
    description?: string;
    imageUrl?: string;
    status: string;
    createdAt: string;
    priority: string; // Added based on usage in JSX
    user?: { // Added based on usage in JSX
        name: string;
        phone: string;
    };
    volunteer?: { // Added based on usage in JSX
        name: string;
        phone: string;
    };
    location: { // Added based on usage in JSX
        latitude: number;
        longitude: number;
    };
}

export function SOSDetailsPage() {
    const { sosId } = useParams<{ sosId: string }>();
    const navigate = useNavigate();
    const [sos, setSos] = useState<SOSData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (sosId) {
            fetchSOSDetails();
        }
    }, [sosId]);

    const fetchSOSDetails = async () => {
        try {
            setIsLoading(true);
            const data = await sosService.getSOSDetails(sosId!);
            setSos(data as any);
        } catch (error: any) {
            toast.error('Failed to load SOS details');
            navigate('/dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!sos) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/dashboard')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">SOS Details</h1>
                            <p className="text-sm text-gray-600">Request ID: {sos.id.slice(0, 8)}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* SOS Information */}
                    <div className="space-y-6">
                        <Card>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Emergency Information</h2>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Emergency Type</p>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                        {sos.emergencyType}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Status</p>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                                        {sos.status}
                                    </span>
                                </div>

                                {sos.description && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Description</p>
                                        <p className="text-gray-900">{sos.description}</p>
                                    </div>
                                )}

                                {sos.imageUrl && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Photo Proof</p>
                                        <img
                                            src={sos.imageUrl}
                                            alt="Emergency Proof"
                                            className="rounded-lg border border-gray-200 w-full object-cover max-h-64 cursor-pointer hover:opacity-95 transition"
                                            onClick={() => window.open(sos.imageUrl, '_blank')}
                                        />
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Created</p>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <Clock className="h-4 w-4" />
                                        {formatDistanceToNow(new Date(sos.createdAt), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* User Information */}
                        {sos.user && (
                            <Card>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">User Information</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-600" />
                                        <span className="text-gray-900">{sos.user.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-600" />
                                        <a href={`tel:${sos.user.phone}`} className="text-primary-600 hover:underline">
                                            {sos.user.phone}
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Volunteer Information */}
                        {sos.volunteer && (
                            <Card>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Volunteer Information</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-gray-600" />
                                        <span className="text-gray-900">{sos.volunteer.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-600" />
                                        <a href={`tel:${sos.volunteer.phone}`} className="text-primary-600 hover:underline">
                                            {sos.volunteer.phone}
                                        </a>
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>

                    {/* Map */}
                    <div>
                        <Card>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Location</h2>

                            <div className="mb-4">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-sm">
                                        {sos.latitude.toFixed(6)}, {sos.longitude.toFixed(6)}
                                    </span>
                                </div>
                            </div>

                            <MapView
                                center={{ latitude: sos.latitude, longitude: sos.longitude }}
                                markers={[
                                    {
                                        position: { latitude: sos.latitude, longitude: sos.longitude },
                                        title: `${sos.emergencyType} Emergency`,
                                        description: sos.description,
                                        type: 'emergency',
                                    },
                                ]}
                                zoom={15}
                            />
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
