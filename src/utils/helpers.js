/**
 * Common Helper Functions
 * 
 * Utility functions extracted from Code Review findings to eliminate duplication
 * across the application. These were previously defined inline multiple times,
 * creating maintenance nightmares.
 * 
 * USAGE:
 * import { getDisplayName, escapeQuotes, formatFirebaseDate, showElements, hideElements } from './helpers.js';
 * 
 * @module helpers
 */

// ═══════════════════════════════════════════════════════════════════════════
// USER DISPLAY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get display name for a user with fallback chain
 * 
 * REPLACES: 9 instances of inline fallback logic in:
 * - projects.js (lines 26, 41, 50)
 * - posts.js (lines 26, 101)
 * - projectpage.js (lines 652, 3002, 3281)
 * - app.js (line 226)
 * 
 * @param {Object} user - User object from Firebase Auth
 * @param {string} user.displayName - Display name (fallback 1)
 * @param {string} user.email - Email address (fallback 2)
 * @param {string} defaultName - Custom fallback name (default: 'Guest')
 * @returns {string} Display name, email, custom fallback, or 'Guest'
 * 
 * @example
 * const displayName = getDisplayName(currentUser);
 * // Returns user.displayName || user.email || 'Guest'
 * 
 * const displayName = getDisplayName(currentUser, 'User');
 * // Returns user.displayName || user.email || 'User'
 * 
 * // Before: user.displayName || user.email || 'Guest'
 * // After: getDisplayName(user)
 */
export function getDisplayName(user, defaultName = 'Guest') {
    if (!user) return defaultName;
    return user.displayName || user.email || defaultName;
}

// ═══════════════════════════════════════════════════════════════════════════
// STRING ESCAPING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Escape single quotes in strings for safe use in onclick handler attributes
 * 
 * REPLACES: 17 instances of inline escaping in:
 * - app.js (multiple lines)
 * - sharing.js (multiple lines)
 * 
 * PROBLEM SOLVED:
 * When generating HTML with template literals containing user-provided text
 * that goes into onclick handlers, quotes can break the onclick attribute.
 * This ensures safe escaping.
 * 
 * @param {string} str - String to escape
 * @returns {string} String with single quotes escaped
 * 
 * @example
 * // Before:
 * const onClick = `${item.title.replace(/'/g, "\\'")}"`;
 * 
 * // After:
 * const onClick = `${escapeQuotes(item.title)}"`;
 */
export function escapeQuotes(str) {
    if (!str) return '';
    return str.replace(/'/g, "\\'");
}

/**
 * Escape HTML special characters for safe DOM insertion
 * 
 * More robust than escapeQuotes; use when inserting user content into page
 * 
 * @param {string} str - String to escape
 * @returns {string} HTML-safe string
 * 
 * @example
 * const safeTitle = escapeHtml(userInput);
 * element.innerHTML = `<h1>${safeTitle}</h1>`;
 */
export function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// ═══════════════════════════════════════════════════════════════════════════
// DATE/TIME UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format Firebase Firestore timestamp to readable date string
 * 
 * REPLACES: Inconsistent patterns in:
 * - projectpage.js (lines 3306, 3579)
 * - messagingUI.js (line 187)
 * 
 * PROBLEM SOLVED:
 * Different parts of the code handled Firebase timestamps differently:
 * - change.createdAt?.toDate()
 * - timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
 * - update.createdAt?.toDate?.()
 * This unifies all cases.
 * 
 * @param {Object|Date|number} timestamp - Firebase Timestamp or Date
 * @param {string} locale - Locale string (default: 'en-GB')
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or empty string if invalid
 * 
 * @example
 * // Firebase Timestamp
 * const dateStr = formatFirebaseDate(createdAt);
 * // Output: "25/02/2026"
 * 
 * // With custom format
 * const dateStr = formatFirebaseDate(createdAt, 'en-US', {
 *   year: 'numeric',
 *   month: 'long',
 *   day: 'numeric'
 * });
 * // Output: "February 25, 2026"
 * 
 * // Handles edge cases
 * formatFirebaseDate(null) // Returns ""
 * formatFirebaseDate({ toDate: () => new Date(...) }) // Works
 * formatFirebaseDate(new Date(...)) // Works
 */
export function formatFirebaseDate(timestamp, locale = 'en-GB', options = {}) {
    if (!timestamp) return '';
    
    try {
        let date;
        
        // Handle Firestore Timestamp object
        if (timestamp && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        }
        // Handle Date object
        else if (timestamp instanceof Date) {
            date = timestamp;
        }
        // Handle milliseconds timestamp
        else if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        }
        else {
            return '';
        }
        
        // Validate date
        if (isNaN(date.getTime())) {
            return '';
        }
        
        // Default format if not specified
        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            ...options
        };
        
        return date.toLocaleDateString(locale, defaultOptions);
    } catch (err) {
        console.error('Error formatting Firebase date:', err);
        return '';
    }
}

/**
 * Get number of days since a timestamp (e.g., "2 days ago")
 * 
 * @param {Object|Date|number} timestamp - Firebase Timestamp or Date
 * @returns {string} Human-readable time difference
 * 
 * @example
 * const timeAgo = getTimeAgo(createdAt);
 * // Output: "2 days ago"
 */
export function getTimeAgo(timestamp) {
    if (!timestamp) return '';
    
    try {
        let date;
        if (timestamp && typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'number') {
            date = new Date(timestamp);
        } else {
            return '';
        }
        
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        
        if (seconds < 60) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        if (weeks < 4) return `${weeks}w ago`;
        if (months < 12) return `${months}mo ago`;
        
        return formatFirebaseDate(timestamp);
    } catch (err) {
        console.error('Error calculating time ago:', err);
        return '';
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// DOM MANIPULATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show elements by ID (set display to block, flex, or grid)
 * 
 * REPLACES: 40+ instances of inline element.style.display = 'block' in:
 * - app.js (lines 222-286)
 * - projectpage.js (multiple)
 * - settings.js (multiple)
 * - sharing.js (multiple)
 * 
 * PROBLEM SOLVED:
 * Code like this appears everywhere:
 * document.getElementById('landing').style.display = 'none';
 * document.getElementById('auth').style.display = 'none';
 * document.getElementById('userPanel').style.display = 'none';
 * 
 * This replaces all of it with: hideElements(['landing', 'auth', 'userPanel']);
 * 
 * @param {array} ids - Array of element IDs to show
 * @param {string} displayValue - CSS display value ('block', 'flex', 'grid')
 * 
 * @example
 * // Show multiple elements at once
 * showElements(['feed', 'floatingMenu', 'userPanel'], 'flex');
 * 
 * // Default display is 'block'
 * showElements(['modal']);
 */
export function showElements(ids, displayValue = 'block') {
    if (!Array.isArray(ids)) return;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = displayValue;
    });
}

/**
 * Hide elements by ID (set display to none)
 * 
 * Counterpart to showElements()
 * 
 * @param {array} ids - Array of element IDs to hide
 * 
 * @example
 * // Hide multiple elements at once
 * hideElements(['landing', 'auth', 'userPanel', 'feed', 'floatingMenu', 'floatingPostBtn']);
 * 
 * // Before this required 6 lines
 * document.getElementById('landing').style.display = 'none';
 * document.getElementById('auth').style.display = 'none';
 * // ... 4 more lines
 * 
 * // After: 1 line
 * hideElements(['landing', 'auth', 'userPanel', 'feed', 'floatingMenu', 'floatingPostBtn']);
 */
export function hideElements(ids) {
    if (!Array.isArray(ids)) return;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

/**
 * Toggle element visibility
 * 
 * @param {string} id - Element ID to toggle
 * 
 * @example
 * toggleElement('settingsPanel');
 */
export function toggleElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Set an element's display value
 * 
 * @param {string} id - Element ID
 * @param {string} displayValue - CSS display value
 * 
 * @example
 * setElementDisplay('modal', 'flex');
 */
export function setElementDisplay(id, displayValue) {
    const el = document.getElementById(id);
    if (el) el.style.display = displayValue;
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {boolean} True if email appears valid
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Check if value is empty (null, undefined, or empty string)
 * 
 * @param {any} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

// ═══════════════════════════════════════════════════════════════════════════
// ARRAY UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Remove duplicates from array while preserving order
 * 
 * @param {array} arr - Array to deduplicate
 * @param {string} key - Optional: property name for object arrays
 * @returns {array} Array with duplicates removed
 * 
 * @example
 * // Primitive array
 * removeDuplicates([1, 2, 2, 3, 1]) // [1, 2, 3]
 * 
 * // Object array by property
 * removeDuplicates(users, 'id') // Removes users with same ID
 */
export function removeDuplicates(arr, key = null) {
    if (!Array.isArray(arr)) return [];
    
    if (key) {
        const seen = new Set();
        return arr.filter(item => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    
    return [...new Set(arr)];
}

/**
 * Group array items by a property
 * 
 * @param {array} arr - Array to group
 * @param {string} key - Property name to group by
 * @returns {Object} Object with grouped items
 * 
 * @example
 * const projectsByCategory = groupBy(projects, 'category');
 * // { Tech: [...], Civil: [...], Law: [...] }
 */
export function groupBy(arr, key) {
    if (!Array.isArray(arr)) return {};
    
    return arr.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) result[groupKey] = [];
        result[groupKey].push(item);
        return result;
    }, {});
}
