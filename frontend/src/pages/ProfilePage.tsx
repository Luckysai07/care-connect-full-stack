/**
 * Profile Page (Professional Redesign)
 * 
 * Features:
 * - Differentiated User/Volunteer views
 * - Tabbed interface for Personal vs Professional details
 * - Skill management for volunteers
 * - Certificate upload UI (Mock)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
    ArrowLeft,
    User,
    Save,
    Shield,
    FileText,
    Award,
    Settings,
    Camera,
    CheckCircle,
    AlertCircle,
    Upload
} from 'lucide-react';
import toast from 'react-hot-toast';

// Available skills for selection
const AVAILABLE_SKILLS = [
    { id: 'first_aid', label: 'First Aid', category: 'Medical' },
    { id: 'cpr', label: 'CPR / BLS', category: 'Medical' },
    { id: 'nursing', label: 'Nursing', category: 'Medical' },
    { id: 'fire_safety', label: 'Fire Safety', category: 'Rescue' },
    { id: 'swimming', label: 'Swimming / Lifeguard', category: 'Rescue' },
    { id: 'driving', label: 'Driving (Start/Hvy)', category: 'Transport' },
    { id: 'mechanic', label: 'Mechanic', category: 'Technical' },
];

export function ProfilePage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'personal' | 'credentials' | 'settings'>('personal');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Mock volunteer data (this would come from user.volunteer in a real app)
    const [volunteerData, setVolunteerData] = useState({
        skills: ['first_aid'],
        documents: [
            { id: 1, name: 'Driving License.pdf', status: 'verified', date: '2024-01-15' },
            { id: 2, name: 'First Aid Cert.jpg', status: 'pending', date: '2025-01-10' },
        ]
    });

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    if (!user) return null;

    const isVolunteer = user.role === 'VOLUNTEER';

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Profile updated successfully');
            setIsEditing(false);
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSkill = (skillId: string) => {
        setVolunteerData(prev => {
            const hasSkill = prev.skills.includes(skillId);
            return {
                ...prev,
                skills: hasSkill
                    ? prev.skills.filter(id => id !== skillId)
                    : [...prev.skills, skillId]
            };
        });
    };

    // --- Render Helpers ---

    const renderTabs = () => (
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 mb-6">
            <button
                onClick={() => setActiveTab('personal')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'personal'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
            >
                <User className="w-4 h-4" />
                Personal Details
            </button>
            {isVolunteer && (
                <button
                    onClick={() => setActiveTab('credentials')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'credentials'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Award className="w-4 h-4" />
                    Credentials & Skills
                </button>
            )}
        </div>
    );

    const renderPersonalTab = () => (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                />
                <div>
                    <Input
                        label="Email Address"
                        value={formData.email}
                        disabled={true} // Email usually immutable
                    />
                    <p className="mt-1 text-xs text-gray-500">Contact support to change email</p>
                </div>
                <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                />
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Account Type</label>
                    <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-600 font-medium capitalize flex items-center gap-2">
                        {isVolunteer ? <Shield className="w-4 h-4 text-blue-600" /> : <User className="w-4 h-4" />}
                        {user.role} Account
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="flex justify-end pt-4">
                    <Button type="submit" isLoading={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </div>
            )}
        </form>
    );

    const renderCredentialsTab = () => (
        <div className="space-y-8">
            {/* Verification Status Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
                <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                    <h3 className="font-semibold text-blue-900">Volunteer Verification Status</h3>
                    <p className="text-sm text-blue-700 mt-1">
                        Your account is <span className="font-bold">Active & Verified</span>. You can receive SOS alerts.
                    </p>
                </div>
            </div>

            {/* Skills Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">My Skills</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {volunteerData.skills.length} Selected
                    </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {AVAILABLE_SKILLS.map(skill => (
                        <button
                            key={skill.id}
                            onClick={() => isEditing && toggleSkill(skill.id)}
                            disabled={!isEditing}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${volunteerData.skills.includes(skill.id)
                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                } ${!isEditing && 'cursor-default opacity-90'}`}
                        >
                            <span className={`text-sm font-medium ${volunteerData.skills.includes(skill.id) ? 'text-blue-700' : 'text-gray-700'}`}>
                                {skill.label}
                            </span>
                            {volunteerData.skills.includes(skill.id) && <CheckCircle className="w-4 h-4 text-blue-600" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Certificates Section */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Certificates & Documents</h3>
                    {isEditing && (
                        <Button size="sm" variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload New
                        </Button>
                    )}
                </div>
                <div className="space-y-3">
                    {volunteerData.documents.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                    <FileText className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-xs text-gray-500">Uploaded on {doc.date}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${doc.status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {doc.status === 'verified' ? 'Active' : 'Pending Review'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isEditing && (
                <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button onClick={() => setIsEditing(false)}>Save Credentials</Button>
                </div>
            )}
        </div>
    );


    return (
        <div className="min-h-screen bg-gray-50">
            {/* Professional Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(isVolunteer ? '/volunteer/dashboard' : '/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">My Profile</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isEditing && (
                                <Button size="sm" onClick={() => setIsEditing(true)}>
                                    Settings
                                </Button>
                            )}
                            {isEditing && (
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Sidebar: ID Card Style */}
                    <div className="lg:col-span-4">
                        <Card className="text-center p-6 sticky top-24">
                            <div className="relative inline-block mb-4">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto border-4 border-white shadow-lg">
                                    {user.name.charAt(0)}
                                </div>
                                {isEditing && (
                                    <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md border border-gray-200 hover:bg-gray-50">
                                        <Camera className="w-4 h-4 text-gray-600" />
                                    </button>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-gray-500 mb-4">{user.email}</p>

                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium ${isVolunteer ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                {isVolunteer ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                {user.role}
                            </div>

                            {isVolunteer && (
                                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">4.9</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Rating</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-900">12</p>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Helped</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Content */}
                    <div className="lg:col-span-8">
                        <Card className="min-h-[500px]">
                            {renderTabs()}

                            <div className="mt-6">
                                {activeTab === 'personal' && renderPersonalTab()}
                                {activeTab === 'credentials' && renderCredentialsTab()}
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
