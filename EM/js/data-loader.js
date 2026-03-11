/**
 * Data Loader for Historical Earthquake & Solar Data
 * Handles loading, caching, and filtering of consolidated datasets
 */

class HistoricalDataLoader {
    constructor(dataDir = "/data") {
        this.dataDir = dataDir;
        this.earthquakeData = null;
        this.solarData = null;
        this.metadata = null;
        this.cache = new Map();
    }

    /**
     * Load all historical data
     */
    async loadAll() {
        console.log("📂 Loading historical data...");
        
        try {
            const [quakes, solar, metadata] = await Promise.all([
                this.loadEarthquakes(),
                this.loadSolarData(),
                this.loadMetadata()
            ]);
            
            this.earthquakeData = quakes;
            this.solarData = solar;
            this.metadata = metadata;
            
            console.log(`✓ Loaded ${quakes.length} earthquakes`);
            console.log(`✓ Loaded ${Object.keys(solar).length} solar metrics`);
            
            return true;
        } catch (e) {
            console.error("Error loading data:", e);
            return false;
        }
    }

    /**
     * Load consolidated earthquake data
     */
    async loadEarthquakes() {
        if (this.cache.has("earthquakes")) {
            return this.cache.get("earthquakes");
        }

        const response = await fetch(`${this.dataDir}/earthquakes/earthquakes_consolidated.json`);
        if (!response.ok) throw new Error("Failed to load earthquakes");
        
        const data = await response.json();
        this.cache.set("earthquakes", data);
        return data;
    }

    /**
     * Load consolidated solar data (all metrics)
     */
    async loadSolarData() {
        if (this.cache.has("solar")) {
            return this.cache.get("solar");
        }

        const response = await fetch(`${this.dataDir}/solar/solar_consolidated.json`);
        if (!response.ok) throw new Error("Failed to load solar data");
        
        const data = await response.json();
        this.cache.set("solar", data);
        return data;
    }

    /**
     * Load metadata
     */
    async loadMetadata() {
        if (this.cache.has("metadata")) {
            return this.cache.get("metadata");
        }

        const response = await fetch(`${this.dataDir}/index_metadata.json`);
        if (!response.ok) throw new Error("Failed to load metadata");
        
        const data = await response.json();
        this.cache.set("metadata", data);
        return data;
    }

    /**
     * Filter earthquakes by date range
     * @param {Date|string} startDate - Start date (ISO string or Date object)
     * @param {Date|string} endDate - End date (ISO string or Date object)
     * @returns {Array} Filtered earthquake features
     */
    getEarthquakesByDateRange(startDate, endDate) {
        if (!this.earthquakeData) {
            console.warn("Earthquake data not loaded");
            return [];
        }

        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return this.earthquakeData.filter(feature => {
            const time = feature.properties?.time;
            if (!time) return false;
            const timestamp = new Date(time).getTime();
            return timestamp >= start && timestamp <= end;
        });
    }

    /**
     * Filter earthquakes by magnitude range
     */
    getEarthquakesByMagnitude(minMag, maxMag) {
        if (!this.earthquakeData) return [];

        return this.earthquakeData.filter(feature => {
            const mag = feature.properties?.mag ?? 0;
            return mag >= minMag && mag <= maxMag;
        });
    }

    /**
     * Get earthquakes in geographic bounding box
     */
    getEarthquakesByRegion(minLat, maxLat, minLon, maxLon) {
        if (!this.earthquakeData) return [];

        return this.earthquakeData.filter(feature => {
            const [lon, lat, depth] = feature.geometry?.coordinates ?? [];
            return lat >= minLat && lat <= maxLat && 
                   lon >= minLon && lon <= maxLon;
        });
    }

    /**
     * Get solar activity data for date range
     */
    getSolarByDateRange(startDate, endDate, metric = null) {
        if (!this.solarData) return metric ? [] : {};

        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        const filterByDateRange = (records) => {
            return records.filter(record => {
                const timestamp = new Date(record.timestamp).getTime();
                return timestamp >= start && timestamp <= end;
            });
        };

        if (metric) {
            // Return specific metric
            const data = this.solarData[metric] || [];
            return filterByDateRange(data);
        } else {
            // Return all metrics
            const result = {};
            for (const [key, records] of Object.entries(this.solarData)) {
                result[key] = filterByDateRange(records);
            }
            return result;
        }
    }

    /**
     * Correlate earthquakes with solar activity
     * Find earthquakes within N days after solar events
     */
    correlateEarthquakesWithSolar(solarMetric, daysAfter = 7, minShakeMag = 0) {
        if (!this.solarData || !this.earthquakeData) return [];

        const solar = this.solarData[solarMetric] || [];
        const correlations = [];

        for (const event of solar) {
            const eventTime = new Date(event.timestamp).getTime();
            const windowEnd = eventTime + (daysAfter * 24 * 60 * 60 * 1000);

            const nearbyQuakes = this.earthquakeData.filter(feature => {
                const quakeTime = new Date(feature.properties?.time).getTime();
                const mag = feature.properties?.mag ?? 0;
                
                return quakeTime >= eventTime && 
                       quakeTime <= windowEnd && 
                       mag >= minShakeMag;
            });

            if (nearbyQuakes.length > 0) {
                correlations.push({
                    solar_event: event,
                    earthquakes: nearbyQuakes,
                    count: nearbyQuakes.length,
                    lag_days: (nearbyQuakes[0].properties?.time - event.timestamp) / 
                              (24 * 60 * 60 * 1000)
                });
            }
        }

        return correlations;
    }

    /**
     * Get summary statistics
     */
    getStatistics() {
        return {
            earthquakes: this.metadata?.earthquakes || {},
            solar: this.metadata?.solar || {},
            updated: this.metadata?.created
        };
    }

    /**
     * Get date range of available data
     */
    getAvailableDateRange() {
        if (!this.metadata) return null;

        return {
            earthquakes: this.metadata.earthquakes?.date_range,
            solar: {
                minDate: "1610-01-01",  // SILSO sunspots
                maxDate: new Date().toISOString().split("T")[0]
            }
        };
    }
}

// Export for use in HTML/frontend
// Usage:
// const loader = new HistoricalDataLoader();
// await loader.loadAll();
// const recentQuakes = loader.getEarthquakesByDateRange("2024-01-01", "2024-12-31");
