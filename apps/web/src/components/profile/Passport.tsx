import React, { useEffect, useState } from 'react';

interface Venue {
  id: string;
  name: string;
}

interface Visit {
  id: string;
  visitedAt: string;
  venue: Venue;
}

interface ProfileData {
  deviceHash: string;
  nickname: string | null;
  streakCount: number;
  badges: string[];
  visits: Visit[];
}

interface PassportProps {
  onClose: () => void;
}

const ALL_BADGES = [
  { id: 'FIRST_STEPS', label: 'First Steps 🐾', desc: 'Scan and join your very first venue session.' },
  { id: 'EXPLORER', label: 'Local Explorer 🗺️', desc: 'Visit 3 or more unique venues in the city.' },
  { id: 'LOYALIST', label: 'Lounge Loyalist 👑', desc: 'Visit the same venue 3 or more times.' },
  { id: 'DUEL_CHAMP', label: 'Duel Champion ⚔️', desc: 'Defeat an opponent in any 2-player casual duel.' }
];

export const Passport: React.FC<PassportProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let deviceHash = localStorage.getItem('sydaura_device_hash');
    if (!deviceHash) {
      deviceHash = 'dev-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sydaura_device_hash', deviceHash);
    }

    fetch(`http://localhost:3001/api/v1/profile/${deviceHash}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching profile:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(6, 9, 12, 0.96)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1.5rem',
      backdropFilter: 'blur(20px)'
    }}>
      <div className="glass-card page-enter" style={{ maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          ×
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 className="text-gradient-emerald">My Loyalty Passport</h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Track your streaks, stamps, and unlocked venue achievements.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }} className="pulse-animation">Loading passport...</div>
        ) : !profile ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Failed to load profile.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Streak & Info */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)',
              border: '1px solid rgba(16, 185, 129, 0.15)',
              borderRadius: '16px',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Streak Status</h4>
                <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>Play weekly to keep the flame alive!</p>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                🔥 {profile.streakCount}
              </div>
            </div>

            {/* Badges Section */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>Achievements & Badges</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {ALL_BADGES.map((b) => {
                  const unlocked = profile.badges.includes(b.id);
                  return (
                    <div 
                      key={b.id} 
                      style={{
                        padding: '0.75rem',
                        borderRadius: '12px',
                        background: unlocked ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255,255,255,0.01)',
                        border: unlocked ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255,255,255,0.04)',
                        opacity: unlocked ? 1 : 0.45,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: unlocked ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{b.label}</h4>
                      <p className="text-muted" style={{ fontSize: '0.75rem', margin: '0.25rem 0 0 0', lineHeight: 1.3 }}>{b.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visits Stamp Board */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>Passport Stamps</h3>
              {profile.visits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px dotted var(--border-subtle)', borderRadius: '12px' }}>
                  <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>No stamps collected yet. Scan location QR codes to collect stamps!</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {profile.visits.map((v) => (
                    <div 
                      key={v.id} 
                      style={{
                        padding: '1rem 0.5rem',
                        borderRadius: '50%',
                        width: '100px',
                        height: '100px',
                        margin: '0 auto',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '2px dashed var(--accent-primary)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transform: 'rotate(-5deg)',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-primary)', textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '90%' }}>
                        {v.venue.name}
                      </span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {new Date(v.visitedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.1rem' }}>✓</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
