## FILE INDEX - CloudBeacon Code Navigation

This document helps you find what you're looking for in the reorganized codebase.

---

## QUICK FIND

**Looking for:** → **Go to:**
- Firebase setup | `src/core/firebase-sdk.js`
- Constants/categories | `src/core/constants.js`
- Error handling | `src/core/error-handler.js`
- User login | `src/features/auth/auth.js`
- User profiles | `src/features/profile/profile.js`
- Projects/tasks | `src/features/projects/projectpage/`
- Laws & manifestos | `src/features/governance/governance.js`
- Voting & posts | `src/features/voting/posts.js`
- Messages & notifications | `src/features/messaging/messaging.js`
- Global search | `src/features/search/search.js`
- Elections & MPs | `src/features/election/election2024_data.js`
- UI colors/themes | `src/ui/colors.js`
- Date/validation helpers | `src/utils/`

---

## TIER STRUCTURE

### src/core/ (Foundation)
**Foundation layer - everything depends on this**

| File | Purpose |
|------|---------|
| firebase-sdk.js | Centralized Firebase imports (Firestore, Storage, Auth) |
| constants.js | All app constants (categories, skills, roles, etc.) |
| error-handler.js | Error classification, logging, user notifications |
| index.js | Core API exports |

### src/services/ (Data & Business Logic)
**Service layer - contains data operations and business rules**
*Coming in Phase 4*

### src/features/ (Domain Features)
**Feature-specific code organized by business capability**

#### auth/ - Authentication & Login
```
auth/
├── auth.js - UI bindings
├── auth-manager.js - Auth logic (future)
└── index.js - Public API
```

#### profile/ - User Profiles
```
profile/
├── profile.html - Markup
├── profile.css - Styles
├── profile.js - UI bindings
├── profile-manager.js - Profile operations (future)
└── index.js - Public API
```

#### projects/ - Project Management
```
projects/
├── projectpage/
│   ├── projectpage-loader.js - Project orchestrator
│   ├── overview-tab.js - Overview display
│   ├── team-tab.js - Team management
│   ├── updates-tab.js - Project updates
│   ├── costs-tab.js - Budget tracking
│   ├── funds-tab.js - Funding/bids
│   └── plan-tab/
│       ├── tasks.js - Task CRUD
│       ├── activities.js - Work breakdown
│       └── gantt.js - Gantt chart
├── projects-list/ - Project listing (future)
└── index.js - Public API
```

#### governance/ - Laws & Manifestos
```
governance/
├── governance.html - Markup
├── governance.js - Main orchestrator
├── laws-tab.js - Legislation browsing
├── manifestos-tab.js - Party policies
└── index.js - Public API
```

#### voting/ - Voting & Engagement
```
voting/
├── posts.js - Social feed
├── voting-manager.js - Voting logic
├── voting-eligibility.js - Eligibility rules
└── index.js - Public API
```

#### messaging/ - Direct Messages
```
messaging/
├── messaging.js - Message operations
├── messaging-ui.js - Message display
├── notifications.js - Notification system
└── index.js - Public API
```

#### search/ - Global Search
```
search/
├── search.html - Search page
├── search.js - Search operations
├── search-ui.js - Search interface
└── index.js - Public API
```

#### election/ - Elections & MPs
```
election/
├── election2024_data.js - Election data
├── mps.js - MP information
├── election.js - UI bindings
└── index.js - Public API
```

### src/ui/ (Shared Components)
**Reusable UI components and styling**

| File | Purpose |
|------|---------|
| colors.js | Category colors and theme system |
| color-settings.js | User-customizable colors |
| modals.js | Modal dialogs (future) |
| tabs.js | Tab components (future) |
| forms.js | Form components (future) |
| index.js | UI API exports |

### src/utils/ (Helpers)
**Utility functions for common operations**

| File | Purpose |
|------|---------|
| date-utils.js | Date formatting and calculations (future) |
| validators.js | Input validation helpers (future) |
| dom-utils.js | DOM manipulation helpers (future) |
| helpers.js | Array/object utilities (future) |
| index.js | Utils API exports |

### docs/ (Documentation)
**Project documentation and guides**

| File | Purpose |
|------|---------|
| FILE_INDEX.md | This file - navigation guide |
| ARCHITECTURE.md | Design principles and dependency rules |
| API_REFERENCE.md | Public API documentation |
| MODULE_GUIDE.md | How to add new features |

---

## ROOT LEVEL (Legacy - Being Phased Out)

These files are gradually being moved to `src/` tiers. During Phase 3:

**Currently Being Used:**
- `app.js` - Main entry point *(moving to src/features/)*
- `index.html` - Main page template
- `firebase.json` - Firebase config
- `package.json` - Dependencies

**To Be Moved Soon:**
- `firebase-sdk.js` → `src/core/`
- `constants.js` → `src/core/`
- `error-handler.js` → `src/core/`
- `profile.js` → `src/features/profile/`
- `projectpage.js` → `src/features/projects/projectpage/`
- `posts.js` → `src/features/voting/`
- `governance.js` → `src/features/governance/`

---

## USING THE INDEX SYSTEM

Each tier and feature has an `index.js` file that exports its public API.

### Example: Using Profile Feature
```javascript
// Instead of:
import { loadProfile } from '../../profile/profile-manager.js';

// Use:
import { loadProfile } from '../features/profile/index.js';
// or with barrel imports:
import * as Profile from '../features/profile/index.js';
```

### Benefits:
✓ IDE autocomplete shows all available exports
✓ Easy to see what a module exposes
✓ Can refactor internals without changing external imports
✓ Single source of truth for module boundaries

---

## DEPENDENCY RULES

Follow this hierarchy - never go backwards:

```
Core ← Services ← Features ← UI ← Utils
 ↓       ↓           ↓        ↓
Only dependencies of what's below them
```

**Examples:**
- ✅ Feature can import from Core
- ❌ Core cannot import from Feature
- ✅ UI can import from Utils
- ❌ Utils cannot import from UI
- ✅ Feature can import from Services
- ❌ Services cannot import from Feature

---

## COMMON TASKS

### Finding where a function is defined
1. Search for function name across the codebase
2. Check corresponding feature or service folder
3. Look in the feature's `index.js` to see if it's exported

### Adding a new feature
1. Create folder in `src/features/new-feature/`
2. Create `index.js` with public API exports
3. Export from `src/features/index.js`
4. Add to this FILE_INDEX.md

### Moving a file to src/
1. Check what it imports
2. Update all import paths (../../../core/ for core modules)
3. Add to appropriate tier's index.js
4. Update this FILE_INDEX.md

### Finding related functionality
1. Go to feature folder for that area
2. Check index.js for all available operations
3. Example: Need voting? → `src/features/voting/index.js` shows all voting functions

---

## PHASE 3 PROGRESS

✅ Folders created (all 13 directories)
✅ Index.js files created (core, services, features, ui, utils)
✅ Feature index.js created (all 8 features)
⏳ Files being moved to src/ (in progress)
⏳ Import paths being updated (in progress)
⏳ Browser testing (pending)
⏳ Phase 4 - Service layer (pending)

See [PHASE3_STATUS_TRACKER.md](./PHASE3_STATUS_TRACKER.md) for detailed progress.

---

## SUPPORT

For questions about:
- **Module organization** → See [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Public APIs** → See [API_REFERENCE.md](./API_REFERENCE.md)
- **Adding new code** → See [MODULE_GUIDE.md](./MODULE_GUIDE.md)
- **Phase 3 progress** → See [PHASE3_STATUS_TRACKER.md](./PHASE3_STATUS_TRACKER.md)
