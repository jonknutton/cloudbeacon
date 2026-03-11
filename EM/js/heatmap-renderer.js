/**
 * Heatmap 3D Renderer
 * Renders density blocks on the 3D Earth using Three.js
 */

class HeatmapRenderer {
    constructor(scene, earth, globeGroup, visualizationRadius, depthExaggeration = 1) {
        this.scene = scene;
        this.earth = earth;  // Three.js sphere (Earth)
        this.globeGroup = globeGroup;  // Rotating group containing Earth
        this.visualizationRadius = visualizationRadius || 10;  // Model units (usually 10)
        this.depthExaggeration = depthExaggeration;  // 1 = true depth scale, no exaggeration
        
        this.heatmapGroup = new THREE.Group();
        this.heatmapGroup.name = 'heatmap-layer';
        // Add to globeGroup so it rotates with Earth
        this.globeGroup.add(this.heatmapGroup);
        
        this.blockSize = 1.0;
        this.depthBlockSize = 10;
    }

    /**
     * Convert lat/lon/depth to 3D position on Earth surface and above
     * @param {number} lat - Latitude (-90 to 90)
     * @param {number} lon - Longitude (-180 to 180)
     * @param {number} depth - Depth in km
     * @returns {THREE.Vector3} 3D position
     */
    latLonDepthTo3D(lat, lon, depth) {
        // Earth radius in model units - use actual visualization radius
        const earthRadius = this.visualizationRadius;  // e.g., 10 model units
        const earthRadiusKm = 6371;  // actual Earth radius in km
        
        // Depth reduces the radius (deeper = closer to center)
        const depth_km = Math.max(0, depth);
        // Scale depth in km to model units, WITH EXAGGERATION to make visible
        const radiusReduction = (depth_km / earthRadiusKm) * earthRadius * this.depthExaggeration;
        
        // Add surface offset to render blocks outside Earth (visible on surface)
        const surfaceOffset = 0.2; // model units
        const radius = earthRadius - radiusReduction + surfaceOffset;

        const latRad = (lat) * Math.PI / 180;
        const lonRad = (lon) * Math.PI / 180;

        const x = radius * Math.cos(latRad) * Math.cos(lonRad);
        const y = radius * Math.sin(latRad);
        const z = radius * Math.cos(latRad) * Math.sin(lonRad);

        return new THREE.Vector3(x, y, z);
    }

    /**
     * Render magnitude or frequency heatmap
     * @param {Array} densityBlocks - Output from HeatmapCalculator.getMagnitudeDensity() or getFrequencyDensity()
     * @param {string} mode - 'magnitude' or 'frequency'
     * @param {number} blockSizeDegrees - Size of each block in degrees
     */
    renderHeatmap(densityBlocks, mode = 'magnitude', blockSizeDegrees = 1.0) {
        // Clear previous heatmap
        while (this.heatmapGroup.children.length > 0) {
            const child = this.heatmapGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.heatmapGroup.remove(child);
        }

        // Create a mesh for each block so we can handle them individually
        for (const block of densityBlocks) {
            const blockMesh = this.createBlockMesh(block, blockSizeDegrees);
            this.heatmapGroup.add(blockMesh);
        }

        console.log(`Rendered ${densityBlocks.length} heatmap blocks`);
    }

    /**
     * Create a box mesh for a single block
     */
    createBlockMesh(block, blockSizeDegrees) {
        // Get 8 corner positions
        const corners = this.getBlockCorners(block.latitude, block.longitude, block.depth, blockSizeDegrees);

        // Create box geometry
        const geometry = new THREE.BufferGeometry();

        // Compute center point on surface for better positioning
        const centerSurf = this.latLonDepthTo3D(
            block.latitude + blockSizeDegrees / 2,
            block.longitude + blockSizeDegrees / 2,
            0
        );

        // Get thickness
        const surfaceRadius = this.latLonDepthTo3D(
            block.latitude + blockSizeDegrees / 2,
            block.longitude + blockSizeDegrees / 2,
            0
        ).length();

        const depthRadius = this.latLonDepthTo3D(
            block.latitude + blockSizeDegrees / 2,
            block.longitude + blockSizeDegrees / 2,
            this.depthBlockSize
        ).length();

        const thickness = Math.max(0.1, surfaceRadius - depthRadius);

        // Create geometry positions for a box
        const positions = new Float32Array([
            ...corners[0].toArray(),    // 0
            ...corners[1].toArray(),    // 1
            ...corners[3].toArray(),    // 2
            ...corners[2].toArray(),    // 3
            ...corners[4].toArray(),    // 4
            ...corners[5].toArray(),    // 5
            ...corners[7].toArray(),    // 6
            ...corners[6].toArray(),    // 7
        ]);

        const indices = new Uint32Array([
            0, 1, 2,  0, 2, 3,  // front
            4, 6, 5,  4, 7, 6,  // back
            0, 4, 5,  0, 5, 1,  // bottom
            2, 6, 7,  2, 7, 3,  // top
            0, 3, 7,  0, 7, 4,  // left
            1, 5, 6,  1, 6, 2,  // right
        ]);

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();

        // Create material with color based on density
        const color = HeatmapCalculator.getDensityColor(block.density);
        const opacity = HeatmapCalculator.getDensityOpacity(block.density);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            reflectivity: 0.3,
            side: THREE.DoubleSide
        });

        return new THREE.Mesh(geometry, material);
    }

    /**
     * Get the 3D corners of a block
     */
    getBlockCorners(startLat, startLon, startDepth, blockSize) {
        const corners = [];
        const lats = [startLat, startLat + blockSize];
        const lons = [startLon, startLon + blockSize];
        const depths = [startDepth, startDepth + this.depthBlockSize];

        for (let latIdx = 0; latIdx < 2; latIdx++) {
            for (let lonIdx = 0; lonIdx < 2; lonIdx++) {
                for (let depthIdx = 0; depthIdx < 2; depthIdx++) {
                    corners.push(this.latLonDepthTo3D(lats[latIdx], lons[lonIdx], depths[depthIdx]));
                }
            }
        }
        // Reorder for proper cube layout
        // [lat0lon0dep0, lat0lon1dep0, lat1lon0dep0, lat1lon1dep0, lat0lon0dep1, lat0lon1dep1, lat1lon0dep1, lat1lon1dep1]
        return [
            corners[0],  // 0: lat0, lon0, depth0
            corners[1],  // 1: lat0, lon1, depth0
            corners[2],  // 2: lat1, lon0, depth0
            corners[3],  // 3: lat1, lon1, depth0
            corners[4],  // 4: lat0, lon0, depth1
            corners[5],  // 5: lat0, lon1, depth1
            corners[6],  // 6: lat1, lon0, depth1
            corners[7],  // 7: lat1, lon1, depth1
        ];
    }

    /**
     * Show/hide heatmap
     */
    setVisible(visible) {
        this.heatmapGroup.visible = visible;
    }

    /**
     * Clear heatmap
     */
    clear() {
        while (this.heatmapGroup.children.length > 0) {
            const child = this.heatmapGroup.children[0];
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
            this.heatmapGroup.remove(child);
        }
    }
}
