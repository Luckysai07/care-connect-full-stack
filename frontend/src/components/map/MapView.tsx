/**
 * Map View Component
 * 
 * Displays OpenStreetMap with markers using Leaflet.
 * No API key required!
 */

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '../../types';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom emergency marker icon
const emergencyIcon = L.divIcon({
    className: 'custom-emergency-marker',
    html: `
    <div style="
      background: #ef4444;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      animation: pulse 2s infinite;
    ">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    </div>
  `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

interface MapViewProps {
    center: Location;
    markers?: Array<{
        position: Location;
        title: string;
        description?: string;
        type?: 'default' | 'emergency';
    }>;
    zoom?: number;
    height?: string;
    showUserLocation?: boolean;
}

// Component to recenter map when center prop changes
function RecenterMap({ center }: { center: Location }) {
    const map = useMap();

    useEffect(() => {
        map.setView([center.latitude, center.longitude]);
    }, [center, map]);

    return null;
}

export function MapView({
    center,
    markers = [],
    zoom = 13,
    height = '400px',
    showUserLocation = true,
}: MapViewProps) {
    return (
        <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <MapContainer
                center={[center.latitude, center.longitude]}
                zoom={zoom}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                {/* OpenStreetMap Tile Layer - No API key needed! */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User's current location */}
                {showUserLocation && (
                    <Marker position={[center.latitude, center.longitude]}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-semibold">Your Location</p>
                                <p className="text-sm text-gray-600">
                                    {center.latitude.toFixed(6)}, {center.longitude.toFixed(6)}
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Additional markers */}
                {markers.map((marker, index) => (
                    <Marker
                        key={index}
                        position={[marker.position.latitude, marker.position.longitude]}
                        icon={marker.type === 'emergency' ? emergencyIcon : DefaultIcon}
                    >
                        <Popup>
                            <div className="text-center">
                                <p className="font-semibold">{marker.title}</p>
                                {marker.description && (
                                    <p className="text-sm text-gray-600 mt-1">{marker.description}</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {/* Recenter map when center changes */}
                <RecenterMap center={center} />
            </MapContainer>
        </div>
    );
}
