# EM Data Pipeline Guide

## Overview

The EM (Electromagnetic) data pipeline automates the acquisition, consolidation, and indexing of historical earthquake and solar activity data spanning decades. This enables the 3D visualization to support temporal analysis and correlation studies.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ fetch_earthquake_data.py                            │
│ • USGS ComCat API queries (1900-present)            │
│ • Automatic 180-day chunking (avoids 20k limit)     │
│ • Output: 12+ JSON files (~120 years)               │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─> usgs_earthquakes_1900-1910.json
                 ├─> usgs_earthquakes_1910-1920.json
                 └─> ... (one file per decade)
                 
┌─────────────────────────────────────────────────────┐
│ fetch_solar_data.py                                 │
│ • NOAA & SILSO data sources (1610-present)          │
│ • Four metrics: sunspots, Kp, Dst, F10.7            │
│ • Output: 4 JSON files + metadata                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─> silso_sunspots.json (1610-now)
                 ├─> noaa_kp_index.json (1932-now)
                 ├─> noaa_dst_index.json (1957-now)
                 └─> f107_index.json (1947-now)

┌─────────────────────────────────────────────────────┐
│ consolidate_data.py                                 │
│ • Merges all source files                           │
│ • Creates searchable indices                        │
│ • Generates metadata                                │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─> earthquakes_consolidated.json
                 ├─> earthquakes_index.json
                 ├─> solar_consolidated.json
                 └─> index_metadata.json

┌─────────────────────────────────────────────────────┐
│ data-loader.js (Frontend)                           │
│ • Loads consolidated data on demand                 │
│ • Provides filtering API (date, magnitude, region)  │
│ • Enables correlation analysis                      │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Run the Complete Pipeline

```bash
cd EM/scripts
python run_pipeline.py
```

This executes all three steps in sequence:
- Fetches earthquake data (5-10 minutes)
- Fetches solar data (2-3 minutes)  
- Consolidates everything (< 1 minute)

**First time only:** ⏭️ This runs all steps sequentially on first execution

### 2. Run Individual Steps (if needed)

```bash
# Just fetch earthquakes
python fetch_earthquake_data.py

# Just fetch solar data
python fetch_solar_data.py

# Just consolidate/re-index
python consolidate_data.py
```

## Data Sources & Coverage

### Earthquakes
- **Source:** USGS ComCat (Comprehensive Earthquake Catalog)
- **API:** `/fdsnws/event/1/query` endpoint
- **Coverage:** 1900-01-01 to present (~126 years)
- **Magnitude:** All magnitudes (0+)
- **Output:** GeoJSON features with depth/magnitude/location

### Solar Activity - 4 Metrics

| Metric | Source | Coverage | Unit | Description |
|--------|--------|----------|------|-------------|
| Sunspots | SILSO | 1610-now | Count | Daily sunspot number |
| Kp Index | NOAA | 1932-now | 0-9 | Planetary geomagnetic activity |
| Dst Index | NOAA | 1957-now | nanoTesla | Disturbance storm time |
| F10.7 | NOAA | 1947-now | sfu | Solar radio flux 10.7 cm |

## Data Structure

### Earthquake Records (GeoJSON)
```json
{
  "type": "Feature",
  "properties": {
    "mag": 7.2,
    "place": "118 km NW of Hihifo, Tonga",
    "time": "2023-01-15T16:22:30.000Z",
    "tsunami": 0,
    "felt": 123
  },
  "geometry": {
    "type": "Point",
    "coordinates": [-174.2, -16.5, 10.2]  // [lon, lat, depth_km]
  }
}
```

### Solar Records
```json
{
  "timestamp": "1932-01-01T00:00:00Z",
  "metric": "kp_index",
  "value": 3.0,
  "source": "NOAA Space Weather Prediction Center"
}
```

## Using the Data Loader (Frontend)

### Basic Usage

```javascript
// Initialize loader
const loader = new HistoricalDataLoader("/data");

// Load all data
await loader.loadAll();

// Get earthquakes for a date range
const quakes2024 = loader.getEarthquakesByDateRange(
    "2024-01-01", 
    "2024-12-31"
);

// Filter by magnitude
const strong = loader.getEarthquakesByMagnitude(6.0, 9.0);

// Get solar data
const kpData = loader.getSolarByDateRange(
    "2024-01-01", 
    "2024-12-31", 
    "kp_index"
);

// Find correlations (earthquakes within 7 days of solar events)
const correlations = loader.correlateEarthquakesWithSolar(
    "kp_index",
    7,  // days after
    5.0 // minimum magnitude
);
```

### API Reference

**Loading Data**
- `async loadAll()` - Load earthquakes, solar data, and metadata
- `async loadEarthquakes()` - Load earthquake data only
- `async loadSolarData()` - Load solar data only

**Querying Earthquakes**
- `getEarthquakesByDateRange(start, end)` - Filter by date
- `getEarthquakesByMagnitude(min, max)` - Filter by magnitude
- `getEarthquakesByRegion(minLat, maxLat, minLon, maxLon)` - Filter by coordinates

**Querying Solar Data**
- `getSolarByDateRange(start, end, metric?)` - Get solar data for date range
  - Omit `metric` to get all metrics
  - Specify metric (e.g., "kp_index") to get one

**Analysis**
- `correlateEarthquakesWithSolar(metric, daysAfter, minMag)` - Find lag correlations
- `getStatistics()` - Get summary stats
- `getAvailableDateRange()` - Get data coverage span

## Integration with Visualization

### 1. Add Data Loader to HTML

```html
<!-- In index.html, after other scripts -->
<script src="js/data-loader.js"></script>
```

### 2. Initialize in Visualization

```javascript
// In controls.js or visualization init code

const dataLoader = new HistoricalDataLoader("/data");
let historicalData = null;

// Load data on page startup
async function initializeVisualization() {
    const loaded = await dataLoader.loadAll();
    if (loaded) {
        historicalData = dataLoader.earthquakeData;
        console.log(`Ready with ${historicalData.length} earthquakes`);
    }
}

// When user selects date range
function onDateRangeChange(startDate, endDate) {
    const filtered = dataLoader.getEarthquakesByDateRange(startDate, endDate);
    // Update visualization with filtered data
    updateEarthquakeVisualization(filtered);
}

// When user requests correlation analysis
function onCorrelationRequest(metric, daysOffset) {
    const results = dataLoader.correlateEarthquakesWithSolar(
        metric, 
        daysOffset, 
        4.5  // minimum magnitude
    );
    displayCorrelationResults(results);
}
```

## File Locations

```
EM/
├── data/
│   ├── earthquakes/
│   │   ├── earthquakes_consolidated.json      # All quakes merged
│   │   ├── earthquakes_index.json             # Date-based index
│   │   └── usgs_earthquakes_YYYY-YYYY.json    # Source files (if kept)
│   ├── solar/
│   │   ├── solar_consolidated.json            # All metrics merged
│   │   ├── silso_sunspots.json                # Sunspot data
│   │   ├── noaa_kp_index.json                 # Kp index
│   │   ├── noaa_dst_index.json                # Dst index
│   │   ├── f107_index.json                    # Solar radio flux
│   │   └── metadata.json                      # Source documentation
│   └── index_metadata.json                    # Master metadata
├── scripts/
│   ├── fetch_earthquake_data.py               # Earthquake fetcher
│   ├── fetch_solar_data.py                    # Solar fetcher
│   ├── consolidate_data.py                    # Merger & indexer
│   └── run_pipeline.py                        # Orchestrator
└── js/
    └── data-loader.js                         # Frontend loader class
```

## Performance Notes

- **Initial Load:** First execution takes 5-15 minutes (network I/O + parsing)
- **Subsequent Loads:** < 1 second (files cached locally)
- **Memory Usage:** ~50-100 MB for full consolidated datasets in browser
- **Disk Usage:** ~100-200 MB for JSON files

### Optimization Tips

1. **Lazy Load:** Don't load all data on page startup; fetch history on-demand
2. **Cache:** Browser caches fetched JSON; refresh is instant
3. **Subset:** Pre-generate filtered datasets for common queries
4. **Compression:** Can gzip JSON files for 60-80% size reduction

## Troubleshooting

### "Network not available" errors
- Check internet connection
- USGS/NOAA may be temporarily unavailable (rare)
- Try running individual script again after waiting

### "Data not found" in frontend
- Verify `/data/earthquakes/` and `/data/solar/` directories exist
- Verify consolidation step completed (`consolidate_data.py`)
- Check browser console for specific file paths 404'ing

### Script hangs or timeout
- USGS API can be slow for large date ranges
- Defaults use reasonable timeouts; may need to wait 5-10 minutes
- Can interrupt (Ctrl+C) and re-run; scripts checkpoint and resume

### Stale data
- Solar data sources update monthly; re-run `fetch_solar_data.py` monthly
- USGS updates within seconds; re-run `fetch_earthquake_data.py` daily/weekly
- Consolidation picks up new/updated source files automatically

## Future Enhancements

- [ ] Add confidence scores to detections
- [ ] Create multi-event correlation (N earthquakes in M days after solar spike)
- [ ] Implement spectral analysis (frequency domain)
- [ ] Add prediction model training (ML correlation detection)
- [ ] Create shareable JSON report exports
- [ ] Add GIS/mapping integration (Leaflet)
- [ ] Implement websocket updates for near-real-time data

## References

- [USGS ComCat API](https://earthquake.usgs.gov/fdsnws/event/1/)
- [SILSO Sunspot Data](https://www.sidc.be/SILSO/datafiles)
- [NOAA Space Weather](https://www.swpc.noaa.gov/products/indices)
- [GeoJSON Spec](https://tools.ietf.org/html/rfc7946)
