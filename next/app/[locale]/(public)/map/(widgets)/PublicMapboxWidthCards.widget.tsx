"use client";

import {
    useEffect,
    useRef,
    useState,
    useCallback
} from 'react';
import mapboxgl from 'mapbox-gl';
import { usePublicSearchContext } from '@/app/[locale]/(public)/(context)/PublicSearchContext';
import { searchCards } from '@/app/[locale]/(public)/cards/PublicCardsService';
import { PublicMapCardDetailModalWidget } from '@/app/[locale]/(public)/map/(widgets)/PublicMapCardDetailModal.widget';
import { useMapboxStyle } from '@/app/hooks/useMapboxStyle';

import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

import type { Card } from '@tiktak/shared/types/domain/Card.types';

import { ConsoleLogger } from '@/lib/logging/Console.logger';
// API response type for public mapbox cards (minimal Card.PublicAccess data for map markers)
interface PublicMapboxCardApiResponse extends Pick<Card.PublicAccess, 'id'> {
    [key: string]: unknown; // Allow additional map/location fields
}

interface PublicMapboxWidthCardsWidgetProps {
    onMapClustersUpdate?: (clusters: unknown[]) => void;
    className?: string;
}

export function PublicMapboxWidthCardsWidget({
    className = ''
}: PublicMapboxWidthCardsWidgetProps) {
    // Use search context for cards, buckets, loading, error states and map parameter updates
    const { buckets, cards, loading, error, updateMapParams } = usePublicSearchContext();

    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);
    const moveendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initialMapStateRef = useRef<{ lng: number; lat: number; zoom: number } | null>(null);

    const [lng, setLng] = useState(47.0376);
    const [lat, setLat] = useState(40.2577);
    const [zoom, setZoom] = useState(6);
    const [showCardModal, setShowCardModal] = useState(false);
    const [selectedCard, setSelectedCard] = useState<Card.PublicAccess | null>(null);
    const [loadingCardDetails, setLoadingCardDetails] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapChanged, setMapChanged] = useState(false);
    const [mapContainerReady, setMapContainerReady] = useState(false);

    const mapStyle = useMapboxStyle();

    // Update map parameters in search context when map moves/zooms
    const handleMapBoundsChange = useCallback((bounds: mapboxgl.LngLatBounds, zoomLevel: number) => {
        if (!map.current || !updateMapParams) return;

        const boundingBox = {
            northEast: {
                lat: bounds.getNorthEast().lat,
                lng: bounds.getNorthEast().lng
            },
            southWest: {
                lat: bounds.getSouthWest().lat,
                lng: bounds.getSouthWest().lng
            }
        };

        updateMapParams(zoomLevel, boundingBox);
    }, [updateMapParams]);

    // Track when map container is ready
    useEffect(() => {
        if (mapContainer.current && !mapContainerReady) {
            setMapContainerReady(true);
        }
    }, [mapContainerReady]);

    // Swap map style when theme changes (after map is loaded)
    useEffect(() => {
        if (map.current && mapLoaded) {
            map.current.setStyle(mapStyle);
        }
    }, [mapStyle, mapLoaded]);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current) return;
        if (map.current) return;
        if (!mapContainerReady) return;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: mapStyle,
                center: [lng, lat],
                zoom: zoom,
                preserveDrawingBuffer: false,
                doubleClickZoom: true,
                touchZoomRotate: true,
            });

            // Add controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-left');
            map.current.addControl(new mapboxgl.FullscreenControl(), 'top-left');
            map.current.addControl(new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            }), 'top-left');

            // Handle load event - fetch initial data
            const handleLoad = () => {
                setMapLoaded(true);
                if (mapContainer.current) {
                    mapContainer.current.className =
                        'w-full h-full rounded-lg shadow-lg';
                }
                const bounds = map.current?.getBounds();
                const currentZoom = map.current?.getZoom();
                const center = map.current?.getCenter();
                if (bounds && currentZoom !== undefined && center) {
                    // Store initial state
                    initialMapStateRef.current = {
                        lng: center.lng,
                        lat: center.lat,
                        zoom: currentZoom
                    };
                    // Initial API call on map load
                    handleMapBoundsChange(bounds, currentZoom);
                }
            };

            // Check if map position/zoom has changed from initial
            const checkMapChanged = () => {
                if (!initialMapStateRef.current || !map.current) return;

                const center = map.current.getCenter();
                const currentZoom = map.current.getZoom();

                const lngDiff = Math.abs(
                    center.lng - initialMapStateRef.current.lng
                );
                const latDiff = Math.abs(
                    center.lat - initialMapStateRef.current.lat
                );
                const zoomDiff = Math.abs(
                    currentZoom - initialMapStateRef.current.zoom
                );

                // Check if changes exceed thresholds
                const hasChanged =
                    lngDiff > 0.0001 ||
                    latDiff > 0.0001 ||
                    zoomDiff > 0.05;

                setMapChanged(hasChanged);
            };

            // Handle drag/zoom start - immediate feedback
            const handleDragStart = () => {
                checkMapChanged();
            };

            const handleZoomStart = () => {
                checkMapChanged();
            };

            // Handle move event - continuous checking during interaction
            // Don't trigger checkMapChanged on every move to avoid marker re-renders
            const handleMove = () => {
                // Removed checkMapChanged() to prevent marker jitter
                // Map changed detection happens on dragstart/zoomstart instead
            };

            // Handle moveend event - update position state only
            const handleMoveend = () => {
                if (moveendTimeoutRef.current) {
                    clearTimeout(moveendTimeoutRef.current);
                }

                moveendTimeoutRef.current = setTimeout(() => {
                    if (!map.current) return;
                    const center = map.current.getCenter();
                    const currentZoom = map.current.getZoom();

                    setLng(center.lng);
                    setLat(center.lat);
                    setZoom(currentZoom);
                    // Note: NOT calling handleMapBoundsChange here
                    // API only refetches when user clicks the refresh button
                }, 200);
            };

            // Register event listeners
            map.current.on('load', handleLoad);
            map.current.on('dragstart', handleDragStart);
            map.current.on('zoomstart', handleZoomStart);
            map.current.on('move', handleMove);
            map.current.on('moveend', handleMoveend);

            // Cleanup function - remove all event listeners and destroy map
            return () => {
                if (moveendTimeoutRef.current) {
                    clearTimeout(moveendTimeoutRef.current);
                }
                if (map.current) {
                    try {
                        map.current.off('load', handleLoad);
                        map.current.off('dragstart', handleDragStart);
                        map.current.off('zoomstart', handleZoomStart);
                        map.current.off('move', handleMove);
                        map.current.off('moveend', handleMoveend);
                        // Remove the map instance completely
                        map.current.remove();
                        map.current = null;
                        setMapLoaded(false);
                    } catch (error) {
                        ConsoleLogger.error('Error cleaning up map:', error);
                    }
                }
            };
        } catch (error) {
            ConsoleLogger.error('Error initializing map:', error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapContainerReady]);

    // Cleanup and remove old markers
    const clearMarkers = useCallback(() => {
        markersRef.current.forEach(marker => {
            try {
                marker.remove();
            } catch (error) {
                ConsoleLogger.error('Error removing marker:', error);
            }
        });
        markersRef.current = [];
    }, []);

    // Update map markers when cards or buckets change (but not on map move)
    useEffect(() => {
        if (!mapLoaded || !map.current || !map.current.isStyleLoaded()) return;

        clearMarkers();

        // Use buckets for map mode, fallback to cards for individual markers
        const dataToUse = buckets && buckets.length > 0 ? buckets : cards;

        if (!dataToUse || dataToUse.length === 0) return;

        try {
            dataToUse.forEach(item => {
                let location, count, isBucket = false;

                if (buckets && buckets.length > 0) {
                    // Handle geo bucket (geohash format)
                    isBucket = true;
                    const bucket = item;

                    // Use centroids from the API response
                    if (bucket.centroids && bucket.centroids.location) {
                        location = bucket.centroids.location;
                    } else {
                        ConsoleLogger.warn('Bucket missing centroids:', bucket);
                        return;
                    }

                    count = bucket.doc_count;
                } else {
                    // Handle individual card
                    const card = item;
                    if (!card._source?.location) return;
                    location = card._source.location;
                    count = 1;
                }

                const markerDiv = document.createElement('div');
                markerDiv.className = 'custom-marker cursor-pointer';

                // Use a wrapper for the marker content to avoid transform conflicts
                const markerContent = document.createElement('div');
                markerContent.style.width = isBucket ? '40px' : '30px';
                markerContent.style.height = isBucket ? '40px' : '30px';
                // Brand colors: clusters = cyan, single = purple
                markerContent.style.backgroundColor = isBucket ? '#4EFFB8' : '#5B23FF';
                markerContent.style.borderRadius = '50%';
                markerContent.style.border = '2px solid rgba(255,255,255,0.8)';
                markerContent.style.display = 'flex';
                markerContent.style.justifyContent = 'center';
                markerContent.style.alignItems = 'center';
                markerContent.style.color = isBucket ? '#120f1c' : '#fff';
                markerContent.style.fontSize = isBucket ? '14px' : '12px';
                markerContent.style.fontWeight = 'bold';
                markerContent.style.boxShadow = isBucket
                    ? '0 0 0 3px rgba(78,255,184,0.3), 0 2px 8px rgba(0,0,0,0.25)'
                    : '0 0 0 3px rgba(91,35,255,0.3), 0 2px 8px rgba(0,0,0,0.25)';
                markerContent.style.transition = 'all 0.2s ease';
                markerContent.style.cursor = 'pointer';
                markerContent.innerText = count.toString();

                markerDiv.appendChild(markerContent);

                // Hover effects on the inner content, not the wrapper
                markerContent.addEventListener('mouseenter', () => {
                    markerContent.style.transform = 'scale(1.15)';
                    markerContent.style.backgroundColor =
                        isBucket ? '#2dd4a8' : '#4a1acc';
                });

                markerContent.addEventListener('mouseleave', () => {
                    markerContent.style.transform = 'scale(1)';
                    markerContent.style.backgroundColor =
                        isBucket ? '#4EFFB8' : '#5B23FF';
                });

                // Create popup content
                const popupContent = document.createElement('div');
                popupContent.className = 'max-w-xs';

                if (isBucket) {
                    if (count === 1) {
                        // Single card - fetch and show details
                        popupContent.innerHTML = `
                            <div class="space-y-2">
                              <h3 class="font-bold text-sm">1 card</h3>
                              <p class="text-xs text-gray-600">
                                Click to view card details
                              </p>
                            </div>
                        `;

                        markerContent.addEventListener('click', async () => {
                            // Fetch the card at this location using simple mode
                            setLoadingCardDetails(true);
                            setShowCardModal(true);
                            setSelectedCard(null);

                            try {
                                // For single-item buckets, centroid is the exact card location
                                // Use a very small bounding box (±0.000001) to query just this point
                                const boundingBox = {
                                    northEast: {
                                        lat: location.lat + 0.000001,
                                        lng: location.lon + 0.000001
                                    },
                                    southWest: {
                                        lat: location.lat - 0.000001,
                                        lng: location.lon - 0.000001
                                    }
                                };

                                const result = await searchCards({
                                    mode: 'simple',
                                    pagination: 1,
                                    boundingBox
                                });

                                if (result.cards && result.cards.length > 0) {
                                    setSelectedCard(result.cards[0] as unknown as Card.PublicAccess);
                                } else {
                                    ConsoleLogger.error('No card found at this location');
                                    setShowCardModal(false);
                                }
                            } catch (error) {
                                ConsoleLogger.error('Error fetching card details:', error);
                                setShowCardModal(false);
                            } finally {
                                setLoadingCardDetails(false);
                            }
                        });
                    } else {
                        // Multiple cards - zoom in by 30% and auto-refresh
                        markerContent.addEventListener('click', () => {
                            if (!map.current) return;

                            // Zoom in by 30% (multiply zoom level by 1.3)
                            const currentZoom = map.current.getZoom();
                            const newZoom = currentZoom * 1.3;

                            // Reset map changed state and update initial position
                            setMapChanged(false);

                            map.current.flyTo({
                                center: [location.lon, location.lat],
                                zoom: newZoom,
                                duration: 1000,
                                essential: true
                            });

                            // Wait for animation to complete, then trigger search
                            map.current.once('moveend', () => {
                                const bounds = map.current?.getBounds();
                                const finalZoom = map.current?.getZoom();

                                if (bounds && finalZoom !== undefined) {
                                    // Update initial state to new position
                                    initialMapStateRef.current = {
                                        lng: map.current?.getCenter().lng || 0,
                                        lat: map.current?.getCenter().lat || 0,
                                        zoom: finalZoom
                                    };

                                    // Automatically trigger search at new zoom level
                                    handleMapBoundsChange(bounds, finalZoom);
                                }
                            });
                        });
                    }
                } else {
                    // Individual card from simple mode
                    const card = item;
                    popupContent.innerHTML = `
                        <div class="space-y-2">
                          <h3 class="font-bold text-sm">
                            ${card._source.title || 'Card'}
                          </h3>
                          <p class="text-xs text-gray-600">
                            Click to view details
                          </p>
                        </div>
                    `;

                    markerContent.addEventListener('click', () => {
                        setSelectedCard(card._source);
                        setShowCardModal(true);
                    });
                }

                // Only attach popup for single cards or individual cards from simple mode
                let popup = null;
                if ((isBucket && count === 1) || !isBucket) {
                    popup = new mapboxgl.Popup({
                        offset: 25,
                        closeButton: true,
                        closeOnClick: false
                    }).setDOMContent(popupContent);
                }

                const mapboxMarker = new mapboxgl.Marker(markerDiv)
                    .setLngLat([location.lon, location.lat]);

                // Only set popup if it exists (single cards only)
                if (popup) {
                    mapboxMarker.setPopup(popup);
                }

                mapboxMarker.addTo(map.current as mapboxgl.Map);

                markersRef.current.push(mapboxMarker);
            });
        } catch (error) {
            ConsoleLogger.error('Error updating markers:', error);
        }
    }, [cards, buckets, mapLoaded, clearMarkers]);

    // Handle refresh button click
    const handleRefreshCards = useCallback(() => {
        if (!map.current) return;
        const bounds = map.current?.getBounds();
        const currentZoom = map.current?.getZoom();
        if (bounds && currentZoom !== undefined) {
            // Reset map changed flag
            setMapChanged(false);
            // Update initial state to current
            initialMapStateRef.current = {
                lng: map.current?.getCenter().lng || 0,
                lat: map.current?.getCenter().lat || 0,
                zoom: currentZoom
            };
            // Trigger search context update
            handleMapBoundsChange(bounds, currentZoom);
        }
    }, [handleMapBoundsChange]);


    // Cleanup on unmount - only handle markers and timeouts
    // Map cleanup is handled in the initialization useEffect
    useEffect(() => {
        return () => {
            clearMarkers();
            if (moveendTimeoutRef.current) {
                clearTimeout(moveendTimeoutRef.current);
            }
        };
    }, [clearMarkers]);


    return (
        <>
            <div className={
                `relative w-full aspect-10/16 md:aspect-square 
               lg:aspect-16/10 mb-6 ${className}`
            }>
                <div ref={mapContainer}
                    className="w-full h-full rounded-lg shadow-lg"
                />

                {/* Loading Overlay */}
                {loading && (
                    <div className='absolute inset-0 bg-white/20 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-lg'>
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
                        <p className="mt-4 text-gray-700 font-medium">Loading cards...</p>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className='absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg'>
                        <div className='bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg max-w-md mx-4 text-center'>
                            <div className="flex items-center justify-center mb-2">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <p className="font-medium">Error loading map</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* Map Stats */}
                {!loading && !error && (
                    <div className='absolute top-4 right-4 
                      bg-white/90 backdrop-blur-sm px-3 py-2 
                      rounded-lg shadow-md text-sm z-10'>
                        <div className="flex items-center gap-2">
                            {buckets && buckets.length > 0 ? (
                                <>
                                    <span className="w-3 h-3 
                                      bg-red-500 rounded-full"></span>
                                    <span>
                                        {buckets.length} clusters, {
                                            buckets.reduce(
                                                (sum, b) => sum + b.doc_count, 0
                                            )
                                        } total cards
                                    </span>
                                </>
                            ) : (
                                <>
                                    <span className="w-3 h-3 
                                      bg-app-bright-purple rounded-full"></span>
                                    <span>{cards?.length || 0} cards</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Refresh Button - Shows when map is moved/zoomed */}
                {mapChanged && !loading ? (
                    <div className='absolute bottom-4 left-1/2 
                      -translate-x-1/2 z-50'>
                        <button
                            onClick={handleRefreshCards}
                            className='bg-app-bright-purple hover:bg-app-bright-purple/90 
                              text-white font-semibold 
                              py-3 px-6 rounded-lg shadow-2xl 
                              transition-all duration-200 
                              flex items-center gap-2 
                              hover:shadow-xl 
                              hover:scale-105 active:scale-95'>
                            <span>🔄</span>
                            <span>Refresh Cards in This Area</span>
                        </button>
                    </div>
                ) : null}
            </div>

            {/* Card Details Modal */}
            <PublicMapCardDetailModalWidget
                isOpen={showCardModal}
                onClose={() => setShowCardModal(false)}
                card={selectedCard}
                loading={loadingCardDetails}
            />
        </>
    );
}
