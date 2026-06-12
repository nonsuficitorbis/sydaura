import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface QrCodeData {
  id: string;
  token: string;
}

interface Placement {
  id: string;
  name: string;
  qrCodes: QrCodeData[];
}

export const QrManager = () => {
  const [owner, setOwner] = useState<any>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [newTableName, setNewTableName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPlacements = async (locationId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/owner/placements?locationId=${locationId}`);
      if (!response.ok) throw new Error('Failed to load table placements');
      const data = await response.json();
      setPlacements(data);
    } catch (err: any) {
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

    fetchPlacements(parsed.location.id);
  }, [navigate]);

  const handleAddPlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim() || !owner?.location?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/owner/placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: owner.location.id,
          name: newTableName.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to add placement');

      setNewTableName('');
      fetchPlacements(owner.location.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlacement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table placement? All QR Codes linked to it will be invalidated.')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/v1/owner/placements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete placement');

      fetchPlacements(owner.location.id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!owner) return <div className="page-enter">Loading placements...</div>;

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-gradient">Table QR Manager</h2>
          <p className="text-secondary">{owner.venue.name} — {owner.location.name}</p>
        </div>
        <Link to="/owner/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Grid: Left - Add table, Right - Active Placements list */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        
        {/* Create Placement */}
        <div className="glass-card" style={{ height: 'fit-content' }}>
          <h3 className="text-gradient" style={{ marginBottom: '1.25rem' }}>Add New Table</h3>
          <form onSubmit={handleAddPlacement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Table or Placement Name</label>
              <input
                type="text"
                className="input-premium"
                placeholder="e.g. Table 15"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Adding...' : 'Generate QR & Table'}
            </button>
          </form>
        </div>

        {/* List Placements */}
        <div className="glass-card">
          <h3 className="text-gradient" style={{ marginBottom: '1.25rem' }}>Active Placements ({placements.length})</h3>
          
          {placements.length === 0 ? (
            <p className="text-secondary" style={{ fontStyle: 'italic' }}>
              No placements defined. Use the panel on the left to add your first table!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {placements.map((p) => {
                const qrToken = p.qrCodes[0]?.token || '';
                const scanUrl = `/join/${qrToken}`;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      padding: '1rem',
                      borderRadius: '16px',
                    }}
                  >
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{p.name}</h4>
                      <p className="text-secondary" style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
                        Token: <code style={{ color: 'var(--accent-primary)' }}>{qrToken}</code>
                      </p>
                      <Link 
                        to={scanUrl} 
                        target="_blank" 
                        style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}
                      >
                        [Mock Scan / Join]
                      </Link>
                    </div>
                    
                    <button
                      onClick={() => handleDeletePlacement(p.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ff4d4d',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: '0.5rem',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
