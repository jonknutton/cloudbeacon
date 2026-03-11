/**
 * 3D Earth Visualization with Earthquakes
 * Uses Three.js to render an interactive globe with earthquake data
 */

class Earth3D {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.earth = null;
        this.globeGroup = null;
        this.earthquakeMeshes = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedQuake = null;
        
        // Scale factor: visualization uses radius 10, real Earth is 6371 km
        this.visualizationRadius = 10; // scene units
        this.radiusScale = this.visualizationRadius / 6371; // 10 / 6371 conversion factor
        
        // Mouse controls state
        this.isDragging = false;
        this.previousMousePos = { x: 0, y: 0 };
        this.rotationSpeed = 0.005;
        this.zoomSpeed = 1.5;
        
        // Visualization parameters
        this.earthquakeScale = 1.0;
        this.depthExaggeration = 1.0;
        this.autoRotate = true; // Auto-rotation enabled by default
        
        this.init();
    }

    /**
     * Initialize Three.js scene, camera, renderer
     */
    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        // Camera setup
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(
            75,
            width / height,
            0.1,
            10000
        );
        this.camera.position.z = 20;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Create container group for Earth and earthquakes
        this.globeGroup = new THREE.Group();
        this.scene.add(this.globeGroup);

        // Create Earth
        this.createEarth();

        // Add stars background
        this.createStars();

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.container.addEventListener('click', (e) => this.onCanvasClick(e));
        this.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Mouse drag rotation
        this.container.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.container.addEventListener('mousemove', (e) => this.onMouseDrag(e));
        this.container.addEventListener('mouseup', () => this.onMouseUp());
        this.container.addEventListener('mouseleave', () => this.onMouseUp());
        
        // Scroll zoom
        this.container.addEventListener('wheel', (e) => this.onMouseWheel(e), { passive: false });

        // Start animation loop
        this.animate();
    }

    /**
     * Create Earth sphere
     */
    createEarth() {
        const geometry = new THREE.SphereGeometry(this.visualizationRadius, 64, 64);
        
        // Create canvas texture for Earth
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // Simple Earth texture
        ctx.fillStyle = '#1a5f3f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add some landmass-like patterns
        ctx.fillStyle = '#2d8659';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 200 + 50;
            ctx.fillRect(x, y, size, size);
        }

        // Ocean blue overlay
        ctx.fillStyle = 'rgba(26, 95, 63, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 5,
            opacity: 0,
            transparent: true
        });

        this.earth = new THREE.Mesh(geometry, material);
        this.globeGroup.add(this.earth);

        // Add wireframe grid
        const wireframe = new THREE.LineSegments(
            new THREE.WireframeGeometry(geometry),
            new THREE.LineBasicMaterial({ color: 0x00d4ff, linewidth: 0.1, opacity: 0.9 })
        );
        wireframe.scale.set(1.01, 1.01, 1.01); // Slightly larger
        this.earth.add(wireframe);
    }

    /**
     * Create background stars
     */
    createStars() {
        const points = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            points.push(new THREE.Vector3(x, y, z));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.2,
            sizeAttenuation: true,
            opacity: 0.5
        });

        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    /**
     * Add earthquakes to the scene
     * @param {Array} earthquakes - Array of earthquake objects
     * @param {number} radiusScale - Scale factor for visualization (defaults to this.radiusScale)
     */
    addEarthquakes(earthquakes, radiusScale) {
        if (!radiusScale) radiusScale = this.radiusScale;
        
        // Clear existing earthquake meshes
        this.earthquakeMeshes.forEach(mesh => {
            this.globeGroup.remove(mesh);
        });
        this.earthquakeMeshes = [];

        const fetcher = new USGSFetcher();

        earthquakes.forEach((quake, index) => {
            const coords = fetcher.toCartesian(quake, radiusScale, this.depthExaggeration);
            
            // Calculate sphere size based on magnitude
            // Magnitude 2-8 maps to radius 0.02-0.4 (scaled by earthquakeScale)
            const maxSize = 0.4 * this.earthquakeScale;
            const minSize = 0.02 * this.earthquakeScale;
            const magRange = 8 - 2;
            const size = minSize + ((quake.magnitude - 2) / magRange) * (maxSize - minSize);

            // Create sphere for earthquake
            const geometry = new THREE.SphereGeometry(size, 16, 16);
            
            // Color based on magnitude
            const color = this.getMagnitudeColor(quake.magnitude);
            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5
            });

            const sphere = new THREE.Mesh(geometry, material);
            sphere.position.set(coords.x, coords.y, coords.z);
            
            // Store earthquake data on mesh
            sphere.userData = {
                ...quake,
                index: index
            };

            this.globeGroup.add(sphere);
            this.earthquakeMeshes.push(sphere);

            // Add glow effect
            this.addGlowToSphere(sphere, color);
        });

        console.log(`Added ${earthquakes.length} earthquakes to visualization`);
    }

    /**
     * Add glow effect to sphere
     * @param {THREE.Mesh} sphere - The sphere mesh
     * @param {THREE.Color} color - Color for glow
     */
    addGlowToSphere(sphere, color) {
        const glowGeometry = new THREE.SphereGeometry(
            sphere.geometry.parameters.radius * 1.5,
            16,
            16
        );
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });

        const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        sphere.add(glowMesh);
    }

    /**
     * Get color based on magnitude
     * @param {number} magnitude - Earthquake magnitude
     * @returns {THREE.Color} Color for visualization
     */
    getMagnitudeColor(magnitude) {
        if (magnitude < 3) return new THREE.Color(0x00ff00); // Green
        if (magnitude < 4) return new THREE.Color(0xffff00); // Yellow
        if (magnitude < 5) return new THREE.Color(0xff9900); // Orange
        if (magnitude < 6) return new THREE.Color(0xff3300); // Red-orange
        if (magnitude < 7) return new THREE.Color(0xff0000); // Red
        return new THREE.Color(0xff00ff); // Magenta for 7+
    }

    /**
     * Handle canvas click for earthquake selection
     * @param {MouseEvent} event - Click event
     */
    onCanvasClick(event) {
        // Calculate mouse position in normalized device coordinates
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update picking ray
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Check intersections
        const intersects = this.raycaster.intersectObjects(this.earthquakeMeshes);

        if (intersects.length > 0) {
            this.selectEarthquake(intersects[0].object);
        } else {
            this.deselectEarthquake();
        }
    }

    /**
     * Handle mouse move for highlighting and dragging
     * @param {MouseEvent} event - Mouse move event
     */
    onMouseMove(event) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.earthquakeMeshes);

        // Update cursor based on state
        if (this.isDragging) {
            this.container.style.cursor = 'grabbing';
        } else if (intersects.length > 0) {
            this.container.style.cursor = 'pointer';
        } else {
            this.container.style.cursor = 'grab';
        }
    }

    /**
     * Handle mouse down - start drag
     * @param {MouseEvent} event - Mouse down event
     */
    onMouseDown(event) {
        this.isDragging = true;
        this.previousMousePos = { x: event.clientX, y: event.clientY };
    }

    /**
     * Handle mouse drag - rotate scene
     * @param {MouseEvent} event - Mouse move event during drag
     */
    onMouseDrag(event) {
        if (!this.isDragging) return;

        const deltaX = event.clientX - this.previousMousePos.x;
        const deltaY = event.clientY - this.previousMousePos.y;

        // Rotate the entire globe group (Earth + earthquakes) around Y axis (longitude)
        this.globeGroup.rotation.y += deltaX * this.rotationSpeed;
        
        // Rotate the entire globe group around X axis (latitude)
        this.globeGroup.rotation.x += deltaY * this.rotationSpeed;

        this.previousMousePos = { x: event.clientX, y: event.clientY };
    }

    /**
     * Handle mouse up - stop drag
     */
    onMouseUp() {
        this.isDragging = false;
    }

    /**
     * Handle mouse wheel - zoom in/out
     * @param {WheelEvent} event - Scroll event
     */
    onMouseWheel(event) {
        event.preventDefault();

        const zoomDelta = event.deltaY > 0 ? this.zoomSpeed : 1 / this.zoomSpeed;
        this.camera.position.z *= zoomDelta;
        
        // Clamp zoom to reasonable limits
        this.camera.position.z = Math.max(5, Math.min(100, this.camera.position.z));
    }

    /**
     * Select an earthquake
     * @param {THREE.Mesh} mesh - The earthquake mesh
     */
    selectEarthquake(mesh) {
        this.selectedQuake = mesh.userData;
        
        // Scale up selected mesh
        mesh.scale.set(1.3, 1.3, 1.3);

        // Dispatch custom event
        const event = new CustomEvent('earthquakeSelected', {
            detail: this.selectedQuake
        });
        document.dispatchEvent(event);
    }

    /**
     * Deselect current earthquake
     */
    deselectEarthquake() {
        if (this.selectedQuake) {
            // Find mesh and scale back
            const mesh = this.earthquakeMeshes[this.selectedQuake.index];
            if (mesh) {
                mesh.scale.set(1, 1, 1);
            }
        }

        this.selectedQuake = null;
        const event = new CustomEvent('earthquakeDeselected');
        document.dispatchEvent(event);
    }

    /**
     * Set auto-rotation state
     * @param {boolean} autoRotate - Whether to automatically rotate
     */
    setAutoRotate(autoRotate) {
        this.autoRotate = autoRotate;
    }

    /**
     * Set earthquake scale multiplier
     * @param {number} scale - Scale factor (e.g., 1.5 = 1.5x larger)
     */
    setEarthquakeScale(scale) {
        this.earthquakeScale = scale;
        
        // Update all earthquake sphere sizes
        this.earthquakeMeshes.forEach((mesh, index) => {
            if (mesh.visible) {
                const quake = mesh.userData;
                const maxSize = 0.4 * this.earthquakeScale;
                const minSize = 0.02 * this.earthquakeScale;
                const magRange = 8 - 2;
                const newSize = minSize + ((quake.magnitude - 2) / magRange) * (maxSize - minSize);
                
                // Scale the mesh
                const currentRadius = mesh.geometry.parameters.radius;
                const scale = newSize / currentRadius;
                mesh.scale.multiplyScalar(scale);
            }
        });
    }

    /**
     * Set depth exaggeration multiplier
     * @param {number} exaggeration - Depth exaggeration factor (e.g., 2 = 2x deeper)
     */
    setDepthExaggeration(exaggeration) {
        this.depthExaggeration = exaggeration;
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());

        // Auto-rotate globe group
        if (this.autoRotate !== false) {
            this.globeGroup.rotation.y += 0.0002;
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Filter visible earthquakes by magnitude
     * @param {number} minMagnitude - Minimum magnitude to show
     */
    filterByMagnitude(minMagnitude) {
        this.earthquakeMeshes.forEach(mesh => {
            mesh.visible = mesh.userData.magnitude >= minMagnitude;
        });
    }

    /**
     * Hide all earthquakes
     */
    hideAllEarthquakes() {
        this.earthquakeMeshes.forEach(mesh => {
            mesh.visible = false;
        });
    }

    /**
     * Show all earthquakes
     */
    showAllEarthquakes() {
        this.earthquakeMeshes.forEach(mesh => {
            mesh.visible = true;
        });
    }

    /**
     * Show a specific earthquake by data object
     * @param {Object} quakeData - Earthquake data object with coordinates
     */
    showEarthquake(quakeData) {
        const mesh = this.earthquakeMeshes.find(m => m.userData.usgsId === quakeData.usgsId);
        if (mesh) {
            mesh.visible = true;
            // Reset opacity in case it was faded
            mesh.traverse(child => {
                if (child.material) {
                    child.material.opacity = 1.0;
                }
            });
        }
    }

    /**
     * Hide a specific earthquake by data object
     * @param {Object} quakeData - Earthquake data object
     */
    hideEarthquake(quakeData) {
        const mesh = this.earthquakeMeshes.find(m => m.userData.usgsId === quakeData.usgsId);
        if (mesh) {
            mesh.visible = false;
        }
    }

    /**
     * Set opacity for a specific earthquake (used for fade-out effects)
     * @param {Object} quakeData - Earthquake data object
     * @param {number} opacity - Opacity value (0-1)
     */
    setEarthquakeOpacity(quakeData, opacity) {
        const mesh = this.earthquakeMeshes.find(m => m.userData.usgsId === quakeData.usgsId);
        if (mesh) {
            // Set opacity for the main sphere and glow
            mesh.traverse(child => {
                if (child.material) {
                    child.material.opacity = opacity;
                    child.material.transparent = opacity < 1;
                }
            });
        }
    }

    /**
     * Get visible earthquake count
     * @returns {number} Number of visible earthquakes
     */
    getVisibleCount() {
        return this.earthquakeMeshes.filter(m => m.visible).length;
    }
}

// Export for use in other modules
window.Earth3D = Earth3D;
