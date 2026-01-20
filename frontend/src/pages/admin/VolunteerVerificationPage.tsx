/**
 * Volunteer Verification Page
 * Admin interface to approve or reject volunteer applications
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Check, X, Shield, User, Phone, Mail, Award, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/admin.service';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';

export function VolunteerVerificationPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: volunteers, isLoading } = useQuery({
        queryKey: ['pending-volunteers'],
        queryFn: adminService.getPendingVolunteers,
    });

    const verifyMutation = useMutation({
        mutationFn: adminService.verifyVolunteer,
        onSuccess: () => {
            toast.success('Volunteer verified successfully');
            queryClient.invalidateQueries({ queryKey: ['pending-volunteers'] });
        },
        onError: () => toast.error('Failed to verify volunteer'),
    });

    const rejectMutation = useMutation({
        mutationFn: adminService.rejectVolunteer,
        onSuccess: () => {
            toast.success('Volunteer rejected');
            queryClient.invalidateQueries({ queryKey: ['pending-volunteers'] });
        },
        onError: () => toast.error('Failed to reject volunteer'),
    });

    if (isLoading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/dashboard')}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <ArrowLeft className="w-6 h-6 text-gray-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Volunteer Verification</h1>
                            <p className="text-gray-600">Review pending volunteer applications</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {volunteers && volunteers.length > 0 ? (
                    <div className="grid gap-6">
                        {volunteers.map((volunteer) => (
                            <div
                                key={volunteer.userId}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">{volunteer.name}</h3>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="w-4 h-4" />
                                                        {volunteer.phone}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-4 h-4" />
                                                        {volunteer.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            Applied {formatDistanceToNow(new Date(volunteer.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>

                                    <div className="mt-6 grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                <Award className="w-4 h-4" />
                                                Skills
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {volunteer.skills.map((skill, i) => (
                                                    <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-100">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {volunteer.certifications && volunteer.certifications.length > 0 && (
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                                    <Shield className="w-4 h-4" />
                                                    Certifications
                                                </h4>
                                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                                    {volunteer.certifications.filter(c => c).map((cert, i) => (
                                                        <li key={i}>{cert}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
                                        <button
                                            onClick={() => rejectMutation.mutate(volunteer.userId)}
                                            disabled={rejectMutation.isPending || verifyMutation.isPending}
                                            className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => verifyMutation.mutate(volunteer.userId)}
                                            disabled={rejectMutation.isPending || verifyMutation.isPending}
                                            className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                                        >
                                            <Check className="w-4 h-4" />
                                            {verifyMutation.isPending ? 'Verifying...' : 'Approve & Verify'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No Pending Applications</h3>
                        <p className="text-gray-500 mt-2">All volunteer applications have been reviewed.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
