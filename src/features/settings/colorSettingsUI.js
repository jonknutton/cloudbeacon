/**
 * UI Integration for Color Settings
 * Adds a settings button to access color customization
 */

const ColorSettingsUI = {
  /**
   * Add a settings button to the page
   * (Currently disabled - Theme settings moved to menu)
   */
  addSettingsButton() {
    // Disabled - theme settings now accessible from main menu
    return;
    // Check if button already exists
    if (document.getElementById('colorSettingsBtn')) {
      return;
    }

    // Create button
    const btn = document.createElement('button');
    btn.id = 'colorSettingsBtn';
    btn.className = 'color-settings-btn';
    btn.innerHTML = '🎨';
    btn.title = 'Theme Settings';
    btn.setAttribute('aria-label', 'Open theme settings');

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .color-settings-btn {
        position: fixed;
        bottom: 140px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--color-buttonPrimary);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
        z-index: 999;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .color-settings-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      }

      .color-settings-btn:active {
        transform: scale(0.95);
      }

      @media (max-width: 600px) {
        .color-settings-btn {
          bottom: 100px;
          right: 16px;
          width: 48px;
          height: 48px;
          font-size: 20px;
        }
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(btn);

    // Add click handler
    btn.addEventListener('click', () => {
      if (typeof ColorSettings !== 'undefined') {
        ColorSettings.showModal();
      }
    });
  }
};

// Add settings button when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ColorSettingsUI.addSettingsButton();
  });
} else {
  ColorSettingsUI.addSettingsButton();
}
