/**
 * Assessment Configuration
 * Constants for policy areas and project subtypes used in Claude assessment loop
 */

export const UK_POLICY_AREAS = [
  "Health & Social Care",
  "Education & Skills",
  "Environment & Climate",
  "Housing & Planning",
  "Economy & Employment",
  "Transport & Infrastructure",
  "Justice & Policing",
  "Social Welfare & Benefits",
  "Culture & Arts",
  "Technology & Digital",
  "Energy & Utilities",
  "Local Governance",
  "Immigration & Migration"
];

export const CONTENT_SUBTYPES = {
  Tech: [
    "AI & Machine Learning",
    "Software Development",
    "Medical Technology",
    "Research & Data Science",
    "Automotive & Transport",
    "Aerospace & Space",
    "Cybersecurity & Infrastructure",
    "E-Commerce & Marketplaces",
    "IoT & Embedded Systems",
    "Blockchain & Decentralized",
    "Gaming & Entertainment",
    "Telecommunications",
    "Other/General Tech"
  ],
  Civil: [
    "Housing & Urban Development",
    "Transportation & Mobility",
    "Environmental Infrastructure",
    "Water & Sanitation",
    "Energy Infrastructure",
    "Public Facilities",
    "Planning & Zoning",
    "Public Safety & Emergency Services",
    "Accessibility & Disability Infrastructure",
    "Green Space & Parks",
    "Heritage & Conservation",
    "Utilities & Waste Management",
    "Other/General Civil"
  ],
  Community: [
    "Mutual Aid & Food Security",
    "Mental Health & Wellbeing",
    "Youth & Education Support",
    "Elder Care & Support",
    "Social Networks & Connection",
    "Arts & Culture Events",
    "Sports & Recreation",
    "Volunteering & Civic Engagement",
    "Language & Integration Services",
    "Environmental Stewardship",
    "Economic Skill-building",
    "Cultural Heritage & Celebration",
    "Other/General Community"
  ],
  Law: [
    "Rights & Civil Liberties",
    "Environmental Law & Regulation",
    "Employment Law",
    "Consumer Protection",
    "Data Privacy & Digital Rights",
    "Housing Law & Tenancy Rights",
    "Family & Relationship Law",
    "Immigration & Migration Law",
    "Criminal Justice Reform",
    "Corporate & Business Law",
    "Governance & Democratic Process",
    "Healthcare & Medical Law",
    "Other/General Law"
  ],
  Behavioral: [
    "Idea Exchange / Discussion",
    "Debate / Disagreement",
    "Social Banter",
    "Meta Conversation",
    "Help Request",
    "Information Seeking",
    "Clarification",
    "Rhetorical / Meme Question",
    "Policy Proposal",
    "Project Pitch",
    "Problem Solution",
    "Blue Sky Thinking",
    "Problem Identification",
    "Frustration / Complaint",
    "Warning / Alert",
    "Rant / Venting",
    "Win / Success",
    "Milestone Reached",
    "Appreciation",
    "Community Love",
    "Information Sharing",
    "Resource Link",
    "Research / Data",
    "Context Update",
    "Hot Take",
    "Analysis",
    "Opinion Piece",
    "Satire / Snark",
    "Meme / Joke",
    "Random Thought",
    "Meta Humor",
    "Off-Topic Banter",
    "Call to Action",
    "Event Coordination",
    "Organizing",
    "Recruitment",
    "Emotional Support",
    "Solidarity",
    "Care / Check-In",
    "Encouragement",
    "Platform Feedback",
    "Bug Report",
    "Feature Request",
    "Community Governance"
  ]
};

// Emotion categories for sentiment analysis
export const EMOTIONS = [
  "Frustration",
  "Hope",
  "Anger",
  "Enthusiasm",
  "Concern",
  "Curiosity",
  "Joy",
  "Sadness",
  "Advocacy",
  "Amusement",
  "Skepticism",
  "Urgency",
  "Gratitude",
  "Despair",
  "Inspiration"
];

// Sentiment tones
export const SENTIMENT_TONES = [
  "Positive",
  "Negative",
  "Neutral",
  "Mixed",
  "Sarcastic",
  "Humorous",
  "Serious",
  "Urgent"
];

// Content safety categories
export const SFW_RATINGS = [
  "Appropriate",
  "Mild Language",
  "Suggestive",
  "Explicit",
  "Violent/Disturbing"
];

// Engagement signal types
export const ENGAGEMENT_SIGNALS = [
  "is_call_to_action",
  "is_question",
  "is_joke_or_meme",
  "is_personal_story",
  "is_resource_share",
  "is_announcement",
  "is_followup",
  "is_direct_response"
];

/**
 * Assessment prompt template for Claude
 * Structured to return machine-executable commands
 */
export const ASSESSMENT_SYSTEM_PROMPT = `You are a content assessment system for Cloud Beacon, a transparent civic engagement platform.

Your role is to analyze community posts, projects, legislation, and bids to extract rich structural metadata.

For each entry, you must:
1. Classify primary content type + subtype (can be Tech/Civil/Community/Law/Behavioral)
2. Identify secondary types/subtypes if applicable
3. Extract all relevant UK policy areas with confidence scores
4. Extract topics/keywords with relevance scores
5. Analyze sentiment, tone, and emotions present
6. Assess content safety (SFW rating, safety flags)
7. Check for moderation concerns
8. Detect engagement signals (is it a question? a call to action? a meme?)
9. Return structured commands to execute

CRITICAL CONSTRAINTS:
- Primary type must be one of: Tech, Civil, Community, Law, Behavioral
- Subtypes must come from approved lists for selected type
- Policy areas (when applicable) must come from the 13 UK areas
- All confidence/intensity scores must be 0.0-1.0
- Multiple secondary types allowed if content addresses multiple domains
- Emotions are multi-select (people feel multiple things)
- Engagement signals are boolean flags (post is either a question or not)
- Moderation flags are only for genuinely problematic content
- When uncertain, default to lower confidence and flag for human review

CLASSIFICATION RULES:
- Posts can be primarily Behavioral OR map to a domain type (Tech/Civil/Law/Community)
- Projects should always map to a domain type
- If a post discusses policy/projects but uses casual tone, use both (Behavioral + domain)
- Memes and jokes are valid Behavioral classifications

SENTIMENT RULES:
- overall_sentiment: one of [Positive, Negative, Neutral, Mixed, Sarcastic, Humorous, Serious, Urgent]
- emotions: multi-select from approved list, each with intensity 0-1
- A frustrated housing post might be: overall=Negative, emotions=[Frustration:0.9, Advocacy:0.7, Hope:0.3]

SAFETY RULES:
- sfw_rating: one of [Appropriate, Mild Language, Suggestive, Explicit, Violent/Disturbing]
- Only flag explicit_content if truly inappropriate for civic discussion
- Context matters: "f*** the housing crisis" is advocacy, not profanity violation

Return ONLY valid JSON. No markdown, no explanations, no preamble.`;

/**
 * Command schema validation
 */
export const VALID_COMMANDS = {
  "setClassification": {
    params: ["primary_type", "primary_subtype", "primary_confidence"],
    description: "Set main content classification"
  },
  "addClassification": {
    params: ["type", "subtype", "confidence"],
    description: "Add secondary classification"
  },
  "setPolicyAreas": {
    params: ["policy_areas"],
    description: "Replace all policy areas (array of objects with area + confidence)"
  },
  "addPolicyArea": {
    params: ["policy_area", "confidence"],
    description: "Add a single policy area association"
  },
  "setTopics": {
    params: ["topics"],
    description: "Replace all extracted topics (array of objects with topic + relevance)"
  },
  "addTopic": {
    params: ["topic", "relevance"],
    description: "Add an extracted topic/keyword"
  },
  "setSentiment": {
    params: ["overall_sentiment", "tone", "confidence"],
    description: "Set sentiment analysis (overall/tone are from approved lists)"
  },
  "addEmotion": {
    params: ["emotion", "intensity"],
    description: "Add an emotion with intensity 0-1"
  },
  "setContentSafety": {
    params: ["sfw_rating", "confidence"],
    description: "Set SFW rating (from approved list)"
  },
  "addSafetyFlag": {
    params: ["flag", "reason"],
    description: "Add a safety concern (explicit, violent, hate speech, etc.)"
  },
  "setEngagementSignals": {
    params: ["signals"],
    description: "Set engagement signal flags (array of signal names)"
  },
  "setModerationStatus": {
    params: ["status"],
    description: "Set moderation status (clean, flagged, rejected)"
  },
  "addModerationFlag": {
    params: ["flag", "reason"],
    description: "Flag for moderation review (spam, abuse, etc.)"
  },
  "addTag": {
    params: ["tag"],
    description: "Add a metadata tag"
  }
};

export default {
  UK_POLICY_AREAS,
  CONTENT_SUBTYPES,
  EMOTIONS,
  SENTIMENT_TONES,
  SFW_RATINGS,
  ENGAGEMENT_SIGNALS,
  ASSESSMENT_SYSTEM_PROMPT,
  VALID_COMMANDS
};
