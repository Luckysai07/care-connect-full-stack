/**
 * SOS Service
 * API calls for SOS requests
 */

import api from './api';
import { API_ENDPOINTS } from '../config/api.config';

export interface CreateSOSData {
    emergencyType: string;
    latitude: number;
    longitude: number;
    description?: string;
}

export interface SOSRequest {
    id: string;
    userId: string;
    emergencyType: string;
    latitude: number;
    longitude: number;
    description?: string;
    status: string;
    createdAt: string;
}

export interface SOSHistoryItem {
    id: string;
    emergencyType: string;
    priority: string;
    status: string;
    location: {
        latitude: number;
        longitude: number;
    };
    createdAt: string;
    resolvedAt: string | null;
    volunteerName: string | null;
}

export interface SOSDetails {
    id: string;
    userId: string;
    emergencyType: string;
    priority: string;
    description?: string;
    imageUrl?: string;
    status: string;
    location: {
        latitude: number;
        longitude: number;
    };
    createdAt: string;
    expiresAt?: string;
    acceptedAt?: string;
    resolvedAt?: string;
    user: {
        name: string;
        phone: string;
        email: string;
    };
    volunteer?: {
        id: string;
        name: string;
        phone: string;
        rating?: number;
        location?: {
            latitude: number;
            longitude: number;
            updatedAt: string;
        };
    };
}

const sosService = {
    /**
     * Create SOS request
     */
    async createSOS(data: CreateSOSData | FormData): Promise<{ id: string }> {
        const config = data instanceof FormData ? {
            headers: { 'Content-Type': 'multipart/form-data' }
        } : undefined;

        const response = await api.post(API_ENDPOINTS.sos.create, data, config);
        return response.data;
    },

    /**
     * Get SOS details
     */
    async getSOSDetails(sosId: string): Promise<SOSDetails> {
        const response = await api.get(API_ENDPOINTS.sos.byId(sosId));
        return response.data;
    },

    /**
     * Get user's SOS history
     */
    async getMyHistory(): Promise<SOSHistoryItem[]> {
        const response = await api.get(API_ENDPOINTS.sos.myHistory);
        return response.data;
    },
};

export default sosService;


