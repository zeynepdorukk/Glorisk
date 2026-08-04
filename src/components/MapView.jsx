import { useCallback, useEffect, useRef, useState } from 'react';
import { GeoJSON, MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const BASEMAPS = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    labels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labels: 'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

const NO_DATA_COLOR = '#3f3f46';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function computeStyle(iso3, { byId, selectedId, bandFilter }) {
  const country = byId.get(iso3);
  const hasScore = country && country.score !== null;
  const dimmed = bandFilter !== 'all' && (!hasScore || country.band?.id !== bandFilter);
  const isSelected = selectedId === iso3;

  return {
    fillColor: hasScore ? country.band.color : NO_DATA_COLOR,
    fillOpacity: dimmed ? 0.08 : hasScore ? 0.75 : 0.25,
    color: isSelected ? '#ffffff' : 'rgba(9, 9, 11, 0.85)',
    weight: isSelected ? 2.5 : 0.6,
    opacity: dimmed ? 0.25 : 1,
  };
}

function tooltipFor(iso3, byId, feature) {
  const country = byId.get(iso3);
  const name = country?.name ?? feature?.properties?.name ?? iso3;
  const score = country && country.score !== null ? `${Math.round(country.score)}/100` : 'no data';
  return `<strong>${name}</strong><span>${score}</span>`;
}

/**
 * Dedicated pane so place names render above the choropleth fill. Creating a
 * Leaflet pane is idempotent, so this is safe to run on every render.
 */
function LabelsPane({ url }) {
  const map = useMap();
  if (!map.getPane('labels')) {
    const pane = map.createPane('labels');
    pane.style.zIndex = '450';
    pane.style.pointerEvents = 'none';
  }
  return <TileLayer url={url} pane="labels" />;
}

export default function MapView({ geometry, byId, selectedId, bandFilter, basemap, onSelect }) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  // MapContainer renders its children only once Leaflet is ready, so the layer
  // is not available during the parent's first round of effects.
  const [layerReady, setLayerReady] = useState(false);
  // Leaflet event handlers are bound once, so they read the latest props from
  // here rather than from a stale closure.
  const latest = useRef({ byId, selectedId, bandFilter, onSelect });

  const attachLayer = useCallback((layer) => {
    layerRef.current = layer;
    setLayerReady(Boolean(layer));
  }, []);

  useEffect(() => {
    latest.current = { byId, selectedId, bandFilter, onSelect };
    layerRef.current?.eachLayer((layer) => {
      const iso3 = layer.feature?.id;
      layer.setStyle(computeStyle(iso3, latest.current));
      layer.setTooltipContent(tooltipFor(iso3, byId, layer.feature));
    });
  }, [byId, selectedId, bandFilter, onSelect]);

  useEffect(() => {
    if (!selectedId || !mapRef.current || !layerRef.current) return;
    let bounds = null;
    layerRef.current.eachLayer((layer) => {
      if (layer.feature?.id === selectedId) bounds = layer.getBounds();
    });
    if (!bounds) return;
    mapRef.current.flyToBounds(bounds, {
      padding: [60, 60],
      maxZoom: 5,
      duration: prefersReducedMotion() ? 0 : 1.1,
    });
  }, [selectedId, layerReady]);

  const onEachFeature = useCallback((feature, layer) => {
    layer.bindTooltip(tooltipFor(feature.id, latest.current.byId, feature), {
      sticky: true,
      direction: 'top',
      className: 'glorisk-tooltip',
      opacity: 1,
    });
    layer.on({
      mouseover: (event) => {
        event.target.setStyle({ weight: 2, color: '#ffffff' });
        event.target.bringToFront();
      },
      mouseout: (event) => event.target.setStyle(computeStyle(event.target.feature?.id, latest.current)),
      click: (event) => {
        const iso3 = event.target.feature?.id;
        if (latest.current.byId.has(iso3)) latest.current.onSelect(iso3);
      },
    });
  }, []);

  const tiles = BASEMAPS[basemap] ?? BASEMAPS.dark;

  return (
    <MapContainer
      ref={mapRef}
      center={[25, 10]}
      zoom={2}
      minZoom={2}
      maxZoom={7}
      worldCopyJump
      zoomControl={false}
      preferCanvas
      maxBounds={[[-85, -190], [85, 190]]}
      maxBoundsViscosity={0.8}
      style={{ height: '100%', width: '100%', background: '#09090b' }}
    >
      <TileLayer url={tiles.url} attribution={tiles.attribution} />
      {geometry && (
        <GeoJSON
          ref={attachLayer}
          data={geometry}
          style={(feature) => computeStyle(feature.id, { byId, selectedId, bandFilter })}
          onEachFeature={onEachFeature}
        />
      )}
      <LabelsPane url={tiles.labels} />
      <ZoomControl position="bottomright" />
    </MapContainer>
  );
}
