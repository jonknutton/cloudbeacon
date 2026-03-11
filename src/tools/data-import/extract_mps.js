/**
 * Simple MP Parser - Extract MPs from leg_pull.txt
 * 
 * Format is:
 * [Name] Portrait
 * [Name]
 * [Party] - [Constituency]
 * [optional: government position]
 * [votes] (percent%) majority - 2024 General Election
 * First elected: [date]
 * Set Alert - ...
 */

const fs = require('fs');

function extractMPs(fileContent) {
    const mps = [];
    const lines = fileContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Look for "[Name] Portrait" lines
        if (line.endsWith('Portrait') && !line.includes('View') && !line.includes('Return')) {
            const name = line.substring(0, line.length - 8).trim(); // Remove " Portrait"
            
            if (!name) continue;
            
            // Next line should duplicate name - skip it  
            if (!lines[i+1] || lines[i+1].trim() !== name) continue;
            
            // Line after that: Party - Constituency
            const partyCon = (lines[i+2] || '').trim();
            if (!partyCon || !partyCon.includes(' - ')) continue;
            
            const [party, constituency] = partyCon.split(' - ').map(s => s.trim());
            if (!party || !constituency) continue;
            
            // Scan for all useful data
            let votes = null;
            let percentage = null;
            let firstElected = null;
            let governmentPosition = null;
            let partyHistory = []; // Track party changes
            let memberHistory = []; // Track member status changes
            
            for (let j = i + 3; j < Math.min(i + 25, lines.length); j++) {
                const checkLine = (lines[j] || '').trim();
                
                if (!checkLine || checkLine.includes('Set Alert')) break;
                
                // Check for government position (multi-word line without common keywords)
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
                
                // Check for votes line
                if (checkLine.includes('majority') && checkLine.includes('%')) {
                    const match = checkLine.match(/^([\d,]+)\s+\(([\d.]+)%\)\s+majority/);
                    if (match) {
                        votes = parseInt(match[1].replace(/,/g, ''));
                        percentage = parseFloat(match[2]);
                    }
                }
                
                // Check for first elected
                if (checkLine.startsWith('First elected:')) {
                    firstElected = checkLine.substring('First elected:'.length).trim();
                }
                
                // Check for party/member history (e.g., "Independent member from X until Y")
                if ((checkLine.includes('member from') && checkLine.includes('until')) ||
                    (checkLine.includes('member from') && checkLine.includes('until'))) {
                    memberHistory.push(checkLine);
                }
            }
            
            // Only add if we have key data
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
                
                // Add optional history if available
                if (memberHistory.length > 0) {
                    mp.memberHistory = memberHistory;
                }
                
                mps.push(mp);
            }
        }
    }
    
    return mps;
}

async function main() {
    try {
        console.log('📖 Reading leg_pull.txt...');
        const content = fs.readFileSync('./leg_pull.txt', 'utf-8');
        console.log(`✅ Loaded ${content.length} characters\n`);
        
        console.log('⚙️  Extracting MPs...');
        const mps = extractMPs(content);
        console.log(`✅ Extracted ${mps.length} MPs\n`);
        
        // Show samples
        if (mps.length > 0) {
            console.log('📊 FIRST 3 MPs:');
            mps.slice(0, 3).forEach((mp, idx) => {
                console.log(`\n${idx + 1}. ${mp.name}`);
                console.log(`   Party: ${mp.party}`);
                console.log(`   Constituency: ${mp.constituency}`);
                console.log(`   Votes: ${mp.votes} (${mp.percentage}%)`);
                console.log(`   First Elected: ${mp.firstElected}`);
                if (mp.governmentPosition) {
                    console.log(`   Position: ${mp.governmentPosition}`);
                }
            });
        }
        
        // Party breakdown
        const byParty = {};
        mps.forEach(mp => {
            byParty[mp.party] = (byParty[mp.party] || 0) + 1;
        });
        
        console.log('\n\n📈 BY PARTY:');
        Object.entries(byParty).sort((a, b) => b[1] - a[1]).forEach(([party, count]) => {
            console.log(`  ${party}: ${count}`);
        });
        
        // Ask to upload
        console.log(`\n\n✨ Ready to upload ${mps.length} MPs to Firestore!`);
        console.log('✔️  Run: node import_mps_to_firestore.js');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
