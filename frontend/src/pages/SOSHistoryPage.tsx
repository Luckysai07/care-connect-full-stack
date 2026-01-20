/**
 * SOS History Page
 * Shows user's past SOS requests
 */

import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, History, AlertCircle } from 'lucide-react';
import sosService from '../services/sos.service';
import { SOSHistoryCard } from '../components/history/SOSHistoryCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../store/auth.store';

export function SOSHistoryPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    // Fetch user's SOS history
    const { data: history, isLoading, error } = useQuery({
        queryKey: ['sosHistory'],
        queryFn: () => sosService.getMyHistory(),
        enabled: isAuthenticated,
    });

    if (!isAuthenticated) {
        navigate('/login');
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">SOS History</h1>
                            <p className="text-sm text-gray-600">Your past emergency requests</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : error ? (
                    <Card className="text-center py-12">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load history</h3>
                        <p className="text-gray-600">Please try again later</p>
                    </Card>
                ) : !history || history.length === 0 ? (
                    <Card className="text-center py-12">
                        <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No SOS requests yet</h3>
                        <p className="text-gray-600 mb-4">
                            Your emergency request history will appear here
                        </p>
                        <Button onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <p className="text-gray-600">
                                {history.length} request{history.length !== 1 ? 's' : ''} found
                            </p>
                        </div>

                        {history.map((request) => (
                            <SOSHistoryCard
                                key={request.id}
                                request={request}
                                isVolunteerView={false}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
