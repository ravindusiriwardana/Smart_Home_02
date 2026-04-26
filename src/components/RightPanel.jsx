function RightPanel() {
  return (
    <div className="w-80 p-6 space-y-6">

      {/* Camera */}
      <div className="sh-glass sh-card rounded-xl p-4">
        <h3>Drawing Room</h3>
        <img src="/room.jpg" className="rounded-lg mt-2" />
      </div>

      {/* Weather */}
      <div className="sh-glass sh-card rounded-xl p-4 text-center">
        <h2 className="text-3xl">28°C</h2>
        <p>Sunny</p>
      </div>

      {/* Devices */}
      <div className="space-y-3">
        <Device name="Light" />
        <Device name="AC" />
      </div>

    </div>
  );
}

function Device({ name }) {
  return (
    <div className="sh-glass sh-card p-3 rounded-xl flex justify-between">
      <span>{name}</span>
      <div className="w-10 h-5 bg-green-400 rounded-full"></div>
    </div>
  );
}

export default RightPanel;