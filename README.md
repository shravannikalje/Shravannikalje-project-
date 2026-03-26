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
