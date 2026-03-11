/**
 * Color Settings Modal
 * Provides UI for customizing the application color palette
 */

const ColorSettings = {
  // HTML structure for the settings modal
  getModalHTML() {
    return `
      <div id="colorSettingsModal" class="color-settings-modal">
        <div class="color-settings-backdrop"></div>
        <div class="color-settings-container">
          <div class="color-settings-header">
            <h2>Theme Colors</h2>
            <button class="color-settings-close" aria-label="Close settings">✕</button>
          </div>
          
          <div class="color-settings-tabs">
            <button class="color-settings-tab active" data-tab="light">Light Theme</button>
            <button class="color-settings-tab" data-tab="dark">Dark Theme</button>
          </div>
          
          <div class="color-settings-content">
            <div id="lightThemeTab" class="color-settings-tab-content active">
              <div class="color-picker-grid">
                <div class="color-picker-item">
                  <label for="colorButtonPrimary">Button Primary</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorButtonPrimary" data-color-key="buttonPrimary" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorButtonSecondary">Button Secondary</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorButtonSecondary" data-color-key="buttonSecondary" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorFontPrimary">Primary Font</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorFontPrimary" data-color-key="fontPrimary" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorFontSecondary">Secondary Font</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorFontSecondary" data-color-key="fontSecondary" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorPageBackground">Page Background</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorPageBackground" data-color-key="pageBackground" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorCardBackground">Card Background</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorCardBackground" data-color-key="cardBackground" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorTextboxBackground">Text Box Background</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorTextboxBackground" data-color-key="textboxBackground" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
              </div>
            </div>
            
            <div id="darkThemeTab" class="color-settings-tab-content">
              <div class="color-picker-grid">
                <div class="color-picker-item">
                  <label for="colorDarkPageBg">Page Background</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorDarkPageBg" data-color-key="darkPageBg" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorDarkCardBg">Card Background</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorDarkCardBg" data-color-key="darkCardBg" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorDarkPaperBg">Paper Background</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorDarkPaperBg" data-color-key="darkPaperBg" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorDarkFontPrimary">Primary Font</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorDarkFontPrimary" data-color-key="darkFontPrimary" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
                
                <div class="color-picker-item">
                  <label for="colorDarkFontSecondary">Secondary Font</label>
                  <div class="color-input-wrapper">
                    <input type="color" id="colorDarkFontSecondary" data-color-key="darkFontSecondary" class="color-picker-input">
                    <input type="text" class="color-picker-value" readonly>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="color-settings-actions">
            <button id="resetColorsBtn" class="color-btn color-btn-secondary">Reset to Defaults</button>
            <button id="closeColorSettingsBtn" class="color-btn color-btn-primary">Done</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Initialize color settings modal
   */
  init() {
    // Create modal HTML
    const modalHTML = this.getModalHTML();
    const wrapper = document.createElement('div');
    wrapper.innerHTML = modalHTML;
    document.body.appendChild(wrapper.firstElementChild);

    // Add CSS
    this.addCSS();

    // Setup event listeners
    this.setupEventListeners();

    // Load current colors into inputs
    this.loadColorsToInputs();
  },

  /**
   * Add CSS for color settings modal
   */
  addCSS() {
    const css = `
      /* Color Settings Modal */
      .color-settings-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
      }

      .color-settings-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
      }

      .color-settings-container {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--color-cardBackground);
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        color: var(--color-fontPrimary);
      }

      .color-settings-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid #e0e0e0;
      }

      .color-settings-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
      }

      .color-settings-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .color-settings-close:hover {
        color: var(--color-fontPrimary);
      }

      .color-settings-tabs {
        display: flex;
        gap: 8px;
        padding: 16px 24px;
        border-bottom: 1px solid #e0e0e0;
        background: #f5f5f5;
      }

      .color-settings-tab {
        padding: 8px 16px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        color: #999;
        transition: all 0.2s;
      }

      .color-settings-tab:hover {
        color: var(--color-fontPrimary);
      }

      .color-settings-tab.active {
        background: var(--color-buttonPrimary);
        color: white;
        border-color: var(--color-buttonPrimary);
      }

      .color-settings-content {
        flex: 1;
        overflow-y: auto;
        padding: 24px;
      }

      .color-settings-tab-content {
        display: none;
      }

      .color-settings-tab-content.active {
        display: block;
      }

      .color-picker-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
      }

      .color-picker-item {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .color-picker-item label {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #999;
      }

      .color-input-wrapper {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .color-picker-input {
        width: 50px;
        height: 40px;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        flex-shrink: 0;
      }

      .color-picker-value {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
        background: #f9f9f9;
        color: var(--color-fontPrimary);
      }

      .color-settings-actions {
        display: flex;
        gap: 12px;
        padding: 16px 24px;
        border-top: 1px solid #e0e0e0;
        background: #f5f5f5;
      }

      .color-btn {
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        flex: 1;
      }

      .color-btn-primary {
        background: var(--color-buttonPrimary);
        color: white;
      }

      .color-btn-primary:hover {
        background: #555;
      }

      .color-btn-secondary {
        background: transparent;
        border: 1px solid #ddd;
        color: var(--color-fontPrimary);
      }

      .color-btn-secondary:hover {
        background: #f0f0f0;
        border-color: #999;
      }

      @media (max-width: 600px) {
        .color-settings-container {
          width: 95%;
          max-height: 90vh;
        }

        .color-picker-grid {
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .color-settings-actions {
          flex-direction: column;
        }

        .color-btn {
          width: 100%;
        }
      }
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const modal = document.getElementById('colorSettingsModal');
    const backdrop = modal.querySelector('.color-settings-backdrop');
    const closeBtn = modal.querySelector('.color-settings-close');
    const doneBtn = document.getElementById('closeColorSettingsBtn');
    const resetBtn = document.getElementById('resetColorsBtn');
    const tabButtons = modal.querySelectorAll('.color-settings-tab');
    const colorInputs = modal.querySelectorAll('.color-picker-input');

    // Close modal
    backdrop.addEventListener('click', () => this.closeModal());
    closeBtn.addEventListener('click', () => this.closeModal());
    doneBtn.addEventListener('click', () => this.closeModal());

    // Tab switching
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Color change
    colorInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        const colorKey = e.target.dataset.colorKey;
        const value = e.target.value;
        ColorPalette.set(colorKey, value);
        
        // Update the text input
        const wrapper = e.target.closest('.color-input-wrapper');
        const textInput = wrapper.querySelector('.color-picker-value');
        textInput.value = value;
      });

      input.addEventListener('input', (e) => {
        const wrapper = e.target.closest('.color-input-wrapper');
        const textInput = wrapper.querySelector('.color-picker-value');
        textInput.value = e.target.value;
      });
    });

    // Reset colors
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all colors to default? This cannot be undone.')) {
        ColorPalette.reset();
        this.loadColorsToInputs();
      }
    });
  },

  /**
   * Switch between light and dark theme tabs
   */
  switchTab(tabName) {
    const modal = document.getElementById('colorSettingsModal');
    const contents = modal.querySelectorAll('.color-settings-tab-content');
    const tabs = modal.querySelectorAll('.color-settings-tab');

    contents.forEach(content => content.classList.remove('active'));
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabName + 'ThemeTab').classList.add('active');
    modal.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  },

  /**
   * Load current colors into color inputs
   */
  loadColorsToInputs() {
    const modal = document.getElementById('colorSettingsModal');
    const colorInputs = modal.querySelectorAll('.color-picker-input');

    colorInputs.forEach(input => {
      const colorKey = input.dataset.colorKey;
      const color = ColorPalette.get(colorKey);
      
      input.value = color;
      
      const wrapper = input.closest('.color-input-wrapper');
      const textInput = wrapper.querySelector('.color-picker-value');
      textInput.value = color;
    });
  },

  /**
   * Show the color settings modal
   */
  showModal() {
    const modal = document.getElementById('colorSettingsModal');
    if (modal) {
      modal.style.display = 'block';
      this.loadColorsToInputs();
    }
  },

  /**
   * Hide the color settings modal
   */
  closeModal() {
    const modal = document.getElementById('colorSettingsModal');
    if (modal) {
      modal.style.display = 'none';
    }
  },

  /**
   * Toggle the modal
   */
  toggleModal() {
    const modal = document.getElementById('colorSettingsModal');
    if (modal) {
      const isVisible = modal.style.display !== 'none';
      if (isVisible) {
        this.closeModal();
      } else {
        this.showModal();
      }
    }
  }
};

// Initialize color settings when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ColorSettings.init();
  });
} else {
  ColorSettings.init();
}
