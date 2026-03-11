/**
 * TIER 1: CORE - Platform Foundation
 * 
 * Everything depends on this layer. These are the fundamental utilities
 * that the entire application needs to function.
 * 
 * RULES:
 * - Core modules should NEVER import from other tiers
 * - Core only imports from Core
 * - All core utilities must be exported here
 * 
 * EXPORTS:
 */

// Firebase SDK abstraction - use this instead of importing firebase directly
export * from './firebase-sdk.js';

// Error handling - centralized error management across app
export * from './error-handler.js';

// Global constants - enums, configuration, data structures
export * from './constants.js';

// Authentication service (will be created in Phase 4)
// export * from './auth-service.js';

/**
 * CORE API SUMMARY
 * 
 * From firebase-sdk.js:
 * - Firestore: collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, limit, getDoc
 * - Storage: getStorage, ref, uploadBytes, getDownloadURL, listAll, deleteObject
 * - Auth: auth object
 * - Firestore helpers: serverTimestamp, increment, setDoc
 * 
 * From error-handler.js:
 * - handleError(error, action, options) - centralized error handler
 * - showAlert(message, type) - user notifications
 * - classifyError(error) - determine error type
 * - getSafeElement(id) - safe DOM access
 * - retryOnError(fn, options) - retry logic
 * 
 * From constants.js:
 * - CATEGORY_CONFIG - project categories
 * - SKILLS_BY_CATEGORY - skill taxonomy
 * - ROLE_HIERARCHY - role permissions
 * - Helper functions: getCategoryColor, getCategoryIcon, hasPermission, etc.
 * 
 * USAGE:
 * import { handleError, getCategory, SKILLS_BY_CATEGORY } from '../core/index.js';
 */

console.log('[CORE] Cloud Beacon core tier loaded');
