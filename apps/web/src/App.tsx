import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';

// Placeholder Pages
const Home = () => (
  <div className="glass-card page-enter">
    <h1 className="text-gradient">Welcome to Sydaura</h1>
    <p className="text-secondary" style={{ marginBottom: '1.5rem' }}>
      Turn your venue into a social gaming experience.
    </p>
    <Link to="/owner/login" className="btn-primary" style={{ textDecoration: 'none' }}>
      Owner Portal
    </Link>
  </div>
);

import { JoinSession } from './pages/guest/JoinSession';
import { Login } from './pages/owner/Login';
import { OnboardingWizard } from './pages/owner/OnboardingWizard';
import { Dashboard } from './pages/owner/Dashboard';
import { QrManager } from './pages/owner/QrManager';
import { QuestionPackManager } from './pages/owner/QuestionPackManager';
import { HostControl } from './pages/owner/HostControl';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <Link to="/" className="brand-logo text-gradient">Sydaura</Link>
          <nav>
            <Link to="/owner/login" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem' }}>
              Owner Login
            </Link>
          </nav>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/join/:qrToken" element={<JoinSession />} />
            <Route path="/owner/login" element={<Login />} />
            <Route path="/owner/onboarding" element={<OnboardingWizard />} />
            <Route path="/owner/dashboard" element={<Dashboard />} />
            <Route path="/owner/placements" element={<QrManager />} />
            <Route path="/owner/packs" element={<QuestionPackManager />} />
            <Route path="/owner/host/:sessionId" element={<HostControl />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
