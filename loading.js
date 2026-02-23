/**
 * Loading Overlay Manager
 * Displays a loading screen during page transitions and initial load
 */

const LoadingManager = {
  progressInterval: null,
  currentProgress: 0,
  isVisible: true,
  paletteReady: false,
  contentReady: false,

  /**
   * Initialize loading overlay when page starts
   */
  init() {
    // Show loading overlay on page load
    this.show();
    
    // Simulate progress
    this.simulateProgress();
    
    // Wait for both palette AND content to be ready before hiding
    this.waitForReady();
    
    // Also hide on window load event (fallback timeout)
    window.addEventListener('load', () => this.checkReady());
  },

  /**
   * Signal that color palette is ready
   */
  setPaletteReady() {
    this.paletteReady = true;
    this.checkReady();
  },

  /**
   * Signal that content is ready
   */
  setContentReady() {
    this.contentReady = true;
    this.checkReady();
  },

  /**
   * Check if both palette and content are ready
   */
  checkReady() {
    if (this.paletteReady && this.contentReady) {
      this.complete();
    }
  },

  /**
   * Wait for ready signals or timeout
   */
  waitForReady() {
    // Timeout fallback - hide after 8 seconds regardless
    setTimeout(() => {
      if (this.isVisible) {
        console.warn('Loading timeout - hiding overlay');
        this.complete();
      }
    }, 8000);
  },

  /**
   * Show the loading overlay
   */
  show() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      this.isVisible = true;
      this.currentProgress = 0;
      this.updateProgress(0);
    }
  },

  /**
   * Hide the loading overlay with a fade out
   */
  hide() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      this.isVisible = false;
      if (this.progressInterval) {
        clearInterval(this.progressInterval);
      }
    }
  },

  /**
   * Hide after a delay (for smooth transition)
   */
  hideAfterDelay(delay = 500) {
    setTimeout(() => {
      this.hide();
    }, delay);
  },

  /**
   * Simulate progress bar animation
   */
  simulateProgress() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }
    
    this.progressInterval = setInterval(() => {
      if (this.currentProgress < 85) {
        // Random increment between 5-15%
        const increment = Math.random() * 10 + 5;
        this.currentProgress = Math.min(this.currentProgress + increment, 85);
        this.updateProgress(this.currentProgress);
      }
    }, 300);
  },

  /**
   * Update progress bar and percentage text
   */
  updateProgress(percent) {
    const bar = document.getElementById('loadingProgress');
    const percentText = document.getElementById('loadingPercent');
    
    if (bar) {
      bar.style.width = percent + '%';
    }
    if (percentText) {
      percentText.textContent = Math.round(percent) + '%';
    }
  },

  /**
   * Complete the progress on page ready
   */
  complete() {
    if (!this.isVisible) return;
    
    this.currentProgress = 100;
    this.updateProgress(100);
    this.hideAfterDelay(300);
  }
};

// Initialize loading manager when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LoadingManager.init());
} else {
  LoadingManager.init();
}

// Handle navigation to other pages
document.addEventListener('click', function(event) {
  const target = event.target.closest('a');
  if (target && target.href && !target.target && !target.hasAttribute('onclick')) {
    const href = target.getAttribute('href');
    // Only show loading for internal navigation
    if (href && !href.startsWith('http') && !href.startsWith('javascript:') && !href.startsWith('#')) {
      LoadingManager.show();
      LoadingManager.simulateProgress();
      // Reset ready states for new page
      LoadingManager.paletteReady = false;
      LoadingManager.contentReady = false;
    }
  }
});
