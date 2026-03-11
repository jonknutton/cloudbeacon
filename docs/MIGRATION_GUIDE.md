## PHASE 3: MIGRATION GUIDE - Import Path Updates

This document shows exactly how to update import paths when moving files.

---

## CORE FILES - Import Path Formula

When a file imports from **src/core/**, the path depends on its depth:

```
File Location: src/features/FEATURE/FILE.js
Depth: 3 levels (src → features → FEATURE)
Path to core: ../../../core/FILENAME.js
```

### Path Calculation Formula

| Depth | Path | Example |
|-------|------|---------|
| 1 level (src/xxx/) | ../../core/ | src/ui/colors.js imports: `../../core/firebase-sdk.js` |
| 2 levels (src/xxx/yyy/) | ../../../core/ | src/features/profile/profile.js imports: `../../../core/firebase-sdk.js` |
| 3 levels (src/xxx/yyy/zzz/) | ../../../../core/ | src/features/projects/projectpage/plan/ imports: `../../../../core/firebase-sdk.js` |

---

## FILES TO UPDATE - Before Moving

### 🔴 P0: CORE IMPORTS

**Files that import from Core:** (Update these first)
1. app.js
2. profile.js
3. projectpage.js
4. projects.js
5. posts.js
6. governance.js
7. authentication.js (if exists)

**Imports to find and update:**
```javascript
import { initializeFirebase, ... } from './firebase-sdk.js'
import { SKILLS_BY_CATEGORY, ... } from './constants.js'
import { handleError, showToast, ... } from './error-handler.js'
```

---

## STEP-BY-STEP MIGRATION

### STEP 1: Move Core Foundation (5 minutes)

**Files to move:**
```
firebase-sdk.js     → src/core/
constants.js        → src/core/
error-handler.js    → src/core/
```

**No path updates needed** (these files don't import from each other)

---

### STEP 2: Update app.js (10 minutes)

**Location:** Keep at root for now (app.js is entry point)

**Current imports (OLD):**
```javascript
import { initializeFirebase, ... } from './firebase-sdk.js'
import { SKILLS_BY_CATEGORY, ... } from './constants.js'
import { handleError, showToast, ... } from './error-handler.js'
```

**Updated imports (NEW):**
```javascript
import { initializeFirebase, ... } from './src/core/firebase-sdk.js'
import { SKILLS_BY_CATEGORY, ... } from './src/core/constants.js'
import { handleError, showToast, ... } from './src/core/error-handler.js'
```

---

### STEP 3: Move Feature Files (90 minutes)

#### Profile Feature
**Profile.js location after move:** `src/features/profile/profile.js`
**Depth:** 3 levels from root, 2 levels to core = `../../`

**Current imports (OLD):**
```javascript
import { SKILLS_BY_CATEGORY, ROLES } from './constants.js'
import { handleError, showToast } from './error-handler.js'
import { generateProfileColor } from './colors.js'
```

**Updated imports (NEW):**
```javascript
import { SKILLS_BY_CATEGORY, ROLES } from '../../../core/constants.js'
import { handleError, showToast } from '../../../core/error-handler.js'
import { generateProfileColor } from '../../../ui/colors.js'
```

**Files to move:**
- profile.js → src/features/profile/profile.js
- profile.html → src/features/profile/profile.html
- profile.css → src/features/profile/profile.css

---

#### Projects Feature
**Projectpage.js location after move:** `src/features/projects/projectpage/projectpage.js`
**Depth:** 4 levels to core = `../../../../`

**Current imports (OLD):**
```javascript
import { SKILLS_BY_CATEGORY, ... } from './constants.js'
import { handleError, ... } from './error-handler.js'
```

**Updated imports (NEW):**
```javascript
import { SKILLS_BY_CATEGORY, ... } from '../../../../core/constants.js'
import { handleError, ... } from '../../../../core/error-handler.js'
```

**Files to move:**
- projectpage.js → src/features/projects/projectpage/projectpage.js
- project.html → src/features/projects/projectpage/project.html
- project.css → src/features/projects/projectpage/project.css

---

#### Governance Feature
**Governance.js location after move:** `src/features/governance/governance.js`
**Depth:** 3 levels to core = `../../../`

**Current imports (OLD):**
```javascript
import { ... } from './constants.js'
import { handleError, ... } from './error-handler.js'
```

**Updated imports (NEW):**
```javascript
import { ... } from '../../../core/constants.js'
import { handleError, ... } from '../../../core/error-handler.js'
```

**Files to move:**
- governance.js → src/features/governance/governance.js
- governance.html → src/features/governance/governance.html

---

#### Voting Feature
**Posts.js location after move:** `src/features/voting/posts.js`
**Depth:** 3 levels to core = `../../../`

**Current imports (OLD):**
```javascript
import { handleError, ... } from './error-handler.js'
```

**Updated imports (NEW):**
```javascript
import { handleError, ... } from '../../../core/error-handler.js'
```

**Files to move:**
- posts.js → src/features/voting/posts.js
- voting*.js → src/features/voting/
- votingSystem.js → src/features/voting/

---

#### Other Features (Similar Pattern)
Follow the same pattern for:
- **Auth:** auth.js → src/features/auth/auth.js (3 levels)
- **Search:** search.js → src/features/search/search.js (3 levels)
- **Messaging:** messaging.js → src/features/messaging/messaging.js (3 levels)
- **Election:** election*.js → src/features/election/ (3 levels)

---

#### UI Components
**Colors.js location after move:** `src/ui/colors.js`
**Depth:** 2 levels to core = `../../`

**Current imports (if any):**
```javascript
import { handleError } from './error-handler.js'
```

**Updated imports (NEW):**
```javascript
import { handleError } from '../../core/error-handler.js'
```

**Files to move:**
- colors.js → src/ui/colors.js
- colorSettings.js → src/ui/colorSettings.js
- colorSettingsUI.js → src/ui/colorSettingsUI.js

---

## UPDATING app.js AFTER FILES ARE MOVED

After all feature files are moved, app.js imports them like this:

### Current (OLD)
```javascript
import { renderProfile, loadProfile } from './profile.js'
import { initProjectPage } from './projectpage.js'
import { initGovernance } from './governance.js'
import { initVoting } from './posts.js'
```

### Future (NEW - After files moved)
```javascript
import { renderProfile, loadProfile } from './src/features/profile/profile.js'
import { initProjectPage } from './src/features/projects/projectpage/projectpage.js'
import { initGovernance } from './src/features/governance/governance.js'
import { initVoting } from './src/features/voting/posts.js'
```

---

## UPDATING index.html AFTER FILES ARE MOVED

Currently index.html has:
```html
<script src="app.js" type="module"></script>
```

This may need updating if app.js moves to src/:
```html
<script src="src/app.js" type="module"></script>
<!-- OR keep app.js at root and have it re-export from src/ -->
```

**Best practice:** Keep app.js at root as entry point.

---

## IMPORT PATH REFERENCE TABLE

Quick lookup: For a file at `src/features/X/file.js`:

| Import Target | Path |
|---|---|
| Core module | `../../../core/MODULE.js` |
| UI module | `../../../ui/COMPONENT.js` |
| Same feature module | `./OTHER_FILE.js` |
| Different feature | `../OTHER_FEATURE/FILE.js` |
| Services (future) | `../../../services/SERVICE.js` |

---

## SEARCH & REPLACE PATTERNS

Use Find/Replace in VS Code to update imports quickly:

### Pattern 1: Core modules in app.js
- **Find:** `from './firebase-sdk.js'`
- **Replace:** `from './src/core/firebase-sdk.js'`

### Pattern 2: Core modules in feature files
- **Find:** `from './constants.js'`
- **Replace (in profile.js):** `from '../../../core/constants.js'`

### Pattern 3: Colors in features
- **Find:** `from './colors.js'`
- **Replace (in features):** `from '../../../ui/colors.js'`

---

## VALIDATION CHECKLIST

After each move:
- [ ] File moved to correct folder
- [ ] Import paths updated
- [ ] File not deleted at root location
- [ ] app.js import path updated
- [ ] Test in browser (DevTools console)
- [ ] No 404 errors on import

---

## TROUBLESHOOTING

### "Module not found" Error
1. Check the path depth calculation
2. Verify file actually exists at that path
3. Check for typos (case-sensitive!)
4. Count the `../` levels carefully

### "Function not found" Error
1. Check if function is exported from the module
2. Check if index.js has the export
3. Verify naming (SKILLS_BY_CATEGORY vs skillsByCategory)

### Browser can't load the page
1. Open DevTools Network tab
2. Look for failed imports (red X)
3. Click on failed import to see actual error
4. Fix the path and reload

---

## NEXT STEPS

1. **Move core files** (no path updates needed)
2. **Update app.js** to import from src/core/
3. **Test in browser** (verify no import errors)
4. **Move feature files one by one**
5. **Update each feature file's imports**
6. **Test after each move**
7. **Update app.js imports for each feature**

---

*Use PHASE3_STATUS_TRACKER.md to track which files have been moved.*
