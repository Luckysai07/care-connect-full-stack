/**
 * Geolocation Hook
 * 
 * Custom hook for getting user's current location.
 */

import { useState, useEffect } from 'react';
import { Location } from '../types';

interface GeolocationState {
    location: Location | null;
    error: string | null;
    isLoading: boolean;
}

export function useGeolocation(watch = false) {
    const [state, setState] = useState<GeolocationState>({
        location: null,
        error: null,
        isLoading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState({
                location: null,
                error: 'Geolocation is not supported by your browser',
                isLoading: false,
            });
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            setState({
                location: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                },
                error: null,
                isLoading: false,
            });
        };

        const handleError = (error: GeolocationPositionError) => {
            let errorMessage = 'Failed to get location';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location permission denied';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    break;
            }

            setState({
                location: null,
                error: errorMessage,
                isLoading: false,
            });
        };

        const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        };

        let watchId: number | undefined;

        if (watch) {
            // Watch position continuously
            watchId = navigator.geolocation.watchPosition(
                handleSuccess,
                handleError,
                options
            );
        } else {
            // Get position once
            navigator.geolocation.getCurrentPosition(
                handleSuccess,
                handleError,
                options
            );
        }

        // Cleanup
        return () => {
            if (watchId !== undefined) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [watch]);

    /**
     * Manually refresh location
     */
    const refresh = () => {
        setState(prev => ({ ...prev, isLoading: true }));

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setState({
                    location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    },
                    error: null,
                    isLoading: false,
                });
            },
            (error) => {
                setState({
                    location: null,
                    error: error.message,
                    isLoading: false,
                });
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return {
        ...state,
        refresh,
    };
}
