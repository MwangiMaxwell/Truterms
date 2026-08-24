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

  return <main className="page"><header><div><div className="brand">TruTerms</div><div className="tagline">Know what you&apos;re agreeing to.</div></div><div className="kicker">Manual analyzer</div></header><section className="hero"><div><div className="kicker">Read before you accept</div><h1>Find the clauses that matter.</h1><p className="intro">Paste an agreement and get a plain-English, evidence-first explanation of money, renewals, data use, cancellation, and other terms worth your attention.</p></div><form className="panel" onSubmit={submit}><label htmlFor="terms">Agreement text</label><textarea id="terms" value={content} onChange={(event) => setContent(event.target.value)} placeholder="Paste Terms and Conditions, a Privacy Policy, or subscription terms..." /><div className="row"><button className="primary" disabled={loading} type="submit">{loading ? 'Analyzing...' : 'Analyze terms'}</button><button className="hint" type="button" onClick={() => setContent(sample)}>Use demo text</button></div>{error && <p className="error" role="alert">{error}</p>}</form></section>{analysis && <section className="results"><div className="result-head"><h2>Important things to know</h2><span className="badge">{analysis.overall_risk} attention</span></div><p className="summary">{analysis.summary}</p><div className="findings">{analysis.results.key_points.map((finding, index) => <article className="finding" key={`${finding.title}-${index}`}><div className="severity">{finding.severity} · {finding.category}</div><h3>{finding.title}</h3><p>{finding.summary}</p><div className="evidence">&ldquo;{finding.evidence}&rdquo;{finding.section && <><br /><span className="hint">{finding.section}</span></>}</div></article>)}</div></section>}<p className="disclaimer">AI-generated explanation. Not legal advice. TruTerms helps you inspect an agreement; you remain in control of what you accept.</p></main>;
}
