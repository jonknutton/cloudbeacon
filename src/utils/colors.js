/**
 * CloudBeacon Color Palette System
 * Defines the color scheme for the entire application
 * Supports per-user color customization with localStorage persistence
 */

const ColorPalette = {
  // Current user ID (set when user logs in)
  currentUserId: null,

  // Default colors - can be customized via settings
  defaults: {
    buttonPrimary: '#333333',      // Primary button color
    buttonSecondary: '#e0e0e0',    // Secondary button color
    fontPrimary: '#333333',        // Primary text color
    fontSecondary: '#888888',      // Secondary text color
    pageBackground: '#f0f0f0',     // Page background
    cardBackground: '#ffffff',     // Card/panel background
    textboxBackground: '#ffffff',  // Input/textbox background
    
    // Dark theme defaults (for dark pages)
    darkPageBg: '#1a1a1a',
    darkCardBg: '#2a2218',
    darkPaperBg: '#fdfcf8',
    darkFontPrimary: '#ffffff',
    darkFontSecondary: '#cccccc',
  },

  // Semantic colors (these have specific meanings, less commonly customized)
  semantic: {
    delete: '#dc3545',
    success: '#2b8a3e',
    warning: '#f59f00',
    info: '#0066cc',
    legislationTag: '#d3f9d8',
    legislationTagText: '#1a6b2e',
    projectTag: '#dbe4ff',
    projectTagText: '#364fc7',
    stageTag: '#fff3bf',
    stageTagText: '#7d5a00',
    progressBar: '#4caf50',
    border: '#ccc',
    shadow: 'rgba(0,0,0,0.1)',
  },

  /**
   * Set the current user ID
   * Call this when user logs in to enable per-user color storage
   */
  setUserId(userId) {
    this.currentUserId = userId;
    // Load user's saved colors
    this.loadFromStorage();
    this.applyToDOM();
  },

  /**
   * Clear user ID (call on logout)
   */
  clearUserId() {
    this.currentUserId = null;
    // Reset to defaults
    window.cloudBeaconColors = JSON.parse(JSON.stringify(this.defaults));
    this.applyToDOM();
  },

  /**
   * Get storage key for current user
   */
  getStorageKey() {
    if (this.currentUserId) {
      return `cloudBeaconColors_${this.currentUserId}`;
    }
    return 'cloudBeaconColors'; // Fallback for guests
  },

  /**
   * Initialize the color system
   * Sets up CSS variables and loads saved preferences
   */
  init() {
    this.loadFromStorage();
    this.applyToDOM();
  },

  /**
   * Get current color value
   */
  get(colorKey) {
    const current = this.getCurrent();
    return current[colorKey] || this.defaults[colorKey] || '';
  },

  /**
   * Get all current colors
   */
  getCurrent() {
    if (!window.cloudBeaconColors) {
      window.cloudBeaconColors = JSON.parse(JSON.stringify(this.defaults));
    }
    return window.cloudBeaconColors;
  },

  /**
   * Set a single color
   */
  set(colorKey, value) {
    const current = this.getCurrent();
    current[colorKey] = value;
    this.applyToDOM();
    this.saveToStorage();
  },

  /**
   * Set multiple colors at once
   */
  setMultiple(colorObj) {
    const current = this.getCurrent();
    Object.assign(current, colorObj);
    this.applyToDOM();
    this.saveToStorage();
  },

  /**
   * Reset to defaults
   */
  reset() {
    window.cloudBeaconColors = JSON.parse(JSON.stringify(this.defaults));
    this.applyToDOM();
    this.saveToStorage();
  },

  /**
   * Apply colors to DOM as CSS variables
   */
  applyToDOM() {
    const current = this.getCurrent();
    const root = document.documentElement;

    // Set CSS variables for each color
    for (const [key, value] of Object.entries(current)) {
      const varName = `--color-${key}`;
      root.style.setProperty(varName, value);
    }

    // Also set semantic colors
    for (const [key, value] of Object.entries(this.semantic)) {
      const varName = `--color-${key}`;
      root.style.setProperty(varName, value);
    }
  },

  /**
   * Load colors from localStorage
   * Uses per-user key if userId is set
   */
  loadFromStorage() {
    try {
      const storageKey = this.getStorageKey();
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        window.cloudBeaconColors = JSON.parse(saved);
      } else {
        window.cloudBeaconColors = JSON.parse(JSON.stringify(this.defaults));
      }
    } catch (e) {
      console.warn('Failed to load colors from storage:', e);
      window.cloudBeaconColors = JSON.parse(JSON.stringify(this.defaults));
    }
  },

  /**
   * Save colors to localStorage
   * Uses per-user key if userId is set
   */
  saveToStorage() {
    try {
      const storageKey = this.getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(this.getCurrent()));
    } catch (e) {
      console.warn('Failed to save colors to storage:', e);
    }
  },

  /**
   * Get all customizable color keys
   */
  getCustomizableKeys() {
    return Object.keys(this.defaults);
  },

  /**
   * Get display name for a color key
   */
  getDisplayName(colorKey) {
    const names = {
      buttonPrimary: 'Button Primary',
      buttonSecondary: 'Button Secondary',
      fontPrimary: 'Primary Font',
      fontSecondary: 'Secondary Font',
      pageBackground: 'Page Background',
      cardBackground: 'Card Background',
      textboxBackground: 'Text Box Background',
      darkPageBg: 'Dark Page Background',
      darkCardBg: 'Dark Card Background',
      darkPaperBg: 'Dark Paper Background',
      darkFontPrimary: 'Dark Primary Font',
      darkFontSecondary: 'Dark Secondary Font',
    };
    return names[colorKey] || colorKey;
  },
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ColorPalette.init();
  });
} else {
  ColorPalette.init();
}
