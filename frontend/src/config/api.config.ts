/**
 * API Configuration
 * 
 * Centralized configuration for API endpoints.
 */

import config from '../config';


export const API_CONFIG = {
    baseURL: config.API_URL,
    socketURL: config.SOCKET_URL,
    timeout: 30000, // 30 seconds
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
    // Auth
    auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        refresh: '/api/auth/refresh',
        logout: '/api/auth/logout',
    },

    // Users
    users: {
        me: '/api/users/me',
        updateProfile: '/api/users/me',
        updateLocation: '/api/users/me/location',
        getLocation: '/api/users/me/location',
        nearby: '/api/users/nearby',
        byId: (id: string) => `/api/users/${id}`,
    },

    // SOS
    sos: {
        create: '/api/sos',
        myHistory: '/api/sos/my-history',
        byId: (id: string) => `/api/sos/${id}`,
        accept: (id: string) => `/api/sos/${id}/accept`,
        reject: (id: string) => `/api/sos/${id}/reject`,
        updateStatus: (id: string) => `/api/sos/${id}/status`,
        feedback: (id: string) => `/api/sos/${id}/feedback`,
    },

    // Volunteers
    volunteers: {
        register: '/api/volunteers/register',
        toggleAvailability: '/api/volunteers/toggle-availability',
        stats: '/api/volunteers/stats',
        acceptedSOS: '/api/volunteers/accepted-sos',
        incomingSOS: '/api/volunteers/incoming-sos',
        activeSOS: '/api/volunteers/active-sos',
        profile: '/api/volunteers/profile',
        availability: '/api/volunteers/availability',
        location: '/api/volunteers/location',

        // Actions
        acceptSOS: (id: string) => `/api/volunteers/sos/${id}/accept`,
        declineSOS: (id: string) => `/api/volunteers/sos/${id}/decline`,
        completeSOS: (id: string) => `/api/volunteers/sos/${id}/complete`,

        verify: (id: string) => `/api/volunteers/${id}/verify`,
    },
};

/**
 * Socket.io Events
 */
export const SOCKET_EVENTS = {
    // SOS Events
    SOS_NEW_REQUEST: 'sos:new_request',
    SOS_ACCEPTED: 'sos:accepted',
    SOS_VOLUNTEER_ACCEPTED: 'sos:volunteer_accepted',
    SOS_STATUS_CHANGED: 'sos:status_changed',
    SOS_NOTIFY_VOLUNTEERS: 'sos:notify_volunteers',
    SOS_STATUS_UPDATE: 'sos:status_update',

    // Chat Events
    CHAT_JOIN: 'chat:join',
    CHAT_LEAVE: 'chat:leave',
    CHAT_MESSAGE: 'chat:message',
    CHAT_NEW_MESSAGE: 'chat:new_message',

    // Location Events
    LOCATION_UPDATE: 'location:update',
    LOCATION_VOLUNTEER_MOVED: 'location:volunteer_moved',
};

export default API_CONFIG;
