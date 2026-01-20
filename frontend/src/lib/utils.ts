/**
 * Utility Functions
 * 
 * Common utility functions used throughout the application.
 */

import { clsx, ClassValue } from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * Merge class names
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date, formatStr = 'PPp'): string {
    return format(new Date(date), formatStr);
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Format distance to human-readable string
 */
export function formatDistance(meters: number): string {
    if (meters < 1000) {
        return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Get emergency type color
 */
export function getEmergencyTypeColor(type: string): string {
    const colors: Record<string, string> = {
        MEDICAL: 'bg-red-100 text-red-800',
        FIRE: 'bg-orange-100 text-orange-800',
        ACCIDENT: 'bg-yellow-100 text-yellow-800',
        CRIME: 'bg-purple-100 text-purple-800',
        NATURAL_DISASTER: 'bg-blue-100 text-blue-800',
        OTHER: 'bg-gray-100 text-gray-800',
    };

    return colors[type] || colors.OTHER;
}

/**
 * Get SOS status color
 */
export function getSOSStatusColor(status: string): string {
    const colors: Record<string, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        ACCEPTED: 'bg-blue-100 text-blue-800',
        IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
        RESOLVED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-gray-100 text-gray-800',
        ESCALATED: 'bg-red-100 text-red-800',
    };

    return colors[status] || colors.PENDING;
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: string): string {
    const colors: Record<string, string> = {
        CRITICAL: 'bg-red-100 text-red-800',
        HIGH: 'bg-orange-100 text-orange-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        LOW: 'bg-green-100 text-green-800',
    };

    return colors[priority] || colors.MEDIUM;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
}

/**
 * Truncate text to specified length
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
