export type EmergencyType = 'MEDICAL' | 'FIRE' | 'ACCIDENT' | 'CRIME' | 'NATURAL_DISASTER' | 'OTHER';
export type SOSStatus = 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export interface Location {
    latitude: number;
    longitude: number;
}

export interface SOSRequest {
    id: string;
    userId: string;
    emergencyType: EmergencyType;
    priority: number;
    location: Location;
    description?: string;
    imageUrl?: string;
    status: SOSStatus;
    createdAt: Date;
    expiresAt: Date;
    acceptedBy?: string;
    acceptedAt?: Date;
    resolvedAt?: Date;
}

export interface SOSFeedback {
    sosId: string;
    volunteerId: string;
    rating: number;
    comment?: string;
    createdAt?: Date;
}

export interface SOSRejection {
    sosId: string;
    volunteerId: string;
    reason?: string;
    createdAt?: Date;
}
