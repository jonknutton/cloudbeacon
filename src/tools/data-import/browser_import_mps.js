/**
 * BROWSER CONSOLE IMPORTER FOR UK PARLIAMENT MPs
 * 
 * This script imports real, complete MP data from Parliament CSV downloads
 * 
 * STEPS:
 * 1. Download from https://data.parliament.uk/:
 *    - Members (all CSVs - they come in 500-entry chunks)
 *    - Election Results (2024 General Election)
 *    
 * 2. Open governance.html in browser
 * 3. Press F12 to open Developer Console
 * 4. Copy THIS ENTIRE FILE to browser console
 * 5. Call: importMPsFromCSV(membersCSV, electionResultsCSV)
 *    where membersCSV and electionResultsCSV are the CSV text content
 * 
 * ALTERNATIVE - Paste CSV directly:
 * Copy the full CSV content from the downloaded file, then:
 * const membersCSV = `[ paste members CSV here ]`;
 * const electionCSV = `[ paste election results CSV here ]`;
 * importMPsFromCSV(membersCSV, electionCSV);
 */

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse header
    const headerLine = lines[0];
    const headers = headerLine.split('","').map(h => h.replace(/^"|"$/g, ''));
    
    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Simple CSV parsing for quoted fields
        const values = line.split('","').map(v => v.replace(/^"|"$/g, ''));
        const obj = {};
        
        headers.forEach((header, idx) => {
            obj[header.toLowerCase().trim()] = values[idx] ? values[idx].trim() : '';
        });
        
        rows.push(obj);
    }
    
    return rows;
}

/**
 * Extract party from election result label
 * e.g., "Con Hold" -> "Conservative", "Lab Gain" -> "Labour"
 */
function extractPartyFromResult(resultLabel) {
    const partyMap = {
        'Con': 'Conservative',
        'Lab': 'Labour',
        'LD': 'Liberal Democrats',
        'SNP': 'SNP',
        'PC': 'Plaid Cymru',
        'DUP': 'DUP',
        'SF': 'Sinn Féin',
        'SDLP': 'SDLP',
        'Green': 'Green',
        'Ind': 'Independent',
        'Reform': 'Reform UK',
        'Alba': 'Alba'
    };
    
    for (const [abbrev, full] of Object.entries(partyMap)) {
        if (resultLabel.includes(abbrev)) {
            return full;
        }
    }
    return 'Independent';
}

/**
 * Main import function
 */
async function importMPsFromCSV(membersCSVText, electionResultsCSVText) {
    console.log('\n🚀 Starting UK MPs Import from Parliament CSV\n');
    
    try {
        // Parse both CSVs
        console.log('📄 Parsing Members CSV...');
        const members = parseCSV(membersCSVText);
        console.log(`   ✓ Found ${members.length} members`);
        
        console.log('📄 Parsing Election Results CSV...');
        const electionResults = parseCSV(electionResultsCSVText);
        console.log(`   ✓ Found ${electionResults.length} election results`);
        
        // Build a lookup map for 2024 election results by constituency
        const electionMap = {};
        electionResults.forEach(result => {
            const constituency = result['constituency > label'] || result['constituency'];
            const election = result['election > label'] || result['election'];
            
            // Only include 2024 General Election
            if (election && election.includes('2024')) {
                electionMap[constituency.toLowerCase()] = result;
            }
        });
        
        console.log(`🗺️  Built election map with ${Object.keys(electionMap).length} constituencies\n`);
        
        // Combine member data with election results
        console.log('🔗 Matching members with election results...');
        const mps = [];
        
        members.forEach(member => {
            if (!member['full name'] || !member['constituency > label']) {
                return; // Skip incomplete records
            }
            
            const constituency = member['constituency > label'].toLowerCase();
            const electionResult = electionMap[constituency];
            
            // Only include if they won in 2024 election
            if (electionResult) {
                const party = extractPartyFromResult(electionResult['result of election'] || '');
                
                mps.push({
                    id: member.uri || (member['full name'] + '-' + member['constituency > label']),
                    name: member['full name'],
                    firstName: member['given name'] || '',
                    lastName: member['family name'] || '',
                    party: member.party || party,
                    constituency: member['constituency > label'],
                    gender: member.gender || 'Not specified',
                    twitter: member.twitter || '',
                    twitterHandle: member.twitter ? '@' + member.twitter : '',
                    website: member['home page'] || member['home page > uri'] || '',
                    elected: '4 Jul 2024', // 2024 General Election date
                    nextElection: 'By 28 Jan 2029',
                    status: 'Active'
                });
            }
        });
        
        console.log(`✅ Successfully matched ${mps.length} current MPs\n`);
        
        // Preview
        console.log('📋 Preview (first 5 MPs):');
        mps.slice(0, 5).forEach(mp => {
            console.log(`   • ${mp.name} (${mp.party}) - ${mp.constituency}`);
        });
        console.log();
        
        // Import to Firestore
        if (!window.db) {
            console.error('❌ Firestore not initialized. Make sure firebase.js is loaded.\n');
            return;
        }
        
        console.log('📤 Importing to Firestore...\n');
        
        // Show preview prompt
        const confirmed = confirm(
            `✅ Preview successful!\n\n` +
            `Ready to import ${mps.length} MPs to Firestore?\n\n` +
            `Click OK to proceed.`
        );
        
        if (!confirmed) {
            console.log('⏸️ Import cancelled by user.\n');
            return;
        }
        
        // Import in batches
        const BATCH_SIZE = 50;
        let imported = 0;
        
        for (let i = 0; i < mps.length; i += BATCH_SIZE) {
            const batch = mps.slice(i, i + BATCH_SIZE);
            
            for (const mp of batch) {
                try {
                    // Create or update MP document
                    const docRef = window.db.collection('mps').doc(mp.id);
                    await docRef.set(mp, { merge: true });
                    imported++;
                } catch (error) {
                    console.error(`Error importing ${mp.name}:`, error);
                }
            }
            
            console.log(`✓ Imported ${Math.min(imported, i + BATCH_SIZE)} / ${mps.length} MPs...`);
        }
        
        console.log(`\n✅ IMPORT COMPLETE!\n`);
        console.log(`✓ ${imported} MPs imported to Firestore`);
        console.log(`✓ Collection: "mps"`);
        console.log(`✓ Refresh page to see updated data\n`);
        
    } catch (error) {
        console.error('❌ Import error:', error.message);
        console.error(error);
    }
}

/**
 * Load MPs from Firestore (called by governance.js)
 */
async function loadMPsFromFirestore() {
    try {
        if (!window.db) {
            console.warn('Firestore not initialized');
            return null;
        }
        
        const snapshot = await window.db.collection('mps').get();
        const mps = [];
        
        snapshot.forEach(doc => {
            mps.push(doc.data());
        });
        
        console.log(`[MPs] Loaded ${mps.length} MPs from Firestore`);
        return mps;
    } catch (error) {
        console.error('[MPs] Error loading from Firestore:', error);
        return null;
    }
}

console.log('%c📊 UK Parliament MPs Importer Ready', 'color: blue; font-weight: bold; font-size: 14px;');
console.log('Usage: importMPsFromCSV(membersCSV, electionResultsCSV)');
console.log('');
