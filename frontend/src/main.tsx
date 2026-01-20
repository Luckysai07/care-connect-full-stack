/**
 * Main Entry Point
 * 
 * Renders the React application.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
const updateSW = registerSW({
    onNeedRefresh() {
        if (confirm('New content available. Reload?')) {
            updateSW(true);
        }
    },
});

import config from './config';

// Debug: Log API URL to verify connection (Removed for security)
// console.log('🚀 Frontend Config:', config);
// console.log('🔗 Connecting to API:', config.API_URL);

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
