import { Hero } from '../components/Hero';
import { FeatureCard } from '../components/FeatureCard';

export function Home() {
  const features = [
    {
      icon: '✨',
      title: 'Elegant Aesthetics',
      description: 'Moving beyond the standard neon and purple for a more refined visual experience.',
      delay: '0.2s'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Built on modern web technologies ensuring rapid load times and smooth interactions.',
      delay: '0.4s'
    },
    {
      icon: '🌗',
      title: 'Dynamic Themes',
      description: 'Seamlessly transition between light and dark modes tailored to your environment.',
      delay: '0.6s'
    }
  ];

  return (
    <>
      <Hero />
      <section id="features" className="features-section container">
        <div className="feature-grid">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={feature.delay}
            />
          ))}
        </div>
      </section>
    </>
  );
}
