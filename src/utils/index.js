/**
 * TIER 5: UTILS - Generic Utilities & Helpers
 * 
 * Pure utility functions that don't depend on business logic.
 * Used by all other tiers as needed.
 * 
 * INCLUDES:
 * - String formatting & escaping
 * - User display utilities
 * - Date utilities & formatting
 * - DOM manipulation helpers
 * - Validation functions
 * - Array/object helpers
 * 
 * RULES:
 * - Utils import Core only
 * - Utils are pure functions (same input = same output)
 * - No side effects (no DOM manipulation except helpers)
 * - No external state
 * 
 * PURPOSE OF HELPERS:
 * Eliminates 300+ lines of duplicate code that existed in:
 * - projects.js, posts.js, projectpage.js, app.js (display name)
 * - app.js, sharing.js (escape quotes)
 * - projectpage.js, messagingUI.js (date formatting)
 * - app.js, projectpage.js, settings.js, sharing.js (DOM manipulation)
 * 
 * EXPORTS:
 */

// User display & string utilities
export {
    getDisplayName,
    escapeQuotes,
    escapeHtml
} from './helpers.js';

// Date formatting utilities
export {
    formatFirebaseDate,
    getTimeAgo
} from './helpers.js';

// DOM manipulation utilities
export {
    showElements,
    hideElements,
    toggleElement,
    setElementDisplay
} from './helpers.js';

// Validation utilities
export {
    isValidEmail,
    isEmpty
} from './helpers.js';

// Array utilities
export {
    removeDuplicates,
    groupBy
} from './helpers.js';

// Existing utilities
export { getColorDisplayName } from './colors.js';
export { shareContent } from './sharing.js';

// String formatting and validation
// export {
//     capitalize,
//     slugify,
//     truncate,
//     isValidEmail,
//     isValidPhone
// } from './validators.js';

// Generic DOM utilities
// export {
//     addClass,
//     removeClass,
//     toggleClass,
//     hasClass
// } from './dom-utils.js';

// Array and object helpers
// export {
//     groupByProperty,
//     sortByProperty,
//     filterByProperty,
//     uniqueBy
// } from './helpers.js';

/**
 * UTILS USAGE
 * 
 * Used throughout the app:
 * import { formatDate, capitalize } from '../utils/index.js';
 * 
 * const displayName = capitalize(user.name);
 * const formattedDate = formatDate(new Date());
 */

console.log('[UTILS] Cloud Beacon utilities loaded');
