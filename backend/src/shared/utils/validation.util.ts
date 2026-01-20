/**
 * Validation Utility Module
 * 
 * Provides common validation functions.
 */

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate phone number format
 * International format: +1234567890
 * @param {string} phone - Phone number
 * @returns {boolean} True if valid phone
 */
export function isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 * @param {string} password - Password
 * @returns {Object} Validation result with isValid and errors
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate location coordinates
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {boolean} True if valid coordinates
 */
export function isValidLocation(latitude: number, longitude: number): boolean {
    return (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
    );
}

/**
 * Sanitize string input
 * Removes potentially dangerous characters
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(input: any): string {
    if (typeof input !== 'string') return '';

    return input
        .trim()
        .replace(/[<>]/g, '') // Remove < and >
        .substring(0, 1000); // Limit length
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID string
 * @returns {boolean} True if valid UUID
 */
export function isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

export default {
    isValidEmail,
    isValidPhone,
    validatePassword,
    isValidLocation,
    sanitizeString,
    isValidUUID
};
