import { useState, useEffect } from 'react';
import { messaging } from '../config/firebase';
import { getToken } from 'firebase/messaging';
import { useAuthStore } from '../store/auth.store';
import api from '../services/api';

export function usePushNotifications() {
    const { isAuthenticated } = useAuthStore();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated || !messaging) return;

        const requestPermission = async () => {
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const currentToken = await getToken(messaging, {
                        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
                    });

                    if (currentToken) {
                        setToken(currentToken);
                        // Send token to backend
                        await api.post('/users/fcm-token', { token: currentToken });
                        console.log('FCM Token registered');
                    }
                }
            } catch (error) {
                console.warn('Notification permission/token error:', error);
            }
        };

        requestPermission();
    }, [isAuthenticated]);

    return { token };
}
