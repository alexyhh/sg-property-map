import Header from '../components/Header';
import MapView from '../components/MapView';
import ControlPanel from '../components/ControlPanel';
import DetailPanel from '../components/DetailPanel';
import UpgradeModal from '../components/UpgradeModal';
import useMapStore from '../stores/mapStore';

export default function MapPage() {
  const { detailPanelOpen, upgradeModalOpen } = useMapStore();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 relative flex overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block w-[280px] flex-shrink-0">
          <ControlPanel />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapView />

          {/* Mobile bottom controls */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-10">
            <ControlPanel mobile />
          </div>
        </div>

        {/* Detail panel */}
        {detailPanelOpen && (
          <div className="hidden md:block w-[380px] flex-shrink-0">
            <DetailPanel />
          </div>
        )}

        {/* Mobile detail sheet */}
        {detailPanelOpen && (
          <div className="md:hidden fixed inset-x-0 bottom-0 z-20">
            <DetailPanel mobile />
          </div>
        )}
      </div>

      {upgradeModalOpen && <UpgradeModal />}
    </div>
  );
}
