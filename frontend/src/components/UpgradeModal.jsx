import { X, Check, Lock } from 'lucide-react';
import useMapStore from '../stores/mapStore';

export default function UpgradeModal() {
  const { upgradeFeature, hideUpgradeModal } = useMapStore();

  const features = [
    { name: 'Planning area heatmap', free: true, pro: true },
    { name: 'District-level view', free: false, pro: true },
    { name: 'Land plot layer', free: false, pro: true },
    { name: 'All time ranges', free: false, pro: true },
    { name: 'Flat type filter', free: false, pro: true },
    { name: 'YoY price trend', free: false, pro: true },
    { name: 'Full transaction list', free: false, pro: true },
    { name: 'CSV export', free: false, pro: true },
    { name: 'Watchlist (10 areas)', free: false, pro: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={hideUpgradeModal} />
      <div className="relative bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full p-6">
        <button onClick={hideUpgradeModal} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Unlock {upgradeFeature || 'Pro Features'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Upgrade to Pro for full access to all map layers and data
          </p>
        </div>

        <div className="space-y-2 mb-6">
          {features.map((f) => (
            <div key={f.name} className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-300">{f.name}</span>
              <div className="flex gap-6">
                <span className="w-12 text-center">
                  {f.free ? <Check className="w-4 h-4 text-emerald-400 inline" /> : <span className="text-slate-600">&mdash;</span>}
                </span>
                <span className="w-12 text-center">
                  {f.pro ? <Check className="w-4 h-4 text-blue-400 inline" /> : <span className="text-slate-600">&mdash;</span>}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-700">
            <span></span>
            <div className="flex gap-6">
              <span className="w-12 text-center">Free</span>
              <span className="w-12 text-center">Pro</span>
            </div>
          </div>
        </div>

        <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
          Upgrade to Pro &mdash; S$29/mo
        </button>
        <button onClick={hideUpgradeModal} className="w-full py-2 text-slate-400 text-sm hover:text-slate-300 mt-2">
          Maybe later
        </button>
      </div>
    </div>
  );
}
