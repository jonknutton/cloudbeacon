/**
 * Control Panel and UI Logic
 * Manages user interactions and updates the visualization
 */

class EarthquakeController {
    constructor() {
        this.visualization = null;
        this.fetcher = null;
        this.allEarthquakes = [];
        this.currentMinMagnitude = 2;
        this.currentTimeRange = 'month';
        this.loaded = false;

        // Timeline state
        this.timelineState = {
            isPlaying: false,
            currentTime: null,
            minTime: null,
            maxTime: null,
            mode: 'accumulate', // 'accumulate' or 'sequential'
            playbackSpeed: 1,
            displayedEarthquakes: new Set(), // Track which quakes are shown
            fadingEarthquakes: new Map(), // Map of quake -> fadeStartTime for sequential mode
            animationFrameId: null,
            lastUpdateTime: Date.now()
        };

        this.initializeUI();
        this.attachEventListeners();
        
        // Auto-load data on page load
        this.loadData();
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        this.visualization = new Earth3D('#canvas-container');
        this.fetcher = new USGSFetcher();

        // Cache DOM elements
        this.elements = {
            timeRange: document.getElementById('time-range'),
            magnitudeFilter: document.getElementById('magnitude-filter'),
            magDisplay: document.getElementById('mag-display'),
            showLabels: document.getElementById('show-labels'),
            autoRotate: document.getElementById('auto-rotate'),
            loadDataBtn: document.getElementById('load-data-btn'),
            statusMessage: document.getElementById('status-message'),
            quakeCount: document.getElementById('quake-count'),
            magRange: document.getElementById('mag-range'),
            maxDepth: document.getElementById('max-depth'),
            quakeInfo: document.getElementById('quake-info'),
            earthquakeScale: document.getElementById('earthquake-scale'),
            scaleDisplay: document.getElementById('scale-display'),
            depthExaggeration: document.getElementById('depth-exaggeration'),
            depthDisplay: document.getElementById('depth-display'),
            // Timeline elements
            playBtn: document.getElementById('play-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            currentDate: document.getElementById('current-date'),
            dateSelectorBtn: document.getElementById('date-selector-btn'),
            timelineMode: document.getElementById('timeline-mode'),
            playbackSpeed: document.getElementById('playback-speed'),
            speedDisplay: document.getElementById('speed-display'),
            progressFill: document.getElementById('progress-fill'),
            timeRangeDisplay: document.getElementById('time-range-display'),
            progressBar: document.querySelector('.progress-bar'),
            infoPanel: document.getElementById('info-panel'),
            datePickerModal: document.getElementById('date-picker-modal'),
            datePickerInput: document.getElementById('date-picker-input')
        };

        // Initialize heatmap controller
        this.heatmapController = new HeatmapController(this.visualization, this.elements);
    }

    /**
     * Attach event listeners to controls
     */
    attachEventListeners() {
        // Load data button
        this.elements.loadDataBtn.addEventListener('click', () => this.loadData());

        // Time range selector
        this.elements.timeRange.addEventListener('change', (e) => {
            this.currentTimeRange = e.target.value.Date;
            this.loadData();
        });

        // Magnitude filter
        this.elements.magnitudeFilter.addEventListener('input', (e) => {
            this.currentMinMagnitude = parseFloat(e.target.value);
            this.elements.magDisplay.textContent = this.currentMinMagnitude.toFixed(1);
            this.updateMagnitudeFilter();
        });

        // Auto-rotate checkbox
        this.elements.autoRotate.addEventListener('change', (e) => {
            this.visualization.setAutoRotate(e.target.checked);
        });

        // Earthquake scale slider
        this.elements.earthquakeScale.addEventListener('input', (e) => {
            const scale = parseFloat(e.target.value);
            this.elements.scaleDisplay.textContent = scale.toFixed(1) + 'x';
            this.visualization.setEarthquakeScale(scale);
        });

        // Depth exaggeration slider
        this.elements.depthExaggeration.addEventListener('input', (e) => {
            const exaggeration = parseFloat(e.target.value);
            this.elements.depthDisplay.textContent = exaggeration.toFixed(1) + 'x';
            this.visualization.setDepthExaggeration(exaggeration);
            // Reload earthquakes with new depth scaling
            if (this.loaded) {
                this.visualization.addEarthquakes(this.allEarthquakes, this.visualization.radiusScale);
            }
        });

        // Earthquake selection events
        document.addEventListener('earthquakeSelected', (e) => {
            this.displayQuakeInfo(e.detail);
        });

        document.addEventListener('earthquakeDeselected', () => {
            this.clearQuakeInfo();
        });

        // Timeline controls
        this.elements.playBtn.addEventListener('click', () => this.playTimeline());
        this.elements.pauseBtn.addEventListener('click', () => this.pauseTimeline());
        this.elements.prevBtn.addEventListener('click', () => this.previousFrame());
        this.elements.nextBtn.addEventListener('click', () => this.nextFrame());
        this.elements.dateSelectorBtn.addEventListener('click', () => this.showDateSelector());
        
        this.elements.timelineMode.addEventListener('change', (e) => {
            this.timelineState.mode = e.target.value;
            this.resetTimeline();
        });

        this.elements.playbackSpeed.addEventListener('input', (e) => {
            this.timelineState.playbackSpeed = parseFloat(e.target.value);
            this.elements.speedDisplay.textContent = this.timelineState.playbackSpeed.toFixed(1) + 'x';
        });

        this.elements.progressBar.addEventListener('click', (e) => {
            this.seekToProgress(e);
        });

        // Date picker modal
        this.elements.dateSelectorBtn.addEventListener('click', () => this.showDatePicker());
        
        // Modal buttons
        document.getElementById('date-picker-confirm').addEventListener('click', () => this.confirmDatePicker());
        document.getElementById('date-picker-cancel').addEventListener('click', () => this.closeDatePicker());
        
        // Close modal when clicking outside
        this.elements.datePickerModal.addEventListener('click', (e) => {
            if (e.target === this.elements.datePickerModal) {
                this.closeDatePicker();
            }
        });
    }

    /**
     * Load earthquake data
     */
    async loadData() {
        this.showStatus('Loading earthquake data...', 'loading');
        this.elements.loadDataBtn.disabled = true;

        try {
            this.allEarthquakes = await this.fetcher.fetch(this.currentTimeRange);
            
            // Add earthquakes to visualization with proper scale
            this.visualization.addEarthquakes(this.allEarthquakes, this.visualization.radiusScale);
            
            // Initialize timeline
            this.initializeTimeline();
            
            // Update stats
            this.updateStats();
            this.updateMagnitudeFilter();
            
            this.showStatus(`✓ Loaded ${this.allEarthquakes.length} earthquakes`, 'success');
            this.loaded = true;
        } catch (error) {
            console.error('Error loading data:', error);
            this.showStatus('✗ Error loading data. Check console.', 'error');
        } finally {
            this.elements.loadDataBtn.disabled = false;
        }
    }

    /**
     * Update magnitude filter
     */
    updateMagnitudeFilter() {
        if (!this.loaded) return;

        this.visualization.filterByMagnitude(this.currentMinMagnitude);
        
        const visibleCount = this.visualization.getVisibleCount();
        this.elements.quakeCount.textContent = visibleCount;
    }

    /**
     * Update statistics display
     */
    updateStats() {
        if (this.allEarthquakes.length === 0) {
            this.elements.quakeCount.textContent = '0';
            this.elements.magRange.textContent = '-';
            this.elements.maxDepth.textContent = '-';
            return;
        }

        const stats = this.fetcher.getStats();
        
        this.elements.quakeCount.textContent = stats.count;
        this.elements.magRange.textContent = `${stats.minMagnitude.toFixed(1)} - ${stats.maxMagnitude.toFixed(1)}`;
        this.elements.maxDepth.textContent = `${stats.maxDepth.toFixed(0)} km`;
    }

    /**
     * Display earthquake information
     * @param {Object} quake - Earthquake object
     */
    displayQuakeInfo(quake) {
        const magnitude = quake.magnitude.toFixed(1);
        const depth = quake.depth.toFixed(1);
        const time = quake.time.toLocaleString();
        const color = this.getMagnitudeColorName(quake.magnitude);

        let html = `
            <div class="active">
                <div><strong>Magnitude:</strong> <span style="color: ${this.getMagnitudeColorHex(quake.magnitude)}">${magnitude}</span> (${color})</div>
                <div><strong>Depth:</strong> ${depth} km</div>
                <div><strong>Location:</strong> ${quake.place}</div>
                <div><strong>Time (UTC):</strong> ${time}</div>
                <div><strong>Latitude:</strong> ${quake.lat.toFixed(4)}°</div>
                <div><strong>Longitude:</strong> ${quake.lon.toFixed(4)}°</div>
        `;

        if (quake.felt !== null && quake.felt > 0) {
            html += `<div><strong>Reports:</strong> ${quake.felt} felt reports</div>`;
        }

        if (quake.tsunami) {
            html += `<div><strong>⚠️ Tsunami Warning</strong> issued for this event</div>`;
        }

        html += `<div style="margin-top: 10px; font-size: 10px; color: #666;">ID: ${quake.usgsId}</div></div>`;

        this.elements.quakeInfo.innerHTML = html;
        this.elements.infoPanel.classList.add('active');
    }

    /**
     * Clear earthquake information
     */
    clearQuakeInfo() {
        this.elements.quakeInfo.innerHTML = '<p style="color: #888;">Click on a sphere for details</p>';
        this.elements.infoPanel.classList.remove('active');
    }

    /**
     * Get magnitude color name
     * @param {number} magnitude - Earthquake magnitude
     * @returns {string} Color name
     */
    getMagnitudeColorName(magnitude) {
        if (magnitude < 3) return 'Minor';
        if (magnitude < 4) return 'Light';
        if (magnitude < 5) return 'Moderate';
        if (magnitude < 6) return 'Strong';
        if (magnitude < 7) return 'Major';
        return 'Great';
    }

    /**
     * Get magnitude color hex
     * @param {number} magnitude - Earthquake magnitude
     * @returns {string} Hex color
     */
    getMagnitudeColorHex(magnitude) {
        if (magnitude < 3) return '#00ff00';
        if (magnitude < 4) return '#ffff00';
        if (magnitude < 5) return '#ff9900';
        if (magnitude < 6) return '#ff3300';
        if (magnitude < 7) return '#ff0000';
        return '#ff00ff';
    }

    /**
     * Initialize timeline with loaded earthquakes
     */
    initializeTimeline() {
        if (this.allEarthquakes.length === 0) {
            console.warn('initializeTimeline: No earthquakes loaded');
            this.elements.currentDate.textContent = 'No data';
            this.timelineState.minTime = 0;
            this.timelineState.maxTime = 0;
            this.timelineState.currentTime = 0;
            return;
        }

        // Validate that earthquakes have time property
        const validQuakes = this.allEarthquakes.filter(q => {
            if (!q.hasOwnProperty('time') || q.time === null || q.time === undefined) {
                console.warn('Earthquake missing time property:', q);
                return false;
            }
            const timeNum = Number(q.time);
            return !isNaN(timeNum);
        });

        if (validQuakes.length === 0) {
            console.error('No valid earthquakes with time property found');
            this.elements.currentDate.textContent = 'Error: Invalid data';
            this.timelineState.minTime = 0;
            this.timelineState.maxTime = 0;
            this.timelineState.currentTime = 0;
            return;
        }

        // Sort earthquakes by time
        const sortedQuakes = [...validQuakes].sort((a, b) => Number(a.time) - Number(b.time));
        
        const minTime = Number(sortedQuakes[0].time);
        const maxTime = Number(sortedQuakes[sortedQuakes.length - 1].time);

        if (isNaN(minTime) || isNaN(maxTime)) {
            console.error('Invalid time range:', { minTime, maxTime });
            this.elements.currentDate.textContent = 'Error: Invalid dates';
            this.timelineState.minTime = 0;
            this.timelineState.maxTime = 0;
            this.timelineState.currentTime = 0;
            return;
        }

        this.timelineState.minTime = minTime;
        this.timelineState.maxTime = maxTime;
        this.timelineState.currentTime = minTime;
        this.timelineState.displayedEarthquakes.clear();
        this.timelineState.fadingEarthquakes.clear();
        
        console.log('Timeline initialized:', {
            minTime: new Date(minTime).toISOString(),
            maxTime: new Date(maxTime).toISOString(),
            totalEarthquakes: this.allEarthquakes.length,
            validEarthquakes: validQuakes.length
        });
        
        this.updateTimelineDisplay();
        this.resetTimeline();
    }

    /**
     * Reset timeline to initial state
     */
    resetTimeline() {
        this.pauseTimeline();
        this.timelineState.currentTime = this.timelineState.minTime;
        this.timelineState.displayedEarthquakes.clear();
        this.timelineState.fadingEarthquakes.clear();
        
        // Hide all earthquakes
        this.visualization.hideAllEarthquakes();
        this.updateTimelineDisplay();
    }

    /**
     * Play timeline animation
     */
    playTimeline() {
        if (!this.loaded || this.timelineState.minTime === null || this.timelineState.minTime === 0 && this.timelineState.maxTime === 0) {
            this.showStatus('Load earthquake data first', 'error');
            console.warn('Cannot play timeline:', {
                loaded: this.loaded,
                minTime: this.timelineState.minTime,
                maxTime: this.timelineState.maxTime
            });
            return;
        }

        // Validate current time is set
        if (this.timelineState.currentTime === null || isNaN(this.timelineState.currentTime)) {
            this.timelineState.currentTime = this.timelineState.minTime;
            console.log('Reset currentTime to minTime');
        }

        console.log('Starting timeline playback:', {
            mode: this.timelineState.mode,
            currentTime: new Date(this.timelineState.currentTime).toISOString()
        });

        this.timelineState.isPlaying = true;
        this.elements.playBtn.style.display = 'none';
        this.elements.pauseBtn.style.display = 'inline-block';
        this.timelineState.lastUpdateTime = Date.now();
        
        this.animateTimeline();
    }

    /**
     * Pause timeline animation
     */
    pauseTimeline() {
        this.timelineState.isPlaying = false;
        this.elements.playBtn.style.display = 'inline-block';
        this.elements.pauseBtn.style.display = 'none';
        
        if (this.timelineState.animationFrameId) {
            cancelAnimationFrame(this.timelineState.animationFrameId);
            this.timelineState.animationFrameId = null;
        }
    }

    /**
     * Animation loop for timeline
     */
    animateTimeline() {
        if (!this.timelineState.isPlaying) return;

        const now = Date.now();
        const deltaTime = (now - this.timelineState.lastUpdateTime) / 1000; // Convert to seconds
        this.timelineState.lastUpdateTime = now;

        // Validate time range
        const timeRange = this.timelineState.maxTime - this.timelineState.minTime;
        if (isNaN(timeRange) || timeRange <= 0) {
            console.error('Invalid time range:', timeRange);
            this.pauseTimeline();
            this.showStatus('Error: Invalid time range', 'error');
            return;
        }

        // Calculate time step - spread timeRange over ~100 frames per playback unit
        const framesPerUnit = 100;
        const timeStep = (timeRange / framesPerUnit) * this.timelineState.playbackSpeed * deltaTime;
        
        if (isNaN(timeStep) || !isFinite(timeStep)) {
            console.error('Invalid timeStep:', timeStep);
            this.pauseTimeline();
            return;
        }
        
        this.timelineState.currentTime += timeStep;

        // Check if we've reached the end
        if (this.timelineState.currentTime >= this.timelineState.maxTime) {
            this.timelineState.currentTime = this.timelineState.maxTime;
            this.updateTimelineVisualization();
            this.updateTimelineDisplay();
            this.pauseTimeline();
            this.showStatus('Timeline complete', 'success');
            return;
        }

        this.updateTimelineVisualization();
        this.updateTimelineDisplay();
        
        this.timelineState.animationFrameId = requestAnimationFrame(() => this.animateTimeline());
    }

    /**
     * Update visualization based on current timeline position
     */
    updateTimelineVisualization() {
        const currentTime = this.timelineState.currentTime;
        const mode = this.timelineState.mode;

        if (mode === 'accumulate') {
            this.updateAccumulatingMode(currentTime);
        } else if (mode === 'sequential') {
            this.updateSequentialMode(currentTime);
        }
    }

    /**
     * Update accumulating mode: show all earthquakes up to current time
     */
    updateAccumulatingMode(currentTime) {
        try {
            // Keep previously displayed earthquakes, only add new ones
            let newCount = 0;
            
            for (const quake of this.allEarthquakes) {
                const quakeTime = Number(quake.time);
                
                if (!isNaN(quakeTime) && quakeTime <= currentTime) {
                    if (!this.timelineState.displayedEarthquakes.has(quake)) {
                        this.visualization.showEarthquake(quake);
                        this.timelineState.displayedEarthquakes.add(quake);
                        newCount++;
                    }
                }
            }
            
            if (newCount > 0) {
                console.log(`Added ${newCount} new earthquakes, total: ${this.timelineState.displayedEarthquakes.size}`);
            }
        } catch (error) {
            console.error('Error in updateAccumulatingMode:', error);
        }
    }

    /**
     * Update sequential mode: show earthquake then fade it out
     */
    updateSequentialMode(currentTime) {
        try {
            const fadeDuration = 2000; // Time for earthquake to fade out (ms)
            
            // Show new earthquakes at current time
            for (const quake of this.allEarthquakes) {
                const quakeTime = Number(quake.time);
                
                if (!isNaN(quakeTime) && quakeTime <= currentTime && !this.timelineState.displayedEarthquakes.has(quake)) {
                    this.visualization.showEarthquake(quake);
                    this.timelineState.displayedEarthquakes.add(quake);
                    this.timelineState.fadingEarthquakes.set(quake, Date.now());
                }
            }

            // Apply fade effects to earthquakes in fade process
            for (const [quake, fadeStartTime] of this.timelineState.fadingEarthquakes.entries()) {
                const elapsedTime = Date.now() - fadeStartTime;
                const progress = elapsedTime / fadeDuration; // 0 to 1

                if (progress >= 1) {
                    // Fade complete, hide and remove
                    this.visualization.hideEarthquake(quake);
                    this.timelineState.fadingEarthquakes.delete(quake);
                } else {
                    // Apply opacity fade
                    this.visualization.setEarthquakeOpacity(quake, 1 - progress);
                }
            }
        } catch (error) {
            console.error('Error in updateSequentialMode:', error);
        }
    }

    /**
     * Move to next frame (one earthquake forward)
     */
    nextFrame() {
        if (!this.loaded || this.timelineState.minTime === null) return;

        this.pauseTimeline();
        
        // Find next earthquake after current time
        const nextQuake = this.allEarthquakes.find(q => q.time > this.timelineState.currentTime);
        
        if (nextQuake) {
            this.timelineState.currentTime = nextQuake.time;
        } else {
            this.timelineState.currentTime = this.timelineState.maxTime;
        }

        if (this.timelineState.mode === 'accumulate') {
            this.updateAccumulatingMode(this.timelineState.currentTime);
        } else {
            this.updateSequentialMode(this.timelineState.currentTime);
        }

        this.updateTimelineDisplay();
    }

    /**
     * Move to previous frame (one earthquake backward)
     */
    previousFrame() {
        if (!this.loaded || this.timelineState.minTime === null) return;

        this.pauseTimeline();
        
        // Find previous earthquake before current time
        const prevQuake = [...this.allEarthquakes]
            .reverse()
            .find(q => q.time < this.timelineState.currentTime);
        
        if (prevQuake) {
            this.timelineState.currentTime = prevQuake.time;
        } else {
            this.timelineState.currentTime = this.timelineState.minTime;
        }

        if (this.timelineState.mode === 'accumulate') {
            this.updateAccumulatingMode(this.timelineState.currentTime);
        } else {
            this.updateSequentialMode(this.timelineState.currentTime);
        }

        this.updateTimelineDisplay();
    }

    /**
     * Show date picker modal
     */
    showDatePicker() {
        if (!this.timelineState.currentTime || isNaN(this.timelineState.currentTime)) {
            this.showStatus('Timeline not initialized', 'error');
            return;
        }

        // Set the input to current date
        const dateStr = new Date(this.timelineState.currentTime).toISOString().split('T')[0];
        this.elements.datePickerInput.value = dateStr;
        
        // Set min and max dates
        const minDate = new Date(this.timelineState.minTime).toISOString().split('T')[0];
        const maxDate = new Date(this.timelineState.maxTime).toISOString().split('T')[0];
        this.elements.datePickerInput.min = minDate;
        this.elements.datePickerInput.max = maxDate;
        
        // Show modal
        this.elements.datePickerModal.classList.remove('hidden');
        this.elements.datePickerInput.focus();
    }

    /**
     * Confirm date picker selection
     */
    confirmDatePicker() {
        try {
            const dateStr = this.elements.datePickerInput.value;
            
            if (!dateStr) {
                this.showStatus('Please select a date', 'error');
                return;
            }

            const parsedDate = new Date(dateStr);
            if (isNaN(parsedDate.getTime())) {
                this.showStatus('Invalid date format', 'error');
                return;
            }

            const newTime = parsedDate.getTime();
            
            if (newTime >= this.timelineState.minTime && newTime <= this.timelineState.maxTime) {
                this.timelineState.currentTime = newTime;
                this.pauseTimeline();
                
                if (this.timelineState.mode === 'accumulate') {
                    this.updateAccumulatingMode(this.timelineState.currentTime);
                } else {
                    this.updateSequentialMode(this.timelineState.currentTime);
                }
                
                this.updateTimelineDisplay();
                this.showStatus('Date updated', 'success');
                this.closeDatePicker();
            } else {
                const minDate = new Date(this.timelineState.minTime).toLocaleDateString();
                const maxDate = new Date(this.timelineState.maxTime).toLocaleDateString();
                this.showStatus(`Date must be between ${minDate} and ${maxDate}`, 'error');
            }
        } catch (error) {
            console.error('Error confirming date:', error);
            this.showStatus('Error selecting date', 'error');
        }
    }

    /**
     * Close date picker modal
     */
    closeDatePicker() {
        this.elements.datePickerModal.classList.add('hidden');
    }

    /**
     * Show date selector dialog (deprecated - replaced with modal)
     */
    showDateSelector() {
        // Redirect to new calendar picker
        this.showDatePicker();
    }

    /**
     * Seek to position based on progress bar click
     */
    seekToProgress(event) {
        if (!this.loaded || this.timelineState.minTime === null) {
            this.showStatus('Load data first', 'error');
            return;
        }

        try {
            const rect = this.elements.progressBar.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const progress = Math.max(0, Math.min(1, clickX / rect.width));

            const timeRange = this.timelineState.maxTime - this.timelineState.minTime;
            this.timelineState.currentTime = this.timelineState.minTime + (timeRange * progress);

            this.pauseTimeline();

            if (this.timelineState.mode === 'accumulate') {
                this.updateAccumulatingMode(this.timelineState.currentTime);
            } else {
                this.updateSequentialMode(this.timelineState.currentTime);
            }

            this.updateTimelineDisplay();
        } catch (error) {
            console.error('Error seeking to progress:', error);
            this.showStatus('Error seeking timeline', 'error');
        }
    }

    /**
     * Update timeline UI display
     */
    updateTimelineDisplay() {
        if (this.timelineState.minTime === null || this.timelineState.minTime === 0 && this.timelineState.maxTime === 0) {
            console.warn('Timeline not initialized for display');
            return;
        }

        try {
            // Validate current time
            let currentTime = this.timelineState.currentTime;
            if (!currentTime || isNaN(currentTime)) {
                currentTime = this.timelineState.minTime;
                this.timelineState.currentTime = currentTime;
            }

            // Update date display
            const date = new Date(currentTime);
            if (isNaN(date.getTime())) {
                console.error('Invalid date:', currentTime);
                this.elements.currentDate.textContent = 'Invalid Date';
                return;
            }

            this.elements.currentDate.textContent = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Update progress bar
            const timeRange = this.timelineState.maxTime - this.timelineState.minTime;
            const progress = (currentTime - this.timelineState.minTime) / timeRange;
            this.elements.progressFill.style.width = Math.max(0, Math.min(100, progress * 100)) + '%';

            // Update time range display
            const minDate = new Date(this.timelineState.minTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            const maxDate = new Date(this.timelineState.maxTime).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            
            const visibleCount = this.timelineState.displayedEarthquakes.size;
            this.elements.timeRangeDisplay.textContent = `Showing ${visibleCount} earthquakes (${minDate} - ${maxDate})`;
        } catch (error) {
            console.error('Error in updateTimelineDisplay:', error);
            this.elements.currentDate.textContent = 'Error';
        }
    }

    /**
     * Show status message
     * @param {string} message - Message to display
     * @param {string} type - 'loading', 'error', or 'success'
     */
    showStatus(message, type = 'info') {
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = '';
        
        if (type !== 'info') {
            this.elements.statusMessage.classList.add(type);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.controller = new EarthquakeController();
});
