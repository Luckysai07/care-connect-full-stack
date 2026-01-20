export type UserRole = 'USER' | 'VOLUNTEER' | 'PROFESSIONAL' | 'ADMIN';

export interface User {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date;
}

export interface UserProfile {
    userId: string;
    name: string;
    phone: string;
    address?: string;
    photoUrl?: string;
    preferences?: Record<string, any>;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface VolunteerProfile {
    userId: string;
    skills: string[];
    verified: boolean;
    available: boolean;
    averageRating: number;
    cancellationCount: number;
    lastLocation?: {
        latitude: number;
        longitude: number;
    };
    lastLocationUpdatedAt?: Date;
}

export interface ProfessionalProfile {
    userId: string;
    licenseNumber: string;
    specialization: string;
    hospitalAffiliation?: string;
    verified: boolean;
    available: boolean;
}

export interface FullUserProfile extends UserProfile {
    email: string;
    role: UserRole;
    isActive: boolean;
    volunteer?: VolunteerProfile;
    professional?: ProfessionalProfile;
}
