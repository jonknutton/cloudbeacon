# Earthquake Visualization - Cloud Beacon

An interactive 3D globe visualization of recent earthquakes, powered by USGS Earthquake Hazards Program data and Three.js.

## Features

- **Real-time 3D Earth** - Interactive rotating globe with realistic styling
- **Live Earthquake Data** - Pulls data directly from USGS API
- **Magnitude-based Visualization** - Sphere size and color represent earthquake magnitude
- **Interactive Selection** - Click on spheres to view detailed earthquake information
- **Customizable Filters** - Filter by time range and minimum magnitude
- **Auto-rotation** - Toggle automatic Earth rotation
- **Deep Visualization** - Depth represented as radial distance from Earth's surface

## Data Source

Data is fetched from the **USGS Earthquake Hazards Program**:
- API: https://earthquake.usgs.gov/earthquakes/feed/v1.0/
- Updates: Real-time feed access
- Coverage: Global, minimum magnitude 2.0

## Main Components

### `index.html`
Main HTML page with controls panel and info display.

**Layout:**
- Left: 3D visualization canvas (70%)
- Center-right: Control panel (controls, filters, statistics)
- Right: Information panel (earthquake details)

### `css/style.css`
Dark cyberpunk theme with cyan accents (#00d4ff).

**Features:**
- Responsive grid layout
- Scrollable panels with custom scrollbars
- Animated UI elements
- Mobile-friendly breakpoints

### `js/usgs-fetcher.js`
Handles all USGS API communication and data parsing.

**Key Methods:**
- `fetch(timeRange, minMagnitude)` - Fetch earthquake data
- `parseData(geojson, minMagnitude)` - Parse GeoJSON response
- `toCartesian(earthquake, radiusScale)` - Convert lat/lon/depth to 3D coordinates
- `getStats()` - Calculate statistics about loaded data
- `filterByMagnitude(minMag)` - Filter earthquakes by magnitude

### `js/earth-3d.js`
Three.js visualization engine.

**Key Methods:**
- `addEarthquakes(earthquakes, radiusScale)` - Render earthquakes on globe
- `filterByMagnitude(minMagnitude)` - Show/hide earthquakes by magnitude
- `selectEarthquake(mesh)` - Handle earthquake selection
- `getMagnitudeColor(magnitude)` - Get color based on magnitude scale

**Color Scale:**
- Magnitude < 3: Green (Minor)
- Magnitude 3-4: Yellow (Light)
- Magnitude 4-5: Orange (Moderate)
- Magnitude 5-6: Red-Orange (Strong)
- Magnitude 6-7: Red (Major)
- Magnitude 7+: Magenta (Great)

### `js/controls.js`
UI controller and event handling.

**Features:**
- Auto-loads data on page initialization
- Manages all UI control interactions
- Displays earthquake details on selection
- Updates statistics in real-time

## Usage

### Basic Setup
1. Copy `earthquake-viz/` folder to your web server
2. Open `index.html` in a web browser
3. Data loads automatically

### Controls

**Time Range:**
- Past Week
- Past Month (default)
- All Available

**Magnitude Filter:**
- Slider: 2.0 - 8.0
- Shows/hides earthquakes below threshold
- Updates instantly

**View Options:**
- Show Location Labels (planned)
- Auto Rotate: Toggles Earth rotation

**Data Refresh:**
- "Load Latest Data" button: Manually refresh earthquake data

### Interaction

- **Click on spheres** - View earthquake details
- **Drag to rotate** - (planned feature)
- **Scroll to zoom** - (planned feature)
- **Hover** - Cursor changes to indicate clickable elements

## Future Enhancements

### Phase 2: Controls
- [ ] Mouse drag to rotate Earth
- [ ] Mouse scroll to zoom
- [ ] Double-click to center on earthquake
- [ ] Location labels on hover

### Phase 3: Analysis Features
- [ ] Heatmaps showing fault lines
- [ ] Temporal animation (earthquakes over time)
- [ ] Magnitude vs depth scatter plot
- [ ] Regional statistics
- [ ] Induction effect visualization

### Phase 4: Advanced
- [ ] AR mode for mobile
- [ ] Real-time socket updates
- [ ] Historical data archive
- [ ] Export data to CSV/JSON
- [ ] Tectonic plate overlay

## Technical Details

### Coordinate System
- **Spherical to Cartesian**: Uses Three.js MathUtils for conversion
- **Radius Calculation**: `r = (Earth_Radius - depth_km) × scale_factor`
- **Depth Visualization**: Pushes earthquakes inward from surface

### Performance Optimization
- Indexed sphere geometry (16×16 resolution)
- Efficient raycasting for click detection
- Visibility toggling (no mesh removal)
- 60 FPS target

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (WebGL required)
- Mobile: Tested on iOS/Android browsers

## Data Schema

Each earthquake object contains:
```javascript
{
    lat: number,           // Latitude (-90 to 90)
    lon: number,           // Longitude (-180 to 180)
    depth: number,         // Depth in km
    magnitude: number,     // Magnitude (typically 2-9)
    time: Date,            // Event timestamp
    place: string,         // Location description
    usgsId: string,        // USGS event ID
    url: string,           // Link to USGS event page
    felt: number | null,   // Number of felt reports
    tsunami: number,       // Tsunami flag (0 or 1)
    type: string           // Geometry type
}
```

## API Notes

### Rate Limits
- USGS API: No authentication required
- No known public rate limits
- Responses cached in browser

### Data Availability
- Week: ~500-2000 earthquakes
- Month: ~2000-5000 earthquakes
- All: ~150,000 earthquakes (may be slow)

### Endpoints
- `all_week.geojson` - Last 7 days
- `all_month.geojson` - Last 30 days
- Available via CORS (no proxy needed)

## Troubleshooting

### Data not loading?
1. Check browser console (F12) for errors
2. Verify internet connection
3. Try "Load Latest Data" button
4. Check if USGS API is accessible: https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson

### Performance issues?
1. Reduce time range (use "Week" instead of "All")
2. Increase magnitude filter (hide minor earthquakes)
3. Disable auto-rotation
4. Close other browser tabs

### Visualization not rendering?
1. Verify WebGL support in browser
2. Update GPU drivers
3. Try different browser
4. Check for browser console errors

## License

Data sourced from USGS Earthquake Hazards Program (public domain)

## Notes

- This visualization is designed for exploring earthquake patterns and testing theories about tectonic interactions
- Not intended as a real-time warning system
- Use official USGS resources for scientific research
- Depth visualization is simplified (actual depth variation is scaled for visibility)
