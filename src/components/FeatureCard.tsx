import { ReactNode } from 'react';

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  delay?: string;
}

export function FeatureCard({ icon, title, description, delay = '0s' }: FeatureCardProps) {
  return (
    <div 
      className="feature-card glass-panel hover-lift animate-fade-in" 
      style={{ animationDelay: delay }}
    >
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
