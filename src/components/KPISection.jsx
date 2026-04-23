function KPISection() {
  return (
    <div className="grid grid-cols-4 gap-4">

      <Card title="Consumption" value="1.1 KW" />
      <Card title="Humidity" value="50%" />
      <Card title="Temperature" value="16°C" />
      <Card title="Energy Usage" value="2.2 KW" />

    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 text-white">
      <p>{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}

export default KPISection;