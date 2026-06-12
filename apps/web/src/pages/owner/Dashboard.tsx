import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface SessionInfo {
  id: string;
  prizeType: string;
  createdAt: string;
}

interface LeaderboardEntry {
  id: string;
  nickname: string;
  tableName: string;
  score: number;
}

interface Metrics {
  scansLast24h: number;
  activePlayers: number;
  leaderboard: LeaderboardEntry[];
}

export const Dashboard = () => {
  const [owner, setOwner] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<SessionInfo | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ scansLast24h: 0, activePlayers: 0, leaderboard: [] });
  const [error, setError] = useState<string | null>(null);
  const [prizeType, setPrizeType] = useState('Free Appetizer');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchDashboardData = async (locationId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/owner/dashboard?locationId=${locationId}`);
      if (!response.ok) throw new Error('Failed to load dashboard metrics');
      
      const data = await response.json();
      setActiveSession(data.activeSession);
      setMetrics(data.metrics);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    const ownerData = localStorage.getItem('owner');
    if (!ownerData) {
      navigate('/owner/login');
      return;
    }

    const parsed = JSON.parse(ownerData);
    setOwner(parsed);

    if (parsed.needsOnboarding) {
      navigate('/owner/onboarding');
      return;
    }

    fetchDashboardData(parsed.location.id);

    // Poll for real-time updates every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardData(parsed.location.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleStartSession = async () => {
    if (!owner?.location?.id) return;
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/v1/owner/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: owner.location.id,
          prizeType,
        }),
      });

      if (!response.ok) throw new Error('Failed to start session');
      
      const session = await response.json();
      setActiveSession(session);
      fetchDashboardData(owner.location.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/v1/owner/sessions/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: activeSession.id }),
      });

      if (!response.ok) throw new Error('Failed to end session');
      
      setActiveSession(null);
      fetchDashboardData(owner.location.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('owner');
    navigate('/owner/login');
  };

  if (!owner) return <div className="page-enter">Loading owner profile...</div>;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 className="text-gradient" style={{ margin: 0 }}>{owner.venue.name}</h2>
          <p className="text-secondary">{owner.location.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/owner/packs" className="btn-primary" style={{ textDecoration: 'none', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            Manage Trivia Packs
          </Link>
          <Link to="/owner/placements" className="btn-primary" style={{ textDecoration: 'none', background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
            Manage Tables & QRs
          </Link>
          <button className="btn-primary" onClick={handleLogout} style={{ background: '#3a0000', color: '#ffb3b3' }}>
            Sign Out
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Metric summary boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div className="glass-card">
          <h4 className="text-secondary">QR Scans (Last 24h)</h4>
          <p style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: 'var(--text-primary)' }}>
            {metrics.scansLast24h}
          </p>
        </div>
        <div className="glass-card">
          <h4 className="text-secondary">Active Game Players</h4>
          <p className="pulse-animation" style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: 'var(--accent-primary)' }}>
            {metrics.activePlayers}
          </p>
        </div>
        <div className="glass-card">
          <h4 className="text-secondary">Active Game Session</h4>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0.5rem 0 0 0', color: activeSession ? '#50c878' : '#ff4d4d' }}>
            {activeSession ? 'Live' : 'No Active Game'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        {/* Left Side: Session controller */}
        <div className="glass-card">
          <h3 className="text-gradient" style={{ marginBottom: '1.5rem' }}>Tonight's Game Controls</h3>
          
          {activeSession ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(9, 121, 105, 0.1)', border: '1px solid rgba(9, 121, 105, 0.3)', padding: '1rem', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>Active session is running!</p>
                <p className="text-secondary" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Prize Type: {activeSession.prizeType}</p>
                <p className="text-secondary" style={{ fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>Started: {new Date(activeSession.createdAt).toLocaleTimeString()}</p>
              </div>
              <Link to={`/owner/host/${activeSession.id}`} className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
                Open Host Control Panel
              </Link>
              <button className="btn-primary" style={{ background: '#a12a2a', width: '100%' }} onClick={handleEndSession} disabled={loading}>
                {loading ? 'Processing...' : 'End Live Trivia'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
                Choose a prize to motivate guests. Clicking "Start" makes all table QR codes joinable for gameplay.
              </p>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Prize Description</label>
                <input 
                  type="text" 
                  className="input-premium" 
                  placeholder="e.g. Free Dessert" 
                  value={prizeType} 
                  onChange={(e) => setPrizeType(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button className="btn-primary" style={{ width: '100%' }} onClick={handleStartSession} disabled={loading}>
                {loading ? 'Starting...' : 'Launch Live Trivia Session'}
              </button>
            </div>
          )}
        </div>

        {/* Right Side: Real-time Leaderboard */}
        <div className="glass-card">
          <h3 className="text-gradient" style={{ marginBottom: '1.5rem' }}>Live Leaderboard</h3>
          
          {metrics.leaderboard.length === 0 ? (
            <p className="text-secondary" style={{ fontStyle: 'italic' }}>
              No scores recorded yet. Launch a session and have guests scan table QRs to see results here!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {metrics.leaderboard.map((item, index) => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 'bold', marginRight: '0.5rem', color: index === 0 ? 'gold' : 'inherit' }}>
                      #{index + 1}
                    </span>
                    <span style={{ fontWeight: 500 }}>{item.nickname}</span>
                    <span className="text-secondary" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                      ({item.tableName})
                    </span>
                  </div>
                  <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                    {item.score} pts
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
