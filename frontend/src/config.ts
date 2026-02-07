/**
 * Runtime Configuration Helper
 * 
 * Reads configuration from window.__RUNTIME_CONFIG__ (injected by Docker/HTML)
 * or falls back to Vite env vars (local dev).
 */

interface RuntimeConfig {
    API_URL: string;
    SOCKET_URL: string;
}

declare global {
    interface Window {
        __RUNTIME_CONFIG__?: RuntimeConfig;
    }
}

const config: RuntimeConfig = {
    API_URL: window.__RUNTIME_CONFIG__?.API_URL || import.meta.env.VITE_API_URL || 'https://care-connect-api-bl1z.onrender.com',
    SOCKET_URL: window.__RUNTIME_CONFIG__?.SOCKET_URL || import.meta.env.VITE_SOCKET_URL || 'https://care-connect-api-bl1z.onrender.com'
};

export default config;
