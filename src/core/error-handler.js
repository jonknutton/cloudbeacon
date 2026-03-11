/**
 * Error Handling Utility Module
 * 
 * Provides consistent error handling across the application.
 * Centralizes error logging, user notifications, and recovery strategies.
 * 
 * PURPOSE:
 * - Catch all async/await errors systematically
 * - Show user-friendly error messages instead of silent failures
 * - Log detailed errors for debugging
 * - Provide consistent error patterns throughout codebase
 * - Track error categories for analytics
 * 
 * USAGE:
 * import { handleError, showAlert } from './error-handler.js';
 * 
 * try {
 *   const data = await fetchSomething();
 * } catch (err) {
 *   handleError(err, 'fetching data', { fallback: [], notify: true });
 * }
 * 
 * ADOPTION GUIDE FOR OTHER DEVELOPERS:
 * 1. Copy this file to your project
 * 2. Create complementary notification system (e.g., toast messages)
 * 3. Add to all async functions: try { } catch (err) { handleError(...) }
 * 4. Customize error messages per domain  
 * 5. Monitor error logs in production
 * 
 * @module error-handler
 */

// ═══════════════════════════════════════════════════════════════════════════
// ERROR TYPES & CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Standard error categories for classification and handling
 * Helps identify patterns in failures
 */
export const ERROR_TYPES = {
    FIRESTORE: 'firestore_error',
    STORAGE: 'storage_error',
    NETWORK: 'network_error',
    VALIDATION: 'validation_error',
    AUTHENTICATION: 'auth_error',
    PERMISSION: 'permission_error',
    NOT_FOUND: 'not_found_error',
    UNKNOWN: 'unknown_error'
};

/**
 * Error severity levels for filtering/alerting
 */
export const ERROR_SEVERITY = {
    LOW: 'low',           // User can retry, doesn't block workflow
    MEDIUM: 'medium',     // Operation failed, user notified
    HIGH: 'high',         // Critical failure, user action required
    CRITICAL: 'critical'  // System-wide issue
};

// ═══════════════════════════════════════════════════════════════════════════
// ERROR CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Classify error based on type and message
 * Helps determine appropriate user messaging and recovery
 * 
 * USAGE:
 * const errorType = classifyError(error);
 * if (errorType === ERROR_TYPES.AUTHENTICATION) { redirectToLogin(); }
 */
export function classifyError(error) {
    const message = error?.message?.toLowerCase() || '';
    const code = error?.code?.toLowerCase() || '';

    // Firestore errors
    if (code.includes('permission-denied') || message.includes('permission')) {
        return ERROR_TYPES.PERMISSION;
    }
    if (code.includes('not-found') || message.includes('not found')) {
        return ERROR_TYPES.NOT_FOUND;
    }
    if (code.includes('failed-precondition') || message.includes('firestore')) {
        return ERROR_TYPES.FIRESTORE;
    }

    // Storage errors
    if (code.includes('storage') || message.includes('storage')) {
        return ERROR_TYPES.STORAGE;
    }

    // Network errors
    if (code.includes('network') || message.includes('network') || 
        message.includes('offline') || message.includes('fetch')) {
        return ERROR_TYPES.NETWORK;
    }

    // Authentication errors
    if (code.includes('auth') || message.includes('auth') || 
        message.includes('unauthenticated') || message.includes('credential')) {
        return ERROR_TYPES.AUTHENTICATION;
    }

    // Validation errors
    if (message.includes('required') || message.includes('invalid') || 
        message.includes('validation')) {
        return ERROR_TYPES.VALIDATION;
    }

    return ERROR_TYPES.UNKNOWN;
}

/**
 * Get user-friendly error message based on error type
 * 
 * USAGE:
 * const message = getUserMessage(ERROR_TYPES.PERMISSION, 'creating project');
 * showAlert(message, 'error');
 */
export function getUserMessage(errorType, action = 'performing action') {
    const messages = {
        [ERROR_TYPES.FIRESTORE]: `Failed to ${action}. Database error. Please try again.`,
        [ERROR_TYPES.STORAGE]: `Failed to ${action}. File storage error. Please try again.`,
        [ERROR_TYPES.NETWORK]: `No internet connection. Please check your connection and try again.`,
        [ERROR_TYPES.VALIDATION]: `Invalid data. Please check your input and try again.`,
        [ERROR_TYPES.AUTHENTICATION]: `You need to log in to ${action}.`,
        [ERROR_TYPES.PERMISSION]: `You don't have permission to ${action}.`,
        [ERROR_TYPES.NOT_FOUND]: `The item you're looking for was not found.`,
        [ERROR_TYPES.UNKNOWN]: `Failed to ${action}. Please try again or contact support.`
    };
    
    return messages[errorType] || messages[ERROR_TYPES.UNKNOWN];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Central error handling function
 * 
 * PARAMETERS:
 * - error: The caught error object
 * - action: Description of what was being attempted (e.g., "fetching posts")
 * - options: Configuration object
 *   - logToConsole: Whether to log detailed error to console (default: true)
 *   - notify: Whether to show user notification (default: true)
 *   - fallback: Value to return on error (default: null)
 *   - returnValue: Alternative to fallback, can be function
 *   - severity: Error severity level (default: MEDIUM)
 *   - context: Additional context for logging
 * 
 * USAGE EXAMPLES:
 * 
 * Example 1 - Simple error handling:
 * try {
 *   const data = await getDocs(query(collection(db, 'posts')));
 * } catch (err) {
 *   handleError(err, 'fetching posts', { notify: true });
 * }
 * 
 * Example 2 - With fallback value:
 * try {
 *   const posts = await fetch('/api/posts').then(r => r.json());
 *   return posts;
 * } catch (err) {
 *   handleError(err, 'loading posts', { fallback: [], notify: true });
 *   return [];
 * }
 * 
 * Example 3 - Silent error (log only):
 * try {
 *   await analytics.track('event');
 * } catch (err) {
 *   handleError(err, 'tracking event', { notify: false });
 * }
 * 
 * Example 4 - With context:
 * try {
 *   await updateDoc(...);
 * } catch (err) {
 *   handleError(err, 'saving profile', {
 *     notify: true,
 *     context: { userId: currentUser.uid, field: 'bio' }
 *   });
 * }
 */
export function handleError(error, action = 'performing action', options = {}) {
    const {
        logToConsole = true,
        notify = true,
        fallback = null,
        returnValue = null,
        severity = ERROR_SEVERITY.MEDIUM,
        context = {}
    } = options;

    // Classify error
    const errorType = classifyError(error);
    const userMessage = getUserMessage(errorType, action);

    // Build detailed error context
    const errorContext = {
        timestamp: new Date().toISOString(),
        action,
        errorType,
        severity,
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
        ...context
    };

    // Log to console for developers
    if (logToConsole) {
        console.group(`❌ Error: ${action}`);
        console.error('Error Type:', errorType);
        console.error('Message:', error?.message);
        console.error('Code:', error?.code);
        console.error('Severity:', severity);
        if (Object.keys(context).length > 0) {
            console.error('Context:', context);
        }
        console.error('Full Error:', error);
        console.groupEnd();
    }

    // Log to error tracking (could integrate with Sentry, LogRocket, etc.)
    logErrorToAnalytics(errorContext);

    // Show user notification
    if (notify) {
        showAlert(userMessage, 'error');
    }

    // Return fallback value if needed
    return returnValue !== null ? returnValue : fallback;
}

// ═══════════════════════════════════════════════════════════════════════════
// USER NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Show alert/toast notification to user
 * 
 * Currently uses window.alert (fallback). 
 * Should be replaced with proper toast/notification library.
 * 
 * INTEGRATION NOTES:
 * - Replace with your notification library (e.g., React Toastify, notyf, etc.)
 * - Example for Toastify:
 *   import { toast } from 'react-toastify';
 *   export function showAlert(message, type) {
 *     toast[type](message);
 *   }
 * 
 * - Example for vanilla JS toast:
 *   export function showAlert(message, type) {
 *     const notification = document.createElement('div');
 *     notification.className = `toast-${type}`;
 *     notification.textContent = message;
 *     document.body.appendChild(notification);
 *     setTimeout(() => notification.remove(), 5000);
 *   }
 */
export function showAlert(message, type = 'info') {
    // TODO: Replace with proper notification system
    // For now, use console + window.alert as fallback
    
    const prefix = {
        error: '❌',
        warning: '⚠️',
        success: '✅',
        info: 'ℹ️'
    }[type] || 'ℹ️';

    console.log(`${prefix} ${message}`);

    // Only show alert for critical user-facing errors
    if (type === 'error') {
        // Uncomment to use browser alert (not recommended for production)
        // window.alert(message);
        
        // Better: Create a simple toast notification
        createSimpleToast(message, type);
    }
}

/**
 * Create simple toast notification (temporary fallback)
 * Should be replaced with proper notification library
 */
function createSimpleToast(message, type) {
    // Check if toast container exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }

    // Create toast element
    const toast = document.createElement('div');
    const bgColor = {
        error: '#ff6b6b',
        warning: '#ffd93d',
        success: '#51cf66',
        info: '#4dabf7'
    }[type] || '#4dabf7';

    toast.style.cssText = `
        background: ${bgColor};
        color: white;
        padding: 16px;
        margin-bottom: 10px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        font-size: 14px;
        line-height: 1.5;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    // Add CSS animation if not already present
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    container.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => toast.remove(), 5000);
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR TRACKING & ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log error to analytics/monitoring system
 * 
 * Currently logs to console only.
 * Should be integrated with error tracking service.
 * 
 * INTEGRATION OPTIONS:
 * - Sentry: https://sentry.io
 * - LogRocket: https://logrocket.com
 * - Rollbar: https://rollbar.com
 * - Honeybadger: https://honeybadger.io
 * - Custom backend endpoint
 * 
 * EXAMPLE - Send to custom backend:
 * export function logErrorToAnalytics(context) {
 *   fetch('/api/errors', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(context)
 *   }).catch(e => console.error('Failed to log error:', e));
 * }
 */
export function logErrorToAnalytics(context) {
    // TODO: Integrate with error tracking service
    // For now, store in local array for debugging
    
    if (!window._errorLog) {
        window._errorLog = [];
    }
    
    window._errorLog.push(context);
    
    // Keep only last 50 errors in memory
    if (window._errorLog.length > 50) {
        window._errorLog.shift();
    }
    
    // Log count to console
    console.debug(`Error logged. Total errors in session: ${window._errorLog.length}`);
}

/**
 * Get all logged errors (for debugging)
 * 
 * USAGE in browser console:
 * import('./error-handler.js').then(eh => {
 *   console.table(eh.getErrorLog());
 * });
 */
export function getErrorLog() {
    return window._errorLog || [];
}

/**
 * Clear error log (for testing)
 */
export function clearErrorLog() {
    window._errorLog = [];
    console.log('Error log cleared');
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR RECOVERY PATTERNS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Retry logic for transient failures
 * 
 * USAGE:
 * await retryOnError(
 *   () => fetchData(),
 *   { maxAttempts: 3, delayMs: 1000 }
 * );
 */
export async function retryOnError(fn, options = {}) {
    const {
        maxAttempts = 3,
        delayMs = 1000,
        backoffMultiplier = 2,
        shouldRetry = (err) => true
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            // Check if we should retry this type of error
            if (!shouldRetry(err)) {
                throw err;
            }

            // Check if we have more attempts
            if (attempt === maxAttempts) {
                throw err;
            }

            // Calculate delay with exponential backoff
            const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);
            console.log(`Attempt ${attempt} failed. Retrying in ${delay}ms...`, err.message);
            
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Handle errors in parallel operations
 * 
 * USAGE:
 * const results = await Promise.all([
 *   fetchPosts().catch(err => handleError(err, 'fetching posts', {fallback: []})),
 *   fetchUser().catch(err => handleError(err, 'fetching user', {fallback: null}))
 * ]);
 */
export async function handleParallelErrors(promises, action = 'parallel operations', options = {}) {
    try {
        return await Promise.all(promises);
    } catch (err) {
        return handleError(err, action, options);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// ASYNC/AWAIT WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Wrap async functions to handle errors automatically
 * 
 * USAGE:
 * const safeFetch = wrapAsync(fetchData, 'fetching data');
 * const result = await safeFetch(); // Errors handled automatically
 */
export function wrapAsync(fn, action = 'performing action', options = {}) {
    return async function wrappedFn(...args) {
        try {
            return await fn(...args);
        } catch (err) {
            return handleError(err, action, { notify: true, ...options });
        }
    };
}

// ═══════════════════════════════════════════════════════════════════════════
// DEBUGGING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enable error handler debugging in browser console
 * Shows all error classifications and messages
 * 
 * USAGE in browser console:
 * import('./error-handler.js').then(eh => eh.enableDebug());
 */
export function enableDebug() {
    window._errorHandlerDebug = true;
    console.log('✓ Error handler debug mode enabled');
    console.log('View error log:', 'import("./error-handler.js").then(eh => console.table(eh.getErrorLog()))');
}

/**
 * Disable error handler debugging
 */
export function disableDebug() {
    window._errorHandlerDebug = false;
    console.log('✓ Error handler debug mode disabled');
}

// ═══════════════════════════════════════════════════════════════════════════
// COMMON ERROR SCENARIOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safe DOM element access (prevents "can't access property 'style'" errors)
 * 
 * USAGE:
 * const element = getSafeElement('postForm');
 * if (element) element.style.display = 'none';
 */
export function getSafeElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`⚠️  Element not found: #${id}`);
        return null;
    }
    return element;
}

/**
 * Safe element property access
 * 
 * USAGE:
 * setElementStyle('button', 'display', 'none');
 */
export function setElementStyle(id, property, value) {
    const element = getSafeElement(id);
    if (element) {
        element.style[property] = value;
        return true;
    }
    return false;
}

/**
 * Safe element text content
 * 
 * USAGE:
 * setElementText('status', 'Loading...');
 */
export function setElementText(id, text) {
    const element = getSafeElement(id);
    if (element) {
        element.textContent = text;
        return true;
    }
    return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Quick reference of exported functions
 * 
 * MAIN:
 * - handleError() - Central error handler
 * - showAlert() - Show user notification
 * 
 * UTILITIES:
 * - classifyError() - Determine error type
 * - getUserMessage() - Get user-friendly message
 * - retryOnError() - Retry logic
 * - wrapAsync() - Auto-wrap async functions
 * - getSafeElement() - Safe DOM access
 * 
 * DEBUGGING:
 * - getErrorLog() - View logged errors
 * - clearErrorLog() - Clear error history
 * - enableDebug() - Enable debug mode
 * - disableDebug() - Disable debug mode
 */
