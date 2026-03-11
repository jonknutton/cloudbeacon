/**
 * Import MPs from leg_pull.txt into Firestore
 * 
 * Usage: node import_mps_parallel.js
 * 
 * This script:
 * 1. Reads leg_pull.txt
 * 2. Parses each MP entry extracting: name, party, constituency, votes, percentage, firstElected
 * 3. Creates a new 'mps' collection in Firestore
 * 4. Uploads all MP data
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK (assumes GOOGLE_APPLICATION_CREDENTIALS is set)
try {
    admin.initializeApp();
} catch (error) {
    // Already initialized
}

const db = admin.firestore();

/**
 * Parse MPs from text file
 */
function parseMPsFromText(fileContent) {
    const mps = [];
    
    // Split by pattern that indicates start of MP entry
    // Each MP entry starts with "[Name] Portrait" and ends before next entry or "Set Alert"
    
    // Split on lines
    const lines = fileContent.split('\n');
    
    let i = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        
        // Look for Portrait pattern - "[Name] Portrait"
        if (line && line.includes('Portrait') && !line.includes('View') && !line.includes('Return')) {
            try {
                const mpData = parseMPEntry(lines, i);
                if (mpData) {
                    mps.push(mpData);
                    i = mpData._endLine;
                } else {
                    i++;
                }
            } catch (error) {
                console.error(`Error parsing MP at line ${i}:`, error.message);
                i++;
            }
        } else {
            i++;
        }
    }
    
    return mps;
}

/**
 * Parse a single MP entry starting from a Portrait line
 */
function parseMPEntry(lines, startLine) {
    try {
        let i = startLine;
        
        // Current line: "[Name] Portrait" - extract name
        const portraitLine = lines[i]?.trim();
        if (!portraitLine || !portraitLine.includes('Portrait')) return null;
        
        const name = portraitLine.replace(/\s+Portrait\s*$/, '').trim();
        if (!name) return null;
        i++;
        
        // Next line: Duplicate name (skip it)
        const nextLine = lines[i]?.trim();
        if (nextLine === name) {
            i++;
        }
        
        // Next line: Party - Constituency (may include government position on next line)
        let partyConstituencyLine = lines[i]?.trim();
        if (!partyConstituencyLine) return null;
        i++;
        
        // Check if next line is a government position (doesn't contain "-")
        let governmentPosition = null;
        if (lines[i] && !lines[i].includes('-') && !lines[i].includes('majority') && lines[i].trim().length > 0) {
            governmentPosition = lines[i].trim();
            i++;
        }
        
        // Parse party and constituency
        const [party, constituency] = parsePartyConstituency(partyConstituencyLine);
        
        // Next lines should have vote info and "First elected"
        let votes = null;
        let percentage = null;
        let firstElected = null;
        
        // Read until we find "First elected:"
        while (i < lines.length && !lines[i].includes('First elected:')) {
            const voteLine = lines[i]?.trim();
            
            // Look for pattern: "NUMBER (PERCENT%) majority - 2024 General Election"
            if (voteLine && voteLine.includes('majority') && voteLine.includes('%')) {
                const match = voteLine.match(/^([\d,]+)\s+\(([\d.]+)%\)\s+majority/);
                if (match) {
                    votes = parseInt(match[1].replace(/,/g, ''));
                    percentage = parseFloat(match[2]);
                }
            }
            
            i++;
        }
        
        // Parse "First elected: DATE"
        if (lines[i]?.includes('First elected:')) {
            const match = lines[i].match(/First elected:\s*(.+?)(?:\n|$)/);
            if (match) {
                firstElected = match[1].trim();
            }
        }
        
        // Skip to end of entry (look for "Set Alert" line)
        while (i < lines.length && !lines[i].includes('Set Alert')) {
            i++;
        }
        i++; // Move past the "Set Alert" line
        
        // Only return if we have required fields
        if (!name || !party || !constituency || !firstElected) {
            return null;
        }
        
        return {
            name,
            party,
            constituency,
            votes: votes || null,
            percentage: percentage || null,
            firstElected,
            governmentPosition: governmentPosition || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            _endLine: i
        };
    } catch (error) {
        console.error('Error in parseMPEntry:', error);
        return null;
    }
}

/**
 * Parse "Party - Constituency" line
 */
function parsePartyConstituency(line) {
    // Format: "Party Name - Constituency Name"
    const parts = line.split(' - ');
    if (parts.length >= 2) {
        const party = parts[0].trim();
        const constituency = parts.slice(1).join(' - ').trim();
        return [party, constituency];
    }
    return [line, null];
}

/**
 * Upload MPs to Firestore
 */
async function uploadMPsToFirestore(mps) {
    const batch = db.batch();
    const collectionRef = db.collection('mps');
    
    console.log(`\n📝 Uploading ${mps.length} MPs to Firestore...`);
    
    let count = 0;
    
    for (const mpData of mps) {
        // Remove the _endLine property before uploading
        const { _endLine, ...cleanData } = mpData;
        
        // Create doc ID from name (lowercase, replace spaces with hyphens)
        const docId = mpData.name.toLowerCase().replace(/\s+/g, '-');
        
        const docRef = collectionRef.doc(docId);
        batch.set(docRef, cleanData);
        
        count++;
        if (count % 50 === 0) {
            console.log(`  → Queued ${count} MPs...`);
        }
    }
    
    // Commit batch
    await batch.commit();
    console.log(`✅ Successfully uploaded ${mps.length} MPs to Firestore collection 'mps'`);
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('🏛️  MP Data Import Script');
        console.log('========================\n');
        
        // Read the file
        const filePath = path.join(__dirname, 'leg_pull.txt');
        console.log(`📂 Reading: ${filePath}`);
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        console.log(`✅ File loaded (${fileContent.length} characters)`);
        
        // Parse MPs
        console.log('\n⚙️  Parsing MP entries...');
        const mps = parseMPsFromText(fileContent);
        console.log(`✅ Parsed ${mps.length} MPs`);
        
        // Show sample
        if (mps.length > 0) {
            console.log('\n📊 First MP sample:');
            console.log(JSON.stringify(mps[0], null, 2));
        }
        
        // Upload to Firestore
        await uploadMPsToFirestore(mps);
        
        // Statistics
        console.log('\n📈 Import Statistics:');
        const byParty = {};
        mps.forEach(mp => {
            byParty[mp.party] = (byParty[mp.party] || 0) + 1;
        });
        
        Object.entries(byParty).sort((a, b) => b[1] - a[1]).forEach(([party, count]) => {
            console.log(`  • ${party}: ${count}`);
        });
        
        console.log('\n✨ Import complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
