/**
 * Emergency Button Component
 * 
 * Large button for creating SOS requests with location.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';
import { useGeolocation } from '../../hooks/useGeolocation';
import sosService from '../../services/sos.service';
import { EmergencyReportModal } from './EmergencyReportModal';
import toast from 'react-hot-toast';

type EmergencyType = 'MEDICAL' | 'FIRE' | 'ACCIDENT' | 'CRIME' | 'NATURAL_DISASTER' | 'OTHER';

export function EmergencyButton() {
    const navigate = useNavigate();
    const { location, error: locationError, isLoading: locationLoading } = useGeolocation();
    const [isCreating, setIsCreating] = useState(false);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);

    const emergencyTypes: { type: EmergencyType; label: string; icon: string }[] = [
        { type: 'MEDICAL', label: 'Medical Emergency', icon: '🏥' },
        { type: 'FIRE', label: 'Fire', icon: '🔥' },
        { type: 'ACCIDENT', label: 'Accident', icon: '🚗' },
        { type: 'CRIME', label: 'Crime', icon: '🚨' },
        { type: 'NATURAL_DISASTER', label: 'Natural Disaster', icon: '🌪️' },
        { type: 'OTHER', label: 'Other', icon: '⚠️' },
    ];

    const handleTypeSelect = (type: EmergencyType) => {
        setSelectedType(type);
        setShowReportModal(true);
    };

    const handleCreateSOS = async (data: { description: string; file: File | null }) => {
        if (!location || !selectedType) {
            toast.error('Location or emergency type missing.');
            return;
        }

        setIsCreating(true);

        try {
            const formData = new FormData();
            formData.append('emergencyType', selectedType);
            formData.append('latitude', location.latitude.toString());
            formData.append('longitude', location.longitude.toString());
            formData.append('description', data.description);

            if (data.file) {
                formData.append('image', data.file);
            }

            const response = await sosService.createSOS(formData);

            toast.success('SOS created! Notifying nearby volunteers...');
            navigate(`/sos-status/${response.id}`);
            setShowReportModal(false);
            setShowTypeSelector(false);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to create SOS';
            toast.error(errorMessage);
        } finally {
            setIsCreating(false);
        }
    };

    if (locationLoading) {
        return (
            <div className="text-center">
                <div className="inline-flex items-center gap-2 text-gray-600">
                    <MapPin className="h-5 w-5 animate-pulse" />
                    <span>Getting your location...</span>
                </div>
            </div>
        );
    }

    if (locationError) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-red-800">Location Error</p>
                        <p className="text-sm text-red-700 mt-1">{locationError}</p>
                    </div>
                </div>
            </div>
        );
    }

    if (showTypeSelector && !showReportModal) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                    Select Emergency Type
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    {emergencyTypes.map(({ type, label, icon }) => (
                        <button
                            key={type}
                            onClick={() => handleTypeSelect(type)}
                            className="p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center"
                        >
                            <div className="text-3xl mb-2">{icon}</div>
                            <div className="text-sm font-medium text-gray-900">{label}</div>
                        </button>
                    ))}
                </div>

                <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowTypeSelector(false)}
                >
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <button
                    onClick={() => setShowTypeSelector(true)}
                    className="w-full h-48 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                >
                    <div className="flex flex-col items-center justify-center h-full">
                        <AlertCircle className="h-16 w-16 mb-4 animate-pulse" />
                        <h2 className="text-3xl font-bold">EMERGENCY</h2>
                        <p className="text-red-100 mt-2">Tap to request help</p>
                    </div>
                </button>

                {location && (
                    <div className="text-center text-sm text-gray-600">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        Location detected
                    </div>
                )}
            </div>

            {selectedType && (
                <EmergencyReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    onSubmit={handleCreateSOS}
                    emergencyType={selectedType}
                    isLoading={isCreating}
                />
            )}
        </>
    );
}
