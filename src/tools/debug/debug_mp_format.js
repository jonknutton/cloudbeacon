/**
 * Debug MP Parser - Check what's going wrong with one MP
 */

const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync(path.join(__dirname, 'leg_pull.txt'), 'utf-8');
const lines = fileContent.split('\n');

// Find first Portrait entry
for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('Portrait') && !line.includes('View') && !line.includes('Return')) {
        console.log(`Found Portrait at line ${i}: "${line}"\n`);
        
        // Show next 15 lines
        console.log('Next 15 lines:');
        for (let j = 0; j < 15 && i + j < lines.length; j++) {
            console.log(`  ${i+j}: "${lines[i+j]}"`);
        }
        break;
    }
}
