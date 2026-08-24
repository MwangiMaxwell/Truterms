const API_URL = 'https://truterms.onrender.com';
const status = document.querySelector('#status');
const info = document.querySelector('#page-info');
const analyzeButton = document.querySelector('#analyze');
const results = document.querySelector('#results');
let page = null;

function setStatus(text, error = false) {
  status.textContent = text;
  status.className = error ? 'status error' : 'status';
}

function sendToTab(message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab?.id) return reject(new Error('No active page found.'));
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) reject(new Error('This page cannot be read. Try a regular webpage.'));
        else resolve(response);
      });
    });
  });
}

function renderPage() {
  info.classList.remove('hidden');
  info.innerHTML = `<div class="page-title">${escapeHtml(page.title || 'Untitled page')}</div><div class="meta">${page.isLegal ? 'Likely legal document' : 'No clear legal document detected'}${page.acceptButtons.length ? ` · ${page.acceptButtons.length} possible action button${page.acceptButtons.length > 1 ? 's' : ''}` : ''}</div>`;
  if (!page.isLegal) setStatus('This page does not appear to contain legal terms. You can still review pasted text in the web app.');
  else setStatus('We found a page that may contain terms worth reviewing.');
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

function renderResults(analysis) {
  const points = analysis.results?.key_points || [];
  results.innerHTML = `<div class="risk"><h2>Attention level</h2><span class="badge">${escapeHtml(analysis.overall_risk)}</span></div><p class="summary">${escapeHtml(analysis.summary)}</p>${points.map((point, index) => `<article class="finding"><button type="button" data-index="${index}"><div class="finding-head"><span class="severity">${escapeHtml(point.severity)}</span><span class="meta">${escapeHtml(point.category)}</span></div><h3>${escapeHtml(point.title)}</h3><p>${escapeHtml(point.summary)}</p><div class="evidence">“${escapeHtml(point.evidence)}”${point.section ? `<br><span class="meta">${escapeHtml(point.section)}</span>` : ''}</div></button></article>`).join('')}`;
  results.classList.remove('hidden');
  results.querySelectorAll('button[data-index]').forEach((button) => button.addEventListener('click', () => sendToTab({ type: 'HIGHLIGHT_EVIDENCE', evidence: points[button.dataset.index].evidence })));
}

async function initialize() {
  try {
    setStatus('Checking page...');
    page = await sendToTab({ type: 'EXTRACT_PAGE' });
    renderPage();
  } catch (error) { setStatus(error.message, true); analyzeButton.disabled = true; }
}

analyzeButton.addEventListener('click', async () => {
  analyzeButton.disabled = true;
  results.classList.add('hidden');
  try {
    setStatus('Reading agreement...');
    if (!page) page = await sendToTab({ type: 'EXTRACT_PAGE' });
    if (page.content.length < 100) throw new Error('There is not enough visible text to analyze.');
    setStatus('Analyzing agreement...');
    const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ content: page.content, url: page.url, title: page.title }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.message || 'We could not analyze this agreement.');
    setStatus('Analysis complete. Select a finding to locate its evidence.');
    renderResults(payload.analysis);
  } catch (error) { setStatus(error.message, true); }
  finally { analyzeButton.disabled = false; }
});

initialize();
