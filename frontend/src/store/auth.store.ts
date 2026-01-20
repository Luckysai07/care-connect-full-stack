/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state.
 */

import { create } from 'zustand';
import { User, LoginCredentials, RegisterData, AuthResponse } from '../types';
import apiClient from '../lib/api-client';
import { API_ENDPOINTS } from '../config/api.config';
import { queryClient } from '../lib/query-client';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => void;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    /**
     * Login user
     */
    login: async (credentials: LoginCredentials) => {
        try {
            set({ isLoading: true, error: null });

            const response = await apiClient.post<AuthResponse>(
                API_ENDPOINTS.auth.login,
                credentials
            );

            const { user, accessToken, refreshToken } = response.data;

            // Store tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || 'Login failed';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    /**
     * Register new user
     */
    register: async (data: RegisterData) => {
        try {
            set({ isLoading: true, error: null });

            const response = await apiClient.post<AuthResponse>(
                API_ENDPOINTS.auth.register,
                data
            );

            const { user, accessToken, refreshToken } = response.data;

            // Store tokens
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                user,
                accessToken,
                refreshToken,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || 'Registration failed';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    /**
     * Logout user
     */
    logout: async () => {
        try {
            const { refreshToken } = get();

            if (refreshToken) {
                await apiClient.post(API_ENDPOINTS.auth.logout, { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear tokens and state
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            set({
                user: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
            });

            // Clear React Query cache to prevent data leakage between users
            // We need to import it dynamically or use the imported singleton
            // Importing at top level is fine now that it's in a lib file
            queryClient.clear();
        }
    },

    /**
     * Load user from localStorage
     */
    loadUser: () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');
            const userStr = localStorage.getItem('user');

            if (accessToken && refreshToken && userStr) {
                const user = JSON.parse(userStr);
                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    isLoading: false,
                });
            } else {
                set({ isLoading: false });
            }
        } catch (error) {
            console.error('Failed to parse user data:', error);
            localStorage.clear();
            set({ isLoading: false });
        }
    },

    /**
     * Clear error
     */
    clearError: () => set({ error: null }),
}));
