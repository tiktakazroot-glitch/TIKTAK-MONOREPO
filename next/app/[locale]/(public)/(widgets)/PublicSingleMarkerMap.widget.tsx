'use client'

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxStyle } from '@/app/hooks/useMapboxStyle';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

interface Location {
  lat: number;
  lng: number;
}

interface PublicSingleMarkerMapWidgetProps {
  location: Location | null;
}

export function PublicSingleMarkerMapWidget({ location }: PublicSingleMarkerMapWidgetProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapStyle = useMapboxStyle();

  useEffect(() => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') return;
    if (!mapContainerRef.current) return;

    const { lat, lng } = location;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [lng, lat],
      zoom: 14,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.on('load', () => {
      new mapboxgl.Marker({ color: '#5B23FF', scale: 1.1 })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [location, mapStyle]);

  if (!location) return null;

  return <div ref={mapContainerRef} className="map-container rounded-2xl overflow-hidden" style={{ height: '400px', width: '100%' }} />;
}
