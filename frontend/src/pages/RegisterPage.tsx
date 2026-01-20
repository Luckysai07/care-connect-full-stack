/**
 * Register Page
 * 
 * User registration form.
 */

import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function RegisterPage() {
    const navigate = useNavigate();
    const { register, isLoading, error, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'USER' as 'USER' | 'VOLUNTEER',
    });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const validate = () => {
        const errors: Record<string, string> = {};

        if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.phone.match(/^\+?[1-9]\d{9,14}$/)) {
            errors.phone = 'Invalid phone number format (e.g., +1234567890)';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();

        if (!validate()) {
            return;
        }

        try {
            const { confirmPassword, ...registerData } = formData;
            await register(registerData);
            toast.success('Registration successful!');

            // Redirect based on role
            if (formData.role === 'VOLUNTEER') {
                navigate('/volunteer/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error: any) {
            // Handle validation errors from backend
            if (error.response?.data?.error?.details) {
                const details = error.response.data.error.details;
                const newErrors: Record<string, string> = {};

                // Parse details to find specific field errors
                details.forEach((detail: any) => {
                    if (detail.errors) {
                        detail.errors.forEach((err: any) => {
                            // err.path is dot notation, usually just the field name for body
                            const field = err.path;
                            newErrors[field] = err.message;
                        });
                    }
                });

                if (Object.keys(newErrors).length > 0) {
                    setFormErrors(newErrors);
                    toast.error('Please fix the errors in the form.');
                    return;
                }
            }

            toast.error('Registration failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">CareConnect</h1>
                    <p className="text-gray-600">Join Our Community</p>
                </div>

                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Account</h2>

                    {/* Role Selection */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-2">I want to:</p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'USER' })}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${formData.role === 'USER'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                👤 Get Help
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

                    {/* Register Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            error={formErrors.name}
                            required
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="your.email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            error={formErrors.email}
                            required
                        />

                        <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="+1234567890"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            error={formErrors.phone}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            error={formErrors.password}
                            required
                        />

                        <Input
                            label="Confirm Password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            error={formErrors.confirmPassword}
                            required
                        />

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isLoading}
                        >
                            Create Account
                        </Button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
