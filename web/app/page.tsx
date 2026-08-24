'use client';

import { FormEvent, useState } from 'react';

type Finding = { category: string; severity: 'low' | 'medium' | 'high'; title: string; summary: string; evidence: string; section: string };
type Analysis = { overall_risk: 'low' | 'medium' | 'high'; summary: string; results: { key_points: Finding[] } };

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://truterms.onrender.com';
const sample = 'These Terms of Service govern your use of the service. Your subscription automatically renews each month unless you cancel before the renewal date. We may charge your payment method the recurring subscription fee. You may cancel at any time, but fees already paid are non-refundable. We may update these terms by posting a new version on this page. By using the service, you agree to resolve disputes through binding arbitration.';

export default function Home() {
  const [content, setContent] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setAnalysis(null);
    if (content.trim().length < 100) { setError('Paste at least 100 characters of agreement text.'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ content }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'We could not analyze this agreement.');
      setAnalysis(payload.analysis);
    } catch (exception) { setError(exception instanceof Error ? exception.message : 'The analyzer is unavailable.'); }
    finally { setLoading(false); }
  }

  return <main className="page">
    <header className="topbar"><a className="brand" href="/">TruTerms</a></header>
    <section className="hero">
      <div className="hero-copy"><div className="kicker">Read before you accept</div><h1>Find the clauses that matter.</h1><p className="intro">A clearer way to understand the money, renewals, data use, and obligations hiding in the fine print.</p><div className="signal-row"><span>01 / Paste</span><span>02 / Analyze</span><span>03 / Review</span></div></div>
      <form className="panel" onSubmit={submit}>
        <div className="panel-heading"><div><div className="kicker">Manual analyzer</div><label htmlFor="terms">Your agreement</label></div><span className="secure-label">Local input</span></div>
        <textarea id="terms" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste Terms and Conditions, a Privacy Policy, or subscription terms..." aria-describedby="input-meta" />
        <div className="input-meta" id="input-meta"><span>{content.length.toLocaleString()} characters</span><button className="demo-link" type="button" onClick={() => setContent(sample)}>Load demo text</button></div>
        <div className="row"><button className="primary" disabled={loading} type="submit"><span>{loading ? 'Analyzing...' : 'Analyze terms'}</span><span aria-hidden="true">-&gt;</span></button><span className="minimum">Minimum 100 characters</span></div>
        {error && <p className="error" role="alert">{error}</p>}
      </form>
    </section>
    {analysis && <section className="results" aria-live="polite"><div className="result-intro"><div><div className="kicker">Analysis complete</div><h2>Important things to know</h2></div><div className="attention"><span className="attention-label">Attention level</span><span className="badge">{analysis.overall_risk}</span></div></div><p className="summary">{analysis.summary}</p><div className="findings">{analysis.results.key_points.map((finding, index) => <article className="finding" key={`${finding.title}-${index}`}><div className="finding-number">0{index + 1}</div><div className="finding-body"><div className="finding-meta"><span className={`severity severity-${finding.severity}`}>{finding.severity}</span><span>{finding.category}</span></div><h3>{finding.title}</h3><p>{finding.summary}</p><div className="evidence"><span className="evidence-label">Source evidence</span><blockquote>&ldquo;{finding.evidence}&rdquo;</blockquote>{finding.section && <cite>{finding.section}</cite>}</div></div></article>)}</div></section>}
    <footer><p><strong>TruTerms</strong> helps you inspect an agreement. You remain in control of what you accept.</p></footer>
  </main>;
}
