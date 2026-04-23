function EnergyCard({ title, value }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.1)",
      padding: "15px",
      borderRadius: "10px",
      color: "white"
    }}>
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

export default EnergyCard;