import TemperatureControl from "./TemperatureControl";
import KPISection from "./KPISection";
import DevicesRow from "./DevicesRow";

function MainPanel() {
  return (
    <div className="flex-1 p-6 space-y-6">

      <TemperatureControl />

      <KPISection />

      <DevicesRow />

    </div>
  );
}

export default MainPanel;