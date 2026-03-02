import { ConsoleLogger } from '@/lib/logging/Console.logger';
import { useMapboxStyle } from '@/app/hooks/useMapboxStyle';

import {
  useState,
  useEffect,
  useRef
} from 'react';
import mapboxgl
  from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface ProviderLocationPickerWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
}

export function ProviderLocationPickerWidget({ isOpen, onClose, onLocationSelect }: ProviderLocationPickerWidgetProps) {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapStyle = useMapboxStyle();

  // Check for WebGL support
  const checkWebGLSupport = () => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    // Reset error state when modal opens/closes
    if (isOpen) {
      setError(null);
    }

    // Clean up map when component unmounts or modal closes
    return () => {
      if (map) {
        map.remove();
        setMap(null);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    const initializeMap = async () => {
      if (!isOpen || map || !mapContainerRef.current) return;

      // Check WebGL support
      if (!checkWebGLSupport()) {
        setError('WebGL is not supported by your browser. Please update your browser or enable WebGL.');
        return;
      }

      // Check for Mapbox access token
      const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
      if (!token) {
        setError('Mapbox access token is not configured.');
        return;
      }

      mapboxgl.accessToken = token;

      try {
        // Wait a bit for the container to be fully rendered
        await new Promise(resolve => setTimeout(resolve, 100));

        // Ensure container has dimensions
        const container = mapContainerRef.current;
        if (!container.offsetWidth || !container.offsetHeight) {
          setError('Map container is not properly sized.');
          return;
        }

        const newMap = new mapboxgl.Map({
          container: container,
          style: mapStyle,
          center: [49.615563, 40.8521651],
          zoom: 8,
          preserveDrawingBuffer: true,
        });

        newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Add click handler for location selection
        newMap.on('click', () => {
          // Update the center marker position
          const markerElement = container.querySelector('.map-marker');
          if (markerElement && markerElement instanceof HTMLElement) {
            markerElement.style.left = '50%';
            markerElement.style.top = '50%';
          }
        });

        newMap.on('load', () => {
          setMap(newMap);
        });

        newMap.on('error', (e) => {
          ConsoleLogger.error('Mapbox error:', e);
          setError('Failed to load map. Please check your connection and try again.');
        });

      } catch (err) {
        ConsoleLogger.error('Map initialization error:', err);
        setError('Failed to initialize map. Please try again.');
      }
    };

    if (isOpen) {
      initializeMap();
    }
  }, [isOpen, map]);

  const handleConfirm = () => {
    if (!map) {
      setError('Map is not loaded yet. Please wait and try again.');
      return;
    }

    try {
      // Use the current center of the map as the location
      const center = map.getCenter();
      const locationData: LocationData = {
        latitude: center.lat,
        longitude: center.lng
      };
      onLocationSelect(locationData);
      onClose();
    } catch (err) {
      ConsoleLogger.error('Error getting map center:', err);
      setError('Failed to get location. Please try again.');
    }
  };

  if (error) {
    return (
      <div className={`${isOpen ? 'fixed' : 'hidden'} inset-0 z-20 bg-slate-950 bg-opacity-90 overflow-y-auto w-full m-auto flex items-center justify-center`}>
        <div className="w-full max-w-md shadow-xl rounded-md bg-white z-100 relative p-6">
          <div className="text-center">
            <div className="text-red-500 text-lg font-semibold mb-4">Map Error</div>
            <div className="text-gray-700 mb-6">{error}</div>
            <button
              type='button'
              onClick={onClose}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isOpen ? 'fixed' : 'hidden'} inset-0 z-20 bg-slate-950 bg-opacity-90 overflow-y-auto w-full m-auto flex items-center justify-center`}>
      <div className="w-full h-full lg:h-auto lg:w-1/2 lg:aspect-video shadow-xl lg:rounded-md bg-white z-100 relative">
        <div
          ref={mapContainerRef}
          className="h-full w-full min-h-[400px]"
          style={{ position: 'relative' }}
        ></div>

        {/* Loading indicator */}
        {!map && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
            <div className="text-gray-600">Loading map...</div>
          </div>
        )}

        {/* Location marker */}
        {map && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <img src="/loc-icon.png" className='w-9 h-12 map-marker' alt="Location" />
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end">
          <button
            type='button'
            onClick={handleConfirm}
            disabled={!map}
            className={`font-bold py-2 px-4 rounded absolute bottom-6 right-3 ${map
              ? 'bg-app-bright-purple hover:bg-app-bright-purple/90 text-white'
              : 'bg-gray-400 text-gray-600 cursor-not-allowed'
              }`}
          >
            Confirm Location
          </button>
          <button
            type='button'
            onClick={onClose}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded absolute bottom-20 right-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
