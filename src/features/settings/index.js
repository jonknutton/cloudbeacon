/**
 * src/features/settings/index.js
 * 
 * SETTINGS FEATURE - User preferences and settings
 * 
 * This feature module handles:
 * - User profile settings
 * - Color customization
 * - UI preferences
 * - Application configuration
 * 
 * Contents:
 * - settings.js          : Main settings management
 * - colorSettings.js     : Color customization logic
 * - colorSettingsUI.js   : Color settings UI
 * 
 * Dependencies:
 *   - core/constants.js (for color system)
 */

export { default as settings } from './settings.js';
export { default as colorSettings } from './colorSettings.js';
export { default as colorSettingsUI } from './colorSettingsUI.js';
