#!/usr/bin/env node

/**
 * Assessment Loop Test Script
 * 
 * Usage:
 *   node test-assessment.js -d <document_id> -c <collection> [-u <firebase_url>]
 * 
 * Example:
 *   node test-assessment.js -d "post_abc123" -c "feed"
 * 
 * This script:
 *   1. Fetches a single document from Firestore
 *   2. Sends it to the assessEntry Cloud Function
 *   3. Reports token usage and cost
 *   4. Displays the assessment results
 */

const https = require('https');
const process = require('process');

// Parse command line args
const args = process.argv.slice(2);
let documentId = null;
let collectionName = null;
let functionUrl = 'https://us-central1-cloud-beacon-55a40.cloudfunctions.net/assessEntry';

for (let i = 0; i < args.length; i += 2) {
  if (args[i] === '-d') documentId = args[i + 1];
  if (args[i] === '-c') collectionName = args[i + 1];
  if (args[i] === '-u') functionUrl = args[i + 1];
}

if (!documentId || !collectionName) {
  console.error('Usage: node test-assessment.js -d <document_id> -c <collection>');
  process.exit(1);
}

console.log(`\n📡 ASSESSMENT LOOP TEST`);
console.log(`════════════════════════════════════════`);
console.log(`Document: ${collectionName}/${documentId}`);
console.log(`Function: ${functionUrl}\n`);

// Send request to Cloud Function
const payload = JSON.stringify({
  document_id: documentId,
  collection_name: collectionName
});

const options = {
  hostname: new URL(functionUrl).hostname,
  port: 443,
  path: new URL(functionUrl).pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const startTime = Date.now();

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    const elapsed = Date.now() - startTime;

    try {
      const result = JSON.parse(data);

      if (!result.success) {
        console.error('❌ Assessment failed:');
        console.error(result.error);
        if (result.message) console.error(result.message);
        process.exit(1);
      }

      // Display token usage
      console.log(`✅ Assessment Complete (${elapsed}ms)\n`);
      console.log(`📊 TOKEN USAGE`);
      console.log(`────────────────────────────────────────`);
      console.log(`Input Tokens:   ${result.tokens.input}`);
      console.log(`Output Tokens:  ${result.tokens.output}`);
      console.log(`Total Tokens:   ${result.tokens.total}`);
      console.log(`\n💰 COST ESTIMATE (Claude 3.5 Sonnet)`);
      console.log(`────────────────────────────────────────`);
      console.log(`Input Cost:     $${result.cost_estimate.input_cost_usd.toFixed(6)}`);
      console.log(`Output Cost:    $${result.cost_estimate.output_cost_usd.toFixed(6)}`);
      console.log(`Total Cost:     $${result.cost_estimate.total_cost_usd.toFixed(6)}`);

      // Display assessment
      console.log(`\n📋 ASSESSMENT RESULTS`);
      console.log(`────────────────────────────────────────`);
      const a = result.assessment;
      console.log(`Policy Areas:   ${a.policy_areas.join(', ')}`);
      console.log(`Policy Conf:    ${Math.round(a.policy_confidence * 100)}%`);
      console.log(`Subtype:        ${a.subtype}`);
      console.log(`Subtype Conf:   ${Math.round(a.subtype_confidence * 100)}%`);
      console.log(`Tone:           ${a.tone}`);
      console.log(`Moderation:     ${a.moderation_status}`);
      if (a.moderation_flags && a.moderation_flags.length > 0) {
        console.log(`Flags:          ${a.moderation_flags.join(', ')}`);
      }

      // Scaling calculation
      console.log(`\n📈 SCALING ESTIMATES`);
      console.log(`────────────────────────────────────────`);
      const costPerEntry = result.cost_estimate.total_cost_usd;
      console.log(`Cost per entry:     $${costPerEntry.toFixed(6)}`);
      console.log(`100 entries:        $${(costPerEntry * 100).toFixed(2)}`);
      console.log(`1000 entries:       $${(costPerEntry * 1000).toFixed(2)}`);
      console.log(`10000 entries:      $${(costPerEntry * 10000).toFixed(2)}`);

      const entriesPerDollar = (1 / costPerEntry).toFixed(0);
      console.log(`\nEntries per $1:     ${entriesPerDollar}`);

      // Batching recommendation
      console.log(`\n💡 BATCHING RECOMMENDATION`);
      console.log(`────────────────────────────────────────`);
      const avgBatchSize = 10; // Conservative estimate
      const avgTokensPerBatch = result.tokens.total * avgBatchSize;
      const maxTokens = 200000; // Claude token window safety margin
      const recommendedBatchSize = Math.floor(maxTokens / (avgTokensPerBatch / avgBatchSize));
      console.log(`Recommended batch size: ${recommendedBatchSize} entries`);
      console.log(`Estimated tokens/batch: ${avgTokensPerBatch}`);

    } catch (error) {
      console.error('❌ Error parsing response:');
      console.error(error.message);
      console.error('\nRaw response:');
      console.error(data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:');
  console.error(error);
  process.exit(1);
});

req.write(payload);
req.end();
