# CIIT Training Institute - Professional Edition

This project is now upgraded to a **full-stack version** with:

- Responsive public website (`index.html`)
- Backend API (`server.js` with Express)
- Persistent enrollment storage (`data/enrollments.json`)
- Admin dashboard (`admin.html`) with stats + CSV export

## Features

- Dark/light theme with persistence
- Course search/filter
- Enrollment form validation + API submission
- Placement chart visualization
- Admin dashboard to view all enrollments

## Project Structure

- `index.html` - public landing page
- `styles.css` - shared styles for public + admin pages
- `script.js` - public page interactivity
- `admin.html` - admin dashboard
- `admin.js` - admin dashboard logic
- `server.js` - API + static hosting
- `data/enrollments.json` - persistent enrollment records

## Run locally

1. Install dependencies
2. Start server
3. Open browser at `http://localhost:3000`

## Quick Links (GitHub + Live)

- GitHub Repository:
  - `https://github.com/shravannikalje/Shravannikalje-project-`
- Live Frontend (GitHub Pages):
  - `https://shravannikalje.github.io/Shravannikalje-project-/`
- Live Admin Dashboard:
  - `https://shravannikalje.github.io/Shravannikalje-project-/admin.html`
- Backend Health (Render):
  - `https://ciit-backend.onrender.com/api/health`
- Render Dashboard:
  - `https://dashboard.render.com/`

> Tip: If admin data is not visible, check backend health URL first.

## Free Domain Setup (No paid domain needed)

- Frontend free domain: GitHub Pages URL
  - `https://shravannikalje.github.io/Shravannikalje-project-/`
- Backend free domain: Render free subdomain (example)
  - `https://ciit-backend.onrender.com`

> Admin PIN is `7823`. Admin dashboard opens with this PIN and shows all queries from backend.

## Admin Panel Troubleshooting

If `admin.html` does not open data or login fails, check these first:

- Ensure backend server is running (`npm start`) and `http://localhost:3000/api/health` returns OK.
- Use PIN `7823` (or your `ADMIN_PIN` env value in deployment).
- For local frontend on other ports (like `5500`, `5501`, etc.), backend API auto-fallback uses `http://localhost:3000`.
- If deployed on GitHub Pages, keep backend live on Render (or set `window.CIIT_CONFIG.apiBaseUrl` in `config.js`).
- If login is rate-limited after wrong PIN attempts, wait 5 minutes and try again.

## Deploy Backend (Render) + Connect GitHub Pages

1. Push this project to GitHub (already done)
2. In Render, create a new **Web Service** from this repo
3. Render auto-detects `render.yaml` and deploys backend
4. Deploy service name as `ciit-backend` (or your preferred name)
5. Copy deployed backend URL (example: `https://ciit-backend.onrender.com`)
6. Edit `config.js` and set (optional; auto-fallback is already present for GitHub Pages):

```js
window.CIIT_CONFIG = {
  apiBaseUrl: "https://your-render-backend-url.onrender.com",
};
```

7. Commit + push `config.js`
8. GitHub Pages site will then use live backend APIs for enrollments/admin

> Note: GitHub Pages hosts only static frontend. Backend must run separately (Render/Railway/etc.).

## API Endpoints

- `GET /api/health` - health status
- `GET /api/courses` - course list
- `GET /api/placements` - placement list
- `GET /api/enrollments` - all enrollment records
- `POST /api/enrollments` - submit enrollment

### POST payload example

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "course": "Java Full Stack"
}
```

## Safety Backup (Index Recovery)

If `index.html` gets empty or overwritten, use these one-click commands:

- Create backup snapshot:
  - `npm run backup:index`
- Restore from latest backup:
  - `npm run restore:index`

Backup files are stored in:

- `backups/index.backup.html` (latest stable)
- `backups/index.<timestamp>.html` (version history)
