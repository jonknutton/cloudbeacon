/**
 * Detailed debug of parsing first MP
 */

const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync(path.join(__dirname, 'leg_pull.txt'), 'utf-8');
const lines = fileContent.split('\n');

function parseMPEntry(lines, startLine) {
    let i = startLine;
    console.log(`\n=== Parsing MP at line ${i} ===`);
    
    // Current line: "[Name] Portrait" - extract name
    const portraitLine = lines[i]?.trim();
    console.log(`[${i}] portraitLine: "${portraitLine}"`);
    
    if (!portraitLine || !portraitLine.includes('Portrait')) {
        console.log('  ❌ No Portrait in line');
        return null;
    }
    
    const name = portraitLine.replace(/\s+Portrait\s*$/, '').trim();
    console.log(`[${i}] extracted name: "${name}"`);
    
    if (!name) {
        console.log('  ❌ Name is empty');
        return null;
    }
    i++;
    
    // Next line: Duplicate name (skip it)
    const nextLine = lines[i]?.trim();
    console.log(`[${i}] nextLine: "${nextLine}"`);
    
    if (nextLine === name) {
        console.log(`  ✓ Found duplicate name, skipping`);
        i++;
    } else {
        console.log(`  ✗ No duplicate name match`);
    }
    
    // Next line: Party - Constituency
    let partyConstituencyLine = lines[i]?.trim();
    console.log(`[${i}] partyConstituency: "${partyConstituencyLine}"`);
    
    if (!partyConstituencyLine) {
        console.log('  ❌ No party line');
        return null;
    }
    
    const [party, constituency] = partyConstituencyLine.split(' - ');
    console.log(`  party: "${party}"`);
    console.log(`  constituency: "${constituency}"`);
    i++;
    
    // Check for government position
    let governmentPosition = null;
    const posLine = lines[i]?.trim();
    console.log(`[${i}] posLine: "${posLine}"`);
    
    if (posLine && !posLine.includes('-') && !posLine.includes('majority') && posLine.length > 0) {
        governmentPosition = posLine;
        console.log(`  ✓ Government position: "${governmentPosition}"`);
        i++;
    }
    
    // Find votes line
    let votes = null;
 let percentage = null;
    while (i < lines.length && !lines[i].includes('First elected:')) {
        const voteLine = lines[i]?.trim();
        
        if (voteLine && voteLine.includes('majority') && voteLine.includes('%')) {
            const match = voteLine.match(/^([\d,]+)\s+\(([\d.]+)%\)\s+majority/);
            if (match) {
                votes = parseInt(match[1].replace(/,/g, ''));
                percentage = parseFloat(match[2]);
                console.log(`  ✓ Votes: ${votes} (${percentage}%)`);
            }
        }
        i++;
    }
    
    // Parse first elected
    let firstElected = null;
    if (lines[i]?.includes('First elected:')) {
        const match = lines[i].match(/First elected:\s*(.+?)(?:\n|$)/);
        if (match) {
            firstElected = match[1].trim();
            console.log(`  ✓ First elected: "${firstElected}"`);
        }
    }
    
    return { name, party: party?.trim(), constituency: constituency?.trim(), votes, percentage, firstElected, governmentPosition };
}

// Find and parse first MP
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('Portrait') && !line.includes('View') && !line.includes('Return')) {
        const result = parseMPEntry(lines, i);
        console.log('\nRESULT:');
        console.log(JSON.stringify(result, null, 2));
        break;
    }
}
