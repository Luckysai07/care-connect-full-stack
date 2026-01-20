/**
 * Shared TypeScript Definitions
 * 
 * Contains interfaces and types matching the database schema and application domain.
 */

import { USERS_ROLES, EMERGENCY_TYPES, SOS_STATUS, SOS_PRIORITY } from './constants.js';

// Type helpers
export type ValueOf<T> = T[keyof T];

// Enums / Union Types
export type UserRole = ValueOf<typeof USERS_ROLES>;
export type EmergencyType = ValueOf<typeof EMERGENCY_TYPES>;
export type SOSStatus = ValueOf<typeof SOS_STATUS>;
export type SOSPriority = ValueOf<typeof SOS_PRIORITY>;

// JWT Token Payload
export interface TokenPayload {
    userId: string;
    role?: UserRole;
    iat?: number;
    exp?: number;
}

// Basic User Interface
export interface User {
    id: string;
    email: string;
    password_hash?: string; // Optional because we often exclude it
    role: UserRole;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

// User Profile
export interface UserProfile {
    user_id: string;
    name: string;
    phone: string;
    address?: string;
    photo_url?: string;
    preferences?: UserPreferences;
    created_at: Date;
    updated_at: Date;
}

export interface UserPreferences {
    language: string;
    notificationPreferences: {
        push: boolean;
        sms: boolean;
        email: boolean;
    };
    emergencyContacts?: Array<{
        name: string;
        phone: string;
        relationship: string;
    }>;
}

// Volunteer
export interface Volunteer {
    user_id: string;
    skills: string[];
    certifications?: any[]; // Keep flexible with any[] or define stricter if needed
    verified: boolean;
    available: boolean;
    average_rating: number;
    cancellation_count: number;
    verified_at?: Date;
    verified_by?: string;
    created_at: Date;
    updated_at: Date;
}

// SOS Request
export interface SOSRequest {
    id: string;
    user_id: string;
    emergency_type: EmergencyType;
    priority: SOSPriority;
    location: {
        latitude: number;
        longitude: number;
    } | string; // Helper for when it's just a raw field, but typically we want lat/long. Using Object for GeoJSON
    description?: string;
    status: SOSStatus;
    accepted_by?: string;
    created_at: Date;
    accepted_at?: Date;
    resolved_at?: Date;

    // Joined fields (often included in API responses)
    user?: UserProfile;
    volunteer?: UserProfile;
}

// Chat Message
export interface ChatMessage {
    id: string;
    sos_id: string;
    sender_id: string;
    content: string;
    is_read: boolean;
    created_at: Date;
}

// Generic API Response
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
