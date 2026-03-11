/**
 * SIMPLER MPs IMPORTER - Using Election Results CSV
 * 
 * The Election Results dataset is cleaner - it only has constituencies that had 2024 elections
 * and shows who won each seat.
 * 
 * USAGE:
 * 1. Download "Election Results" CSV from data.parliament.uk (2024 General Election)
 * 2. Copy entire CSV content
 * 3. Open governance.html in browser, press F12
 * 4. Paste this entire script into console
 * 5. Run: importMPsFromElectionResults(electionCSVText)
 */

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headerLine = lines[0];
    const headers = headerLine.split('","').map(h => h.replace(/^"|"$/g, '').toLowerCase().trim());
    
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const values = line.split('","').map(v => v.replace(/^"|"$/g, ''));
        const obj = {};
        
        headers.forEach((header, idx) => {
            obj[header] = values[idx] ? values[idx].trim() : '';
        });
        
        rows.push(obj);
    }
    
    return rows;
}

function extractPartyFromResult(resultLabel) {
    const partyMap = {
        'Conservative': 'Conservative',
        'Con': 'Conservative',
        'Labour': 'Labour',
        'Lab': 'Labour',
        'Liberal Democrat': 'Liberal Democrats',
        'LD': 'Liberal Democrats',
        'Scottish National Party': 'SNP',
        'SNP': 'SNP',
        'Plaid Cymru': 'Plaid Cymru',
        'PC': 'Plaid Cymru',
        'Democratic Unionist Party': 'DUP',
        'DUP': 'DUP',
        'Sinn Féin': 'Sinn Féin',
        'SF': 'Sinn Féin',
        'SDLP': 'SDLP',
        'Green': 'Green Party',
        'Reform': 'Reform UK',
        'Independent': 'Independent',
        'Ind': 'Independent'
    };
    
    for (const [key, party] of Object.entries(partyMap)) {
        if (resultLabel.includes(key)) {
            return party;
        }
    }
    
    return 'Independent';
}

async function importMPsFromElectionResults(electionCSVText) {
    console.log('\n🚀 Starting MPs Import from 2024 Election Results\n');
    
    try {
        console.log('📄 Parsing Election Results CSV...');
        const results = parseCSV(electionCSVText);
        console.log(`   ✓ Found ${results.length} election results\n`);
        
        // Preview columns
        if (results.length > 0) {
            console.log('📋 Available columns:', Object.keys(results[0]));
        }
        
        // Build MP list from election results
        console.log('🔨 Building MP records...');
        const mps = [];
        
        results.forEach((result, idx) => {
            // Find the winner info - look for candidate or winner name
            const constituency = result['constituency > label'] || result['constituency'] || '';
            const resultType = result['result of election'] || result['result'] || '';
            const turnout = result['turnout'] || '';
            const electorate = result['electorate'] || '';
            const majority = result['majority'] || '';
            
            if (!constituency || !resultType) {
                return;
            }
            
            // Extract party from result (e.g., "Con Hold", "Lab Gain")
            const party = extractPartyFromResult(resultType);
            
            // Create MP record
            const mp = {
                id: `mp-${idx}-${constituency.replace(/\s+/g, '-')}`,
                constituency: constituency,
                party: party,
                elected: '4 Jul 2024',
                nextElection: 'By 28 Jan 2029',
                result: resultType,
                majority: majority,
                turnout: turnout,
                electorate: electorate,
                status: 'Active'
            };
            
            mps.push(mp);
        });
        
        console.log(`✅ Created ${mps.length} MP records\n`);
        
        // Preview
        console.log('📋 Preview (first 5 constituencies):');
        mps.slice(0, 5).forEach(mp => {
            console.log(`   • ${mp.constituency} (${mp.party}) - ${mp.result}`);
        });
        console.log();
        
        if (!window.db) {
            console.error('❌ Firestore not found. Is firebase.js loaded?');
            return;
        }
        
        // Confirm import
        const confirmed = confirm(
            `Ready to import ${mps.length} constituencies to Firestore?\n\nClick OK to proceed.`
        );
        
        if (!confirmed) {
            console.log('⏸️ Import cancelled.\n');
            return;
        }
        
        console.log('📤 Importing to Firestore...\n');
        
        // Import in batches
        const BATCH_SIZE = 50;
        let imported = 0;
        
        for (let i = 0; i < mps.length; i += BATCH_SIZE) {
            const batch = mps.slice(i, i + BATCH_SIZE);
            
            for (const mp of batch) {
                try {
                    await window.db.collection('mps').doc(mp.id).set(mp, { merge: true });
                    imported++;
                } catch (error) {
                    console.error(`Error importing ${mp.constituency}:`, error);
                }
            }
            
            console.log(`✓ ${Math.min(imported, i + BATCH_SIZE)} / ${mps.length}`);
        }
        
        console.log(`\n✅ COMPLETE!\n`);
        console.log(`✓ ${imported} constituencies imported`);
        console.log(`✓ Refresh page to see data\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

console.log('%c🗳️ Election Results MPs Importer Ready', 'color: green; font-weight: bold; font-size: 14px;');
console.log('Usage: importMPsFromElectionResults(electionCSVText)');
