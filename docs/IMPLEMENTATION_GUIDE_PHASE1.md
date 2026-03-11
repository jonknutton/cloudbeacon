/**
 * PHASE 1 IMPLEMENTATION GUIDE
 * Firebase SDK Centralization & Constants
 * 
 * This guide demonstrates how to update existing code to use the new
 * centralized firebase-sdk.js and constants.js modules.
 * 
 * Total implementation time: ~2 hours
 * No breaking changes - maintains backward compatibility
 * 
 * FILE: IMPLEMENTATION_GUIDE_PHASE1.md
 */

# Phase 1: Firebase SDK & Constants Centralization

## Overview

Two new files have been created:
1. **firebase-sdk.js** - Centralized Firebase SDK imports
2. **constants.js** - All project constants in one place

These files eliminate duplication and create a single source of truth for configuration.

---

## File 1: firebase-sdk.js

### What It Does
- Centralizes all Firebase SDK imports (Firestore, Storage)
- Single version management point
- Prevents duplicate CDN imports

### How It Works
Instead of importing from CDN URLs in each file:
```javascript
// ❌ OLD (in projectpage.js, profile.js, projects.js, etc)
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
```

Now import from the centralized module:
```javascript
// ✅ NEW
import { collection, getDocs, getStorage, ref } from './firebase-sdk.js';
```

### Migration Steps

#### Step 1: Files to Update (Priority Order)

1. **projectpage.js** - BIGGEST IMPACT (multiple imports)
   - Change lines 2-10 (Firebase imports)
   
2. **profile.js** - MEDIUM IMPACT
   - Change lines 1-15 (Firebase imports after auth)
   
3. **projects.js** - Medium impact
   - Change lines 2-15 (Firebase imports)
   
4. **posts.js** - Medium impact
   - Change lines 2-15 (Firebase imports)
   
5. **app.js** - Already mostly consolidated
   - Change lines 7-10 (only if importing firestore directly)

6. **search-page.js** - Small impact
   - Change lines 1-15

#### Step 2: Find & Replace Examples

**For projectpage.js (lines 1-15):**

```javascript
// FIND:
import { db, auth } from './firebase.js';
import {
    collection, addDoc, getDocs, orderBy, query,
    serverTimestamp, doc, updateDoc, getDoc, setDoc,
    where, deleteDoc, limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getBytes, listAll } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// REPLACE WITH:
import { db, auth } from './firebase.js';
import {
    collection, addDoc, getDocs, orderBy, query,
    serverTimestamp, doc, updateDoc, getDoc, setDoc,
    where, deleteDoc, limit
} from './firebase-sdk.js';
import { getStorage, ref, uploadBytes, getBytes, listAll } from './firebase-sdk.js';
```

**For profile.js (lines 1-20):**

```javascript
// FIND:
import { auth } from './firebase.js';

// Then later if importing from CDN
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// REPLACE WITH:
import { auth } from './firebase.js';
import { collection, getDocs } from './firebase-sdk.js';
```

#### Step 3: Testing After Migration

For each updated file:
1. ✅ Does the page load without errors?
2. ✅ Do Firestore operations work? (Create, read, update)
3. ✅ Do file uploads work? (If applicable)
4. ✅ Do queries execute properly?

**Test commands in browser console:**
```javascript
// Verify Firestore is working
import('./firebase-sdk.js').then(sdk => {
  console.log('✓ Firestore functions available:', 
    sdk.collection, sdk.getDocs, sdk.addDoc
  );
});
```

---

## File 2: constants.js

### What It Contains

#### 1. CATEGORY_CONFIG (Top Priority)
Replaces duplicate definitions in:
- app.js (lines 1953-1957) - DUPLICATE #1
- app.js (lines 2102-2106) - DUPLICATE #2
- projectpage.js (if any)

**OLD CODE (in app.js):**
```javascript
const projCategoryColors = {
    Tech: "#6366f1", Civil: "#f59f00", Community: "#ec4899", Law: "#0ca678",
    Physical: "#f59f00", Inventive: "#6366f1"
};
const catIcons = { Tech: "💻", Civil: "🏗️", Community: "🤝", Law: "⚖️", Physical: "🏗️", Inventive: "💡" };
```

**NEW CODE (in app.js):**
```javascript
import { CATEGORY_CONFIG, getCategoryColor, getCategoryIcon } from './constants.js';

// USAge:
const tabColor = getCategoryColor(item.category) || "#5c7cfa";
const icon = getCategoryIcon(item.category) || "📁";
```

#### 2. SKILLS_BY_CATEGORY
Replaces definitions in:
- profile.js (lines 18-50) - 200+ lines
- Used for user skill selection and search

**OLD CODE (in profile.js):**
```javascript
const SKILLS_BY_CATEGORY = {
    'Software & Development': [...],
    'Design & Creative': [...],
    // ... 16 more categories
};
```

**NEW CODE (in profile.js):**
```javascript
import { SKILLS_BY_CATEGORY } from './constants.js';
// Now use directly - no redefinition needed
```

#### 3. ROLE_HIERARCHY
Currently defined inline in projectpage.js, now centralized.

#### 4. Utility Functions
Helper functions for common operations:
```javascript
import { getCategoryColor, getCategoryIcon, hasPermission, getRoleLevel } from './constants.js';

// Examples:
const color = getCategoryColor('Tech');        // '#6366f1'
const icon = getCategoryIcon('Tech');          // '💻'
const canManage = hasPermission('Admin', 'manage_team');  // true
const level = getRoleLevel('Lead');            // 3
```

### Migration Steps

#### Step 1: Replace Category Usage

**File: app.js**

Find and replace BOTH occurrences:

```javascript
// FIND (around line 1952):
const projCategoryColors = {
    Tech: "#6366f1", Civil: "#f59f00", Community: "#ec4899", Law: "#0ca678",
    // legacy support for old category names
    Physical: "#f59f00", Inventive: "#6366f1"
};
const catIcons = { Tech: "💻", Civil: "🏗️", Community: "🤝", Law: "⚖️", Physical: "🏗️", Inventive: "💡" };
const tabColor = projCategoryColors[item.category] || "#5c7cfa";
const icon = catIcons[item.category] || "📁";

// REPLACE WITH:
import { getCategoryColor, getCategoryIcon } from './constants.js';  // Add at top
// Then use:
const tabColor = getCategoryColor(item.category) || "#5c7cfa";
const icon = getCategoryIcon(item.category) || "📁";
```

**File: profile.js**

```javascript
// ADD at top:
import { SKILLS_BY_CATEGORY } from './constants.js';

// FIND AND DELETE (lines 18-50):
const SKILLS_BY_CATEGORY = {
    'Software & Development': [...],
    // ... all 18 categories
};

// The SKILLS_BY_CATEGORY is now imported, no deletion needed!
```

#### Step 2: Gradual Migration Approach

**OPTION 1: Quick Migration (Recommended)**
1. Add `import { CATEGORY_CONFIG, SKILLS_BY_CATEGORY } from './constants.js'` to app.js
2. Delete the duplicate definitions
3. Test that colors/icons still work
4. Repeat for profile.js

**OPTION 2: Safe Migration (Backward Compatible)**
1. Keep old definitions temporarily
2. Add imports but don't use them yet
3. Update one line at a time
4. Delete old definitions after verification

**OPTION 3: Module-by-Module**
1. Start with constants.js import but don't delete old code
2. Update one function to use new constants
3. Test thoroughly
4. Move to next function
5. After all functions work, delete old code

### Testing After Migration

```javascript
// In browser console, test:

// 1. Colors work
import('./constants.js').then(c => {
    console.log('Tech color:', c.getCategoryColor('Tech')); // Should be '#6366f1'
    console.log('Civil icon:', c.getCategoryIcon('Civil'));  // Should be '🏗️'
});

// 2. Skills available
import('./constants.js').then(c => {
    console.log('Total skill categories:', Object.keys(c.SKILLS_BY_CATEGORY).length); // Should be 18
    console.log('Software skills:', c.SKILLS_BY_CATEGORY['Software & Development'].length); // Should be 38+
});

// 3. Roles work
import('./constants.js').then(c => {
    console.log('Valid roles:', c.VALID_ROLES); // Should be 5 roles
    console.log('Admin level:', c.getRoleLevel('Admin')); // Should be 4
});
```

---

## Implementation Checklist

### Firebase SDK (firebase-sdk.js)

- [ ] File created at `/firebase-sdk.js`
- [ ] All Firestore functions exported correctly
- [ ] All Storage functions exported correctly
- [ ] Tested import in browser console

### Constants (constants.js)

- [ ] File created at `/constants.js`
- [ ] CATEGORY_CONFIG defined with all 6 categories
- [ ] SKILLS_BY_CATEGORY exported with all 18 categories + skills
- [ ] Helper functions work: getCategoryColor, getCategoryIcon, etc.
- [ ] Tested import in browser console

### Code Updates - app.js

- [ ] Add import for constants at top
- [ ] Remove duplicate projCategoryColors definition (line ~1953)
- [ ] Remove duplicate catIcons definition
- [ ] Repeat for 2nd occurrence (line ~2102)
- [ ] Verify app loads without errors
- [ ] Test project cards display with correct colors

### Code Updates - profile.js

- [ ] Add import for SKILLS_BY_CATEGORY at top
- [ ] Remove old SKILLS_BY_CATEGORY definition (lines 18-50)
- [ ] Verify profile page loads
- [ ] Test skill selection works

### Code Updates - projectpage.js

- [ ] Update Firebase SDK imports (lines 1-10)
- [ ] Remove CDN imports
- [ ] Verify project page loads
- [ ] Test all Firestore operations (create, read, update)
- [ ] Test file uploads (if applicable)

### Code Updates - Other Files

- [ ] projects.js: Update imports
- [ ] posts.js: Update imports
- [ ] search-page.js: Update imports (if applicable)
- [ ] Any other files importing from CDN

---

## Metrics After Implementation

### Code Quality Improvements
- Duplicate code: 3 definitions → 1 definition (-100%)
- Import redundancy: Eliminated
- Single source of truth: ✓ Established
- Upgrade point for Firebase version: 1 file (vs. 5+ files)

### Before Phase 1
- CATEGORY_COLORS defined in: app.js (2x), projectpage.js
- SKILLS_BY_CATEGORY defined in: profile.js
- Firebase imports: 5+ different patterns across codebase

### After Phase 1
- CATEGORY_COLORS: Accessed via `constants.js` + helper functions
- SKILLS_BY_CATEGORY: Single definition in `constants.js`
- Firebase imports: All from `firebase-sdk.js`
- Lines of duplicate code eliminated: ~60 lines

---

## Troubleshooting

### Issue: "Module not found" error
**Solution:** Verify file paths are correct and files are in the same directory as importing files

### Issue: Colors/icons not displaying
**Solution:** Make sure to use helper functions: `getCategoryColor()` and `getCategoryIcon()` instead of direct object access

### Issue: Skills dropdown empty
**Solution:** Check that SKILLS_BY_CATEGORY is imported correctly and not overwritten by old code

### Issue: Firebase operations fail
**Solution:** Verify firebase.js is still in place (firebase-sdk.js only re-exports, doesn't initialize)

---

## Next Steps After Phase 1

Once Phase 1 is complete, move to:

**Phase 2 (Error Handling)** - 4 hours
- Add try-catch to 30+ async functions
- Improve user error messages

**Phase 3 (File Splitting)** - 8 hours
- Break projectpage.js into 6 focused modules
- Each handles specific feature area

**Phase 4 (Module Standardization)** - 10 hours
- Consistent export patterns
- Clear public APIs

---

## For Other Developers Adopting This Pattern

**Key Takeaways:**
1. ✅ Centralize SDK imports (easier to version-manage)
2. ✅ Extract all constants to one file (single source of truth)
3. ✅ Use helper functions instead of direct object access
4. ✅ Document where each constant is used
5. ✅ Make migration gradual (don't break existing code)

**When Adapting to Your Project:**
1. Copy `firebase-sdk.js` and update version number
2. Copy `constants.js` and update your own categories/skills
3. Follow migration steps with your specific file names
4. Test each update before moving to next file

