/**
 * STANDALONE NODE SCRIPT - Import All UK Acts from legislation.gov.uk
 * 
 * This script fetches ALL Acts from legislation.gov.uk Atom feeds (1801-present)
 * and prepares them for import to Firestore.
 * 
 * USAGE:
 * 1. Make sure you have Node.js installed
 * 2. Run: node importAllActsFromLegislation.js
 * 3. This will create a file: allActsData.json
 * 4. Open that file in browser console and run the import
 * 
 * REQUIREMENTS: npm install node-fetch
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Fetch from paginated main feed instead of year-specific feeds
const PAGES_TO_FETCH = [1];  // Start with just the main feed first

/**
 * Fetch URL using Node.js https module
 */
function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({ status: res.statusCode, text: data });
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

console.log(`\n📚 UK ACTS IMPORT TOOL\n`);
console.log(`Testing with: ${PAGES_TO_FETCH.length} page(s)`);
console.log(`Pages: ${PAGES_TO_FETCH.join(', ')}\n`);

/**
 * Fetch and parse Acts from a paginated Atom feed
 */
async function fetchActsFromPage(pageNum) {
    // Try different URL formats for pagination
    const feedUrl = pageNum === 1 
        ? `https://www.legislation.gov.uk/new/ukpga/data.feed`
        : `https://www.legislation.gov.uk/new/ukpga/data.feed?sort=published&page=${pageNum}`;
    
    try {
        console.log(`⏳ Fetching page ${pageNum}...`);
        console.log(`   URL: ${feedUrl}`);
        const response = await fetchUrl(feedUrl);
        
        console.log(`   Status: ${response.status}`);
        
        if (response.status !== 200) {
            console.log(`   ⚠️  Status ${response.status}`);
            return { entries: [], hasMore: false };
        }
        
        const xml = response.text;
        
        if (!xml || xml.length === 0) {
            console.log(`   ⚠️  Empty response`);
            return { entries: [], hasMore: false };
        }
        
        console.log(`   ✓ Received ${xml.length} bytes of XML`);
        
        // Check if there are more pages
        const moreMatch = /<leg:morePages>(\d+)<\/leg:morePages>/.exec(xml);
        const totalPages = moreMatch ? parseInt(moreMatch[1]) : 0;
        const hasMore = totalPages > pageNum;
        
        console.log(`   📄 Pages available: ${totalPages}`);
        
        // Parse XML entries manually (simple regex-based parsing)
        const entries = [];
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        let entryCount = 0;
        
        while ((match = entryRegex.exec(xml)) !== null) {
            entryCount++;
            const entryXml = match[1];
            
            // Skip entries that are just correction slips
            if (entryXml.includes('Correction slip')) continue;
            
            // Extract title
            const titleMatch = /<title>([\s\S]*?)<\/title>/.exec(entryXml);
            const title = titleMatch ? titleMatch[1].trim() : 'Act';
            
            // Extract summary/description
            const summaryMatch = /<summary>([\s\S]*?)<\/summary>/.exec(entryXml);
            const description = summaryMatch ? summaryMatch[1].trim().substring(0, 300) : 'No description available';
            
            // Extract published date
            const publishedMatch = /<published>([\s\S]*?)<\/published>/.exec(entryXml);
            const introducedDate = publishedMatch ? publishedMatch[1].split('T')[0] : new Date().toISOString().split('T')[0];
            
            // Extract year number from title
            const yearMatch = /(\d{4})/.exec(title);
            const actYear = yearMatch ? yearMatch[1] : '';
            
            // Extract chapter number
            const numberMatch = /<ukm:Number Value="(\d+)"/.exec(entryXml);
            const chapter = numberMatch ? numberMatch[1] : '';
            
            // Extract URL from id
            const urlMatch = /<id>http:\/\/www\.legislation\.gov\.uk\/id\/ukpga\/(\d+)\/(\d+)<\/id>/.exec(entryXml);
            const url = urlMatch ? `https://www.legislation.gov.uk/ukpga/${urlMatch[1]}/${urlMatch[2]}` : '';
            
            if (url && title && title !== 'Correction slip') {
                entries.push({
                    id: `${actYear}-${chapter}`,
                    title: title,
                    description: description,
                    stage: 'Enacted',
                    url: url,
                    introducedDate: introducedDate,
                    year: actYear,
                    chapter: chapter
                });
            }
        }
        
        console.log(`   Found ${entryCount} entry tags, extracted ${entries.length} Acts`);
        console.log(`   Has more pages: ${hasMore}`);
        
        if (entries.length > 0) {
            console.log(`   ✅ Found ${entries.length} Acts`);
            if (entries[0]) {
                console.log(`   Sample: ${entries[0].title}`);
            }
        }
        
        return { entries, hasMore };
        
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return { entries: [], hasMore: false };
    }
}

/**
 * Main import function
 */
async function importAllActs() {
    const allActs = [];
    let currentPage = 1;
    let hasMorePages = true;
    let maxPages = 12;  // Safety limit - stop after this many pages
    
    console.log(`🔄 Starting import from legislation.gov.uk...\n`);
    
    // Fetch Acts page by page until no more pages or max reached
    while (hasMorePages && currentPage <= maxPages) {
        const result = await fetchActsFromPage(currentPage);
        allActs.push(...result.entries);
        hasMorePages = result.hasMore;
        
        console.log(`   Running total: ${allActs.length} Acts\n`);
        
        if (!hasMorePages) {
            console.log(`   Reached last page`);
            break;
        }
        
        currentPage++;
        
        // Rate limiting - be nice to the server
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✨ IMPORT COMPLETE\n`);
    console.log(`📊 Summary:`);
    console.log(`   Total Acts Fetched: ${allActs.length}`);
    console.log(`   Pages Processed: ${currentPage}`);
    
    // Prepare output file
    const output = {
        timestamp: new Date().toISOString(),
        totalActs: allActs.length,
        pagesProcessed: currentPage,
        acts: allActs,
        importInstructions: `
1. Copy the entire 'acts' array from this file
2. Open governance.html in your browser
3. Open Developer Console (F12)
4. Run: window.importAllLegislationBills(allActsData, 'preview')
5. Review the preview, then run: window.importAllLegislationBills(allActsData, 'execute')
6. Wait for import to complete
7. Refresh the page and expand "All Legislation" to see all Acts
        `
    };
    
    // Save to file
    const filename = 'allActsData.json';
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));
    
    console.log(`\n📁 Data saved to: ${filename}`);
    console.log(`\n🚀 NEXT STEPS:\n`);
    console.log(`1. Open allActsData.json`);
    console.log(`2. Copy the "acts" array`);
    console.log(`3. In browser console (F12) on governance.html, run:`);
    console.log(`   window.importAllLegislationBills(YOUR_ACTS_ARRAY, 'preview')`);
    console.log(`4. Then execute with 'execute' mode`);
    console.log(`\n✅ Done!\n`);
}

// Run the import
importAllActs().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
