/**
 * TIER 3: FEATURES - Domain Modules
 * 
 * Features connect UI to services and orchestrate workflows.
 * Each feature is a self-contained domain area.
 * 
 * STRUCTURE:
 * - index.js - Public API exported here
 * - [name]-manager.js - Main logic orchestrator
 * - [name].js - UI bindings and DOM manipulation
 * - [name].html - Feature markup
 * - [name].css - Feature styles
 * - README.md - Feature documentation
 * 
 * RULES:
 * - Features import Core + Services
 * - Features NEVER import other features directly
 * - UI code (DOM manipulation) stays in this tier
 * - Business logic stays in Services
 * 
 * FEATURES:
 */

// Authentication - login, signup, session management
export * as auth from './auth/index.js';

// User Profiles - view/edit profiles, settings
export * as profile from './profile/index.js';

// Project Management - create/edit projects, workflows
export * as projects from './projects/index.js';

// Governance - laws, manifestos, MPs
export * as governance from './governance/index.js';

// Voting & Engagement - vote on projects, posts, feed
export * as voting from './voting/index.js';

// Messaging - direct messages, notifications
export * as messaging from './messaging/index.js';

// Global Search - search interface
export * as search from './search/index.js';

// Elections - election results, MP information
export * as election from './election/index.js';

/**
 * FEATURE LIFECYCLE
 * 
 * When user navigates to a feature:
 * 1. Load feature index.js
 * 2. Call feature's initialization function
 * 3. Feature loads data via services
 * 4. Feature renders UI
 * 5. Feature binds event handlers
 * 6. Feature listens for user actions
 * 7. Feature calls services to save/fetch data
 * 
 * USAGE IN app.js:
 * import * as features from './features/index.js';
 * 
 * // When user goes to profile
 * const profileData = await features.profile.loadProfile(userId);
 * features.profile.render(profileData);
 * 
 * // When user creates project
 * const result = await features.projects.createProject(data);
 */

console.log('[FEATURES] Cloud Beacon features loaded');
