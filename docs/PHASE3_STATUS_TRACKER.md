## PHASE 3: FILE REORGANIZATION - STATUS TRACKER

**Phase 3 Goal:** Transform flat 180-file structure into organized tier-based architecture

**Start Date:** Today
**Target Complete:** When all files moved, import paths updated, and browser verified

---

## PROGRESS DASHBOARD

### Tier 1: CORE (Foundation)
- ✅ Files created: firebase-sdk.js, constants.js, error-handler.js
- ✅ Tests passing: 46/46 ✓
- ✅ index.js created with exports
- ⏳ **NEXT:** Move files to src/core/

### Tier 2-5: Folder Structure & Index Files
- ✅ All 13 directories created
- ✅ src/core/index.js created with exports
- ✅ src/services/index.js created
- ✅ src/features/index.js created
- ✅ src/ui/index.js created
- ✅ src/utils/index.js created
- ✅ All 8 feature folders have index.js
- ⏳ **NEXT:** Move actual files into folders

### File Movement Checklist

#### MUST DO FIRST (Core Dependencies)
- [ ] Move firebase-sdk.js → src/core/
- [ ] Move constants.js → src/core/
- [ ] Move error-handler.js → src/core/

#### THEN - Update paths in these files (they import core):
- [ ] app.js - Update core imports
- [ ] profile.js - Update core imports, then move to src/features/profile/
- [ ] projectpage.js - Update core imports, then move to src/features/projects/projectpage/
- [ ] projects.js - Update core imports, then move to src/features/projects/
- [ ] posts.js - Update core imports, then move to src/features/voting/

#### Other Files to Move (Check paths first):
- [ ] governance.js → src/features/governance/
- [ ] auth.js → src/features/auth/
- [ ] voting*.js → src/features/voting/
- [ ] messaging*.js → src/features/messaging/
- [ ] notifications.js → src/features/messaging/
- [ ] search*.js → src/features/search/
- [ ] election*.js → src/features/election/
- [ ] colors.js → src/ui/
- [ ] color*.js → src/ui/

#### Features (HTML/CSS)
- [ ] profile.html → src/features/profile/
- [ ] profile.css → src/features/profile/
- [ ] governance.html → src/features/governance/
- [ ] search.html → src/features/search/
- [ ] market.html → src/features/voting/ (or new feature)
- [ ] project.html → src/features/projects/projectpage/
- [ ] project.css → src/features/projects/projectpage/

#### Entry Point (Last - After Everything Moved)
- [ ] app.js - Final move to src/core/app.js (or src/app.js)
- [ ] index.html - Update script src paths
- [ ] Update firebase.js imports if needed

### Import Path Updates Needed

When moving files, update these patterns:

| Current Import | After Move |
|---|---|
| `from './firebase-sdk.js'` | `from '../../../core/firebase-sdk.js'` |
| `from './constants.js'` | `from '../../../core/constants.js'` |
| `from './error-handler.js'` | `from '../../../core/error-handler.js'` |
| `from './colors.js'` | `from '../../../ui/colors.js'` |

**Example:** If moving profile.js to `src/features/profile/`:
- Depth calculation: src → features → profile = 2 levels down from src
- Core is 3 levels up: ../../../core/

---

## TASKS BY PRIORITY

### 🔴 P0 - BLOCKING (Do First)
Move core foundation files and update all paths that depend on them.

**Task:** Move src/core files
```
[ ] mv firebase-sdk.js src/core/
[ ] mv constants.js src/core/
[ ] mv error-handler.js src/core/
```
**Time:** 5 minutes
**Impact:** CRITICAL - everything depends on these

**Task:** Update app.js core imports
```
[ ] Update firebase-sdk.js path in app.js
[ ] Update constants.js path in app.js
[ ] Update error-handler.js path in app.js
[ ] Test in browser
```
**Time:** 10 minutes
**Impact:** Unblocks moving all files that app.js loads

### 🟠 P1 - HIGH (Do Next)
Move and update main feature files.

**Task:** Move and update profile.js
```
[ ] Update import paths in profile.js
[ ] Move profile.js to src/features/profile/
[ ] Move profile.html to src/features/profile/
[ ] Move profile.css to src/features/profile/
[ ] Update app.js profile.js import path
```
**Time:** 20 minutes

**Task:** Move and update projectpage.js
```
[ ] Update import paths in projectpage.js
[ ] Move projectpage.js to src/features/projects/projectpage/
[ ] Move project.html to src/features/projects/projectpage/
[ ] Move project.css to src/features/projects/projectpage/
[ ] Update app.js projectpage.js import path
```
**Time:** 20 minutes

**Task:** Move governance.js and related
```
[ ] Update import paths in governance.js
[ ] Move governance.js to src/features/governance/
[ ] Move governance.html to src/features/governance/
[ ] Update app.js governance.js import path
```
**Time:** 15 minutes

**Task:** Move posts.js and voting
```
[ ] Update import paths in posts.js
[ ] Move posts.js to src/features/voting/
[ ] Update app.js posts.js import path
```
**Time:** 15 minutes

### 🟡 P2 - MEDIUM (Do After)
Move remaining features and UI.

**Task:** Move auth and search
```
[ ] Move auth.js to src/features/auth/
[ ] Move search.js to src/features/search/
[ ] Move search.html to src/features/search/
[ ] Update app.js imports
```
**Time:** 15 minutes

**Task:** Move messaging
```
[ ] Move messaging.js to src/features/messaging/
[ ] Move notifications.js to src/features/messaging/
[ ] Move messaging-ui.js to src/features/messaging/
[ ] Update app.js imports
```
**Time:** 15 minutes

**Task:** Move election
```
[ ] Move election2024_data.js to src/features/election/
[ ] Move election.js to src/features/election/
[ ] Move related MP files to src/features/election/
[ ] Update app.js imports
```
**Time:** 15 minutes

**Task:** Move UI components
```
[ ] Move colors.js to src/ui/
[ ] Move colorSettings.js to src/ui/
[ ] Move colorSettingsUI.js to src/ui/
[ ] Update all imports
```
**Time:** 15 minutes

### 🟢 P3 - VERIFICATION (Do Last)
Update remaining files and test.

**Task:** Update HTML files
```
[ ] Update index.html script src paths
[ ] Test all module loads in DevTools
```
**Time:** 10 minutes

**Task:** Browser verification
```
[ ] Load index.html
[ ] Check console for import errors
[ ] Verify each feature loads
[ ] Test core functionality
```
**Time:** 20 minutes

**Task:** Update documentation
```
[ ] Add new feature files to FILE_INDEX.md
[ ] Mark completed sections
[ ] Create MIGRATION_GUIDE.md for future
```
**Time:** 15 minutes

---

## EXECUTION CHECKLIST

### Before Starting
- [ ] All index.js files created (already done ✅)
- [ ] All folders created (already done ✅)
- [ ] Phase 1-2 files tested (already done ✅)

### During Execution
- [ ] After each file move, update this tracker
- [ ] After each import path update, verify in browser
- [ ] Keep list of which files have been moved

### After Completion
- [ ] All files organized in src/ tiers
- [ ] All import paths updated
- [ ] Browser loads without errors
- [ ] All features functional
- [ ] Documentation updated
- [ ] Final test pass recorded

---

## ESTIMATED TIMELINE

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Move core files | 5 min | 🔴 TODO |
| 2 | Update app.js | 10 min | 🔴 TODO |
| 3 | Move feature files | 90 min | 🔴 TODO |
| 4 | Update HTML/CSS paths | 15 min | 🔴 TODO |
| 5 | Browser verification | 20 min | 🔴 TODO |
| 6 | Documentation | 15 min | 🔴 TODO |
| **TOTAL** | **Full Phase 3** | **155 min** | **🔴 IN PROGRESS** |

**Estimated Start Time:** Now
**Estimated Complete:** ~2.5 hours from start

---

## KNOWN ISSUES & BLOCKERS

**None currently**

Issues will be logged here as they arise.

---

## SUCCESS CRITERIA

Phase 3 is complete when:

- [x] Folder structure created (13 directories)
- [x] All index.js files created (5 tier + 8 feature)
- [ ] All files moved to src/ tiers
- [ ] All import paths updated and working
- [ ] Browser loads without module errors
- [ ] All features still functional
- [ ] Documentation updated
- [ ] No console errors on page load

---

## QUICK REFERENCE

**To get unstuck:** 
1. Check current folder structure with `ls -R src/`
2. Check what files still have wrong imports: search workspace for `from './'`
3. Check browser DevTools Network tab for 404 errors on imports

**Next command to run:** 
When ready, start with moving the core files to src/core/

---

*Last Updated:* Phase 3 Just Started - Folder Structure Complete
*Next Milestone:* Move core files to src/core/
