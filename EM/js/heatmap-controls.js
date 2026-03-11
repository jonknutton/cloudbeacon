/**
 * Heatmap Controls
 * Manages heatmap visualization and related UI
 */

class HeatmapController {
    constructor(visualization, elements) {
        this.visualization = visualization;
        this.elements = elements;
        this.heatmapCalculator = null;
        this.heatmapRenderer = null;
        this.historicData = [];
        this.currentMode = null;  // 'magnitude' or 'frequency'
        this.currentBlockSize = 10;  // Increased from 2.0 for performance

        this.initializeHeatmap();
        this.attachEventListeners();
    }

    /**
     * Initialize heatmap components
     */
    initializeHeatmap() {
        if (this.visualization && this.visualization.scene) {
            // Scale depth block size with lat/lon block size for consistency
            const depthBlockSize = this.currentBlockSize * 10;  // 10x for depth dimension
            this.heatmapCalculator = new HeatmapCalculator(this.currentBlockSize, depthBlockSize);
            this.heatmapRenderer = new HeatmapRenderer(
                this.visualization.scene,
                this.visualization.earth,
                this.visualization.globeGroup,  // Pass the rotating group
                this.visualization.visualizationRadius,  // Pass the radius scale
                1  // Depth scale 1:1 (no exaggeration) for accurate visualization
            );
        }
    }

    /**
     * Attach event listeners for heatmap controls
     */
    attachEventListeners() {
        // Visualization mode selector
        const vizModeSelect = document.getElementById('viz-mode');
        if (vizModeSelect) {
            vizModeSelect.addEventListener('change', (e) => this.onVisualizationModeChange(e.target.value));
        }

        // Block size slider
        const blockSizeSlider = document.getElementById('heatmap-block-size');
        if (blockSizeSlider) {
            blockSizeSlider.addEventListener('input', (e) => {
                this.currentBlockSize = parseFloat(e.target.value);
                document.getElementById('block-size-display').textContent = this.currentBlockSize.toFixed(1);
                if (this.currentMode) {
                    this.regenerateHeatmap();
                }
            });
        }

        // Historic data upload
        const csvUpload = document.getElementById('historic-csv-upload');
        if (csvUpload) {
            csvUpload.addEventListener('change', () => this.onCSVUpload());
        }

        // Load historic button
        const loadHistoricBtn = document.getElementById('load-historic-btn');
        if (loadHistoricBtn) {
            loadHistoricBtn.addEventListener('click', () => this.generateHeatmapFromData());
        }
    }

    /**
     * Handle visualization mode change
     */
    onVisualizationModeChange(mode) {
        const recentControls = document.getElementById('recent-controls');
        const heatmapControls = document.getElementById('heatmap-controls');
        const historicControls = document.getElementById('historic-data-controls');

        // Show/hide appropriate controls
        if (recentControls) recentControls.style.display = mode === 'recent' ? 'block' : 'none';
        if (heatmapControls) heatmapControls.style.display = mode.includes('heatmap') ? 'block' : 'none';
        if (historicControls) historicControls.style.display = mode.includes('heatmap') ? 'block' : 'none';

        console.log(`HeatmapController: Mode changed to ${mode}`);
        
        if (mode === 'recent') {
            // Show recent earthquakes, hide heatmap
            console.log('Showing recent earthquakes');
            if (this.heatmapRenderer) {
                this.heatmapRenderer.setVisible(false);
            }
            if (this.visualization && this.visualization.showAllEarthquakes) {
                this.visualization.showAllEarthquakes();
            }
            this.currentMode = null;
        } else if (mode === 'heatmap-magnitude') {
            // Hide recent earthquakes, show magnitude heatmap
            console.log('Hiding earthquakes, showing magnitude heatmap');
            if (this.heatmapRenderer) {
                this.heatmapRenderer.setVisible(true);
            }
            if (this.visualization && this.visualization.hideAllEarthquakes) {
                console.log('Calling hideAllEarthquakes, count:', this.visualization.earthquakeMeshes.length);
                this.visualization.hideAllEarthquakes();
            }
            this.currentMode = 'magnitude';
            if (this.historicData.length > 0) {
                this.regenerateHeatmap();
            } else {
                this.showStatus('historic-status', 'Please load data first', 'info');
            }
        } else if (mode === 'heatmap-frequency') {
            // Hide recent earthquakes, show frequency heatmap
            console.log('Hiding earthquakes, showing frequency heatmap');
            if (this.heatmapRenderer) {
                this.heatmapRenderer.setVisible(true);
            }
            if (this.visualization && this.visualization.hideAllEarthquakes) {
                console.log('Calling hideAllEarthquakes, count:', this.visualization.earthquakeMeshes.length);
                this.visualization.hideAllEarthquakes();
            }
            this.currentMode = 'frequency';
            if (this.historicData.length > 0) {
                this.regenerateHeatmap();
            } else {
                this.showStatus('historic-status', 'Please load data first', 'info');
            }
        }
    }

    /**
     * Handle CSV file upload
     */
    async onCSVUpload() {
        const fileInput = document.getElementById('historic-csv-upload');
        if (!fileInput.files || fileInput.files.length === 0) return;

        this.showStatus('historic-status', 'Loading CSV...', 'loading');

        try {
            this.historicData = await CSVDataLoader.loadFromFileInput(fileInput);
            this.showStatus('historic-status', 
                `Loaded ${this.historicData.length} earthquakes`, 'success');
        } catch (e) {
            this.showStatus('historic-status', `Error loading CSV: ${e.message}`, 'error');
            console.error(e);
        }
    }

    /**
     * Generate heatmap from loaded data
     */
    generateHeatmapFromData() {
        if (!this.historicData || this.historicData.length === 0) {
            this.showStatus('historic-status', 'No data loaded. Upload a CSV file first.', 'error');
            return;
        }

        try {
            this.showStatus('historic-status', 'Generating heatmap...', 'loading');

            // Clear previous heatmap
            this.heatmapCalculator.clear();

            // Add data to calculator
            this.heatmapCalculator.addEarthquakes(this.historicData);

            // Render appropriate density map
            const densityBlocks = this.currentMode === 'magnitude' 
                ? this.heatmapCalculator.getMagnitudeDensity()
                : this.heatmapCalculator.getFrequencyDensity();

            console.log(`Rendering heatmap with ${densityBlocks.length} blocks`);
            this.heatmapRenderer.renderHeatmap(densityBlocks, this.currentMode, this.currentBlockSize);

            // Show heatmap
            if (this.heatmapRenderer) {
                this.heatmapRenderer.setVisible(true);
            }

            this.showStatus('historic-status', 
                `Success: ${densityBlocks.length} blocks rendered. Oldest: ${this.historicData[this.historicData.length-1]?.time || '?'}, Newest: ${this.historicData[0]?.time || '?'}`, 
                'success');

        } catch (e) {
            this.showStatus('historic-status', `Error generating heatmap: ${e.message}`, 'error');
            console.error(e);
        }
    }

    /**
     * Regenerate heatmap with current settings
     */
    regenerateHeatmap() {
        if (!this.currentMode || this.historicData.length === 0) return;

        try {
            this.heatmapCalculator.blockSize = this.currentBlockSize;
            this.heatmapCalculator.depthBlockSize = this.currentBlockSize * 10;  // Scale depth proportionally
            this.generateHeatmapFromData();
        } catch (e) {
            console.error('Error regenerating heatmap:', e);
        }
    }

    /**
     * Show status message
     */
    showStatus(elementId, message, type = 'info') {
        const element = document.getElementById(elementId);
        if (!element) return;

        element.textContent = message;
        element.className = `status-${type}`;
    }

    /**
     * Load historic data from a file (alternative to upload)
     */
    async loadHistoricDataFromURL(url) {
        this.showStatus('historic-status', 'Loading data from server...', 'loading');
        try {
            this.historicData = await CSVDataLoader.loadCSV(url);
            this.showStatus('historic-status', `Loaded ${this.historicData.length} earthquakes`, 'success');
        } catch (e) {
            this.showStatus('historic-status', `Error loading data: ${e.message}`, 'error');
        }
    }
}
