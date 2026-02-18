import { create } from 'zustand';

const useMapStore = create((set) => ({
  granularity: 'planning_area',
  metric: 'avg_psf',
  period: '12m',
  flatType: 'all',
  selectedArea: null,
  detailPanelOpen: false,
  upgradeModalOpen: false,
  upgradeFeature: '',
  viewState: {
    latitude: 1.3521,
    longitude: 103.8198,
    zoom: 11,
    pitch: 0,
    bearing: 0,
  },
  metricsData: {},
  geojsonData: null,
  loading: false,

  setGranularity: (granularity) => set({ granularity }),
  setMetric: (metric) => set({ metric }),
  setPeriod: (period) => set({ period }),
  setFlatType: (flatType) => set({ flatType }),
  selectArea: (area) => set({ selectedArea: area, detailPanelOpen: true }),
  clearSelection: () => set({ selectedArea: null, detailPanelOpen: false }),
  setViewState: (viewState) => set({ viewState }),
  setMetricsData: (metricsData) => set({ metricsData }),
  setGeojsonData: (geojsonData) => set({ geojsonData }),
  setLoading: (loading) => set({ loading }),
  showUpgradeModal: (feature) => set({ upgradeModalOpen: true, upgradeFeature: feature }),
  hideUpgradeModal: () => set({ upgradeModalOpen: false, upgradeFeature: '' }),
}));

export default useMapStore;
