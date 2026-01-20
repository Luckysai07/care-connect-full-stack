/**
 * Dashboard Page
 * 
 * Main dashboard for users after login.
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { EmergencyButton } from '../components/emergency/EmergencyButton';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LogOut, User, History, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export function DashboardPage() {
    const navigate = useNavigate();
    const { user, logout, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">CareConnect</h1>
                            <p className="text-sm text-gray-600">Welcome, {user.name}</p>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Emergency Section */}
                    <div className="lg:col-span-2">
                        <Card>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Need Help?
                            </h2>
                            <EmergencyButton />
                        </Card>

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                            <Card hover className="cursor-pointer" onClick={() => navigate('/history')}>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <History className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">SOS History</h3>
                                        <p className="text-sm text-gray-600">View past requests</p>
                                    </div>
                                </div>
                            </Card>

                            <Card hover className="cursor-pointer" onClick={() => navigate('/profile')}>
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <User className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Profile</h3>
                                        <p className="text-sm text-gray-600">Manage your info</p>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* User Info Card */}
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-4">Your Profile</h3>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-medium text-gray-900">{user.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-medium text-gray-900">{user.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Role</p>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {user.role}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {/* Volunteer Card */}
                        {user.role === 'USER' && (
                            <Card>
                                <div className="text-center">
                                    <Bell className="h-12 w-12 text-primary-600 mx-auto mb-3" />
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        Become a Volunteer
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Help others in your community during emergencies
                                    </p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => navigate('/volunteer/register')}
                                    >
                                        Register as Volunteer
                                    </Button>
                                </div>
                            </Card>
                        )}

                        {/* Safety Tips */}
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-3">Safety Tips</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li>• Keep your location services enabled</li>
                                <li>• Provide accurate emergency information</li>
                                <li>• Stay calm and wait for help</li>
                                <li>• Follow volunteer instructions</li>
                            </ul>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
