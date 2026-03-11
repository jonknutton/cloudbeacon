/**
 * Upload MPs to Firestore 'mps' collection
 */

const fs = require('fs');
const admin = require('firebase-admin');

// Initialize Firebase
try {
    const serviceAccount = require('./service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    try {
        admin.initializeApp({ projectId: 'cloud-beacon-55a40' });
    } catch (e2) {
        console.error('❌ Firebase initialization failed');
        console.error('\n📋 SETUP REQUIRED:');
        console.error('1. Go to: https://console.firebase.google.com/project/cloud-beacon-55a40/settings/serviceaccounts/adminsdk');
        console.error('2. Click "Generate New Private Key"');
        console.error('3. Save the downloaded JSON file as "service-account.json" in this directory');
        console.error('4. Run this script again\n');
        process.exit(1);
    }
}

const db = admin.firestore();

function extractMPs(fileContent) {
    const mps = [];
    const lines = fileContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.endsWith('Portrait') && !line.includes('View') && !line.includes('Return')) {
            const name = line.substring(0, line.length - 8).trim();
            
            if (!name) continue;
            if (!lines[i+1] || lines[i+1].trim() !== name) continue;
            
            const partyCon = (lines[i+2] || '').trim();
            if (!partyCon || !partyCon.includes(' - ')) continue;
            
            const [party, constituency] = partyCon.split(' - ').map(s => s.trim());
            if (!party || !constituency) continue;
            
            let votes = null;
            let percentage = null;
            let firstElected = null;
            let governmentPosition = null;
            let memberHistory = [];
            
            for (let j = i + 3; j < Math.min(i + 25, lines.length); j++) {
                const checkLine = (lines[j] || '').trim();
                
                if (!checkLine || checkLine.includes('Set Alert')) break;
                
                if (governmentPosition === null && checkLine && 
                    !checkLine.includes('Portrait') &&
                    !checkLine.includes('-') && 
                    !checkLine.includes('majority') && 
                    !checkLine.includes('First elected') &&
                    !checkLine.includes('Set Alert') &&
                    !checkLine.includes('Labour') &&
                    !checkLine.includes('Conservative') &&
                    !checkLine.includes('Liberal') &&
                    !checkLine.includes('member') &&
                    !checkLine.includes('until') &&
                    checkLine.length > 10 &&
                    /[A-Z]/.test(checkLine)) {
                    governmentPosition = checkLine;
                }
                
                if (checkLine.includes('majority') && checkLine.includes('%')) {
                    const match = checkLine.match(/^([\d,]+)\s+\(([\d.]+)%\)\s+majority/);
                    if (match) {
                        votes = parseInt(match[1].replace(/,/g, ''));
                        percentage = parseFloat(match[2]);
                    }
                }
                
                if (checkLine.startsWith('First elected:')) {
                    firstElected = checkLine.substring('First elected:'.length).trim();
                }
                
                if ((checkLine.includes('member from') && checkLine.includes('until')) ||
                    (checkLine.includes('member from') && checkLine.includes('until'))) {
                    memberHistory.push(checkLine);
                }
            }
            
            if (name && party && constituency && firstElected) {
                const mp = {
                    name,
                    party,
                    constituency,
                    votes: votes || null,
                    percentage: percentage || null,
                    firstElected,
                    governmentPosition: governmentPosition || null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                if (memberHistory.length > 0) {
                    mp.memberHistory = memberHistory;
                }
                
                mps.push(mp);
            }
        }
    }
    
    return mps;
}

async function uploadToFirestore(mps) {
    const batch = db.batch();
    const collection = db.collection('mps');
    
    console.log(`\n📤 Uploading ${mps.length} MPs to Firestore...\n`);
    
    for (let i = 0; i < mps.length; i++) {
        const mp = mps[i];
        
        // Create document ID from name (lowercase, replace spaces with hyphens)
        const docId = mp.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        const docRef = collection.doc(docId);
        batch.set(docRef, mp);
        
        if ((i + 1) % 50 === 0) {
            console.log(`  ✓ Queued ${i + 1}/${mps.length} MPs...`);
        }
    }
    
    console.log(`\n⏳ Committing batch to Firestore...`);
    try {
        await batch.commit();
        console.log(`✅ Successfully uploaded ${mps.length} MPs to Firestore collection 'mps'\n`);
    } catch (error) {
        if (error.message.includes('default credentials')) {
            console.error('\n❌ ERROR: Firebase authentication required\n');
            console.error('📋 SETUP INSTRUCTIONS:');
            console.error('1. Go to: https://console.firebase.google.com/project/cloud-beacon-55a40/settings/serviceaccounts/adminsdk');
            console.error('2. Click "Generate New Private Key" button');  
            console.error('3. Save the downloaded JSON file as "service-account.json" in this directory');
            console.error('4. Run this script again\n');
            process.exit(1);
        }
        throw error;
    }
}

async function main() {
    try {
        console.log('🏛️  Cloud Beacon MP Import\n');
        
        // Extract MPs
        console.log('📖 Reading and parsing leg_pull.txt...');
        const content = fs.readFileSync('./leg_pull.txt', 'utf-8');
        const mps = extractMPs(content);
        console.log(`✅ Extracted ${mps.length} MPs\n`);
        
        // Show sample
        console.log('📊 SAMPLE MPs:');
        mps.slice(0, 2).forEach((mp, idx) => {
            console.log(`\n${idx + 1}. ${mp.name} (${mp.party})`);
            console.log(`   Constituency: ${mp.constituency}`);
            console.log(`   First elected: ${mp.firstElected}`);
            if (mp.governmentPosition) console.log(`   Position: ${mp.governmentPosition}`);
        });
        
        // Upload to Firestore
        await uploadToFirestore(mps);
        
        // Show stats
        const byParty = {};
        mps.forEach(mp => {
            byParty[mp.party] = (byParty[mp.party] || 0) + 1;
        });
        
        console.log('📈 MPs by Party:');
        Object.entries(byParty).sort((a, b) => b[1] - a[1]).forEach(([party, count]) => {
            console.log(`   ${party}: ${count}`);
        });
        
        console.log('\n✨ Import complete!');
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

main();
