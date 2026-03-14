# Claude Assessment Loop - Cost Estimation Guide

## What We Built

A comprehensive assessment system for Cloud Beacon that analyzes all content (posts/projects/legislation/bids) through Claude to extract rich structural metadata:

1. **Assessment Engine** (`src/core/assessmentEngine.js`) - Validates commands, executes on Firestore
2. **Assessment Config** (`src/core/assessmentConfig.js`) - 13 UK policy areas + 5 content types + 13+ subtypes each + emotions + sentiment tones
3. **Cloud Function** (`functions/assessEntry`) - HTTP endpoint that sends entries to Claude API
4. **Test Script** (`test-assessment.js`) - Command-line tool to measure token usage and cost

## Architecture

```
Your Post/Project/Legislation
       ↓
test-assessment.js (or batch runner)
       ↓
functions/assessEntry (Cloud Function)
       ↓
Claude API (3.5 Sonnet)
       ↓
Comprehensive Assessment JSON
{
  "classification": {...},       # type + subtype(s)
  "policy_areas": [...],         # multi-label 
  "topics": [...],               # extracted keywords
  "sentiment": {...},            # overall tone + emotions
  "content_safety": {...},       # SFW rating + flags
  "engagement_signals": {...},   # is_question, is_call_to_action?
  "moderation": {...},           # flags + reasoning
  "commands": [...]              # Firestore write operations
}
       ↓
Command Executor (schema validation)
       ↓
Firestore Update
{
  metadata.classification: {...},
  metadata.policyAreas: [...],
  metadata.topics: [...],
  metadata.sentiment: {...},
  metadata.contentSafety: {...},
  metadata.engagementSignals: [...],
  metadata.moderationStatus: "...",
  _assessedAt: timestamp,
  _assessedBy: "claude-assessment-loop"
}
```

## Key Design: Fluid Classification

**Posts are not forced into categories.** Instead:
- A post can be primarily **Behavioral** (meme, discussion, banter)
- BUT if it discusses policy/projects, it ALSO gets tagged with **Tech/Civil/Community/Law**
- Multiple tags allowed - "housing discussion with dark humor" = Community (primary) + Behavioral (secondary) + Policy Areas ["Housing & Planning"]

**Example Post Analysis:**
```
Text: "f*** landlords are making bank while renters starve. we NEED rent control NOW"

Assessment:
{
  "classification": {
    "primary_type": "Behavioral",
    "primary_subtype": "Frustration / Complaint",
    "primary_confidence": 0.92,
    "additional_types": [
      {"type": "Law", "subtype": "Housing Law & Tenancy Rights", "confidence": 0.85}
    ]
  },
  "policy_areas": [
    {"area": "Housing & Planning", "confidence": 0.95},
    {"area": "Economy & Employment", "confidence": 0.68}
  ],
  "topics": [
    {"topic": "rent control", "relevance": 0.98},
    {"topic": "landlord reform", "relevance": 0.92},
    {"topic": "housing affordability", "relevance": 0.88}
  ],
  "sentiment": {
    "overall": "Negative",
    "tone_confidence": 0.94,
    "emotions": [
      {"emotion": "Frustration", "intensity": 0.95},
      {"emotion": "Anger", "intensity": 0.82},
      {"emotion": "Advocacy", "intensity": 0.75}
    ]
  },
  "content_safety": {
    "sfw_rating": "Mild Language",
    "explicit_content": false,
    "safety_flags": [],
    "confidence": 0.98
  },
  "engagement_signals": {
    "is_call_to_action": true,
    "is_question": false,
    "is_joke_or_meme": false,
    "is_personal_story": false,
    "is_resource_share": false,
    "is_announcement": false
  },
  "moderation": {
    "status": "clean",
    "flags": [],
    "reasoning": "Strong advocacy. Language is passionate but contextually appropriate.",
    "confidence": 0.95
  }
}
```

## Content Types

### Tech (13 subtypes)
- AI & Machine Learning
- Software Development
- Medical Technology
- Research & Data Science
- Automotive & Transport
- Aerospace & Space
- Cybersecurity & Infrastructure
- E-Commerce & Marketplaces
- IoT & Embedded Systems
- Blockchain & Decentralized
- Gaming & Entertainment
- Telecommunications
- Other/General Tech

### Civil (13 subtypes)
- Housing & Urban Development
- Transportation & Mobility
- Environmental Infrastructure
- Water & Sanitation
- Energy Infrastructure
- Public Facilities
- Planning & Zoning
- Public Safety & Emergency Services
- Accessibility & Disability Infrastructure
- Green Space & Parks
- Heritage & Conservation
- Utilities & Waste Management
- Other/General Civil

### Community (13 subtypes)
- Mutual Aid & Food Security
- Mental Health & Wellbeing
- Youth & Education Support
- Elder Care & Support
- Social Networks & Connection
- Arts & Culture Events
- Sports & Recreation
- Volunteering & Civic Engagement
- Language & Integration Services
- Environmental Stewardship
- Economic Skill-building
- Cultural Heritage & Celebration
- Other/General Community

### Law (13 subtypes)
- Rights & Civil Liberties
- Environmental Law & Regulation
- Employment Law
- Consumer Protection
- Data Privacy & Digital Rights
- Housing Law & Tenancy Rights
- Family & Relationship Law
- Immigration & Migration Law
- Criminal Justice Reform
- Corporate & Business Law
- Governance & Democratic Process
- Healthcare & Medical Law
- Other/General Law

### Behavioral (43 subtypes)
Covers how people actually engage:

**Discussion & Exchange:**
- Idea Exchange / Discussion
- Debate / Disagreement
- Social Banter
- Meta Conversation

**Questions:**
- Help Request
- Information Seeking
- Clarification
- Rhetorical / Meme Question

**Ideation:**
- Policy Proposal
- Project Pitch
- Problem Solution
- Blue Sky Thinking

**Concerns:**
- Problem Identification
- Frustration / Complaint
- Warning / Alert
- Rant / Venting

**Positive:**
- Win / Success
- Milestone Reached
- Appreciation
- Community Love

**Information:**
- Information Sharing
- Resource Link
- Research / Data
- Context Update

**Commentary:**
- Hot Take
- Analysis
- Opinion Piece
- Satire / Snark

**Playfulness:**
- Meme / Joke
- Random Thought
- Meta Humor
- Off-Topic Banter

**Mobilization:**
- Call to Action
- Event Coordination
- Organizing
- Recruitment

**Support:**
- Emotional Support
- Solidarity
- Care / Check-In
- Encouragement

**Platform:**
- Platform Feedback
- Bug Report
- Feature Request
- Community Governance

## UK Policy Areas (13, hardcoded)

```
1. Health & Social Care
2. Education & Skills
3. Environment & Climate
4. Housing & Planning
5. Economy & Employment
6. Transport & Infrastructure
7. Justice & Policing
8. Social Welfare & Benefits
9. Culture & Arts
10. Technology & Digital
11. Energy & Utilities
12. Local Governance
13. Immigration & Migration
```

## Emotions (15 options, multi-select with intensity 0-1)

Frustration, Hope, Anger, Enthusiasm, Concern, Curiosity, Joy, Sadness, Advocacy, Amusement, Skepticism, Urgency, Gratitude, Despair, Inspiration

## Sentiment Tones (pick one)

Positive, Negative, Neutral, Mixed, Sarcastic, Humorous, Serious, Urgent

## Content Safety Ratings

- **Appropriate** - No concerns
- **Mild Language** - Casual swearing, context-appropriate
- **Suggestive** - Implied sexual/romantic content
- **Explicit** - Direct sexual/violent descriptions  
- **Violent/Disturbing** - Graphic violence or harm content

## Engagement Signals (boolean flags)

- `is_call_to_action` - Asks people to do something
- `is_question` - Seeks information/opinion
- `is_joke_or_meme` - Humorous/playful
- `is_personal_story` - Narrative/anecdotal
- `is_resource_share` - Links/data/tools
- `is_announcement` - News/update

## Cost Discovery Phase

### Step 1: Set Up Environment

```bash
# In functions/ directory, add to .env or Firebase config:
ANTHROPIC_API_KEY=sk-ant-...
```

### Step 2: Deploy Cloud Function

```bash
firebase deploy --only functions:assessEntry
```

### Step 3: Run Single Entry Test

```bash
node test-assessment.js -d "post_abc123" -c "feed"
```

Expected output shows tokens and cost estimates.

## Assessment Response Schema

Full JSON structure returned by Claude (see above example for real post analysis).

## Next Phases (After Cost Benchmarking)

### Phase 1: Batch Runner (~100 posts)
Create script that:
- Queries all feed items
- Batches into groups (size TBD by token testing)
- Sends batches to Claude
- Executes commands
- Logs audit trail

Estimated cost: Based on scaling calculations from Phase 0

### Phase 2: Full Dataset Assessment (posts + projects + legislation)
- Same batch approach
- Prioritize by recency/category
- Track accuracy metrics

### Phase 3: Scheduled Execution
- Set up Cloud Task for daily/weekly runs
- New entries get assessed automatically
- Stale metadata can be refreshed

### Phase 4: Live Metadata Display
- Signals page displays policy areas + subtypes
- Word frequency heatmap by policy area
- Subtype distribution visualization
- Coalition detection by policy alignment (not just topic overlap)

## Debugging

Check Cloud Function logs:
```bash
firebase functions:log --follow
```

Monitor firestore reads/writes:
```bash
# In Firebase Console → Firestore → Usage
```

## Cost Assumptions

- Claude 3.5 Sonnet pricing: $3/1M input tokens, $15/1M output tokens
- Typical post: ~200-500 input tokens
- Typical assessment: ~300-500 output tokens
- **Estimated cost per entry: $0.01-0.02**

Optimize with:
- Smaller batches = lower error impact
- Reuse assessments (cache by hash)
- Batch similar content types together
- Filter obvious non-policy posts before assessment

---

**Next**: Run Phase 0 with a few sample posts, measure actual costs, then decide batching strategy.
