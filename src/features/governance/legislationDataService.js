/**
 * Legislation Data Service
 * Handles loading and managing all historical legislation data
 * Data is fetched once from Firestore and cached
 */

/**
 * Load all legislation from Firestore
 * This is called when the "All Legislation" section is expanded
 * @returns {Promise<Array>} Array of legislation objects
 */
async function loadAllLegislationFromFirestore() {
    try {
        console.log('[Legislation Service] Loading all legislation from Firestore...');
        
        // Dynamic import of Firebase modules (same pattern as votingSystem.js)
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, query, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Get Firestore instance
        const db = getFirestore();
        
        // Query the 'legislation' collection for all historical laws
        // In production, this would be paginated or use specific constraints
        const legislationRef = collection(db, 'legislation');
        const q = query(legislationRef, limit(1000)); // Fetch up to 1000 items
        
        const snapshot = await getDocs(q);
        const legislation = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            legislation.push({
                id: doc.id,
                name: data.name || data.title || 'Untitled',
                description: data.description || data.summary || '',
                dateEnacted: data.dateEnacted || data.enacted_date || '',
                status: 'enacted',
                votes: data.votes || { support: 0, oppose: 0, abstain: 0 },
                category: data.category || 'general',
                source: data.source || 'legislation.gov.uk',
                url: data.url || ''
            });
        });
        
        console.log(`[Legislation Service] Loaded ${legislation.length} items from Firestore`);
        return legislation;
        
    } catch (error) {
        console.error('[Legislation Service] Error loading from Firestore:', error);
        
        // If Firestore is not available, return empty array (caller will use mock data)
        return [];
    }
}

/**
 * Import legislation data from legislation.gov.uk via Atom feed
 * This is used as initial seed data or periodic updates
 * @returns {Promise<Array>} Array of legislation from Atom feed
 */
async function fetchFromLegislationAtomFeed() {
    try {
        console.log('[Legislation Service] Fetching from legislation.gov.uk Atom feed...');
        
        // All legislation Atom feed
        const feedUrl = 'https://www.legislation.gov.uk/new/data.feed';
        
        const response = await fetch(feedUrl);
        const feedText = await response.text();
        
        // Parse Atom feed XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(feedText, 'text/xml');
        
        // Extract entries from feed
        const entries = xmlDoc.querySelectorAll('entry');
        const legislation = [];
        
        entries.forEach(entry => {
            const id = entry.querySelector('id')?.textContent || '';
            const title = entry.querySelector('title')?.textContent || 'Untitled';
            const summary = entry.querySelector('summary')?.textContent || '';
            const updated = entry.querySelector('updated')?.textContent || '';
            const link = entry.querySelector('link')?.getAttribute('href') || '';
            
            legislation.push({
                id: id,
                name: title,
                description: summary,
                dateEnacted: updated.split('T')[0], // Extract date from ISO string
                status: 'enacted',
                votes: { support: 0, oppose: 0, abstain: 0 },
                category: 'general',
                source: 'legislation.gov.uk',
                url: link
            });
        });
        
        console.log(`[Legislation Service] Fetched ${legislation.length} items from Atom feed`);
        return legislation;
        
    } catch (error) {
        console.error('[Legislation Service] Error fetching Atom feed:', error);
        return [];
    }
}

/**
 * Save legislation to Firestore (for bulk import)
 * This would be called by an admin function or Cloud Function
 * @param {Array} legislationArray - Array of legislation objects to save
 * @returns {Promise<number>} Number of items saved
 */
async function saveLegislationToFirestore(legislationArray) {
    try {
        console.log(`[Legislation Service] Saving ${legislationArray.length} items to Firestore...`);
        
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, addDoc, writeBatch, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const db = getFirestore();
        const legislationRef = collection(db, 'legislation');
        
        // Use batch write for better performance with large datasets
        const batchSize = 500;
        let savedCount = 0;
        
        for (let i = 0; i < legislationArray.length; i += batchSize) {
            const batch = writeBatch(db);
            const items = legislationArray.slice(i, i + batchSize);
            
            for (const item of items) {
                const docRef = doc(legislationRef);
                batch.set(docRef, item);
                savedCount++;
            }
            
            await batch.commit();
            console.log(`[Legislation Service] Saved ${Math.min(savedCount, i + batchSize)} of ${legislationArray.length} items`);
        }
        
        console.log(`[Legislation Service] Successfully saved ${savedCount} items to Firestore`);
        return savedCount;
        
    } catch (error) {
        console.error('[Legislation Service] Error saving to Firestore:', error);
        return 0;
    }
}

/**
 * Search legislation by title or keyword
 * @param {string} searchTerm - Term to search for
 * @returns {Promise<Array>} Matching legislation
 */
async function searchLegislation(searchTerm) {
    try {
        console.log(`[Legislation Service] Searching for: "${searchTerm}"`);
        
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const db = getFirestore();
        const legislationRef = collection(db, 'legislation');
        
        // Note: Full-text search requires Firestore indexes
        // For now, client-side filtering after fetching
        const q = query(legislationRef);
        const snapshot = await getDocs(q);
        
        const results = [];
        const lowerTerm = searchTerm.toLowerCase();
        
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.name?.toLowerCase().includes(lowerTerm) || 
                data.description?.toLowerCase().includes(lowerTerm)) {
                results.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        console.log(`[Legislation Service] Found ${results.length} results`);
        return results;
        
    } catch (error) {
        console.error('[Legislation Service] Error searching:', error);
        return [];
    }
}

/**
 * Get legislation by ID
 * @param {string} id - Legislation ID
 * @returns {Promise<Object>} Legislation object
 */
async function getLegislationById(id) {
    try {
        console.log(`[Legislation Service] Fetching legislation: ${id}`);
        
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const db = getFirestore();
        const legislationRef = doc(db, 'legislation', id);
        const snapshot = await getDoc(legislationRef);
        
        if (snapshot.exists()) {
            return {
                id: snapshot.id,
                ...snapshot.data()
            };
        } else {
            console.warn(`[Legislation Service] Legislation not found: ${id}`);
            return null;
        }
        
    } catch (error) {
        console.error('[Legislation Service] Error fetching legislation:', error);
        return null;
    }
}

/**
 * Update vote counts for legislation
 * @param {string} id - Legislation ID
 * @param {Object} votes - Vote object { support, oppose, abstain }
 * @returns {Promise<boolean>} Success status
 */
async function updateLegislationVotes(id, votes) {
    try {
        console.log(`[Legislation Service] Updating votes for: ${id}`);
        
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore, collection, doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const db = getFirestore();
        const legislationRef = doc(db, 'legislation', id);
        
        await updateDoc(legislationRef, {
            votes: votes,
            lastUpdated: new Date()
        });
        
        console.log(`[Legislation Service] Successfully updated votes for: ${id}`);
        return true;
        
    } catch (error) {
        console.error('[Legislation Service] Error updating votes:', error);
        return false;
    }
}

// Export functions for global access (if module system supports it)
if (typeof window !== 'undefined') {
    window.loadAllLegislationFromFirestore = loadAllLegislationFromFirestore;
    window.fetchFromLegislationAtomFeed = fetchFromLegislationAtomFeed;
    window.saveLegislationToFirestore = saveLegislationToFirestore;
    window.searchLegislation = searchLegislation;
    window.getLegislationById = getLegislationById;
    window.updateLegislationVotes = updateLegislationVotes;
}
