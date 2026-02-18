import { Map, Grid3x3, MapPin, Lock, ChevronDown } from 'lucide-react';
import useMapStore from '../stores/mapStore';
import useAuthStore from '../stores/authStore';

const GRANULARITY_OPTIONS = [
  { value: 'planning_area', label: 'Area', icon: Map, free: true },
  { value: 'district', label: 'District', icon: Grid3x3, free: false },
  { value: 'land_plot', label: 'Plot', icon: MapPin, free: false },
];

const METRIC_OPTIONS = [
  { value: 'avg_psf', label: 'Avg PSF ($/sqft)', free: true },
  { value: 'median_price', label: 'Median Price ($)', free: false },
  { value: 'volume', label: 'Transaction Volume', free: false },
];

const PERIOD_OPTIONS = [
  { value: '3m', label: '3M', free: false },
  { value: '6m', label: '6M', free: false },
  { value: '12m', label: '1Y', free: true },
  { value: '3y', label: '3Y', free: false },
  { value: '5y', label: '5Y', free: false },
];

const FLAT_TYPE_OPTIONS = [
  { value: 'all', label: 'All Types', free: true },
  { value: '2-room', label: '2 Room', free: false },
  { value: '3-room', label: '3 Room', free: false },
  { value: '4-room', label: '4 Room', free: false },
  { value: '5-room', label: '5 Room', free: false },
  { value: 'executive', label: 'Executive', free: false },
];

function getColor(t) {
  const r = Math.round(t < 0.5 ? t * 2 * 255 : 255);
  const g = Math.round(t < 0.5 ? 128 + t * 255 : 255 - (t - 0.5) * 2 * 255);
  const b = Math.round(t < 0.5 ? 255 - t * 2 * 255 : 0);
  return `rgb(${r},${g},${b})`;
}

export default function ControlPanel({ mobile }) {
  const { granularity, metric, period, flatType, setGranularity, setMetric, setPeriod, setFlatType, showUpgradeModal } = useMapStore();
  const { tier } = useAuthStore();

  const isPro = tier === 'pro' || tier === 'enterprise';

  const handleLockedClick = (featureName) => {
    showUpgradeModal(featureName);
  };

  // Mobile: compact horizontal bar
  if (mobile) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 p-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {/* Granularity buttons */}
          {GRANULARITY_OPTIONS.map((opt) => {
            const isLocked = !opt.free && !isPro;
            const isActive = granularity === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => isLocked ? handleLockedClick(opt.label + ' View') : setGranularity(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isLocked ? <Lock className="w-3 h-3" /> : <opt.icon className="w-3 h-3" />}
                {opt.label}
              </button>
            );
          })}

          <div className="w-px h-6 bg-slate-700 flex-shrink-0" />

          {/* Period buttons */}
          {PERIOD_OPTIONS.map((opt) => {
            const isLocked = !opt.free && !isPro;
            const isActive = period === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => isLocked ? handleLockedClick('Time Range') : setPeriod(opt.value)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isLocked && <Lock className="w-3 h-3" />}
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop: full sidebar
  return (
    <div className="h-full bg-slate-900 border-r border-slate-700 overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Granularity */}
        <div>
          <h3 className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider mb-2">
            Map Layer
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {GRANULARITY_OPTIONS.map((opt) => {
              const isLocked = !opt.free && !isPro;
              const isActive = granularity === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => isLocked ? handleLockedClick(opt.label + ' View') : setGranularity(opt.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white'
                  }`}
                >
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-slate-500" />
                  ) : (
                    <opt.icon className="w-4 h-4" />
                  )}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Metric */}
        <div>
          <h3 className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider mb-2">
            Metric
          </h3>
          <div className="relative">
            <select
              value={metric}
              onChange={(e) => {
                const selected = METRIC_OPTIONS.find((o) => o.value === e.target.value);
                if (selected && !selected.free && !isPro) {
                  handleLockedClick('Metric');
                  return;
                }
                setMetric(e.target.value);
              }}
              className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {METRIC_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {!opt.free && !isPro ? '(Pro)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Time Range */}
        <div>
          <h3 className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider mb-2">
            Time Range
          </h3>
          <div className="flex gap-1.5">
            {PERIOD_OPTIONS.map((opt) => {
              const isLocked = !opt.free && !isPro;
              const isActive = period === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => isLocked ? handleLockedClick('Time Range') : setPeriod(opt.value)}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {isLocked && <Lock className="w-3 h-3" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Flat Type */}
        <div>
          <h3 className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider mb-2">
            Flat Type
          </h3>
          <div className="relative">
            <select
              value={flatType}
              onChange={(e) => {
                const selected = FLAT_TYPE_OPTIONS.find((o) => o.value === e.target.value);
                if (selected && !selected.free && !isPro) {
                  handleLockedClick('Flat Type Filter');
                  return;
                }
                setFlatType(e.target.value);
              }}
              className="w-full appearance-none bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {FLAT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} {!opt.free && !isPro ? '(Pro)' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* Color Legend */}
        <div>
          <h3 className="text-[11px] uppercase font-semibold text-slate-500 tracking-wider mb-2">
            Legend
          </h3>
          <div className="bg-slate-800 rounded-lg p-3">
            <div
              className="h-3 rounded-full mb-2"
              style={{
                background: `linear-gradient(to right, ${getColor(0)}, ${getColor(0.25)}, ${getColor(0.5)}, ${getColor(0.75)}, ${getColor(1)})`,
              }}
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Low</span>
              <span>
                {metric === 'avg_psf'
                  ? '$/sqft'
                  : metric === 'median_price'
                  ? 'Price ($)'
                  : 'Volume'}
              </span>
              <span>High</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
