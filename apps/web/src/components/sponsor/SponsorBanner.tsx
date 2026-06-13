import React, { useEffect, useState } from 'react';

interface SponsorCampaign {
  id: string;
  name: string;
  logoUrl: string | null;
  promoText: string;
  promoUrl: string | null;
}

export const SponsorBanner: React.FC = () => {
  const [campaign, setCampaign] = useState<SponsorCampaign | null>(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/v1/sponsor/active')
      .then((res) => res.json())
      .then((data) => {
        if (data.length > 0) {
          // Select a random active campaign to display
          const randomIndex = Math.floor(Math.random() * data.length);
          setCampaign(data[randomIndex]);
        }
      })
      .catch((err) => console.error('Error fetching active sponsor campaign:', err));
  }, []);

  if (!campaign) return null;

  return (
    <a 
      href={campaign.promoUrl || '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.85rem 1.25rem',
        background: 'rgba(14, 19, 24, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3), 0 0 15px rgba(16, 185, 129, 0.08)',
        transition: 'all 0.2s ease',
        marginTop: '1rem',
      }}
      className="hover-lift"
    >
      {campaign.logoUrl ? (
        <img 
          src={campaign.logoUrl} 
          alt={campaign.name} 
          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} 
        />
      ) : (
        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>
          ★
        </div>
      )}
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sponsored by {campaign.name}
        </p>
        <p className="text-secondary" style={{ margin: '0.15rem 0 0 0', fontSize: '0.85rem', lineHeight: 1.3, fontWeight: 500 }}>
          {campaign.promoText}
        </p>
      </div>
      <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
        →
      </div>
    </a>
  );
};
