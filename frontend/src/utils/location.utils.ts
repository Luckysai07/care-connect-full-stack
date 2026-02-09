/**
 * Location Utilities
 * Helper functions for handling geolocation permissions and updates
 */

import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../config/api.config';
import toast from 'react-hot-toast';

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

/**
 * Request location permission and update backend
 * This function handles the entire flow:
 * 1. Check if geolocation is supported
 * 2. Request permission via getCurrentPosition
 * 3. If granted, update backend with coordinates
 * 4. Show appropriate toast notifications
 * 
 * @returns Promise<LocationData | null> - Returns location data if successful, null otherwise
 */
export async function requestLocationAndUpdate(): Promise<LocationData | null> {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        toast.error('Location not supported by your browser');
        return null;
    }

    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            async (position) => {
                const locationData: LocationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                };

                try {
                    // Update backend with location
                    await apiClient.put(API_ENDPOINTS.users.updateLocation, {
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                    });

                    toast.success('Location updated successfully');
                    resolve(locationData);
                } catch (error) {
                    console.error('Failed to update location:', error);
                    toast.error('Failed to update location on server');
                    resolve(locationData); // Still return location data even if backend update fails
                }
            },
            // Error callback
            (error) => {
                let errorMessage = 'Failed to get location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Some features may be limited.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out';
                        break;
                }

                toast.error(errorMessage, { duration: 4000 });
                resolve(null);
            },
            // Options
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

/**
 * Check if location permission has been granted
 * Note: This uses the Permissions API which may not be supported in all browsers
 * 
 * @returns Promise<'granted' | 'denied' | 'prompt' | 'unsupported'>
 */
export async function checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
    if (!navigator.permissions) {
        return 'unsupported';
    }

    try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        return result.state as 'granted' | 'denied' | 'prompt';
    } catch (error) {
        return 'unsupported';
    }
}
