import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Trash2, Crown, LogOut } from 'lucide-react';
import Header from '../components/Header';
import useAuthStore from '../stores/authStore';
import { fetchWatchlist, removeFromWatchlist } from '../lib/api';

export default function AccountPage() {
  const { user, tier, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const tierConfig = {
    free: { label: 'Free', color: 'bg-emerald-600', textColor: 'text-emerald-400' },
    pro: { label: 'Pro', color: 'bg-blue-600', textColor: 'text-blue-400' },
    enterprise: { label: 'Enterprise', color: 'bg-purple-600', textColor: 'text-purple-400' },
  };

  const currentTier = tierConfig[tier] || tierConfig.free;

  useEffect(() => {
    if (tier === 'pro' || tier === 'enterprise') {
      loadWatchlist();
    }
  }, [tier]);

  const loadWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      const data = await fetchWatchlist();
      setWatchlist(data.watchlist || data || []);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleRemoveFromWatchlist = async (id) => {
    try {
      await removeFromWatchlist(id);
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950" style={{ overflow: 'hidden' }}>
      <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Back link */}
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>

          {/* Profile Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                {displayName[0]?.toUpperCase() || 'U'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white font-medium truncate">{displayName}</h3>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${currentTier.color} text-white`}
                  >
                    {currentTier.label}
                  </span>
                </div>
                <p className="text-slate-400 text-sm truncate">{user?.email}</p>
              </div>
            </div>

            {/* Upgrade button for free users */}
            {tier === 'free' && (
              <div className="mt-6 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-semibold text-white">Upgrade to Pro</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Unlock district views, full transaction history, CSV export, and more.
                </p>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors">
                  Upgrade to Pro -- S$29/mo
                </button>
              </div>
            )}
          </div>

          {/* Watchlist Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                Watchlist
              </h2>
              {(tier === 'pro' || tier === 'enterprise') && watchlist.length > 0 && (
                <span className="text-xs text-slate-500">{watchlist.length}/10 areas</span>
              )}
            </div>

            {tier === 'free' ? (
              <div className="text-center py-8">
                <Star className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Watchlist is a Pro feature</p>
                <p className="text-slate-500 text-xs">
                  Upgrade to save and track up to 10 areas.
                </p>
              </div>
            ) : watchlistLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : watchlist.length === 0 ? (
              <div className="text-center py-8">
                <Star className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No saved areas yet</p>
                <p className="text-slate-500 text-xs">
                  Click the star icon on the map to save areas to your watchlist.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {watchlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{item.area_name || item.name}</p>
                      <p className="text-xs text-slate-400">
                        {item.area_type === 'planning_area' ? 'Planning Area' : item.area_type === 'district' ? 'District' : item.area_type}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromWatchlist(item.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full py-3 bg-slate-900 border border-slate-800 hover:border-red-500/30 text-red-400 rounded-xl transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
