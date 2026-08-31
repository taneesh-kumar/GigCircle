import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';

export interface LocationPickerValue {
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
}

export interface LocationPickerProps {
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddress?: string;
  initialCity?: string;
  onChange: (value: LocationPickerValue) => void;
  readOnly?: boolean;
  label?: string;
}

// Default center: Vijayawada (16.5062, 80.6480)
const DEFAULT_LAT = 16.5062;
const DEFAULT_LNG = 80.6480;

const createCustomPinIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(5, 150, 105, 0.4);
          border: 2.5px solid #ffffff;
        ">
          <div style="
            width: 12px;
            height: 12px;
            background: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

export function LocationPicker({
  initialLatitude,
  initialLongitude,
  initialAddress = '',
  initialCity = '',
  onChange,
  readOnly = false,
  label = 'Service Location Map',
}: LocationPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  const [lat, setLat] = useState<number | null>(initialLatitude ?? null);
  const [lng, setLng] = useState<number | null>(initialLongitude ?? null);
  const [address, setAddress] = useState<string>(initialAddress);
  const [city, setCity] = useState<string>(initialCity);

  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // Reverse Geocode helper via OpenStreetMap Nominatim
  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
          },
        }
      );
      if (!response.ok) throw new Error('Reverse geocode failed');
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const road = addr.road || addr.suburb || addr.neighbourhood || addr.residential || addr.amenity || '';
        const townCity = addr.city || addr.town || addr.village || addr.county || addr.state_district || addr.state || '';
        const fullAddr = data.display_name ? data.display_name.split(',').slice(0, 3).join(',').trim() : road;
        
        if (fullAddr) setAddress(fullAddr);
        if (townCity) setCity(townCity);

        onChange({
          latitude,
          longitude,
          address: fullAddr || address,
          city: townCity || city,
        });
      }
    } catch {
      // Fallback cleanly without breaking
      onChange({
        latitude,
        longitude,
        address,
        city,
      });
    } finally {
      setIsGeocoding(false);
    }
  }, [address, city, onChange]);

  // Handle location update from map click or drag
  const handleLocationUpdate = useCallback(
    (newLat: number, newLng: number, triggerReverseGeocode = true) => {
      const roundedLat = parseFloat(newLat.toFixed(6));
      const roundedLng = parseFloat(newLng.toFixed(6));
      setLat(roundedLat);
      setLng(roundedLng);
      setGeoError(null);

      if (triggerReverseGeocode) {
        reverseGeocode(roundedLat, roundedLng);
      } else {
        onChange({
          latitude: roundedLat,
          longitude: roundedLng,
          address,
          city,
        });
      }
    },
    [address, city, onChange, reverseGeocode]
  );

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const startLat = initialLatitude ?? DEFAULT_LAT;
    const startLng = initialLongitude ?? DEFAULT_LNG;
    const zoomLevel = initialLatitude && initialLongitude ? 15 : 12;

    const map = L.map(mapContainerRef.current, {
      center: [startLat, startLng],
      zoom: zoomLevel,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const pinIcon = createCustomPinIcon();
    const marker = L.marker([startLat, startLng], {
      icon: pinIcon,
      draggable: !readOnly,
    }).addTo(map);

    markerInstanceRef.current = marker;
    mapInstanceRef.current = map;
    setMapLoaded(true);

    if (!readOnly) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat: clickLat, lng: clickLng } = e.latlng;
        marker.setLatLng([clickLat, clickLng]);
        handleLocationUpdate(clickLat, clickLng, true);
      });

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        handleLocationUpdate(position.lat, position.lng, true);
      });
    }

    // Force map resize check to render tiles correctly inside modal
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    };
  }, []);

  // Update map marker if initial props change
  useEffect(() => {
    if (initialLatitude != null && initialLongitude != null && mapInstanceRef.current && markerInstanceRef.current) {
      const currentPos = markerInstanceRef.current.getLatLng();
      if (currentPos.lat !== initialLatitude || currentPos.lng !== initialLongitude) {
        markerInstanceRef.current.setLatLng([initialLatitude, initialLongitude]);
        mapInstanceRef.current.setView([initialLatitude, initialLongitude], 15);
        setLat(initialLatitude);
        setLng(initialLongitude);
      }
    }
  }, [initialLatitude, initialLongitude]);

  // Request Current Location via Browser Geolocation API
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please click on the map to select your location.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;

        if (mapInstanceRef.current && markerInstanceRef.current) {
          markerInstanceRef.current.setLatLng([currentLat, currentLng]);
          mapInstanceRef.current.setView([currentLat, currentLng], 16);
        }

        handleLocationUpdate(currentLat, currentLng, true);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError('Location permission denied. Please select your location manually on the map.');
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError('Current location unavailable. Please select your location manually on the map.');
            break;
          case error.TIMEOUT:
            setGeoError('Location request timed out. Please select your location manually on the map.');
            break;
          default:
            setGeoError('Unable to retrieve your location. Please select manually on the map.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-emerald-600" />
          {label}
        </label>
        {!readOnly && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 px-3 py-1.5 text-[11px] font-extrabold text-emerald-700 hover:bg-emerald-100/80 hover:border-emerald-300 transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
            ) : (
              <Navigation className="h-3.5 w-3.5 text-emerald-600" />
            )}
            Use My Location
          </button>
        )}
      </div>

      {geoError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-800 flex items-start gap-2 animate-fadeIn">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Map Container */}
      <div className="relative rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs bg-slate-100">
        <div
          ref={mapContainerRef}
          className="h-64 w-full z-0"
          style={{ minHeight: '250px' }}
        />

        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-100/90 backdrop-blur-xs flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            Loading interactive map...
          </div>
        )}

        {isGeocoding && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shadow-sm flex items-center gap-1.5 z-[400]">
            <Loader2 className="h-3 w-3 animate-spin text-emerald-600" />
            Resolving address...
          </div>
        )}
      </div>

      {/* Selected Coordinates & Address Feedback */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Selected Coordinates
            </span>
          </div>
          {lat != null && lng != null ? (
            <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
              📍 {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          ) : (
            <span className="text-[11px] italic text-slate-400">
              Click on the map to set location pin
            </span>
          )}
        </div>

        {address && (
          <div className="text-[11px] text-slate-600">
            <strong className="text-slate-800 font-bold">Detected Address:</strong> {address}
            {city && <span className="ml-1 text-slate-500">({city})</span>}
          </div>
        )}
      </div>
    </div>
  );
}
