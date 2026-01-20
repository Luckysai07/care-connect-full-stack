/**
 * Type Definitions
 * 
 * All TypeScript interfaces and types for the application.
 */

// ============================================
// User Types
// ============================================

export type UserRole = 'USER' | 'VOLUNTEER' | 'ADMIN' | 'PROFESSIONAL';

export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    photoUrl?: string;
    role: UserRole;
    isActive: boolean;
    preferences?: Record<string, any>;
    createdAt: string;
    volunteer?: VolunteerProfile;
}

export interface VolunteerProfile {
    skills: string[];
    verified: boolean;
    available: boolean;
    averageRating: number;
    cancellationCount: number;
    // Professional fields (optional)
    licenseNumber?: string;
    specialization?: string;
    hospitalAffiliation?: string;
}

// ============================================
// Auth Types
// ============================================

export interface LoginCredentials {
    email: string;
    password: string;
    role?: UserRole;
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    phone: string;
    role?: UserRole;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}

// ============================================
// Location Types
// ============================================

export interface Location {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

export interface LocationUpdate extends Location {
    updatedAt: Date;
}

// ============================================
// SOS Types
// ============================================

export type EmergencyType =
    | 'MEDICAL'
    | 'FIRE'
    | 'ACCIDENT'
    | 'CRIME'
    | 'NATURAL_DISASTER'
    | 'OTHER';

export type SOSPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type SOSStatus =
    | 'PENDING'
    | 'ACCEPTED'
    | 'IN_PROGRESS'
    | 'RESOLVED'
    | 'CANCELLED'
    | 'ESCALATED';

export interface SOSRequest {
    id: string;
    userId: string;
    emergencyType: EmergencyType;
    priority: SOSPriority;
    description?: string;
    status: SOSStatus;
    location: Location;
    createdAt: string;
    acceptedAt?: string;
    resolvedAt?: string;
    user?: {
        name: string;
        phone: string;
        email: string;
    };
    volunteer?: {
        id: string;
        name: string;
        phone: string;
    };
}

export interface CreateSOSData {
    emergencyType: EmergencyType;
    description?: string;
    latitude: number;
    longitude: number;
}

export interface SOSFeedback {
    rating: number;
    comment?: string;
}

// ============================================
// Volunteer Types
// ============================================

export interface VolunteerStats {
    verified: boolean;
    available: boolean;
    averageRating: number;
    cancellationCount: number;
    completedSOS: number;
    activeSOS: number;
    totalRatings: number;
}

export interface RegisterVolunteerData {
    skills: string[];
    certifications?: any[];
}

// ============================================
// Chat Types
// ============================================

export interface ChatMessage {
    id: string;
    sosId: string;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
}

// ============================================
// API Response Types
// ============================================

export interface APIError {
    code: string;
    message: string;
    details?: any[];
}

export interface APIResponse<T = any> {
    data?: T;
    error?: APIError;
}

// ============================================
// Socket.io Event Types
// ============================================

export interface SOSNotification {
    sosId: string;
    emergencyType: EmergencyType;
    priority: SOSPriority;
    location: Location;
    distance: number;
    createdAt: Date;
}

export interface ChatMessageEvent {
    sosId: string;
    senderId: string;
    content: string;
    createdAt: Date;
}

export interface LocationUpdateEvent {
    volunteerId: string;
    latitude: number;
    longitude: number;
    updatedAt: Date;
}
