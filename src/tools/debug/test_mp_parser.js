/**
 * Test MP Parser - Check if parsing works before uploading to Firestore
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse MPs from text file
 */
function parseMPsFromText(fileContent) {
    const mps = [];
    
    const lines = fileContent.split('\n');
    console.log(`   → Total lines to scan: ${lines.length}`);
    
    let i = 0;
    let parseAttempts = 0;
    while (i < lines.length) {
        const line = lines[i].trim();
        
        // Look for Portrait pattern - "[Name] Portrait"
        if (line && line.includes('Portrait') && !line.includes('View') && !line.includes('Return')) {
            parseAttempts++;
            try {
                const mpData = parseMPEntry(lines, i);
                if (mpData) {
                    mps.push(mpData);
                    const newI = mpData._endLine;
                    if (newI <= i) {
                        console.log(`   ⚠️  Warning: Parser not advancing (i=${i}, newI=${newI}), skipping`);
                        i++;
                    } else {
                        i = newI;
                    }
                } else {
                    i++;
                }
            } catch (error) {
                console.error(`   ❌ Error parsing MP at line ${i}: ${error.message}`);
                i++;
            }
        } else {
            i++;
        }
        
        if (parseAttempts > 0 && parseAttempts % 50 === 0) {
            process.stdout.write(`\r   → Parsed ${mps.length} MPs so far (line ${i}/${lines.length})...`);
        }
    }
    
    console.log(`\n   → Parse attempts: ${parseAttempts}`);
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
        
        // Next line: Party - Constituency
        let partyConstituencyLine = lines[i]?.trim();
        if (!partyConstituencyLine) return null;
        i++;
        
        // Check if next line is a government position
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
    const parts = line.split(' - ');
    if (parts.length >= 2) {
        const party = parts[0].trim();
        const constituency = parts.slice(1).join(' - ').trim();
        return [party, constituency];
    }
    return [line, null];
}

/**
 * Main test function
 */
function main() {
    try {
        console.log('🧪 MP Parser Test\n');
        
        // Read the file
        const filePath = path.join(__dirname, 'leg_pull.txt');
        
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        
        console.log(`📂 Reading file...`);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        console.log(`✅ File loaded (${fileContent.length} chars, ${fileContent.split('\n').length} lines)\n`);
        
        // Parse MPs
        console.log('⚙️  Parsing...');
        const start = Date.now();
        const mps = parseMPsFromText(fileContent);
        const elapsed = Date.now() - start;
        console.log(`✅ Parsed ${mps.length} MPs in ${elapsed}ms\n`);
        
        // Show samples
        if (mps.length > 0) {
            console.log('📊 FIRST 5 MPs:');
            mps.slice(0, 5).forEach((mp, idx) => {
                console.log(`\n${idx + 1}. ${mp.name}`);
                console.log(`   Party: ${mp.party}`);
                console.log(`   Constituency: ${mp.constituency}`);
                console.log(`   Votes: ${mp.votes} (${mp.percentage}%)`);
                console.log(`   First Elected: ${mp.firstElected}`);
                if (mp.governmentPosition) {
                    console.log(`   Position: ${mp.governmentPosition}`);
                }
            });
            
            // Also show a Green Party one
            const greenPartyMP = mps.find(mp => mp.party.includes('Green'));
            if (greenPartyMP) {
                console.log(`\n📊 SAMPLE GREEN PARTY MP:`);
                console.log(JSON.stringify(greenPartyMP, null, 2));
            }
        }
        
        // Statistics
        console.log('\n\n📈 STATISTICS:');
        const byParty = {};
        mps.forEach(mp => {
            byParty[mp.party] = (byParty[mp.party] || 0) + 1;
        });
        
        console.log(`Total MPs: ${mps.length}`);
        console.log(`\nBy Party:`);
        Object.entries(byParty).sort((a, b) => b[1] - a[1]).forEach(([party, count]) => {
            console.log(`  • ${party}: ${count}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();
