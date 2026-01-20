/**
 * Socket.io Hook
 * 
 * Custom hook for Socket.io connection and event handling.
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/api.config';
import { useAuthStore } from '../store/auth.store';

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { accessToken, isAuthenticated } = useAuthStore();

    useEffect(() => {
        // Only connect if authenticated
        if (!isAuthenticated || !accessToken) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setIsConnected(false);
            return;
        }

        // Create socket connection
        const socket = io(API_CONFIG.socketURL, {
            auth: {
                token: accessToken,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Connection events
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            setIsConnected(false);
        });

        socketRef.current = socket;

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isAuthenticated, accessToken]);

    /**
     * Emit event to server
     */
    const emit = (event: string, data?: any) => {
        if (socketRef.current && isConnected) {
            socketRef.current.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit event:', event);
        }
    };

    /**
     * Listen to event from server
     */
    const on = (event: string, callback: (...args: any[]) => void) => {
        if (socketRef.current) {
            socketRef.current.on(event, callback);
        }
    };

    /**
     * Remove event listener
     */
    const off = (event: string, callback?: (...args: any[]) => void) => {
        if (socketRef.current) {
            socketRef.current.off(event, callback);
        }
    };

    return {
        socket: socketRef.current,
        isConnected,
        emit,
        on,
        off,
    };
}
