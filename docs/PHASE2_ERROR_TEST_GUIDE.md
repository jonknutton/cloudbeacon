# Phase 2 Error Handling - Browser Testing Guide

**Purpose**: Verify that all error handling catches failures and shows user-friendly messages instead of silent failures.

**Status**: Ready for testing (`error-handler.js` integrated into 5 core files)

---

## Quick Start - Browser Console Commands

### 1. Enable Debug Mode
```javascript
import('./error-handler.js').then(eh => {
    eh.enableDebug();
    console.log('Debug mode ON - all errors will be logged');
});
```

### 2. View Error Log
```javascript
import('./error-handler.js').then(eh => {
    console.table(eh.getErrorLog());
});
```

### 3. Clear Error Log
```javascript
import('./error-handler.js').then(eh => {
    eh.clearErrorLog();
    console.log('Error log cleared');
});
```

---

## Test Scenarios

### A. Feed Operations (posts.js)

#### Test A1: Load Feed with Error Handling
**Scenario**: Visit feed page and check if posts load
**Expected**: 
- ✅ Posts display normally OR
- ✅ Empty feed with error notification if Firestore issue
- ✅ Error logged to console (not silent)

**Steps**:
1. Open browser console
2. Run: `import('./error-handler.js').then(eh => eh.enableDebug())`
3. Navigate to feed/posts tab
4. Observe toast notification if error occurs
5. Run: `import('./error-handler.js').then(eh => console.table(eh.getErrorLog()))`

---

#### Test A2: Create Post Error Handling
**Scenario**: Try to create a post while network is interrupted
**Expected**: User sees error message (not silent failure)

**Steps**:
1. Open DevTools → Network tab
2. Set network to "Offline"
3. Try to create a post
4. **Expected**: Error toast appears: "Failed to creating post. Database error. Please try again."
5. Restore network connection
6. Try again - should work

**What's Fixed**:
- Before: Silent failure (post doesn't appear, no feedback)
- After: User sees error immediately

---

#### Test A3: Vote on Post
**Scenario**: Vote on a post while network is throttled
**Expected**: Error caught and user notified

**Steps**:
1. Network tab → Throttle to "Slow 3G"
2. Click vote button on any post
3. **Expected**: If timeout/error occurs, user sees: "Failed to voting on post. Please try again."
4. Throttle back to normal

---

### B. Project Page Operations (projectpage.js)

#### Test B1: Load Project Page [FIXES THE DOM ERROR]
**Scenario**: Visit a project page (the one with post creation error)
**Expected**: 
- ✅ Project loads without "can't access property 'style'" error
- ✅ Safe DOM access prevents null reference errors

**Steps**:
1. Open browser console
2. Check for JavaScript errors (should be none)
3. Visit any project page
4. Observe: No console errors, page loads cleanly
5. Check vote stats display (uses safe DOM access)

**What's Fixed**:
- Before: "can't access property 'style', document.getElementById(...) is null"
- After: Safe access via `getSafeElement()` - gracefully handles missing elements

---

#### Test B2: Create Task with Error Handling
**Scenario**: Create a task while network is slow
**Expected**: Error notification if failure

**Steps**:
1. On project page, click "Add Task"
2. Fill in task details (name, activity, date)
3. Network throttle to "Slow 3G"
4. Click "Create Task"
5. **Expected**: If error occurs: "Failed to creating task. Database error. Please try again."

---

#### Test B3: Vote on Project
**Scenario**: Vote on project during network issue
**Expected**: Error caught

**Steps**:
1. On project page, click vote buttons
2. With network throttled, should show error if it fails
3. **Expected**: Toast message instead of silent failure

---

### C. Profile Operations (profile.js)

#### Test C1: Load Profile Page
**Scenario**: Load any user profile
**Expected**: Profile loads or shows friendly error

**Steps**:
1. Navigate to a user profile
2. Observe profile loads without errors
3. Check console - should have no unhandled errors

**What's Fixed**:
- All DOM access uses `getSafeElement()` pattern
- Safe element text updates with `setElementText()`

---

#### Test C2: Update Biography
**Scenario**: Save biography changes during network issue
**Expected**: User sees error notification

**Steps**:
1. On own profile, click edit bio
2. Make a change
3. Network → Offline
4. Click save
5. **Expected**: Error toast: "Failed to updating biography. Database error. Please try again."

---

#### Test C3: Save Profile Customization
**Scenario**: Save CSS customization with error
**Expected**: User notified of save failure

**Steps**:
1. Profile → Customization tab
2. Add custom CSS
3. Network → Offline
4. Click save
5. **Expected**: Error message shown

---

### D. Project Creation (projects.js)

#### Test D1: Create Project with Error
**Scenario**: Create new project during network issue
**Expected**: User sees error instead of silent failure

**Steps**:
1. Navigate to create project
2. Fill in project details
3. Network → Offline
4. Click create
5. **Expected**: Error toast: "Failed to creating project. Database error. Please try again."

---

## Error Types to Observe

When testing, you should see these error classifications:

| Error Type | Example Trigger | User Message |
|-----------|-----------------|--------------|
| **Network** | Go offline then try action | "No internet connection. Please check..." |
| **Firestore** | Database quota exceeded | "Failed to [action]. Database error. Please try again." |
| **Permission** | No write access | "You don't have permission to [action]." |
| **Validation** | Invalid data format | "Invalid data. Please check your input..." |
| **NotFound** | Missing project/post/profile | "The item you're looking for was not found." |
| **Unknown** | Unexpected error | "Failed to [action]. Please try again or contact support." |

---

## Toast Notification System

**How to test toast display**:

1. Create an error scenario (e.g., network offline + action)
2. Look for colored notification in **top-right corner**:
   - 🔴 Red = Error
   - 🟡 Yellow = Warning  
   - 🟢 Green = Success
   - 🔵 Blue = Info

3. Toast auto-disappears after 5 seconds
4. Multiple errors stack vertically

---

## Console Logging Verification

**Open browser DevTools → Console** to verify:

1. ✅ Error group with details when error occurs:
   ```
   ❌ Error: creating post
   Error Type: firestore_error
   Message: [specific error message]
   Code: [Firebase error code]
   ```

2. ✅ Error log stored in memory:
   ```javascript
   getErrorLog() returns:
   [
     { timestamp, action, errorType, severity, ... },
     { timestamp, action, errorType, severity, ... }
   ]
   ```

---

## Checklist - Before Reporting Success

- [ ] Load feed page - no console errors
- [ ] Create/vote on posts - errors caught
- [ ] Visit project page - no "can't access property" errors
- [ ] Load vote stats - DOM elements accessed safely
- [ ] Update profile bio - error shown if fails
- [ ] Create task - error notification appears
- [ ] Network offline scenario - user sees message (not silent fail)
- [ ] Error log accessible in console
- [ ] Toast notifications appear and disappear correctly

---

## Known Improvements Made

### Safe DOM Access Pattern
**Before**:
```javascript
document.getElementById('projectVotes').textContent = value; // Crashes if null
```

**After**:
```javascript
setElementText('projectVotes', value); // Gracefully handles missing element
```

### Error Visibility
**Before**:
```javascript
try {
    await createPost();
} catch (err) {
    console.error(err); // Only in console, user sees nothing
}
```

**After**:
```javascript
try {
    await createPost();
} catch (err) {
    handleError(err, 'creating post', { notify: true });
    // User sees toast + console + error log + debug info
}
```

---

## Troubleshooting Tests

### Toast Not Showing?
1. Check if error occurred (check console first)
2. Check if `notify: true` parameter passed to `handleError()`
3. Check if element with ID `toast-container` appears in DOM

### Console Error Still Appearing?
1. Verify import path: `'./error-handler.js'`
2. Check if try-catch block is around the operation
3. Ensure `handleError()` called with proper parameters

### Error Log Empty?
1. Run: `import('./error-handler.js').then(eh => console.log(eh.getErrorLog()))`
2. Errors only logged when `handleError()` is called
3. Maximum 50 errors stored in memory

---

## Success Indicators

✅ **Phase 2 Testing Complete When**:
1. No "can't access property" errors on projectpage
2. All async operations show user feedback on failure
3. Error log captures all errors with context
4. Toast notifications appear and disappear correctly
5. Network offline scenarios handled gracefully
6. No silent failures - everything visible to user

---

## Next Steps After Testing

1. **Pass**: Move to Phase 3 (File splitting/module standardization)
2. **Issues Found**: Debug specific scenarios, update error messages if needed
3. **Performance**: Monitor error log size, consider persistent error tracking integration

---

## Integration Notes

The error-handler.js system is designed to integrate with:

- **Error Tracking**: Sentry, LogRocket, Rollbar (replace `logErrorToAnalytics()`)
- **Toast Library**: React Toastify, Notyf, etc. (replace `createSimpleToast()`)
- **Backend Logging**: Send errors to backend endpoint (replace `logErrorToAnalytics()`)

Current implementation uses:
- ✅ Console logging (built-in)
- ✅ Browser toast notifications (custom simple version)
- ✅ In-memory error buffer (last 50 errors)

---

## Questions or Issues?

If error scenarios aren't being caught:
1. Check browser console for import errors
2. Verify error-handler.js is loaded: `import('./error-handler.js')`
3. Ensure try-catch blocks wrap async operations
4. Check `notify` parameter in handleError() call
