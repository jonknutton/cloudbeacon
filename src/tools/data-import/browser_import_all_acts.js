/**
 * COPY THE ENTIRE CONTENTS OF THIS FILE TO YOUR BROWSER CONSOLE
 * 
 * This script will:
 * 1. Fetch all 13 pages of UK Acts from legislation.gov.uk
 * 2. Parse the XML and convert to JSON
 * 3. Import ALL acts to Firestore in your Cloud Beacon app
 * 
 * Steps:
 * 1. Open governance.html in browser
 * 2. Press F12 to open Developer Console
 * 3. Copy ALL code below (from "async function" to the last closing brace)
 * 4. Paste into console and press Enter
 * 5. Wait for completion and check Firestore
 */

async function fetchAllActsAndImport() {
    console.log('\n🚀 Starting UK Acts Bulk Import\n');
    
    const BASE_URL = 'https://www.legislation.gov.uk/ukpga/data.feed?sort=published';
    const allActs = [];
    let currentPage = 1;
    let lastSuccessfulPage = 0;
    
    // Fetch pages until we get a 404
    while (true) {
        const url = currentPage === 1 ? BASE_URL : `${BASE_URL}&page=${currentPage}`;
        
        console.log(`📄 Fetching page ${currentPage}...`);
        
        try {
            const response = await fetch(url);
            
            // Stop if we get a 404
            if (response.status === 404) {
                console.log(`\n🛑 Reached page ${currentPage} - got 404 (end of pages)\n`);
                console.log(`✅ Final page fetched: ${lastSuccessfulPage}\n`);
                break;
            }
            
            if (!response.ok) {
                console.warn(`  ⚠️ Got HTTP ${response.status} on page ${currentPage}`);
                break;
            }
            
            const xmlText = await response.text();
            
            // Parse XML
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Check for errors
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                console.warn(`  ⚠️ XML Parse error on page ${currentPage}`);
                break;
            }
            
            lastSuccessfulPage = currentPage;
            
            // Extract entries
            const entries = xmlDoc.getElementsByTagName('entry');
            console.log(`  ✓ Found ${entries.length} entries`);
            
            for (let i = 0; i < entries.length; i++) {
                const entry = entries[i];
                
                // Extract elements
                const title = entry.querySelector('title')?.textContent || 'Untitled';
                
                // Skip correction slips
                if (title.includes('Correction slip')) continue;
                
                const summary = entry.querySelector('summary')?.textContent || 'No description';
                const published = entry.querySelector('published')?.textContent || '';
                const introducedDate = published.split('T')[0] || '';
                
                // Get year and chapter from namespaced elements
                const yearElem = entry.querySelector('[*|localName="Year"]');
                const numberElem = entry.querySelector('[*|localName="Number"]');
                
                const year = yearElem ? yearElem.getAttribute('Value') : '';
                const chapter = numberElem ? numberElem.getAttribute('Value') : '';
                
                // Extract URL from id element
                const idElem = entry.querySelector('id')?.textContent || '';
                const urlMatch = idElem.match(/\/id\/ukpga\/(\d+)\/(\d+)/);
                let url = '';
                
                if (urlMatch) {
                    url = `https://www.legislation.gov.uk/ukpga/${urlMatch[1]}/${urlMatch[2]}`;
                }
                
                if (url && title) {
                    const act = {
                        id: `${year}-${chapter}`,
                        title: title,
                        description: summary.substring(0, 500),
                        stage: 'Enacted',
                        url: url,
                        introducedDate: introducedDate,
                        year: year,
                        chapter: chapter
                    };
                    allActs.push(act);
                }
            }
            
            // Delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Increment page for next iteration
            currentPage++;
            
        } catch (error) {
            console.error(`  ❌ Error fetching page ${currentPage}:`, error);
            break;
        }
    }
    
    console.log(`\n✨ Fetched ${allActs.length} total acts\n`);
    
    // Preview first 3 acts
    console.log('📋 Preview (first 3 acts):');
    allActs.slice(0, 3).forEach(act => {
        console.log(`  • ${act.title} (${act.year}/${act.chapter})`);
    });
    console.log();
    
    // Import to Firestore
    if (window.importAllLegislationBills) {
        console.log('📤 Importing to Firestore...\n');
        
        // First do a preview
        console.log('Running PREVIEW mode...');
        const previewResult = await window.importAllLegislationBills(allActs, 'preview');
        console.log(previewResult);
        
        // Ask user before executing
        const confirmed = confirm(
            `✅ Preview successful!\n\n` +
            `Ready to import ${allActs.length} acts?\n\n` +
            `Click OK to proceed with EXECUTE mode.`
        );
        
        if (confirmed) {
            console.log('\n🔥 Running EXECUTE mode...\n');
            const executeResult = await window.importAllLegislationBills(allActs, 'execute');
            console.log(executeResult);
            console.log('\n✅ IMPORT COMPLETE! Refresh the page to see all acts.\n');
        } else {
            console.log('\n⏸️ Import cancelled by user.\n');
        }
    } else {
        console.log('❌ importAllLegislationBills not found. Make sure you\'re on governance.html\n');
        console.log('Alternatively, you can run this in the browser console:');
        console.log(`window.importAllLegislationBills(${JSON.stringify(allActs, null, 2)}, 'execute');`);
    }
}

// Start the import
fetchAllActsAndImport();
