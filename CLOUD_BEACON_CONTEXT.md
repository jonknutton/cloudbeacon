# Cloud Beacon — Project Context for Claude

## What it is
A civic engagement platform. Users can post opinions, browse UK Parliament legislation, and create/manage civic projects. Built as a vanilla JS SPA with Firebase backend. Demo site — not yet in production.

## Tech Stack
- **Frontend:** Vanilla JS (ES modules), no frameworks
- **Backend:** Firebase — Firestore, Auth, Storage
- **Hosting:** Local dev via Live Server (port 5500)
- **Font:** Jibberish (custom .woff2, @font-face declared in style.css)

## File Structure

| File | Purpose |
|------|---------|
| `index.html` | Landing + feed page |
| `app.js` | Feed logic, auth state, share popover, filter panel |
| `style.css` | Global styles (Jibberish @font-face must be at top) |
| `auth.js` | Firebase Auth helpers (register, login, loginAsGuest, logout, watchAuthState) |
| `posts.js` | Firestore post CRUD + voting + comments |
| `projects.js` | Firestore project creation + voting |
| `legislation.js` | Parliament RSS sync (via Cloud Function CORS proxy) |
| `project.html` | Project detail page (tabs: Overview, Team, Plan, Cost, Fund, Updates, Files, Chat) |
| `project.css` | Project page styles |
| `projectpage.js` | ~3400 lines — all project page logic |
| `firebase.js` | Firebase init |
| `functions/` | Single Cloud Function: CORS proxy for Parliament API |
| `translator/` | Jibberish fictional language tool (separate mini-app, NOT a legislation translator) |
| `Jibberish.woff2` | Custom font file in root |

## Firestore Data Model

### `feed` collection
Top-level mixed feed of all activity:
- `type`: 'post' | 'project' | 'project-update' | 'chat' | 'legislation'
- `authorId`, `authorName`, `createdAt`, `votes`
- For projects: `projectId`, `title`, `category`, `description`
- For legislation: `title`, `description`, `category` (Government Bill / Private Member's Bill / Lords Bill)

### `projects` collection
- `title`, `category`, `description`, `categoryAnswer`, `isPublic`
- `ownerId`, `ownerName`, `createdAt`, `votes`, `status`, `projectNumber`
- `headerPictureUrl` (optional)
- Subcollections: `votes/`, `tasks/`, `activities/`, `bids/`, `updates/`, `files/`, `chat/`, `team/`

### `users` collection
- Profile data, display names

## Project Categories (current)
| Value stored | Label | Feed colour |
|---|---|---|
| Tech | 💻 Tech | Indigo #6366f1 |
| Civil | 🏗️ Civil | Amber #f59f00 |
| Community | 🤝 Community | Pink #ec4899 |
| Law | ⚖️ Law | Green #0ca678 |

**Legacy categories** (old Firestore data): Physical → maps to Civil, Inventive → maps to Tech.
Handled in getCategory() via legacyMap in projectpage.js. Do NOT remove this mapping.

## Project Page Tabs (SUB_TABS in projectpage.js)
- plan: all categories get Overview / Tasks / Gantt
- cost: Civil gets Bids; Tech/Community get Grants; Law/Legislative get Overview only
- fund: all get Overview / Invest; Law skips Bid tab
- team and updates: same for all

## Auth / Landing Flow
1. Visitor sees landing (#landing): "Cloud Beacon" + "Login / Register" + "Continue as Guest"
2. "Login / Register" → shows #auth forms with Back link
3. "Continue as Guest" → anonymous Firebase login → body.jibberish class (Jibberish font site-wide)
4. After login → landing hidden, feed + floating controls shown
5. Logout → returns to landing

Key window-exposed functions in app.js: showAuthForms(), showLanding(), showRegister(), showLogin()

## Share System

### Feed posts (app.js)
openShareMenu(triggerEl, title, url, description) builds a popover:
- 📱 Share via... (Web Share API, mobile only)
- 𝕏 Twitter/X, 💬 WhatsApp, 🦋 Bluesky, 🔗 Copy link

Share text: "Title — Description\nURL" (description truncated to 200 chars).
This text-in-URL approach is the working solution for demo — not OG crawling.

### Project page (projectpage.js)
shareProject(triggerEl) reads currentItem.title + currentItem.description and calls openShareMenu.
Share button is in the project header status block in project.html.

### Open Graph tags
Placeholder OG/Twitter meta tags in project.html head. setOpenGraphTags(item) populates them
dynamically. NOTE: won't work for crawler previews (SPA — crawlers see pre-JS HTML).
Fix at deployment with SSR/prerender if ever needed.

## Filter Panel (app.js)
Single button "⚗ All ▾". Opens panel: All / Posts / Projects (Projects expands right to bill subtypes).
Label updates to active filter. Closes on outside click.
Functions: setFilter(), toggleFilterPanel(), toggleFilterSub() — all on window.

## Floating Menu
Top-left ☰. Hidden until logged in. Closes on outside click (same listener as filter panel).

## CSS Architecture
All CSS additions should be appended to main style.css:
- style_additions.css — landing page + jibberish body class
- style_share_additions.css — share popover + comment footer
- style_filter_additions.css — filter panel + sub-panel

## Known Issues / Tech Debt
- projectpage.js is ~3400+ lines — use Python for replacements (CRLF line endings)
- getPosts() in posts.js may be orphaned (feed uses getFeed() from projects.js)
- Parliament RSS sync uses Cloud Function CORS proxy
- Old projects have description prefixed with "Located at:" / "Problem:" in Firestore (legacy)

## Critical Notes for Future Claude Sessions
- ALWAYS use Python replace() for edits to projectpage.js — CRLF endings, too large for str_replace
- Uploaded files in /mnt/user-data/uploads/ are often originals, not latest. Check outputs/ first
- Outputs must be manually applied by user — Claude cannot confirm what's been deployed
- All JS functions called from HTML onclick must be on window (ES module scope)
- Keep legacyMap in getCategory() — old Firestore data uses Physical/Inventive category names
- Jibberish font: @font-face url('Jibberish.woff2') at top of style.css; translator uses ../Jibberish.woff2