import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const OnboardingWizard = () => {
  const [step, setStep] = useState(1);
  const [venueName, setVenueName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [newTable, setNewTable] = useState('');
  const [tables, setTables] = useState<string[]>(['Table 1', 'Table 2', 'Bar Seat A']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const ownerData = localStorage.getItem('owner');
    if (!ownerData) {
      navigate('/owner/login');
    }
  }, [navigate]);

  const addTable = () => {
    if (!newTable.trim()) return;
    if (tables.includes(newTable.trim())) {
      setError('Table/Placement name already exists');
      return;
    }
    setTables([...tables, newTable.trim()]);
    setNewTable('');
    setError(null);
  };

  const removeTable = (index: number) => {
    setTables(tables.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (!venueName.trim() || !locationName.trim()) {
      setError('Venue name and Location name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ownerData = JSON.parse(localStorage.getItem('owner') || '{}');
      const response = await fetch('http://localhost:3001/api/v1/owner/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: ownerData.accountId,
          venueName,
          locationName,
          placements: tables,
        }),
      });

      if (!response.ok) {
        throw new Error('Onboarding failed. Please try again.');
      }

      const result = await response.json();
      
      // Update local storage credentials with newly created venue/location
      const updatedOwner = {
        ...ownerData,
        needsOnboarding: false,
        venue: result.venue,
        location: result.location,
      };
      localStorage.setItem('owner', JSON.stringify(updatedOwner));

      navigate('/owner/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card page-enter" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
        <h3 className={step === 1 ? 'text-gradient' : 'text-secondary'}>1. Venue Details</h3>
        <h3 className={step === 2 ? 'text-gradient' : 'text-secondary'}>2. Game Placements</h3>
      </div>

      {error && (
        <div style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Venue Name</label>
            <input
              type="text"
              className="input-premium"
              placeholder="e.g. Emerald Lounge"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Default Location Name</label>
            <input
              type="text"
              className="input-premium"
              placeholder="e.g. Ashburn Main St"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              required
            />
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: '1rem', alignSelf: 'flex-end' }}
            onClick={() => {
              if (venueName.trim() && locationName.trim()) {
                setStep(2);
                setError(null);
              } else {
                setError('Please fill in both fields');
              }
            }}
          >
            Next Step
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p className="text-secondary">
            Placements represent your individual tables, bar seats, or private rooms where guests will scan the QR code to join.
          </p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              className="input-premium"
              placeholder="e.g. Table 4"
              value={newTable}
              onChange={(e) => setNewTable(e.target.value)}
            />
            <button className="btn-primary" onClick={addTable} style={{ whiteSpace: 'nowrap' }}>
              Add Placement
            </button>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>Active Placements:</h4>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {tables.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>{t}</span>
                  <button
                    onClick={() => removeTable(i)}
                    style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button
              className="btn-primary"
              style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Back
            </button>
            <button className="btn-primary" onClick={handleComplete} disabled={loading}>
              {loading ? 'Completing Setup...' : 'Finish Wizard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
