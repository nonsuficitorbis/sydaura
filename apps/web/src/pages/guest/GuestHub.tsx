import React, { useState } from 'react';
import { Passport } from '../../components/profile/Passport';

interface SessionData {
  placement: { id: string; name: string };
  venue: { id: string; name: string; locationName: string };
  session: { id: string; status: string; prizeType: string | null } | null;
}

interface GuestHubProps {
  sessionData: SessionData;
  onSelectOption: (option: 'TRIVIA' | 'CASUAL') => void;
}

export const GuestHub: React.FC<GuestHubProps> = ({ sessionData, onSelectOption }) => {
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showPassport, setShowPassport] = useState(false);
  const [refVenueName, setRefVenueName] = useState('');
  const [refCity, setRefCity] = useState('');
  const [refOwnerContact, setRefOwnerContact] = useState('');
  const [refMessage, setRefMessage] = useState<string | null>(null);
  const [refLoading, setRefLoading] = useState(false);

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refVenueName || !refCity || !refOwnerContact) return;

    setRefLoading(true);
    setRefMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/guest/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueName: refVenueName,
          city: refCity,
          ownerContact: refOwnerContact,
          guestName: 'Anonymous Player'
        }),
      });

      if (!response.ok) throw new Error('Failed to submit referral');

      setRefMessage('🎉 Referral submitted successfully! Thank you for sharing the love.');
      setRefVenueName('');
      setRefCity('');
      setRefOwnerContact('');
    } catch (err: any) {
      setRefMessage('❌ Error submitting referral. Please try again.');
    } finally {
      setRefLoading(false);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '1rem auto' }}>
      
      {/* Venue Welcome Banner */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.2rem', margin: 0 }}>{sessionData.venue.name}</h1>
        <p className="text-secondary" style={{ fontSize: '1.1rem', marginTop: '0.25rem' }}>
          {sessionData.venue.locationName} — Sitting at <strong>{sessionData.placement.name}</strong>
        </p>
      </div>

      {/* Grid Menu Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
        
        {/* Live Trivia Card */}
        <div 
          className="glass-card hover-lift" 
          onClick={() => sessionData.session && onSelectOption('TRIVIA')}
          style={{ 
            cursor: sessionData.session ? 'pointer' : 'default',
            border: sessionData.session ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
            background: sessionData.session ? 'rgba(9, 121, 105, 0.05)' : 'rgba(26, 29, 36, 0.4)',
            opacity: sessionData.session ? 1 : 0.7
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {sessionData.session ? '🔴 Live Trivia Night' : '⚪ Trivia Night'}
              </h3>
              <p className="text-secondary" style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                {sessionData.session 
                  ? `Play now to win a ${sessionData.session.prizeType || 'Free appetizer'}!`
                  : 'No active game session right now. Ask your server when trivia begins!'
                }
              </p>
            </div>
            {sessionData.session && (
              <span style={{ background: 'var(--accent-primary)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                Join Live
              </span>
            )}
          </div>
        </div>

        {/* Casual Games Card */}
        <div 
          className="glass-card hover-lift" 
          onClick={() => onSelectOption('CASUAL')}
          style={{ cursor: 'pointer' }}
        >
          <h3 style={{ margin: 0 }}>🎮 2-Player Game Hub</h3>
          <p className="text-secondary" style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Challenge other guests at the lounge to quick games of Tic-Tac-Toe!
          </p>
        </div>

        {/* Refer a Venue Card */}
        <div 
          className="glass-card hover-lift" 
          onClick={() => setShowReferralModal(true)}
          style={{ cursor: 'pointer' }}
        >
          <h3 style={{ margin: 0 }}>🤝 Refer a Venue & Earn</h3>
          <p className="text-secondary" style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Introduce Sydaura to your favorite local spot and earn free drinks!
          </p>
        </div>

        {/* Passport / Stamp card */}
        <div 
          className="glass-card hover-lift" 
          onClick={() => setShowPassport(true)}
          style={{ cursor: 'pointer', border: '1px solid var(--accent-primary)', background: 'rgba(16, 185, 129, 0.03)' }}
        >
          <h3 style={{ margin: 0 }}>🎫 My Passport</h3>
          <p className="text-secondary" style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
            Earn stamps by visiting local venues, track streaks, and unlock achievements!
          </p>
        </div>

      </div>

      {/* Referral Modal Form overlay */}
      {showReferralModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 15, 15, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="glass-card page-enter" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
            <button 
              onClick={() => { setShowReferralModal(false); setRefMessage(null); }}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}
            >
              ×
            </button>

            <h2 className="text-gradient" style={{ marginBottom: '1rem' }}>Refer a Venue</h2>
            <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Know a local spot that needs trivia or loyalty stamp cards? Tell us, and if they sign up, we'll send you rewards!
            </p>

            {refMessage && (
              <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                {refMessage}
              </div>
            )}

            <form onSubmit={handleReferralSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Venue Name</label>
                <input 
                  type="text" 
                  className="input-premium" 
                  placeholder="e.g. Ashburn Brews" 
                  value={refVenueName}
                  onChange={(e) => setRefVenueName(e.target.value)}
                  required
                  disabled={refLoading}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>City</label>
                <input 
                  type="text" 
                  className="input-premium" 
                  placeholder="e.g. Ashburn, VA" 
                  value={refCity}
                  onChange={(e) => setRefCity(e.target.value)}
                  required
                  disabled={refLoading}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Owner or Manager Contact (Email/Phone)</label>
                <input 
                  type="text" 
                  className="input-premium" 
                  placeholder="e.g. manager@brews.com" 
                  value={refOwnerContact}
                  onChange={(e) => setRefOwnerContact(e.target.value)}
                  required
                  disabled={refLoading}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={refLoading}>
                {refLoading ? 'Submitting...' : 'Submit Referral'}
              </button>
            </form>
          </div>
        </div>
      )}
      {showPassport && (
        <Passport onClose={() => setShowPassport(false)} />
      )}

    </div>
  );
};
