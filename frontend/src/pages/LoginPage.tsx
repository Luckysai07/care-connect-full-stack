/**
 * Login Page
 * 
 * User login with email and password.
 */

import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { requestLocationAndUpdate } from '../utils/location.utils';

export function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, isAuthenticated, user, error, clearError } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && user) {
            if (user.role === 'VOLUNTEER') {
                navigate('/volunteer/dashboard', { replace: true });
            } else if (user.role === 'ADMIN') {
                navigate('/admin/dashboard', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate]);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'USER' as 'USER' | 'VOLUNTEER',
    });



    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();

        try {
            await login(formData);
            toast.success('Login successful!');

            // Request location permission and update backend
            // This runs asynchronously and doesn't block navigation
            requestLocationAndUpdate().catch(err => {
                console.error('Location update failed:', err);
            });

            // Redirect based on user role
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user.role === 'VOLUNTEER') {
                    navigate('/volunteer/dashboard');
                } else if (user.role === 'ADMIN') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            // Error is handled by store
            toast.error('Login failed. Please check your credentials.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">CareConnect</h1>
                    <p className="text-gray-600">Emergency Help Platform</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>

                    {/* Role Toggle Buttons */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-3">Login as:</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'USER' })}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${formData.role === 'USER'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                👤 User
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'VOLUNTEER' })}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${formData.role === 'VOLUNTEER'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                🚑 Volunteer
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
