/**
 * Heatmap Data Processor
 * Converts earthquake data into magnitude/frequency density blocks
 */

class HeatmapCalculator {
    constructor(blockSize = 10, depthBlockSize = 100) {
        this.blockSize = blockSize;        // degrees (lat/lon) - increased from 1 to 10 for performance
        this.depthBlockSize = depthBlockSize;  // km - increased from 10 to 100 for performance
        this.blocks = new Map();  // key: "lat,lon,depth" => {count, totalMag, lat, lon, depth}
    }

    /**
     * Add earthquakes to the heatmap
     * @param {Array} earthquakes - Array of {latitude, longitude, depth, mag}
     */
    addEarthquakes(earthquakes) {
        // First pass: find bounding box of actual earthquake data
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;
        let maxDepth = 0;
        
        for (const quake of earthquakes) {
            const lat = quake.latitude ?? quake.lat;
            const lon = quake.longitude ?? quake.lon;
            const depth = quake.depth ?? 0;
            
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (depth > maxDepth) maxDepth = depth;
        }
        
        // Clamp to block boundaries for bounding box
        minLat = Math.floor(minLat / this.blockSize) * this.blockSize;
        maxLat = Math.ceil(maxLat / this.blockSize) * this.blockSize;
        minLon = Math.floor(minLon / this.blockSize) * this.blockSize;
        maxLon = Math.ceil(maxLon / this.blockSize) * this.blockSize;
        maxDepth = Math.ceil(maxDepth / this.depthBlockSize) * this.depthBlockSize;
        
        // Generate 3D matrix only within earthquake bounding box
        for (let lat = minLat; lat <= maxLat; lat += this.blockSize) {
            for (let lon = minLon; lon <= maxLon; lon += this.blockSize) {
                for (let dep = 0; dep <= maxDepth; dep += this.depthBlockSize) {
                    const key = `${lat},${lon},${dep}`;
                    if (!this.blocks.has(key)) {
                        this.blocks.set(key, {
                            latitude: lat,
                            longitude: lon,
                            depth: dep,
                            count: 0,
                            totalMagnitude: 0,
                            totalEnergy: 0,
                            frequency: 0
                        });
                    }
                }
            }
        }
        
        // Second pass: add earthquake data to appropriate blocks
        for (const quake of earthquakes) {
            const lat = quake.latitude ?? quake.lat;
            const lon = quake.longitude ?? quake.lon;
            const depth = quake.depth ?? 0;
            const mag = quake.mag ?? 0;

            const blockLat = Math.floor(lat / this.blockSize) * this.blockSize;
            const blockLon = Math.floor(lon / this.blockSize) * this.blockSize;
            const blockDepth = Math.floor(depth / this.depthBlockSize) * this.depthBlockSize;

            const key = `${blockLat},${blockLon},${blockDepth}`;

            if (this.blocks.has(key)) {
                const block = this.blocks.get(key);
                block.count += 1;
                block.totalMagnitude += mag;
                block.totalEnergy += HeatmapCalculator.magnitudeToEnergy(mag);
                block.frequency = block.count;
            }
        }
    }

    /**
     * Get magnitude density data (total seismic energy per block)
     * Generates COMPLETE 3D matrix covering all lat/lon/depth ranges, not just earthquakes
     * @returns {Array} Array of blocks with density values
     */
    getMagnitudeDensity() {
        const earthquakeBlocks = Array.from(this.blocks.values());
        
        if (earthquakeBlocks.length === 0) return [];
        
        // Determine grid bounds from earthquake data (using loops to avoid spread operator limit)
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;
        let maxDepth = 0;
        
        earthquakeBlocks.forEach(b => {
            if (b.latitude < minLat) minLat = b.latitude;
            if (b.latitude > maxLat) maxLat = b.latitude;
            if (b.longitude < minLon) minLon = b.longitude;
            if (b.longitude > maxLon) maxLon = b.longitude;
            if (b.depth > maxDepth) maxDepth = b.depth;
        });
        
        maxLat += this.blockSize;
        maxLon += this.blockSize;
        const minDepth = 0;
        maxDepth += this.depthBlockSize;
        
        // Generate COMPLETE 3D matrix
        const allBlocks = [];
        for (let lat = minLat; lat < maxLat; lat += this.blockSize) {
            for (let lon = minLon; lon < maxLon; lon += this.blockSize) {
                for (let depth = minDepth; depth < maxDepth; depth += this.depthBlockSize) {
                    const key = `${lat},${lon},${depth}`;
                    const block = this.blocks.get(key) || {
                        latitude: lat,
                        longitude: lon,
                        depth: depth,
                        count: 0,
                        totalMagnitude: 0,
                        totalEnergy: 0,
                        frequency: 0
                    };
                    allBlocks.push(block);
                }
            }
        }
        
        // Calculate stats for normalization using ENERGY (using loops to avoid spread operator limit)
        let minEnergy = Infinity;
        let maxEnergy = -Infinity;
        
        allBlocks.forEach(b => {
            if (b.totalEnergy < minEnergy) minEnergy = b.totalEnergy;
            if (b.totalEnergy > maxEnergy) maxEnergy = b.totalEnergy;
        });
        
        if (minEnergy === Infinity) minEnergy = 0;
        const energyRange = Math.max(maxEnergy - minEnergy, 1);

        // Normalize to 0-1 based on energy
        return allBlocks.map(b => ({
            ...b,
            density: (b.totalEnergy - minEnergy) / energyRange,
            type: 'magnitude'
        }));
    }

    /**
     * Get frequency density data (earthquake count per block)
     * Generates COMPLETE 3D matrix covering all lat/lon/depth ranges
     * @returns {Array} Array of blocks with normalized frequency
     */
    getFrequencyDensity() {
        const earthquakeBlocks = Array.from(this.blocks.values());
        
        if (earthquakeBlocks.length === 0) return [];
        
        // Determine grid bounds from earthquake data (using loops to avoid spread operator limit)
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;
        let maxDepth = 0;
        
        earthquakeBlocks.forEach(b => {
            if (b.latitude < minLat) minLat = b.latitude;
            if (b.latitude > maxLat) maxLat = b.latitude;
            if (b.longitude < minLon) minLon = b.longitude;
            if (b.longitude > maxLon) maxLon = b.longitude;
            if (b.depth > maxDepth) maxDepth = b.depth;
        });
        
        maxLat += this.blockSize;
        maxLon += this.blockSize;
        const minDepth = 0;
        maxDepth += this.depthBlockSize;
        
        // Generate COMPLETE 3D matrix
        const allBlocks = [];
        for (let lat = minLat; lat < maxLat; lat += this.blockSize) {
            for (let lon = minLon; lon < maxLon; lon += this.blockSize) {
                for (let depth = minDepth; depth < maxDepth; depth += this.depthBlockSize) {
                    const key = `${lat},${lon},${depth}`;
                    const block = this.blocks.get(key) || {
                        latitude: lat,
                        longitude: lon,
                        depth: depth,
                        count: 0,
                        totalMagnitude: 0,
                        totalEnergy: 0,
                        frequency: 0
                    };
                    allBlocks.push(block);
                }
            }
        }
        
        // Calculate stats for normalization (using loops to avoid spread operator limit)
        let minFreq = Infinity;
        let maxFreq = -Infinity;
        
        allBlocks.forEach(b => {
            if (b.frequency < minFreq) minFreq = b.frequency;
            if (b.frequency > maxFreq) maxFreq = b.frequency;
        });
        
        if (minFreq === Infinity) minFreq = 0;
        const freqRange = Math.max(maxFreq - minFreq, 1);

        // Normalize to 0-1
        return allBlocks.map(b => ({
            ...b,
            density: (b.frequency - minFreq) / freqRange,
            type: 'frequency'
        }));
    }

    /**
     * Converts magnitude to seismic energy (Joules)
     */
    static magnitudeToEnergy(magnitude) {
        const exponent = 1.5 * magnitude + 4.8;
        return Math.pow(10, exponent);
    }

    /**
     * Get color based on density value (white to purple gradient)
     * @param {number} density - 0 to 1, where 0 = white, 1 = dark purple
     * @returns {THREE.Color} Three.js color object
     */
    static getDensityColor(density) {
        // Gradient: white (#FFFFFF) -> dark purple (#4B0082)
        // Clamp density to 0-1 range
        const d = Math.max(0, Math.min(1, density));
        
        // Interpolate RGB values
        const white = { r: 255, g: 255, b: 255 };
        const purple = { r: 75, g: 0, b: 130 };
        
        const r = Math.round(white.r * (1 - d) + purple.r * d);
        const g = Math.round(white.g * (1 - d) + purple.g * d);
        const b = Math.round(white.b * (1 - d) + purple.b * d);
        
        // Return as THREE.Color
        return new THREE.Color(r / 255, g / 255, b / 255);
    }

    /**
     * Get opacity based on density value
     * Low density = more transparent (0.1), high density = more opaque (0.8)
     * @param {number} density - 0 to 1
     * @returns {number} Opacity value 0-1
     */
    static getDensityOpacity(density) {
        return 0.1 + (density * 0.7);  // Range from 0.1 to 0.8
    }

    /**
     * Get all blocks (for debugging/export)
     */
    getAllBlocks() {
        return Array.from(this.blocks.values());
    }

    /**
     * Clear all data
     */
    clear() {
        this.blocks.clear();
    }
}

// Export for use
// Usage:
// const calculator = new HeatmapCalculator(1.0, 10);  // 1 degree blocks, 10km depth blocks
// calculator.addEarthquakes(earthquakeArray);
// const magDensity = calculator.getMagnitudeDensity();
// const freqDensity = calculator.getFrequencyDensity();
