import React, { useEffect, useState } from 'react';

interface Tournament {
  id: string;
  name: string;
  city: string;
  startDate: string;
  endDate: string;
}

interface LeaderboardEntry {
  deviceHash: string;
  nickname: string;
  score: number;
  totalAnswers: number;
}

interface TournamentHubProps {
  city: string;
  onClose: () => void;
}

export const TournamentHub: React.FC<TournamentHubProps> = ({ city, onClose }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLboard, setLoadingLboard] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/api/v1/tournament/active/${city || 'Ashburn'}`)
      .then((res) => res.json())
      .then((data) => {
        setTournaments(data);
        if (data.length > 0) {
          setSelectedTournament(data[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching tournaments:', err);
        setLoading(false);
      });
  }, [city]);

  useEffect(() => {
    if (!selectedTournament) return;
    setLoadingLboard(true);

    fetch(`http://localhost:3001/api/v1/tournament/${selectedTournament.id}/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        setLeaderboard(data.leaderboard);
        setLoadingLboard(false);
      })
      .catch((err) => {
        console.error('Error fetching tournament leaderboard:', err);
        setLoadingLboard(false);
      });
  }, [selectedTournament]);

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
          <h2 className="text-gradient-emerald">🏆 Citywide Tournaments</h2>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Compete across all venues in {city} for grand prizes!</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }} className="pulse-animation">Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-secondary">No active tournaments in {city} right now.</p>
            <p className="text-muted" style={{ fontSize: '0.8rem' }}>Check back during the next tournament cycle!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Tournament selector if multiple */}
            {tournaments.length > 1 && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select Tournament</label>
                <select 
                  className="input-premium" 
                  value={selectedTournament?.id || ''}
                  onChange={(e) => {
                    const found = tournaments.find((t) => t.id === e.target.value);
                    if (found) setSelectedTournament(found);
                  }}
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedTournament && (
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fbbf24', margin: 0 }}>{selectedTournament.name}</h3>
                <p className="text-muted" style={{ fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                  Ends: {new Date(selectedTournament.endDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            )}

            {/* City Leaderboard */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>City Standings (Top 10)</h3>
              
              {loadingLboard ? (
                <div style={{ textAlign: 'center', padding: '1.5rem' }} className="pulse-animation">Updating standings...</div>
              ) : leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px dotted var(--border-subtle)', borderRadius: '12px' }}>
                  <p className="text-secondary" style={{ margin: 0, fontSize: '0.85rem' }}>No tournament scores recorded yet. Be the first to score!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {leaderboard.map((player, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '0.75rem 1rem', 
                        background: idx === 0 ? 'rgba(251, 191, 36, 0.08)' : 'rgba(255, 255, 255, 0.02)', 
                        border: idx === 0 ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid var(--border-subtle)', 
                        borderRadius: '12px',
                        fontSize: '0.9rem' 
                      }}
                    >
                      <span style={{ fontWeight: idx < 3 ? 'bold' : 'normal' }}>
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`} {player.nickname}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{player.score} pts</span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{player.totalAnswers} answers</span>
                      </div>
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
