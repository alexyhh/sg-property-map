import { useEffect, useState, useCallback, useMemo } from 'react';
import MapGL, { NavigationControl } from 'react-map-gl/maplibre';
import { GeoJsonLayer } from '@deck.gl/layers';
import { DeckGL } from '@deck.gl/react';
import 'maplibre-gl/dist/maplibre-gl.css';
import useMapStore from '../stores/mapStore';
import { fetchPlanningAreas, fetchMetricsSummary } from '../lib/api';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

function getColor(value, min, max) {
  if (value === undefined || value === null) return [100, 100, 100, 120];
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
  const g = Math.round(t < 0.5 ? 128 + t * 255 : 255 - (t - 0.5) * 2 * 255);
  const b = Math.round(t < 0.5 ? 255 - t * 2 * 255 : 0);
  return [r, g, b, 200];
}

function formatMetricValue(value, metric) {
  if (value === undefined || value === null) return 'N/A';
  if (metric === 'avg_psf' || metric === 'median_price') {
    return `$${Math.round(value).toLocaleString()}`;
  }
  if (metric === 'volume') {
    return value.toLocaleString();
  }
  return String(value);
}

export default function MapView() {
  const {
    viewState,
    setViewState,
    metric,
    period,
    flatType,
    granularity,
    geojsonData,
    setGeojsonData,
    metricsData,
    setMetricsData,
    loading,
    setLoading,
    selectArea,
  } = useMapStore();

  const [tooltip, setTooltip] = useState(null);

  // Fetch GeoJSON on mount and when granularity changes
  useEffect(() => {
    let cancelled = false;

    async function loadGeo() {
      setLoading(true);
      try {
        const data = await fetchPlanningAreas();
        if (!cancelled) {
          setGeojsonData(data);
        }
      } catch (err) {
        console.error('Failed to fetch geojson:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadGeo();
    return () => { cancelled = true; };
  }, [granularity, setGeojsonData, setLoading]);

  // Fetch bulk metrics for heatmap coloring
  useEffect(() => {
    let cancelled = false;

    async function loadMetrics() {
      setLoading(true);
      try {
        const params = { metric, period, level: granularity };
        if (flatType !== 'all') params.flat_type = flatType;
        const data = await fetchMetricsSummary(params);
        if (!cancelled) {
          const metricsMap = {};
          if (Array.isArray(data)) {
            data.forEach((item) => {
              const key = item.planning_area || item.area_name || item.name;
              if (key) metricsMap[key] = item;
            });
          } else if (data && typeof data === 'object') {
            Object.assign(metricsMap, data);
          }
          setMetricsData(metricsMap);
        }
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMetrics();
    return () => { cancelled = true; };
  }, [metric, period, flatType, granularity, setMetricsData, setLoading]);

  // Compute min/max from metrics
  const { minVal, maxVal } = useMemo(() => {
    const values = Object.values(metricsData)
      .map((m) => m[metric] ?? m.value)
      .filter((v) => v !== undefined && v !== null);
    if (values.length === 0) return { minVal: 0, maxVal: 1 };
    return {
      minVal: Math.min(...values),
      maxVal: Math.max(...values),
    };
  }, [metricsData, metric]);

  const handleClick = useCallback(
    (info) => {
      if (info.object) {
        const areaName =
          info.object.properties?.PLN_AREA_N ||
          info.object.properties?.name ||
          info.object.properties?.Name ||
          'Unknown';
        const areaMetrics = metricsData[areaName] || {};
        selectArea({
          name: areaName,
          properties: info.object.properties,
          metrics: areaMetrics,
        });
      }
    },
    [metricsData, selectArea]
  );

  const handleHover = useCallback(
    (info) => {
      if (info.object) {
        const areaName =
          info.object.properties?.PLN_AREA_N ||
          info.object.properties?.name ||
          info.object.properties?.Name ||
          'Unknown';
        const areaMetrics = metricsData[areaName] || {};
        const value = areaMetrics[metric] ?? areaMetrics.value;
        setTooltip({
          x: info.x,
          y: info.y,
          name: areaName,
          value: formatMetricValue(value, metric),
        });
      } else {
        setTooltip(null);
      }
    },
    [metricsData, metric]
  );

  const layers = useMemo(() => {
    if (!geojsonData) return [];

    return [
      new GeoJsonLayer({
        id: 'planning-areas',
        data: geojsonData,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        lineWidthMinPixels: 1,
        getFillColor: (feature) => {
          const areaName =
            feature.properties?.PLN_AREA_N ||
            feature.properties?.name ||
            feature.properties?.Name;
          const areaMetrics = metricsData[areaName] || {};
          const value = areaMetrics[metric] ?? areaMetrics.value;
          return getColor(value, minVal, maxVal);
        },
        getLineColor: [255, 255, 255, 60],
        getLineWidth: 1,
        onClick: handleClick,
        onHover: handleHover,
        updateTriggers: {
          getFillColor: [metricsData, metric, minVal, maxVal],
        },
      }),
    ];
  }, [geojsonData, metricsData, metric, minVal, maxVal, handleClick, handleHover]);

  return (
    <div className="w-full h-full relative">
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: vs }) => setViewState(vs)}
        controller={true}
        layers={layers}
        getCursor={({ isHovering }) => (isHovering ? 'pointer' : 'grab')}
      >
        <MapGL
          mapStyle={MAP_STYLE}
          attributionControl={false}
        >
          <NavigationControl position="top-right" />
        </MapGL>
      </DeckGL>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-xl"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 12,
            transform: 'translateY(-100%)',
          }}
        >
          <p className="text-xs font-semibold text-white">{tooltip.name}</p>
          <p className="text-xs text-slate-300">{tooltip.value}</p>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/40 pointer-events-none">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3 shadow-xl">
            <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-slate-300">Loading data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
