export function Dashboard() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '60vh' }}>
      <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Dashboard</h1>
      <p className="hero-subtitle">Welcome back to your workspace.</p>
      
      <div className="feature-grid" style={{ marginTop: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>Recent Projects</h3>
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>You have no recent projects yet.</p>
          <button className="btn btn-primary hover-lift" style={{ marginTop: '2rem' }}>Create New</button>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3>Analytics</h3>
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Overview of your activity this week.</p>
        </div>
      </div>
    </div>
  );
}
