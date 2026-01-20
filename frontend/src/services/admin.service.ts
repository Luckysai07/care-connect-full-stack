/**
 * Admin Service
 * Handles admin-specific API calls
 */

import api from './api';
import { API_CONFIG } from '../config/api.config';

export interface PendingVolunteer {
    userId: string;
    name: string;
    phone: string;
    email: string;
    skills: string[];
    certifications: string[];
    createdAt: string;
}

const adminService = {
    /**
     * Get pending volunteer applications
     */
    async getPendingVolunteers(): Promise<PendingVolunteer[]> {
        const response = await api.get('/admin/volunteers/pending');
        return response.data;
    },

    /**
     * Verify a volunteer
     */
    async verifyVolunteer(userId: string): Promise<void> {
        await api.post(`/admin/volunteers/${userId}/verify`);
    },

    /**
     * Reject a volunteer
     */
    async rejectVolunteer(userId: string): Promise<void> {
        await api.post(`/admin/volunteers/${userId}/reject`);
    },

    /**
     * Get system stats
     */
    async getStats(): Promise<any> {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    /**
     * Get users list
     */
    async getUsers(): Promise<any> {
        const response = await api.get('/admin/users');
        return response.data;
    }
};

export default adminService;
