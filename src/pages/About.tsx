export function About() {
  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', minHeight: '60vh', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '2rem' }}>About Sydaura</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>
        Sydaura is a next-generation platform designed to combine highly aesthetic, premium interfaces with 
        powerful functionality. Built for those who appreciate the finer details of software design.
      </p>
      <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
        We stepped away from the standard bright neons and deep purples to craft a workspace that is calm, focused, and adaptable to your environment.
      </p>
    </div>
  );
}
