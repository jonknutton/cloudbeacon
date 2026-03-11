/**
 * USGS Earthquake Data Fetcher
 * Retrieves earthquake data from USGS Earthquake Hazards Program
 */

class USGSFetcher {
    constructor() {
        this.baseUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary';
        this.earthquakes = [];
    }

    /**
     * Fetch earthquakes from USGS API
     * @param {string} timeRange - 'week', 'month', or 'all'
     * @param {number} minMagnitude - Minimum magnitude to fetch
     * @returns {Promise<Array>} Array of earthquake objects
     */
    async fetch(timeRange = 'month', minMagnitude = 2) {
        try {
            // Choose endpoint based on time range
            let endpoint;
            switch(timeRange) {
                case 'week':
                    endpoint = `${this.baseUrl}/all_week.geojson`;
                    break;
                case 'month':
                    endpoint = `${this.baseUrl}/all_month.geojson`;
                    break;
                case 'all':
                    // For "all", use the largest available dataset
                    endpoint = `${this.baseUrl}/all_month.geojson`;
                    break;
                default:
                    endpoint = `${this.baseUrl}/all_month.geojson`;
            }

            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.earthquakes = this.parseData(data, minMagnitude);
            
            return this.earthquakes;
        } catch (error) {
            console.error('Error fetching earthquake data:', error);
            throw error;
        }
    }

    /**
     * Parse GeoJSON data from USGS
     * @param {Object} geojson - GeoJSON data from USGS
     * @param {number} minMagnitude - Minimum magnitude filter
     * @returns {Array} Parsed earthquake objects
     */
    parseData(geojson, minMagnitude = 2) {
        const earthquakes = [];

        geojson.features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates; // [longitude, latitude, depth_km]

            // Filter by magnitude
            if (props.mag < minMagnitude) {
                return;
            }

            earthquakes.push({
                lat: coords[1],
                lon: coords[0],
                depth: coords[2] || 0,
                magnitude: props.mag || 0,
                time: new Date(props.time),
                place: props.place || 'Unknown',
                usgsId: feature.id,
                url: props.url || '',
                felt: props.felt || null,
                tsunami: props.tsunami || 0,
                type: feature.geometry.type
            });
        });

        // Sort by magnitude descending
        earthquakes.sort((a, b) => b.magnitude - a.magnitude);

        return earthquakes;
    }

    /**
     * Get statistics about loaded earthquakes
     * @returns {Object} Statistics object
     */
    getStats() {
        if (this.earthquakes.length === 0) {
            return {
                count: 0,
                minMagnitude: 0,
                maxMagnitude: 0,
                avgMagnitude: 0,
                maxDepth: 0,
                avgDepth: 0
            };
        }

        const mags = this.earthquakes.map(e => e.magnitude);
        const depths = this.earthquakes.map(e => e.depth);

        return {
            count: this.earthquakes.length,
            minMagnitude: Math.min(...mags),
            maxMagnitude: Math.max(...mags),
            avgMagnitude: (mags.reduce((a, b) => a + b) / mags.length).toFixed(1),
            maxDepth: Math.max(...depths),
            avgDepth: (depths.reduce((a, b) => a + b) / depths.length).toFixed(1)
        };
    }

    /**
     * Filter earthquakes by magnitude
     * @param {number} minMag - Minimum magnitude
     * @returns {Array} Filtered earthquakes
     */
    filterByMagnitude(minMag) {
        return this.earthquakes.filter(e => e.magnitude >= minMag);
    }

    /**
     * Convert earthquake location to 3D coordinates
     * Earth radius: ~6371 km
     * @param {Object} earthquake - Earthquake object
     * @param {number} radiusScale - Scale factor for radius
     * @param {number} depthExaggeration - Depth exaggeration factor (default 1.0)
     * @returns {Object} 3D coordinates {x, y, z}
     */
    toCartesian(earthquake, radiusScale = 1, depthExaggeration = 1.0) {
        const earthRadius = 6371; // km
        const surfaceRadius = earthRadius * radiusScale;
        const depth = (earthquake.depth || 0) * depthExaggeration;
        
        // Distance from Earth's center = surface radius - depth (in km, scaled to visualization units)
        const r = Math.max(0.1, surfaceRadius - (depth * radiusScale));
        
        // Convert lat/lon to radians
        const lat = THREE.MathUtils.degToRad(earthquake.lat);
        const lon = THREE.MathUtils.degToRad(earthquake.lon);
        
        // Convert spherical coordinates to Cartesian
        return {
            x: r * Math.cos(lat) * Math.cos(lon),
            y: r * Math.sin(lat),
            z: r * Math.cos(lat) * Math.sin(lon),
            r: r
        };
    }
}

// Export for use in other modules
window.USGSFetcher = USGSFetcher;
