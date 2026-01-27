// react-web/src/MapAddress.jsx

import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MapAddress({ onSelect, switchToContacts, initialAddress, initialPosition }) {
  const [position, setPosition] = useState(initialPosition || { lat: 22.58479, lng: 88.49045 });
  const [address, setAddress] = useState(initialAddress || "");
  const hasGeocodedRef = useRef(false);

  // More aggressive forward geocoding
  useEffect(() => {
    if (initialAddress && initialAddress !== address) {
      console.log("Forward geocoding address:", initialAddress); // Debug log
      hasGeocodedRef.current = false;
      
      const fetchCoordinates = async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(initialAddress)}&limit=1`,
            { headers: { 'User-Agent': 'my-react-app (myemail@example.com)' } }
          );
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          const data = await res.json();
          
          console.log("Geocoding response:", data); // Debug log
          
          if (data && data.length > 0) {
            const newPosition = {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon)
            };
            console.log("Setting new position:", newPosition); // Debug log
            setPosition(newPosition);
            setAddress(initialAddress);
            hasGeocodedRef.current = true;
          }
        } catch (err) {
          console.error("Forward geocode error:", err);
        }
      };
      
      fetchCoordinates();
    }
  }, [initialAddress, address]);

  // Reverse geocoding
  useEffect(() => {
    // Don't reverse geocode if we just did forward geocoding
    if (hasGeocodedRef.current) {
      hasGeocodedRef.current = false;
      return;
    }

    const fetchAddress = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.lat}&lon=${position.lng}`,
          { headers: { 'User-Agent': 'my-react-app (myemail@example.com)' } }
        );
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const data = await res.json();

        let addressText = data.display_name || "Address not found";
        setAddress(addressText);
      } catch (err) {
        console.error("Reverse geocode error:", err);
        setAddress(`Error: ${err.message}`);
      }
    };

    fetchAddress();
  }, [position]);

  function MapController() {
    const map = useMap();
    
    useEffect(() => {
      console.log("MapController: Centering to", position); // Debug log
      map.setView([position.lat, position.lng], 14);
    }, [position, map]);
    
    return null;
  }

  function LocationMarker() {
    useMapEvents({
      click(e) {
        console.log("Map clicked:", e.latlng); // Debug log
        setPosition(e.latlng);
      },
    });
    
    return <Marker position={position}></Marker>;
  }

  const handleAdd = () => {
    if (onSelect) {
      onSelect(address, position);
    }
  };

  console.log("MapAddress render - initialAddress:", initialAddress, "position:", position); // Debug log

  return (
    <div className="map-address-container">
      <MapContainer
        center={position}
        zoom={14}
        style={{ width: "100%", height: "400px" }}
        key={JSON.stringify(position)} // Force re-render on position change
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        />
        <MapController />
        <LocationMarker />
      </MapContainer>

      <p className="map-address-text">
        {address ? `${address}` : "Move the map to fetch address…"} <br />
        Lat: {position.lat.toFixed(5)}, Lng: {position.lng.toFixed(5)}
      </p>

      <button className="map-address-button" onClick={handleAdd}>
        Confirm Location
      </button>
    </div>
  );
}