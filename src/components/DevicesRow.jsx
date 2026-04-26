function DevicesRow() {
  return (
    <div className="grid grid-cols-4 gap-4">

      <Device name="Humidifier" />
      <Device name="Speaker" />
      <Device name="Smart TV" />
      <Device name="CCTV" />

    </div>
  );
}

function Device({ name }) {
  return (
    <div className="sh-glass sh-card p-4 rounded-xl flex justify-between">
      <span>{name}</span>
      <div className="w-10 h-5 bg-green-400 rounded-full"></div>
    </div>
  );
}

export default DevicesRow;