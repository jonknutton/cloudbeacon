# Color Customization - Quick Start Guide

## What's New
CloudBeacon now has a **full customizable color system**! Users can personalize the appearance of the site to their liking.

## For End Users

### How to Access Color Settings
1. Look for the **🎨 palette button** in the bottom-right corner of the page
2. Click it to open the color settings modal
3. You'll see two tabs: **Light Theme** and **Dark Theme**

### Customizing Colors
1. Click on any color square to open a color picker
2. Choose your desired color
3. The color value is shown in the text field next to it
4. Changes apply **instantly** across the entire site
5. Your preferences are **automatically saved**

### Available Colors

**Light Theme:**
- Button Primary - Main button color
- Button Secondary - Secondary button color
- Primary Font - Main text color
- Secondary Font - Lighter text color
- Page Background - Main background color
- Card Background - Card/container background
- Text Box Background - Input field background

**Dark Theme:**
- Page Background - Dark page background
- Card Background - Dark card holder color
- Paper Background - Light paper/sheet color
- Primary Font - Main text in dark theme
- Secondary Font - Lighter text in dark theme

### Resetting Colors
- Click the **"Reset to Defaults"** button to restore all original colors
- A confirmation dialog will appear

### Closing Settings
- Click **"Done"** to close the settings modal
- Or click outside the modal to close it

## For Developers

### Integration
The color system is integrated into:
- `index.html` (feed/home page)
- `profile.html` (user profiles)
- `project.html` (project pages)

### How to Add More Colors

1. **Edit colors.js:**
```javascript
defaults: {
  // Add new color
  myNewColor: '#ffffff',
}
```

2. **Edit colorSettings.js:**
```html
<div class="color-picker-item">
  <label for="colorMyNewColor">My New Color</label>
  <div class="color-input-wrapper">
    <input type="color" id="colorMyNewColor" data-color-key="myNewColor" class="color-picker-input">
    <input type="text" class="color-picker-value" readonly>
  </div>
</div>
```

3. **Use in CSS:**
```css
.my-element {
  background: var(--color-myNewColor);
}
```

### JavaScript API

```javascript
// Get a color
ColorPalette.get('buttonPrimary')

// Set a color
ColorPalette.set('buttonPrimary', '#ff0000')

// Set multiple colors
ColorPalette.setMultiple({
  buttonPrimary: '#ff0000',
  fontPrimary: '#000000'
})

// Reset to defaults
ColorPalette.reset()

// Show the settings modal
ColorSettings.showModal()

// Hide the settings modal
ColorSettings.closeModal()

// Toggle the settings modal
ColorSettings.toggleModal()
```

## Technical Details

### Files Added
- **colors.js** - Core color management
- **colorSettings.js** - Settings modal UI
- **colorSettingsUI.js** - UI integration
- **COLOR_SYSTEM.md** - Full documentation

### Files Modified
- **style.css** - Updated to use CSS variables
- **profile.css** - Updated to use CSS variables
- **project.css** - Updated to use CSS variables
- **index.html** - Added script tags
- **profile.html** - Added script tags
- **project.html** - Added script tags

### Storage
- Colors are saved in browser's `localStorage`
- Persists across sessions
- No server interaction needed

### CSS Variables Used
All colors are defined as CSS custom properties starting with `--color-`:
- `--color-buttonPrimary`
- `--color-buttonSecondary`
- `--color-fontPrimary`
- `--color-fontSecondary`
- `--color-pageBackground`
- `--color-cardBackground`
- `--color-textboxBackground`
- `--color-darkPageBg`
- `--color-darkCardBg`
- `--color-darkPaperBg`
- `--color-darkFontPrimary`
- `--color-darkFontSecondary`

Plus semantic colors for specific UI elements.

## Tips & Tricks

### Creating Theme Presets
Users can create custom themes by adjusting colors to match their preference:
- **Light Professional:** Neutral grays and blacks
- **Dark Mode:** Dark background with light text
- **High Contrast:** Pure black and white for accessibility
- **Vibrant:** Bright, saturated colors

### Keyboard Shortcuts
Currently there are no keyboard shortcuts, but you could add them to colorSettingsUI.js if needed.

## Troubleshooting

### Colors not saving?
- Check that localStorage is enabled in browser settings
- Try clearing browser cache
- Check browser console for errors

### Settings button not visible?
- Make sure all three JavaScript files are loaded
- Check page is fully loaded
- Verify no JavaScript errors in console

### Need help?
- See COLOR_SYSTEM.md for detailed documentation
- Check browser console for error messages
- Verify script files are in the correct directory

## Next Steps

You can enhance this system further by:
1. Adding preset themes (Light, Dark, High Contrast)
2. Creating theme sharing functionality
3. Adding color harmony suggestions
4. Implementing accessibility contrast checking
5. Adding per-page or per-component color overrides
