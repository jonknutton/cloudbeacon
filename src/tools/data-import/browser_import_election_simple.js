/**
 * UK MPs Importer - Reads CSV from project folder
 * 
 * USAGE:
 * 1. Open governance.html in browser
 * 2. Press F12 to open console
 * 3. Copy this entire script into console
 * 4. Run: importAllElectionData()
 * 
 * This fetches the electionresults.csv from your project folder
 * No copy-paste needed, no variable redeclaration issues
 */

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Parse header (careful with quotes)
    const headerLine = lines[0];
    const headers = [];
    let currentHeader = '';
    let inQuotes = false;
    
    for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            headers.push(currentHeader.replace(/^"|"$/g, '').toLowerCase().trim());
            currentHeader = '';
        } else {
            currentHeader += char;
        }
    }
    headers.push(currentHeader.replace(/^"|"$/g, '').toLowerCase().trim());
    
    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        const values = [];
        let currentValue = '';
        let inQuotes2 = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            
            if (char === '"') {
                inQuotes2 = !inQuotes2;
            } else if (char === ',' && !inQuotes2) {
                values.push(currentValue.replace(/^"|"$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.replace(/^"|"$/g, ''));
        
        const obj = {};
        headers.forEach((header, idx) => {
            obj[header] = values[idx] ? values[idx].trim() : '';
        });
        
        rows.push(obj);
    }
    
    return rows;
}

function extractParty(resultLabel) {
    const keywords = [
        ['Conservative', 'Con'],
        ['Labour', 'Lab'],
        ['Liberal Democrat', 'LD'],
        ['Scottish National Party', 'SNP'],
        ['Plaid Cymru', 'PC'],
        ['Democratic Unionist Party', 'DUP'],
        ['Sinn Féin', 'SF'],
        ['SDLP'],
        ['Green'],
        ['Reform'],
        ['Independent', 'Ind']
    ];
    
    const partyNames = [
        'Conservative',
        'Labour',
        'Liberal Democrats',
        'SNP',
        'Plaid Cymru',
        'DUP',
        'Sinn Féin',
        'SDLP',
        'Green Party',
        'Reform UK',
        'Independent'
    ];
    
    for (let i = 0; i < keywords.length; i++) {
        for (const keyword of keywords[i]) {
            if (resultLabel.includes(keyword)) {
                return partyNames[i];
            }
        }
    }
    
    return 'Independent';
}

async function importAllElectionData() {
    console.log('\n🚀 Starting UK Parliament Election Data Import\n');
    
    try {
        // Fetch CSV from project folder
        console.log('📥 Fetching electionresults.csv...');
        const response = await fetch('/electionresults.csv');
        
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
        }
        
        const csvText = await response.text();
        console.log('✓ CSV fetched\n');
        
        // Parse CSV
        console.log('📄 Parsing CSV...');
        const results = parseCSV(csvText);
        console.log(`✓ Parsed ${results.length} rows\n`);
        
        // Create MP records
        console.log('🔨 Processing election results...');
        const mps = [];
        
        results.forEach((result, idx) => {
            const constituency = result['constituency > label'] || result['constituency'] || '';
            const election = result['election > label'] || result['election'] || '';
            const resultType = result['result of election'] || result['result'] || '';
            const turnout = result['turnout'] || '';
            const electorate = result['electorate'] || '';
            const majority = result['majority'] || '';
            
            if (constituency && resultType) {
                const party = extractParty(resultType);
                const is2024 = election.includes('2024');
                
                const mp = {
                    id: `${constituency.replace(/\s+/g, '-').toLowerCase()}`,
                    constituency: constituency,
                    election: election,
                    party: party,
                    result: resultType,
                    majority: majority || '0',
                    turnout: turnout || '0',
                    electorate: electorate || '0',
                    is2024: is2024,
                    imported: new Date().toISOString()
                };
                
                mps.push(mp);
            }
        });
        
        console.log(`✅ Created ${mps.length} records\n`);
        
        // Count by election
        const count2024 = mps.filter(m => m.is2024).length;
        console.log(`📊 Breakdown:`);
        console.log(`   • 2024 General Election: ${count2024}`);
        console.log(`   • Other elections: ${mps.length - count2024}\n`);
        
        // Preview
        console.log('📋 Preview (2024 elections, first 5):');
        mps.filter(m => m.is2024).slice(0, 5).forEach(mp => {
            console.log(`   • ${mp.constituency} (${mp.party}) - ${mp.result}`);
        });
        console.log();
        
        if (!window.db) {
            console.error('❌ Firestore not initialized');
            return;
        }
        
        // Confirm import
        const confirmed = confirm(
            `Ready to import ${mps.length} total records (${count2024} from 2024)?\n\nClick OK to proceed.`
        );
        
        if (!confirmed) {
            console.log('⏸️ Cancelled.\n');
            return;
        }
        
        // Import to Firestore
        console.log('📤 Importing to Firestore...\n');
        
        let imported = 0;
        const BATCH_SIZE = 100;
        
        for (let i = 0; i < mps.length; i += BATCH_SIZE) {
            const batch = mps.slice(i, i + BATCH_SIZE);
            
            const promises = batch.map(mp =>
                window.db.collection('election_results').doc(mp.id).set(mp, { merge: true })
            );
            
            try {
                await Promise.all(promises);
                imported += batch.length;
                console.log(`✓ ${Math.min(imported, mps.length)} / ${mps.length}`);
            } catch (error) {
                console.error('Batch error:', error);
            }
        }
        
        console.log(`\n✅ IMPORT COMPLETE!\n`);
        console.log(`✓ ${imported} records imported`);
        console.log(`✓ Collection: "election_results"`);
        console.log(`✓ Refresh governance.html\n`);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    }
}

console.log('%c🗳️ UK Parliament Election Data Importer Ready', 'color: #0087DC; font-weight: bold; font-size: 14px;');
console.log('Run: importAllElectionData()');
console.log('');
