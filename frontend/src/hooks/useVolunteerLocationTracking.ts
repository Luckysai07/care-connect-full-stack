/**
 * Volunteer Location Tracking Hook
 * Tracks and updates volunteer location in real-time
 */

import { useEffect, useRef, useState } from 'react';
import volunteerService from '../services/volunteer.service';
import { useAuthStore } from '../store/auth.store';

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    error: string | null;
    isTracking: boolean;
}

export function useVolunteerLocationTracking(enabled: boolean = false) {
    const { user } = useAuthStore();
    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: null,
        isTracking: false,
    });

    const watchIdRef = useRef<number | null>(null);
    const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const locationRef = useRef<LocationState>(location);

    // Keep ref updated with latest location
    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        if (!enabled || user?.role !== 'VOLUNTEER') {
            stopTracking();
            return;
        }

        startTracking();
        return () => stopTracking();
    }, [enabled, user]);

    const startTracking = () => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, error: 'Geolocation not supported' }));
            return;
        }

        setLocation(prev => ({ ...prev, isTracking: true, error: null }));

        // Watch position changes
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const newLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    error: null,
                    isTracking: true,
                };
                setLocation(newLocation);
            },
            (error) => {
                setLocation(prev => ({
                    ...prev,
                    error: error.message,
                    isTracking: false,
                }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );

        // Send location to backend every 10 seconds
        updateIntervalRef.current = setInterval(() => {
            const currentLoc = locationRef.current;
            if (currentLoc.latitude && currentLoc.longitude) {
                volunteerService.updateLocation(currentLoc.latitude, currentLoc.longitude)
                    .catch(err => console.error('Failed to update location:', err));
            }
        }, 10000);
    };

    const stopTracking = () => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        if (updateIntervalRef.current) {
            clearInterval(updateIntervalRef.current);
            updateIntervalRef.current = null;
        }

        setLocation(prev => ({ ...prev, isTracking: false }));
    };

    return {
        ...location,
        startTracking,
        stopTracking,
    };
}
