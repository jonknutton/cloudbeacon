/**
 * Node.js script to import MPs from election results CSV to Firestore
 * 
 * USAGE:
 * 1. Install dependencies: npm install csv-parser firebase-admin
 * 2. Run: node import-mps.js
 * 3. Check Firestore console to see imported data
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json'); // You'll need this

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://cloud-beacon-55a40.firebaseio.com"
});

const db = admin.firestore();

// Party mapping
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

function extractParty(resultLabel) {
    for (const [key, party] of Object.entries(partyMap)) {
        if (resultLabel.includes(key)) {
            return party;
        }
    }
    return 'Independent';
}

async function importElectionResults() {
    console.log('\n🚀 Starting MPs Import from Election Results CSV\n');
    
    const csvPath = path.join(__dirname, 'electionresults.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ electionresults.csv not found at ${csvPath}`);
        process.exit(1);
    }
    
    const mps = [];
    let rowCount = 0;
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                rowCount++;
                
                // Extract data from CSV (adjust field names based on actual CSV headers)
                const constituency = row['constituency > label'] || row['constituency'] || '';
                const election = row['election > label'] || row['election'] || '';
                const resultType = row['result of election'] || row['result'] || '';
                const turnout = row['turnout'] || '';
                const electorate = row['electorate'] || '';
                const majority = row['majority'] || '';
                
                if (constituency && resultType) {
                    const party = extractParty(resultType);
                    
                    // For 2024 General Election
                    const is2024 = election.includes('2024') || election.includes('General');
                    
                    const mp = {
                        id: `${constituency.replace(/\s+/g, '-').toLowerCase()}`,
                        constituency: constituency,
                        election: election,
                        party: party,
                        result: resultType,
                        majority: majority ? parseInt(majority) : 0,
                        turnout: turnout ? parseInt(turnout) : 0,
                        electorate: electorate ? parseInt(electorate) : 0,
                        is2024: is2024,
                        imported: new Date().toISOString()
                    };
                    
                    mps.push(mp);
                }
            })
            .on('end', async () => {
                console.log(`📄 Parsed ${rowCount} rows from CSV`);
                console.log(`✅ Created ${mps.length} election records\n`);
                
                if (mps.length === 0) {
                    console.error('❌ No valid records found');
                    reject(new Error('No valid records'));
                    return;
                }
                
                // Preview
                console.log('📋 Preview (first 5):');
                mps.slice(0, 5).forEach(mp => {
                    console.log(`   • ${mp.constituency} (${mp.party}) - ${mp.result}`);
                });
                console.log();
                
                // Import to Firestore
                console.log('📤 Importing to Firestore...\n');
                
                let imported = 0;
                const BATCH_SIZE = 100;
                
                for (let i = 0; i < mps.length; i += BATCH_SIZE) {
                    const batch = mps.slice(i, i + BATCH_SIZE);
                    
                    try {
                        await Promise.all(
                            batch.map(mp =>
                                db.collection('mps').doc(mp.id).set(mp, { merge: true })
                            )
                        );
                        
                        imported += batch.length;
                        console.log(`✓ Imported ${Math.min(imported, mps.length)} / ${mps.length}`);
                    } catch (error) {
                        console.error('Error importing batch:', error);
                    }
                }
                
                console.log(`\n✅ IMPORT COMPLETE!\n`);
                console.log(`✓ ${imported} records imported to Firestore`);
                console.log(`✓ Collection: "mps"`);
                console.log(`✓ You can now refresh governance.html\n`);
                
                resolve();
            })
            .on('error', reject);
    });
}

// Run import
importElectionResults()
    .then(() => {
        console.log('Database connection closing...');
        process.exit(0);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
