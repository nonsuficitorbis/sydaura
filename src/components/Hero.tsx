export function Hero() {
  return (
    <section className="hero container animate-fade-in">
      <div className="hero-content">
        <h1 className="hero-title">
          Discover the <br/>
          <span className="text-gradient">Future of Digital Spaces</span>
        </h1>
        <p className="hero-subtitle">
          Sydaura is a premium, beautifully crafted platform designed for clarity, focus, and aesthetics. 
          Switch between our Modern Minimalist and Dark Mode Luxury themes for your perfect environment.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary hover-lift">Get Started</button>
          <button className="btn btn-secondary hover-lift">Learn More</button>
        </div>
      </div>
      <div className="hero-visual">
        <div className="abstract-shape shape-1"></div>
        <div className="abstract-shape shape-2"></div>
        <div className="glass-card glass-panel hover-lift">
          <h3>Intelligent Design</h3>
          <p>Experience an interface that anticipates your needs.</p>
        </div>
      </div>
    </section>
  );
}
