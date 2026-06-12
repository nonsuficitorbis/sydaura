import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

interface Question {
  id?: string;
  text: string;
  options: string[];
  correctOption: string;
}

interface QuestionPack {
  id: string;
  name: string;
  questions: Question[];
}

export const QuestionPackManager = () => {
  const [packs, setPacks] = useState<QuestionPack[]>([]);
  const [packName, setPackName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Single question form state
  const [qText, setQText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPacks = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/owner/packs');
      if (!response.ok) throw new Error('Failed to load question packs');
      const data = await response.json();
      setPacks(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const ownerData = localStorage.getItem('owner');
    if (!ownerData) {
      navigate('/owner/login');
      return;
    }
    fetchPacks();
  }, [navigate]);

  const handleAddQuestion = () => {
    if (!qText.trim() || !opt1.trim() || !opt2.trim() || !opt3.trim() || !opt4.trim() || !correctOption) {
      setError('Please fill in all question fields and select the correct option');
      return;
    }

    const options = [opt1.trim(), opt2.trim(), opt3.trim(), opt4.trim()];
    if (!options.includes(correctOption)) {
      setError('Correct option must match one of the answer choices exactly');
      return;
    }

    const newQuestion: Question = {
      text: qText.trim(),
      options,
      correctOption: correctOption.trim()
    };

    setQuestions([...questions, newQuestion]);
    
    // Clear question form
    setQText('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setOpt4('');
    setCorrectOption('');
    setError(null);
  };

  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packName.trim()) {
      setError('Pack name is required');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question to the pack');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/owner/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: packName.trim(),
          questions
        }),
      });

      if (!response.ok) throw new Error('Failed to save question pack');

      setPackName('');
      setQuestions([]);
      fetchPacks();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePack = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question pack? This action cannot be undone.')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/v1/owner/packs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete pack');
      fetchPacks();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="text-gradient">Question Pack Manager</h2>
          <p className="text-secondary">Create and manage your custom trivia games.</p>
        </div>
        <Link to="/owner/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Grid: Left side - Create custom packs, Right side - Pack List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Creator Panel */}
        <div className="glass-card">
          <h3 className="text-gradient" style={{ marginBottom: '1.25rem' }}>Create Question Pack</h3>
          
          <form onSubmit={handleCreatePack} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Pack Title</label>
              <input
                type="text"
                className="input-premium"
                placeholder="e.g. 90s Pop Culture Trivia"
                value={packName}
                onChange={(e) => setPackName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Questions section */}
            <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '1rem', background: 'rgba(0,0,0,0.1)' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem' }}>Add Question</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  className="input-premium"
                  placeholder="Question text (e.g. Which band sang 'Barbie Girl'?)"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <input type="text" className="input-premium" placeholder="Option A" value={opt1} onChange={(e) => setOpt1(e.target.value)} />
                  <input type="text" className="input-premium" placeholder="Option B" value={opt2} onChange={(e) => setOpt2(e.target.value)} />
                  <input type="text" className="input-premium" placeholder="Option C" value={opt3} onChange={(e) => setOpt3(e.target.value)} />
                  <input type="text" className="input-premium" placeholder="Option D" value={opt4} onChange={(e) => setOpt4(e.target.value)} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Correct Answer</label>
                  <select
                    className="input-premium"
                    value={correctOption}
                    onChange={(e) => setCorrectOption(e.target.value)}
                    style={{ width: '100%', appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    <option value="">-- Choose Correct Option --</option>
                    {opt1.trim() && <option value={opt1}>{opt1}</option>}
                    {opt2.trim() && <option value={opt2}>{opt2}</option>}
                    {opt3.trim() && <option value={opt3}>{opt3}</option>}
                    {opt4.trim() && <option value={opt4}>{opt4}</option>}
                  </select>
                </div>

                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--text-primary)', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                  onClick={handleAddQuestion}
                >
                  + Add to List
                </button>
              </div>
            </div>

            {/* Questions to save preview */}
            {questions.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Questions in Pack ({questions.length}):</h4>
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {questions.map((q, i) => (
                    <div key={i} style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{i + 1}. {q.text}</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>({q.correctOption})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }} disabled={loading || questions.length === 0}>
              {loading ? 'Creating...' : 'Save Complete Pack'}
            </button>
          </form>
        </div>

        {/* Packs list panel */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 className="text-gradient">Stored Packs ({packs.length})</h3>
          
          {packs.length === 0 ? (
            <p className="text-secondary" style={{ fontStyle: 'italic' }}>
              No custom packs found. Make your first pack using the form on the left!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    padding: '1rem',
                    borderRadius: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{pack.name}</h4>
                    <button
                      onClick={() => handleDeletePack(pack.id)}
                      style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-secondary" style={{ fontSize: '0.85rem', margin: 0 }}>
                    Total Questions: {pack.questions.length}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
