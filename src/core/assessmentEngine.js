/**
 * Assessment Loop Engine
 * Orchestrates Claude assessment → command validation → Firestore execution
 * Used by Cloud Functions and standalone test scripts
 */

import {
  UK_POLICY_AREAS,
  PROJECT_SUBTYPES,
  ASSESSMENT_SYSTEM_PROMPT,
  VALID_COMMANDS
} from './assessmentConfig.js';

/**
 * Build the assessment prompt for a batch of entries
 */
export function buildAssessmentPrompt(entries, policyAreas, subtypes) {
  const policyList = policyAreas.join(", ");
  const subtypesByCategory = Object.entries(subtypes)
    .map(([cat, subs]) => `${cat}: ${subs.join(", ")}`)
    .join("\n");

  return `Process the following entries and return a JSON array of assessments.

APPROVED POLICY AREAS (use only these):
${policyList}

APPROVED SUBTYPES BY CATEGORY:
${subtypesByCategory}

ENTRIES TO ASSESS:
${JSON.stringify(entries, null, 2)}

For each entry, return:
{
  "entry_id": "...",
  "policy_areas": ["Area1", "Area2"],
  "policy_confidence": 0.85,
  "subtype": "Specific Subtype",
  "subtype_confidence": 0.90,
  "tone": "proposal|concern|question|data|support|other",
  "moderation_status": "clean|flagged|rejected",
  "moderation_flags": ["flag1", "flag2"] or [],
  "moderation_reason": "...",
  "commands": [
    {"action": "setPolicyAreas", "policy_areas": ["Area1", "Area2"]},
    {"action": "setContentSubtype", "subtype": "..."},
    {"action": "setAssessmentConfidence", "confidence": 0.87},
    {"action": "setTone", "tone": "..."},
    {"action": "setModerationStatus", "status": "clean"},
    ...
  ]
}

Confidence scores must be 0.0-1.0. Flag any content with moderation concerns.
Return ONLY the JSON array, no other text.`;
}

/**
 * Validate commands against schema
 */
export function validateCommand(command) {
  const { action, ...params } = command;
  
  if (!VALID_COMMANDS[action]) {
    return {
      valid: false,
      error: `Unknown command: ${action}`
    };
  }

  const schema = VALID_COMMANDS[action];
  for (let required of schema.params) {
    if (!(required in params)) {
      return {
        valid: false,
        error: `Missing required param for ${action}: ${required}`
      };
    }
  }

  return { valid: true };
}

/**
 * Validate policy area
 */
export function validatePolicyArea(area) {
  return UK_POLICY_AREAS.includes(area);
}

/**
 * Validate subtype for category
 */
export function validateSubtype(category, subtype) {
  const subtypes = PROJECT_SUBTYPES[category];
  return subtypes && subtypes.includes(subtype);
}

/**
 * Validate assessment response structure
 */
export function validateAssessment(assessment) {
  const errors = [];

  if (!assessment.entry_id) errors.push("Missing entry_id");
  if (!Array.isArray(assessment.policy_areas)) errors.push("policy_areas must be array");
  if (assessment.policy_areas.some(area => !validatePolicyArea(area))) {
    errors.push("Invalid policy area in assessment");
  }

  if (typeof assessment.policy_confidence !== 'number' || assessment.policy_confidence < 0 || assessment.policy_confidence > 1) {
    errors.push("policy_confidence must be 0-1");
  }

  if (!assessment.subtype) errors.push("Missing subtype");
  if (typeof assessment.subtype_confidence !== 'number' || assessment.subtype_confidence < 0 || assessment.subtype_confidence > 1) {
    errors.push("subtype_confidence must be 0-1");
  }

  if (!['proposal', 'concern', 'question', 'data', 'support', 'other'].includes(assessment.tone)) {
    errors.push("Invalid tone");
  }

  if (!['clean', 'flagged', 'rejected'].includes(assessment.moderation_status)) {
    errors.push("Invalid moderation_status");
  }

  if (!Array.isArray(assessment.commands)) {
    errors.push("commands must be array");
  } else {
    const commandErrors = [];
    for (let cmd of assessment.commands) {
      const validation = validateCommand(cmd);
      if (!validation.valid) {
        commandErrors.push(validation.error);
      }
    }
    if (commandErrors.length > 0) {
      errors.push(`Invalid commands: ${commandErrors.join("; ")}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Execute commands against Firestore document
 * Returns audit trail of actions
 */
export async function executeCommands(db, entryType, entryId, commands) {
  const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
  
  const audit = [];
  const updates = {
    metadata: {},
    _assessedAt: serverTimestamp(),
    _assessedBy: "claude-assessment-loop"
  };

  for (let cmd of commands) {
    try {
      const { action, ...params } = cmd;

      switch (action) {
        case 'setPolicyAreas':
          updates.metadata.policyAreas = params.policy_areas;
          audit.push({ action, status: 'executed', value: params.policy_areas });
          break;

        case 'addPolicyArea':
          updates.metadata.policyAreas = updates.metadata.policyAreas || [];
          if (!updates.metadata.policyAreas.includes(params.policy_area)) {
            updates.metadata.policyAreas.push(params.policy_area);
          }
          audit.push({ action, status: 'executed', value: params.policy_area });
          break;

        case 'setContentSubtype':
          updates.metadata.subtype = params.subtype;
          audit.push({ action, status: 'executed', value: params.subtype });
          break;

        case 'setAssessmentConfidence':
          updates.metadata.assessmentConfidence = params.confidence;
          audit.push({ action, status: 'executed', value: params.confidence });
          break;

        case 'addModerationFlag':
          updates.metadata.moderationFlags = updates.metadata.moderationFlags || [];
          updates.metadata.moderationFlags.push({
            flag: params.flag,
            reason: params.reason,
            timestamp: new Date().toISOString()
          });
          audit.push({ action, status: 'executed', value: params.flag });
          break;

        case 'setModerationStatus':
          updates.metadata.moderationStatus = params.status;
          audit.push({ action, status: 'executed', value: params.status });
          break;

        case 'addTag':
          updates.metadata.tags = updates.metadata.tags || [];
          if (!updates.metadata.tags.includes(params.tag)) {
            updates.metadata.tags.push(params.tag);
          }
          audit.push({ action, status: 'executed', value: params.tag });
          break;

        case 'addKeyword':
          updates.metadata.keywords = updates.metadata.keywords || [];
          if (!updates.metadata.keywords.includes(params.keyword)) {
            updates.metadata.keywords.push(params.keyword);
          }
          audit.push({ action, status: 'executed', value: params.keyword });
          break;

        case 'setTone':
          updates.metadata.tone = params.tone;
          audit.push({ action, status: 'executed', value: params.tone });
          break;

        default:
          audit.push({ action, status: 'skipped', reason: 'unknown action' });
      }
    } catch (error) {
      audit.push({ action: cmd.action, status: 'failed', error: error.message });
    }
  }

  // Apply updates to Firestore
  const docRef = doc(db, entryType, entryId);
  await updateDoc(docRef, updates);

  return {
    entryId,
    commandsExecuted: commands.length,
    audit,
    timestamp: new Date().toISOString()
  };
}

/**
 * Prepare entries for assessment
 * Extract relevant fields, deduplicate sensitive data
 */
export function prepareEntries(firestoreDocuments) {
  return firestoreDocuments.map(doc => ({
    id: doc.id,
    type: doc.type || (doc.description ? 'post' : 'project'),
    text: doc.description || doc.title || '',
    title: doc.title || '',
    category: doc.category || 'Unknown',
    author_id: doc.authorId || 'anonymous',
    created_at: doc.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    // Strip sensitive fields
    firestore_id: undefined,
    authorEmail: undefined,
    authorPhone: undefined
  }));
}

export default {
  buildAssessmentPrompt,
  validateCommand,
  validatePolicyArea,
  validateSubtype,
  validateAssessment,
  executeCommands,
  prepareEntries
};
