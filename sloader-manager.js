/**
 * Loader Manager
 * Handles switching between regular and undercover loaders based on auth state
 * Injects custom Claude Squid color from color settings
 */

const LoaderManager = {
  currentMode: null,
  colorOverridesInjected: false,

  /**
   * Initialize loader manager
   * Checks auth state and loads appropriate loader
   */
  async init() {
    // Check if user is in guest mode (no Firebase auth)
    const isGuestMode = !window.currentUser; // currentUser should be set by your auth system
    this.setLoaderMode(isGuestMode ? 'undercover' : 'regular');
  },

  /**
   * Set which loader to use and inject color overrides
   */
  setLoaderMode(mode) {
    if (this.currentMode === mode) return; // Already in this mode

    this.currentMode = mode;
    this.injectColorOverrides();
  },

  /**
   * Inject custom squid color into the canvas rendering
   * This modifies the loader's palette to use the custom color
   */
  injectColorOverrides() {
    if (typeof window === 'undefined') return;

    // Get the custom squid color from color settings
    const customColor = ColorPalette?.get?.('claudeSquidColor') || '#d97757';

    // Create a script that injects the custom color into any canvas element
    const injectionScript = `
      window.CLAUDE_SQUID_COLOR = "${customColor}";
      window.ORIGINAL_PAL2 = window.pal2;
      
      // We'll apply this in the loader's rendering function
      if (window.onLoaderReady) {
        window.onLoaderReady("${customColor}");
      }
    `;

    // Store custom color globally for loaders to access
    window.CLAUDE_SQUID_COLOR = customColor;
    this.colorOverridesInjected = true;
  },

  /**
   * Get the appropriate loader HTML based on current mode
   * Returns raw HTML string to inject
   */
  async getLoaderHTML(mode = null) {
    mode = mode || this.currentMode || 'regular';

    const loaderFile = mode === 'undercover' 
      ? 'src/ui/claude-undercover-loader.html'
      : 'src/ui/claude-loader.html';

    try {
      const response = await fetch(loaderFile);
      return await response.text();
    } catch (error) {
      console.error('Failed to load loader HTML:', error);
      return ''; // Return empty if fetch fails
    }
  },

  /**
   * Update loader color dynamically (e.g., when user changes color settings)
   */
  updateLoaderColor(newColor) {
    window.CLAUDE_SQUID_COLOR = newColor;
    
    // Trigger re-render if possible
    if (window.onLoaderColorChanged) {
      window.onLoaderColorChanged(newColor);
    }
  },

  /**
   * Check if user is logged in (uses Firebase auth or custom system)
   */
  isUserLoggedIn() {
    // Check Firebase auth first
    if (typeof firebase !== 'undefined' && firebase.auth) {
      return !!firebase.auth().currentUser;
    }

    // Fallback to custom user object
    return !!(window.currentUser && window.currentUser.uid);
  },

  /**
   * Switch modes when auth state changes (e.g., after login/logout)
   */
  onAuthStateChanged(isLoggedIn) {
    this.setLoaderMode(isLoggedIn ? 'regular' : 'undercover');
  }
};

// Initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    LoaderManager.init();
  });
} else {
  LoaderManager.init();
}
