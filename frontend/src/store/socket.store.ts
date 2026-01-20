import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

import { API_CONFIG } from '../config/api.config';

interface SocketState {
    socket: Socket | null;
    isConnected: boolean;
    initialize: (token: string) => void;
    disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
    socket: null,
    isConnected: false,

    initialize: (token: string) => {
        const { socket } = get();
        if (socket?.connected) return;

        if (!token) return;

        console.log('Initializing socket connection to:', API_CONFIG.socketURL);

        const newSocket = io(API_CONFIG.socketURL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            set({ isConnected: true });
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            set({ isConnected: false });
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
            // Don't set isConnected to false here immediately, let reconnection logic handle it
        });

        set({ socket: newSocket });
    },

    disconnect: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },
}));
