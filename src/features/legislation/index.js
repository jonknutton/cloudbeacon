/**
 * src/features/legislation/index.js
 * 
 * LEGISLATION FEATURE - Parliamentary bills and law tracking
 * 
 * This feature module handles:
 * - Displaying and searching UK Parliament bills
 * - Legislative updates and tracking
 * - Bill comparison and analysis
 * - Law-related tabs and views
 * 
 * Contents:
 * - lawTab.js        : Main legislation tab/view
 * - billsTab.js      : Bills-specific tab
 * 
 * Dependencies:
 *   - services/billsDataService.js
 *   - services/legislationDataService.js
 *   - core/firebase-sdk.js
 */

export { default as lawTab } from './lawTab.js';
export { default as billsTab } from './billsTab.js';
