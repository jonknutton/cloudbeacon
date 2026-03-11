/**
 * CSV Data Loader
 * Loads earthquake data from CSV files
 */

class CSVDataLoader {
    /**
     * Load CSV from file input or URL
     * @param {File|string} source - File object or CSV URL
     * @returns {Promise<Array>} Array of parsed earthquake records
     */
    static async loadCSV(source) {
        let csvContent;

        if (typeof source === 'string') {
            // Load from URL
            try {
                const response = await fetch(source);
                csvContent = await response.text();
            } catch (e) {
                console.error('Error loading CSV from URL:', e);
                return [];
            }
        } else if (source instanceof File) {
            // Load from File object
            csvContent = await source.text();
        } else {
            console.error('Invalid source: must be File or URL string');
            return [];
        }

        return CSVDataLoader.parseCSV(csvContent);
    }

    /**
     * Parse CSV content into earthquake records
     * Expected columns: time, latitude, longitude, depth, mag, ...
     */
    static parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) return [];

        // Parse header
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const latIndex = headers.indexOf('latitude');
        const lonIndex = headers.indexOf('longitude');
        const depthIndex = headers.indexOf('depth');
        const magIndex = headers.indexOf('mag');

        if (latIndex === -1 || lonIndex === -1 || depthIndex === -1 || magIndex === -1) {
            console.error('CSV missing required columns: latitude, longitude, depth, mag');
            return [];
        }

        // Parse data rows
        const earthquakes = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const values = CSVDataLoader.parseCSVLine(line);
            if (values.length <= Math.max(latIndex, lonIndex, depthIndex, magIndex)) {
                continue;  // Skip incomplete rows
            }

            try {
                const quake = {
                    latitude: parseFloat(values[latIndex]),
                    longitude: parseFloat(values[lonIndex]),
                    depth: parseFloat(values[depthIndex]),
                    mag: parseFloat(values[magIndex]),
                    // Store other fields too
                    time: values[headers.indexOf('time')] || '',
                    place: values[headers.indexOf('place')] || '',
                };

                // Validate
                if (!isNaN(quake.latitude) && !isNaN(quake.longitude) && 
                    !isNaN(quake.depth) && !isNaN(quake.mag)) {
                    earthquakes.push(quake);
                }
            } catch (e) {
                console.warn('Error parsing row', i, ':', e);
            }
        }

        return earthquakes;
    }

    /**
     * Parse a CSV line respecting quoted fields
     */
    static parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;  // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        values.push(current);  // Add last value
        return values.map(v => v.trim());
    }

    /**
     * Load CSV from file input element
     * @param {HTMLInputElement} fileInput - File input element
     * @returns {Promise<Array>} Array of parsed records
     */
    static async loadFromFileInput(fileInput) {
        if (!fileInput.files || fileInput.files.length === 0) {
            console.error('No file selected');
            return [];
        }

        return CSVDataLoader.loadCSV(fileInput.files[0]);
    }
}
