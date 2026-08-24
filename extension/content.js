const LEGAL_PATTERNS = /terms?\s*(of|and|&)?\s*(service|use|conditions?)|privacy\s*policy|cookie\s*policy|user\s*agreement|subscription\s*terms|service\s*agreement/i;
const ACCEPT_LABELS = /^(accept|agree|i agree|accept all|agree and continue|accept and continue|continue|confirm)$/i;

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function visibleText(element) {
  return element && element.offsetParent !== null ? cleanText(element.innerText || element.textContent || '') : '';
}

function findContainer() {
  const candidates = [...document.querySelectorAll('main, article, [role="main"]')]
    .filter((element) => visibleText(element).length > 0)
    .sort((a, b) => visibleText(b).length - visibleText(a).length);
  return candidates[0] || document.body;
}

function extractPage() {
  const container = findContainer();
  const text = visibleText(container);
  const headings = [...container.querySelectorAll('h1, h2, h3')]
    .map((heading) => visibleText(heading))
    .filter(Boolean)
    .slice(0, 20);
  const acceptButtons = [...document.querySelectorAll('button, input[type="submit"], [role="button"]')]
    .map((element) => visibleText(element) || element.value?.trim() || '')
    .filter((text, index, values) => text && ACCEPT_LABELS.test(text) && values.indexOf(text) === index)
    .map((text) => ({ text }));

  return {
    isLegal: LEGAL_PATTERNS.test(`${document.title} ${location.href} ${headings.join(' ')} ${text.slice(0, 12000)}`),
    content: text.slice(0, 100000),
    url: location.href,
    title: document.title,
    headings,
    acceptButtons
  };
}

function textNodes(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(node.parentElement.tagName)) nodes.push(node);
  }
  return nodes;
}

function highlightEvidence(evidence) {
  const target = cleanText(evidence || '');
  if (!target || target.length < 12) return false;
  const node = textNodes(document.body).find((item) => cleanText(item.nodeValue).includes(target));
  if (!node) return false;
  try {
    const range = document.createRange();
    const start = node.nodeValue.indexOf(target);
    range.setStart(node, start);
    range.setEnd(node, start + target.length);
    const mark = document.createElement('mark');
    mark.dataset.trutermsHighlight = 'true';
    mark.style.background = '#f6c85f';
    mark.style.color = '#17221c';
    range.surroundContents(mark);
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return true;
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'EXTRACT_PAGE') sendResponse(extractPage());
  if (message.type === 'HIGHLIGHT_EVIDENCE') sendResponse({ highlighted: highlightEvidence(message.evidence) });
  return true;
});
