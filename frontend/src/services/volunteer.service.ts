/**
 * Volunteer Service
 * API calls for volunteer-specific operations
 */

import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface VolunteerStats {
    verified: boolean;
    available: boolean;
    averageRating: number;
    cancellationCount: number;
    completedSOS: number;
    activeSOS: number;
    totalRatings: number;
    // Legacy fields for backwards compatibility
    totalResponses?: number;
    completedResponses?: number;
    averageResponseTime?: number;
    activeSOSCount?: number;
}

export interface IncomingSOSRequest {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    emergencyType: string;
    priority: string;
    latitude: number;
    longitude: number;
    distance: number | null;
    createdAt: string;
    expiresAt: string;
    description?: string;
}

export interface ActiveSOS {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    emergencyType: string;
    latitude: number;
    longitude: number;
    description?: string;
    status: string;
    createdAt: string;
}

const volunteerService = {
    /**
     * Get volunteer statistics
     */
    async getStats(): Promise<VolunteerStats> {
        const response = await api.get(API_ENDPOINTS.volunteers.stats);
        return response.data;
    },

    /**
     * Get incoming SOS requests (nearby, pending)
     */
    async getIncomingRequests(): Promise<IncomingSOSRequest[]> {
        const response = await api.get(API_ENDPOINTS.volunteers.incomingSOS);
        return response.data;
    },

    /**
     * Accept an SOS request
     */
    async acceptSOS(sosId: string): Promise<void> {
        await api.post(API_ENDPOINTS.volunteers.acceptSOS(sosId));
    },

    /**
     * Decline an SOS request
     */
    async declineSOS(sosId: string): Promise<void> {
        await api.post(API_ENDPOINTS.volunteers.declineSOS(sosId));
    },

    /**
     * Get active SOS (accepted by this volunteer)
     */
    async getActiveSOS(): Promise<ActiveSOS | null> {
        const response = await api.get(API_ENDPOINTS.volunteers.activeSOS);
        return response.data;
    },

    /**
     * Mark SOS as completed
     */
    async completeSOS(sosId: string): Promise<void> {
        await api.post(API_ENDPOINTS.volunteers.completeSOS(sosId));
    },

    /**
     * Update volunteer availability
     */
    async updateAvailability(available: boolean): Promise<void> {
        await api.put(API_ENDPOINTS.volunteers.availability, { available });
    },

    /**
     * Update volunteer location
     */
    async updateLocation(latitude: number, longitude: number): Promise<void> {
        await api.put(API_ENDPOINTS.volunteers.location, { latitude, longitude });
    },

    /**
     * Get volunteer profile
     */
    async getProfile(): Promise<any> {
        const response = await api.get(API_ENDPOINTS.volunteers.profile);
        return response.data;
    },

    /**
     * Get volunteer's SOS response history
     */
    async getSOSHistory(): Promise<VolunteerSOSHistoryItem[]> {
        const response = await api.get(API_ENDPOINTS.volunteers.acceptedSOS);
        return response.data;
    },
};

export interface VolunteerSOSHistoryItem {
    id: string;
    emergencyType: string;
    priority: string;
    status: string;
    location: {
        latitude: number;
        longitude: number;
    };
    createdAt: string;
    acceptedAt: string;
    user: {
        name: string;
        phone: string;
    };
}

export default volunteerService;
