import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/admin.service';
import { Layout } from '../../components/layout/Layout';
import { Users, AlertTriangle, UserCheck, Shield, ChevronRight, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface Stats {
    activeVolunteers: number;
    users: { role: string; count: string }[];
    sos: { status: string; count: string }[];
    timestamp: string;
}

interface User {
    id: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

export function AdminDashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, usersData] = await Promise.all([
                    adminService.getStats(),
                    adminService.getUsers()
                ]);
                setStats(statsData);
                setUsers(usersData.users);
            } catch (error) {
                console.error('Failed to fetch admin data', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getTotalUsers = () => {
        return stats?.users.reduce((acc, curr) => acc + parseInt(curr.count), 0) || 0;
    };

    const getActiveSOS = () => {
        return stats?.sos.find(s => s.status === 'PENDING' || s.status === 'IN_PROGRESS')?.count || '0';
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-screen bg-gray-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                                <p className="text-sm text-gray-500">Overview of system analytics and user management</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => navigate('/admin/verify-volunteers')}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Verify Volunteers
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Total Users */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-blue-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between mb-4 relative">
                                <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 relative">{getTotalUsers()}</p>
                            <p className="text-sm text-blue-600 mt-2 flex items-center gap-1 relative">
                                <span className="font-medium">+12%</span>
                                <span className="text-gray-400">vs last month</span>
                            </p>
                        </div>

                        {/* Active SOS */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-red-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between mb-4 relative">
                                <h3 className="text-gray-500 text-sm font-medium">Active SOS</h3>
                                <div className="p-2 bg-red-50 rounded-lg text-red-600">
                                    <AlertTriangle className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 relative">{getActiveSOS()}</p>
                            <p className="text-sm text-red-600 mt-2 font-medium relative">
                                Review immediately
                            </p>
                        </div>

                        {/* Active Volunteers */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-24 bg-gradient-to-l from-green-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center justify-between mb-4 relative">
                                <h3 className="text-gray-500 text-sm font-medium">Active Volunteers</h3>
                                <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                    <UserCheck className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 relative">{stats?.activeVolunteers || 0}</p>
                            <p className="text-sm text-green-600 mt-2 flex items-center gap-1 relative">
                                <span className="font-medium">Online now</span>
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions & Recent Users */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Recent Users Table */}
                        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-gray-900">Recent Registrations</h2>
                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                                    View All
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {users.slice(0, 5).map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 uppercase">
                                                            {user.email.substring(0, 2)}
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900">{user.email.split('@')[0]}</div>
                                                            <div className="text-xs text-gray-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full 
                                                        ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                                            user.role === 'VOLUNTEER' ? 'bg-green-100 text-green-800' :
                                                                'bg-blue-100 text-blue-800'}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full 
                                                        ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {user.is_active ? 'Active' : 'Banned'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Quick Actions / System Status */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
                                <div className="space-y-3">
                                    <Button className="w-full justify-start" variant="outline" onClick={() => navigate('/admin/verify-volunteers')}>
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Pending Approvals
                                        <span className="ml-auto bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-medium">3</span>
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline">
                                        <Users className="w-4 h-4 mr-2" />
                                        Manage Users
                                    </Button>
                                    <Button className="w-full justify-start" variant="outline">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        SOS History
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl shadow-lg p-6 text-white">
                                <h3 className="font-bold text-lg mb-2">System Status</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm opacity-90">
                                        <span>Server Status</span>
                                        <span className="flex items-center text-green-400 font-medium">
                                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                                            Operational
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm opacity-90">
                                        <span>Database</span>
                                        <span className="text-green-400 font-medium">Connected</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm opacity-90">
                                        <span>Version</span>
                                        <span className="font-mono opacity-70">v1.2.0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
