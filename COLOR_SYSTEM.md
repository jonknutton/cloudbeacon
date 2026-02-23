# CloudBeacon Color Customization System

## Overview
The CloudBeacon application now has a customizable color palette system. Users can personalize the site's appearance by adjusting colors from a settings panel, and their preferences are automatically saved.

## How It Works

### Files Included

1. **colors.js** - Core color palette system
   - Defines the default color palette
   - Manages color state and CSS variables
   - Handles localStorage persistence
   - Provides API for getting/setting colors

2. **colorSettings.js** - Settings UI modal
   - Creates the color settings interface
   - Provides color picker controls
   - Handles modal interactions
   - Provides reset functionality

3. **colorSettingsUI.js** - UI integration
   - Adds the theme settings button to the page
   - Integrates with the floating UI elements
   - Provides easy access to color settings

4. **CSS Updates**
   - Updated style.css, profile.css, and project.css
   - All colors now use CSS custom properties (variables)
   - Easy to modify and customize

## Color Palette Structure

### Light Theme Colors
- **buttonPrimary** - Primary button color (default: #333333)
- **buttonSecondary** - Secondary button color (default: #e0e0e0)
- **fontPrimary** - Primary text color (default: #333333)
- **fontSecondary** - Secondary text color (default: #888888)
- **pageBackground** - Main page background (default: #f0f0f0)
- **cardBackground** - Cards and containers (default: #ffffff)
- **textboxBackground** - Input fields background (default: #ffffff)

### Dark Theme Colors
- **darkPageBg** - Dark page background (default: #1a1a1a)
- **darkCardBg** - Dark card holder (default: #2a2218)
- **darkPaperBg** - Dark paper/sheet background (default: #fdfcf8)
- **darkFontPrimary** - Dark theme primary text (default: #ffffff)
- **darkFontSecondary** - Dark theme secondary text (default: #cccccc)

### Semantic Colors (non-customizable)
- **delete** - Delete/destructive actions (#dc3545)
- **success** - Success indicators (#2b8a3e)
- **warning** - Warning indicators (#f59f00)
- **info** - Information indicators (#0066cc)
- **legislationTag** - Legislation tag styling
- **projectTag** - Project tag styling
- **stageTag** - Stage/status tag styling
- **progressBar** - Progress indicators (#4caf50)
- **border** - Borders (#ccc)
- **shadow** - Shadow effects

## Using the Color System

### For Users
1. Click the 🎨 (palette) button in the bottom-right corner
2. Switch between Light Theme and Dark Theme tabs
3. Click on any color swatch to open the color picker
4. Select your desired color
5. Colors update instantly across the site
6. Click "Reset to Defaults" to restore original colors
7. Click "Done" to close the settings

### For Developers

#### Accessing Colors in JavaScript
```javascript
// Get a single color
const primaryColor = ColorPalette.get('buttonPrimary');

// Get all current colors
const allColors = ColorPalette.getCurrent();

// Set a color
ColorPalette.set('buttonPrimary', '#ff0000');

// Set multiple colors at once
ColorPalette.setMultiple({
  buttonPrimary: '#ff0000',
  fontPrimary: '#000000'
});

// Reset to defaults
ColorPalette.reset();

// Get customizable color keys
const keys = ColorPalette.getCustomizableKeys();

// Get display name for a color
const name = ColorPalette.getDisplayName('buttonPrimary'); // "Button Primary"
```

#### Using CSS Variables
In your CSS, reference colors using CSS custom properties:
```css
.my-button {
  background-color: var(--color-buttonPrimary);
  color: white;
}

.my-text {
  color: var(--color-fontPrimary);
  background: var(--color-pageBackground);
}

.my-card {
  background: var(--color-cardBackground);
  border: 1px solid var(--color-border);
}
```

#### Adding New Customizable Colors
To add more customizable colors:

1. Add to the `defaults` object in colors.js:
```javascript
defaults: {
  // ... existing colors ...
  accentColor: '#3b82f6',
}
```

2. Add to the color picker form in colorSettings.js:
```html
<div class="color-picker-item">
  <label for="colorAccentColor">Accent Color</label>
  <div class="color-input-wrapper">
    <input type="color" id="colorAccentColor" data-color-key="accentColor" class="color-picker-input">
    <input type="text" class="color-picker-value" readonly>
  </div>
</div>
```

3. Use the variable in CSS:
```css
.accent-element {
  color: var(--color-accentColor);
}
```

## Storage

- Colors are automatically saved to `localStorage` under the key `cloudBeaconColors`
- Settings persist across browser sessions
- Users can reset to defaults at any time using the "Reset to Defaults" button

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Requires CSS custom properties support
- Requires localStorage support
- Fallback colors are defined in CSS for older browsers

## Examples

### Example 1: Custom Dark Theme
User sets:
- darkPageBg: #0d0d0d (darker black)
- darkPaperBg: #1a1a1a (dark paper)
- darkFontPrimary: #e0e0e0 (lighter text)

### Example 2: High Contrast Theme
User sets:
- fontPrimary: #000000 (pure black)
- pageBackground: #ffffff (pure white)
- buttonPrimary: #0000ff (bright blue)

## Troubleshooting

### Colors not updating?
1. Check that all three scripts are loaded: colors.js, colorSettings.js, colorSettingsUI.js
2. Verify browser console for any errors
3. Check localStorage is enabled in browser settings
4. Clear browser cache if necessary

### Settings button not appearing?
1. Ensure colorSettingsUI.js is loaded after colorSettings.js
2. Check that ColorSettings object exists in console
3. Verify page has reached "ready" state

### Colors reverting?
1. This usually indicates localStorage is disabled
2. Check browser's privacy/storage settings
3. Try incognito/private browsing mode to test

## Future Enhancements

Potential improvements:
- Preset color schemes (light, dark, high-contrast, sepia, etc.)
- Color harmony suggestions
- Accessibility contrast checking
- Export/import color schemes
- Per-user color preferences (if logged in)
- Theme scheduling (auto-switch based on time)
