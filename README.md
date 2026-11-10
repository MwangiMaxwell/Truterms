# TruTerms

TruTerms explains a terms of service, privacy policy, or subscription agreement in plain language, and quotes the clause each point came from. It does not accept or reject an agreement for you.

Three parts:

- `extension/` is a Chrome side panel. It reads the open page only after you click Analyze this page, then asks the API to explain it. Clicking a finding highlights that quote on the page.
- `web/` is a page for pasting agreement text when you are not on the document itself.
- `backend/` is a Laravel API. `POST /api/analyze` checks the text, asks Gemini for a structured explanation, drops any finding whose quote is not in the text you sent, and stores the result. `GET /api/analyses/{id}` returns one stored analysis.

## Run the API

PHP 8.4, Composer, and a Gemini API key. The locked dependencies do not install on PHP 8.3.

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve
```

Put the key in `GEMINI_API_KEY`. The model defaults to `gemini-3.6-flash`. The API listens on `http://127.0.0.1:8000`.

`GET /` returns the service name. `POST /api/analyze` expects JSON:

```json
{
  "content": "At least 100 characters of agreement text.",
  "url": "https://example.com/terms",
  "title": "Terms of Service"
}
```

`url` and `title` are optional. Text shorter than 100 characters is rejected before any model call.

`php artisan test` runs the API tests. They fake the Gemini HTTP call.

The Dockerfile is the hosted API image. It migrates, then serves on `$PORT`. Local development uses SQLite.

## Run the web page

Node.js 20 or newer.

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

`.env.example` points `NEXT_PUBLIC_API_URL` at a local API. With no env file, the page calls `https://truterms.onrender.com`. The page origin has to be listed in `TRUTERMS_ALLOWED_ORIGINS` (default `http://localhost:3000`). Chrome extension origins are allowed separately.

## Load the extension

1. Open `chrome://extensions` and turn on Developer mode.
2. Choose Load unpacked and select the `extension/` folder.
3. Open a terms or privacy page and click the TruTerms action.

The side panel calls `https://truterms.onrender.com`. For a local API, set `API_URL` in `extension/sidepanel.js` to `http://127.0.0.1:8000`. The manifest already allows that host. The extension does not click Accept or Agree.

## Where to read

- `backend/app/Services/LegalAnalysisService.php` builds the model request and rejects a finding whose quote is not in the supplied text.
- `backend/app/Http/Controllers/AnalysisController.php` validates input, stores the analysis, and returns it.
- `backend/tests/Feature/AnalysisApiTest.php` covers storage, the short-text rejection, and reading a stored analysis back.
- `extension/content.js` decides whether the page looks like a legal document, and highlights a quote in the page.
- `extension/sidepanel.js` sends the page text only after the button click.
- `web/app/page.tsx` is the paste form and the result list.

The API does not authenticate callers. Laravel still migrates user, session, and personal access token tables. Analysis does not read them. Sanctum ships with the app. The extension and the web page do not use it.
