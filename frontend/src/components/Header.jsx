import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, LogOut, Settings, Map } from 'lucide-react';
import useAuthStore from '../stores/authStore';

export default function Header() {
  const { user, tier, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isMapPage = location.pathname === '/app';

  const tierColors = {
    free: 'bg-emerald-600',
    pro: 'bg-blue-600',
    enterprise: 'bg-purple-600',
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="h-12 bg-slate-900 border-b border-slate-700 flex items-center justify-between px-4 z-50 flex-shrink-0">
      <Link to={user ? '/app' : '/'} className="flex items-center gap-2">
        <Map className="w-5 h-5 text-blue-500" />
        <span className="font-semibold text-sm text-white">SG Property Map</span>
      </Link>

      {user && (
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2"
          >
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${tierColors[tier] || tierColors.free} text-white`}>
              {tier}
            </span>
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
              {user.email?.[0]?.toUpperCase() || 'U'}
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1">
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
                {!isMapPage && (
                  <button onClick={() => { navigate('/app'); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                    <Map className="w-4 h-4" /> Map
                  </button>
                )}
                <button onClick={() => { navigate('/account'); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                  <Settings className="w-4 h-4" /> Account
                </button>
                <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
