/**
 * TIER 2: SERVICES - Data & Business Logic Layer
 * 
 * Pure JavaScript functions that handle:
 * - Data access (Firestore/Storage operations)
 * - Business logic and validation
 * - External API integrations
 * 
 * IMPORTANT: NO UI CODE HERE
 * (No DOM manipulation, no HTML rendering)
 * 
 * RULES:
 * - Services import from Core only
 * - Services NEVER import from Features, UI, or Utils
 * - Services export pure functions
 * - Use error-handler.js for consistent error handling
 * 
 * AVAILABLE SERVICES:
 */

// User management - profiles, account operations
// export * from './user-service.js';

// Project operations - CRUD, workflow management
// export { 
//     createProject, 
//     getProject, 
//     updateProject, 
//     deleteProject
// } from './project-service.js';

// Voting system - vote operations, eligibility
// export {
//     castVote,
//     getVotes,
//     checkVotingEligibility
// } from './voting-service.js';

// Legislation/Bills - fetch, search, manage
// export {
//     getLaws,
//     searchLegislation,
//     linkBillToProject
// } from './legislation-service.js';

// Manifestos - party policies and positions
// export {
//     getManifesto,
//     compareManifestos,
//     getManifestosByPolicy
// } from './manifesto-service.js';

// Notifications - send/receive messages
// export {
//     sendNotification,
//     getNotifications,
//     markNotificationRead
// } from './notification-service.js';

// Global search - search across all entities
// export {
//     searchAll,
//     searchProjects,
//     searchUsers,
//     searchLaws
// } from './search-service.js';

/**
 * SERVICES API REFERENCE
 * 
 * Each service follows a consistent pattern:
 * 
 * async function(params) {
 *     try {
 *         // Validate input
 *         // Perform operation
 *         // Return result
 *     } catch (err) {
 *         handleError(err, 'action description', { notify: false });
 *         return fallbackValue;
 *     }
 * }
 * 
 * Services return:
 * - Data (object/array) on success
 * - null/default value on error
 * - Never throw (always catch and return safely)
 * 
 * USAGE IN FEATURES:
 * import { getProject, castVote } from '../services/index.js';
 * 
 * const project = await getProject(projectId);
 * if (project) {
 *     // Use project data
 * }
 */

console.log('[SERVICES] Cloud Beacon services tier loaded');
