import { useEffect, useState } from 'react';
import { X, Star, Download, Lock, TrendingUp } from 'lucide-react';
import useMapStore from '../stores/mapStore';
import useAuthStore from '../stores/authStore';
import { fetchTransactions, addToWatchlist, exportCsv } from '../lib/api';

function formatPrice(value) {
  if (value === undefined || value === null) return '--';
  return '$' + Math.round(value).toLocaleString();
}

function formatNumber(value) {
  if (value === undefined || value === null) return '--';
  return Math.round(value).toLocaleString();
}

export default function DetailPanel({ mobile }) {
  const { selectedArea, clearSelection, metric, period, flatType, showUpgradeModal } = useMapStore();
  const { tier } = useAuthStore();

  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [watchlisted, setWatchlisted] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isPro = tier === 'pro' || tier === 'enterprise';

  useEffect(() => {
    if (!selectedArea?.name) return;
    let cancelled = false;

    async function loadTx() {
      setTxLoading(true);
      try {
        const params = {
          planning_area: selectedArea.name,
          period,
        };
        if (flatType !== 'all') params.flat_type = flatType;
        const data = await fetchTransactions(params);
        if (!cancelled) {
          setTransactions(Array.isArray(data) ? data : data.transactions || []);
        }
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
      } finally {
        if (!cancelled) setTxLoading(false);
      }
    }

    loadTx();
    return () => { cancelled = true; };
  }, [selectedArea?.name, period, flatType]);

  const handleWatchlist = async () => {
    if (!isPro) {
      showUpgradeModal('Watchlist');
      return;
    }
    try {
      await addToWatchlist({
        area_name: selectedArea.name,
        area_type: 'planning_area',
      });
      setWatchlisted(true);
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
    }
  };

  const handleExport = async () => {
    if (!isPro) {
      showUpgradeModal('CSV Export');
      return;
    }
    setExporting(true);
    try {
      const csv = await exportCsv({
        planning_area: selectedArea.name,
        period,
        ...(flatType !== 'all' ? { flat_type: flatType } : {}),
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedArea.name.toLowerCase().replace(/\s+/g, '_')}_transactions.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  if (!selectedArea) return null;

  const metrics = selectedArea.metrics || {};
  const avgPsf = metrics.avg_psf ?? metrics.value;
  const medianPrice = metrics.median_price;
  const volume = metrics.volume ?? metrics.transaction_count;
  const avgFloorArea = metrics.avg_floor_area ?? metrics.floor_area;

  // Simple sparkline data (mock quarters)
  const sparkData = [
    metrics.q1 ?? (avgPsf ? avgPsf * 0.92 : 60),
    metrics.q2 ?? (avgPsf ? avgPsf * 0.96 : 72),
    metrics.q3 ?? (avgPsf ? avgPsf * 0.98 : 68),
    metrics.q4 ?? (avgPsf ? avgPsf * 1.0 : 80),
  ];
  const sparkMax = Math.max(...sparkData);

  const visibleTransactions = isPro ? transactions : transactions.slice(0, 3);

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-slate-700">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white truncate">{selectedArea.name}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Planning Area</p>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={handleWatchlist}
            className={`p-1.5 rounded-lg transition-colors ${
              watchlisted
                ? 'text-amber-400 bg-amber-400/10'
                : isPro
                ? 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                : 'text-slate-600 hover:text-slate-400'
            }`}
            title={isPro ? 'Save to watchlist' : 'Upgrade to use watchlist'}
          >
            <Star className={`w-5 h-5 ${watchlisted ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={clearSelection}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1 p-4 space-y-5">
        {/* Primary metric */}
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">
            {metric === 'avg_psf' ? 'Avg Price per Sq Ft' : metric === 'median_price' ? 'Median Price' : 'Transaction Volume'}
          </p>
          <p className="text-3xl font-bold text-white">
            {metric === 'volume' ? formatNumber(volume) : formatPrice(avgPsf)}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Median</p>
            <p className="text-sm font-semibold text-white mt-0.5">{formatPrice(medianPrice)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Volume</p>
            <p className="text-sm font-semibold text-white mt-0.5">{formatNumber(volume)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">Avg Area</p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {avgFloorArea ? `${Math.round(avgFloorArea)} sqft` : '--'}
            </p>
          </div>
        </div>

        {/* Sparkline (Pro only) */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-slate-300">Quarterly Trend</span>
            </div>
            {!isPro && (
              <button
                onClick={() => showUpgradeModal('YoY Price Trend')}
                className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300"
              >
                <Lock className="w-3 h-3" /> Pro
              </button>
            )}
          </div>

          {isPro ? (
            <svg viewBox="0 0 200 60" className="w-full h-12">
              {sparkData.map((val, i) => {
                const barHeight = sparkMax > 0 ? (val / sparkMax) * 50 : 10;
                const x = i * 52 + 4;
                return (
                  <rect
                    key={i}
                    x={x}
                    y={60 - barHeight}
                    width={40}
                    height={barHeight}
                    rx={4}
                    fill={i === sparkData.length - 1 ? '#3b82f6' : '#334155'}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="relative">
              <svg viewBox="0 0 200 60" className="w-full h-12 opacity-30 blur-[2px]">
                {sparkData.map((val, i) => {
                  const barHeight = sparkMax > 0 ? (val / sparkMax) * 50 : 10;
                  const x = i * 52 + 4;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={60 - barHeight}
                      width={40}
                      height={barHeight}
                      rx={4}
                      fill="#334155"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => showUpgradeModal('YoY Price Trend')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  <Lock className="w-3 h-3" />
                  Upgrade to see trends
                </button>
              </div>
            </div>
          )}

          {isPro && (
            <div className="flex justify-between mt-1 text-[10px] text-slate-500">
              <span>Q1</span>
              <span>Q2</span>
              <span>Q3</span>
              <span>Q4</span>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
            {isPro && transactions.length > 0 && (
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? 'Exporting...' : 'CSV'}
              </button>
            )}
          </div>

          {txLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">No transactions found</p>
            </div>
          ) : (
            <div className="relative">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700">
                      <th className="text-left py-2 pr-2 font-medium">Month</th>
                      <th className="text-left py-2 pr-2 font-medium">Type</th>
                      <th className="text-left py-2 pr-2 font-medium">Storey</th>
                      <th className="text-right py-2 pr-2 font-medium">Price</th>
                      <th className="text-right py-2 font-medium">PSF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTransactions.map((tx, i) => (
                      <tr
                        key={i}
                        className="border-b border-slate-800 text-slate-300 hover:bg-slate-800/50"
                      >
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {tx.month || tx.transaction_month || '--'}
                        </td>
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {tx.flat_type || tx.type || '--'}
                        </td>
                        <td className="py-2 pr-2 whitespace-nowrap">
                          {tx.storey_range || tx.storey || '--'}
                        </td>
                        <td className="py-2 pr-2 text-right whitespace-nowrap font-medium text-white">
                          {formatPrice(tx.resale_price || tx.price)}
                        </td>
                        <td className="py-2 text-right whitespace-nowrap">
                          {tx.price_per_sqft || tx.psf
                            ? `$${Math.round(tx.price_per_sqft || tx.psf).toLocaleString()}`
                            : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Blur overlay for free users */}
              {!isPro && transactions.length > 3 && (
                <div className="relative mt-0">
                  {/* Blurred extra rows hint */}
                  <div className="overflow-hidden h-20 relative">
                    <table className="w-full text-xs opacity-40 blur-[3px]">
                      <tbody>
                        {transactions.slice(3, 6).map((tx, i) => (
                          <tr key={i} className="border-b border-slate-800 text-slate-300">
                            <td className="py-2 pr-2">{tx.month || '--'}</td>
                            <td className="py-2 pr-2">{tx.flat_type || '--'}</td>
                            <td className="py-2 pr-2">{tx.storey_range || '--'}</td>
                            <td className="py-2 pr-2 text-right">{formatPrice(tx.resale_price || tx.price)}</td>
                            <td className="py-2 text-right">--</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
                  </div>

                  {/* Upgrade CTA */}
                  <div className="flex flex-col items-center py-4">
                    <Lock className="w-5 h-5 text-slate-500 mb-2" />
                    <p className="text-sm text-slate-400 mb-2">
                      Upgrade to see all {transactions.length} transactions
                    </p>
                    <button
                      onClick={() => showUpgradeModal('Full Transaction List')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              )}

              {/* Transaction count for Pro */}
              {isPro && transactions.length > 0 && (
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Showing {transactions.length} transactions
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (mobile) {
    return (
      <div className="bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[70vh] flex flex-col shadow-2xl">
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-slate-600 rounded-full" />
        </div>
        {panelContent}
      </div>
    );
  }

  return (
    <div className="h-full bg-slate-900 border-l border-slate-700 flex flex-col">
      {panelContent}
    </div>
  );
}
