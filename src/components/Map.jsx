import React, { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateTotalRisk, getRiskColor } from '../utils/risk';
import { getCountryRisk } from '../data/countries';
import geoData from '../data/world.geo.json';

// Component to handle map animations
const MapController = ({ selectedCountry }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedCountry && selectedCountry.bounds) {
            map.flyToBounds(selectedCountry.bounds, {
                padding: [50, 50],
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [selectedCountry, map]);

    return null;
};

const Map = ({ onCountrySelect, filterRisk = 'all', selectedCountry }) => {
    const getRiskCategory = (score) => {
        if (score <= 40) return 'low';
        if (score <= 60) return 'medium';
        return 'high';
    };

    const mapStyle = (feature) => {
        const countryId = feature.id;
        const riskData = getCountryRisk(countryId);
        const totalRisk = calculateTotalRisk(riskData.economicRisk, riskData.politicalRisk);
        const color = getRiskColor(totalRisk);
        const category = getRiskCategory(totalRisk);

        const isMatch = filterRisk === 'all' || filterRisk === category;
        const isSelected = selectedCountry && selectedCountry.id === countryId;

        return {
            fillColor: isMatch ? color : 'transparent',
            weight: isSelected ? 3 : (isMatch ? 1 : 0.5),
            opacity: 1,
            color: isSelected ? '#fff' : (isMatch ? color : '#444'), // Border matches risk color or white if selected
            dashArray: '',
            fillOpacity: isSelected ? 0.4 : (isMatch ? 0.2 : 0), // Much more transparent to see the satellite map
            className: 'country-feature transition-all duration-300' // Add class for CSS transitions if possible
        };
    };

    const onEachFeature = (feature, layer) => {
        const countryId = feature.id;
        const riskData = getCountryRisk(countryId);

        layer.on({
            mouseover: (e) => {
                const totalRisk = calculateTotalRisk(riskData.economicRisk, riskData.politicalRisk);
                const category = getRiskCategory(totalRisk);
                if (filterRisk !== 'all' && filterRisk !== category) return;

                const layer = e.target;
                layer.setStyle({
                    weight: 2,
                    color: '#fff',
                    fillOpacity: 0.4,
                    shadowBlur: 10
                });
                layer.bringToFront();
            },
            mouseout: (e) => {
                const totalRisk = calculateTotalRisk(riskData.economicRisk, riskData.politicalRisk);
                const category = getRiskCategory(totalRisk);
                if (filterRisk !== 'all' && filterRisk !== category) return;

                // The style function will handle the reset on re-render, but for immediate feedback:
                // We rely on the mapStyle function being called or manually resetting.
                // For simplicity in this interaction, we can just reset to a "base" hover-out state
                // but ideally we should let React handle state. 
                // However, Leaflet is imperative.
                // Let's just reset to the base style logic roughly:
                const color = getRiskColor(totalRisk);
                layer.setStyle({
                    weight: 1,
                    color: color,
                    fillOpacity: 0.2
                });
            },
            click: (e) => {
                const totalRisk = calculateTotalRisk(riskData.economicRisk, riskData.politicalRisk);
                const category = getRiskCategory(totalRisk);
                if (filterRisk !== 'all' && filterRisk !== category) return;

                onCountrySelect({
                    ...riskData,
                    bounds: e.target.getBounds() // Pass bounds for zooming
                });
            }
        });
    };

    return (
        <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%', background: '#000' }}
            minZoom={2}
            maxBounds={[[-90, -180], [90, 180]]}
        >
            {/* Satellite Layer for Realism */}
            <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />

            {/* Dark overlay to make text readable and risk colors pop slightly without being overwhelming */}
            <div className="leaflet-pane leaflet-tile-pane" style={{ zIndex: 200, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.3)' }}></div>
            </div>

            <MapController selectedCountry={selectedCountry} />

            {geoData && (
                <GeoJSON
                    key={`${filterRisk}-${selectedCountry?.id}`} // Re-render when selection changes to update styles
                    data={geoData}
                    style={mapStyle}
                    onEachFeature={onEachFeature}
                />
            )}
        </MapContainer>
    );
};

export default Map;
