/**
 * Volunteer Stats Component
 * Displays volunteer statistics
 */

import { Activity, CheckCircle, Clock } from 'lucide-react';
import { VolunteerStats } from '../../services/volunteer.service';

interface VolunteerStatsProps {
    stats: VolunteerStats;
}

export function VolunteerStatsCards({ stats }: VolunteerStatsProps) {
    const statItems = [
        {
            label: 'Completed SOS',
            value: stats?.completedSOS || stats?.completedResponses || 0,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Active SOS',
            value: stats?.activeSOS || stats?.activeSOSCount || 0,
            icon: Activity,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            label: 'Average Rating',
            value: (stats?.averageRating || 0).toFixed(1),
            icon: Clock,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statItems.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                            </div>
                            <div className={`${stat.bgColor} p-3 rounded-lg`}>
                                <Icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
