export default function StatCard({ icon, value, label, variant = 'primary' }) {
  return (
    <div className={`card stat-card ${variant}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
