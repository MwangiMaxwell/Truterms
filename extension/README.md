# TruTerms Chrome extension

Load this folder as an unpacked extension at `chrome://extensions` with Developer mode on.

Open a page, click the TruTerms action, then click Analyze this page. The panel sends that page's text to the API. It does not click agreement controls.

`API_URL` in `sidepanel.js` is `https://truterms.onrender.com`. Set it to `http://127.0.0.1:8000` when the Laravel app is running locally.
