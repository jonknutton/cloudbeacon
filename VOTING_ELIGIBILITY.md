# Voting Eligibility System Documentation

## Overview

The voting eligibility system ensures that users can only vote on legislation relevant to their geographic jurisdiction. This prevents bot accounts and users from invalid regions from voting on legislation they shouldn't have access to.

## User Account Schema

When a user completes their account details, the following fields are stored in Firestore under `users/{uid}`:

```javascript
{
    // Required fields
    fullName: "John Doe",
    country: "GB", // ISO 3166-1 alpha-2 country code
    email: "user@example.com",
    
    // Optional fields
    address: "123 Main St, London, UK",
    phone: "+44 20 7946 0958",
    
    // Metadata
    accountDetailsUpdated: Timestamp,
    accountDetailsVerified: false, // Can be set to true after manual/email verification
    
    // Other fields (from other parts of the system)
    twoFactorEnabled: boolean,
    // ... etc
}
```

## Country Codes

Supported country codes in the system:

| Code | Country/Region |
|------|---|
| GB | United Kingdom |
| IE | Ireland |
| US | United States |
| CA | Canada |
| AU | Australia |
| NZ | New Zealand |
| EU | European Union (all EU member states) |
| OTHER | Other countries (limited to international legislation) |

## Jurisdiction Mapping

The `VotingEligibility.jurisdictionMap` defines which legislations each country code can vote on:

```javascript
{
    'GB': ['GB', 'UK'], // UK legislation
    'IE': ['IE', 'IRELAND'], // Irish legislation
    'US': ['US'], // US legislation
    'CA': ['CA', 'CANADA'], // Canadian legislation
    'AU': ['AU', 'AUSTRALIA'], // Australian legislation
    'NZ': ['NZ', 'NEW_ZEALAND'], // NZ legislation
    'EU': ['EU', 'EUROPEAN', ...], // EU and all EU member countries
    'OTHER': ['INTERNATIONAL', 'GLOBAL'] // International/global only
}
```

## Legislation/Project Schema

Projects that represent legislation should include country metadata:

```javascript
{
    // Required voting-related fields
    countries: ["GB", "UK"], // or 'country', 'territories', 'territory'
    
    // Standard fields
    title: "Proposed UK Climate Change Act 2025",
    description: "Description of the legislation...",
    stage: "second_reading",
    parliamentUrl: "http://...",
    
    // Other fields
    isLegislation: true,
    publications: [...],
    // ... etc
}
```

**Note:** The system looks for any of these field names (case-insensitive):
- `countries` (array or string)
- `country` (array or string)
- `territories` (array or string)
- `territory` (array or string)

## API Usage

### Check if Current User Can Vote

```javascript
const result = await VotingEligibility.checkCurrentUserVoting(['GB', 'UK']);

if (result.canVote) {
    // Show vote button
    console.log(`User eligible: ${result.reason}`);
} else {
    // Show blocking message
    console.log(result.blockingReason);
}
```

**Response format:**
```javascript
{
    canVote: boolean,
    reason: string,
    blockingReason?: string, // Only present if canVote is false
    userCountry?: string,
    eligibleJurisdictions?: string[]
}
```

### Check if Specific User Can Vote

```javascript
const result = await VotingEligibility.canUserVote(userId, ['GB']);

if (result.canVote) {
    // Allow vote
}
```

### Get User's Eligible Jurisdictions

```javascript
const jurisdictions = await VotingEligibility.getUserEligibleJurisdictions(userId);
console.log(jurisdictions); // ['GB', 'UK']
```

### Extract Countries from Legislation

```javascript
const countries = VotingEligibility.extractCountriesFromLegislation(legislationDoc);
// Returns: ['GB', 'UK']
```

### Validate Legislation Metadata

```javascript
const validation = VotingEligibility.validateLegislationMetadata(legislationDoc);

if (!validation.valid) {
    console.error('Missing required fields:', validation.errors);
    // 'Missing country/territory information'
    // 'Missing title'
    // 'Missing description'
}
```

## Integration Points

### 1. In Voting UI Components

When displaying a vote button for legislation:

```javascript
// Before rendering the vote button
const eligibility = await VotingEligibility.checkCurrentUserVoting(
    VotingEligibility.extractCountriesFromLegislation(legislation)
);

if (eligibility.canVote) {
    // Show: <button onclick="castVote()">Vote</button>
} else {
    // Show: <span class="disabled">${eligibility.blockingReason}</span>
}
```

### 2. In Vote Submission Handler

```javascript
async function castVote(legislationId, voteType) {
    const legislation = await getDocFromFirestore(legislationId);
    
    // Check eligibility before submitting
    const eligibility = await VotingEligibility.checkCurrentUserVoting(
        VotingEligibility.extractCountriesFromLegislation(legislation)
    );
    
    if (!eligibility.canVote) {
        alert(eligibility.blockingReason);
        return;
    }
    
    // Submit vote to Firestore
    await submitVoteToFirestore(legislationId, voteType);
}
```

### 3. In Legislation Creation/Admin

When creating a new legislation project, ensure it has proper country metadata:

```javascript
// Validate before saving
const validation = VotingEligibility.validateLegislationMetadata(legislationData);
if (!validation.valid) {
    console.error('Cannot save legislation:', validation.errors);
    return;
}

// Save to Firestore
await setDoc(doc(db, 'feed', legislationId), legislationData);
```

## Security Considerations

### Frontend Validation
The voting eligibility checks happen in the browser for **UX purposes**. Users should always see clear messaging about why they can't vote.

### Backend Validation (MUST IMPLEMENT)
**Critical:** You MUST implement server-side validation in Cloud Functions before accepting any votes. Frontend checks can be bypassed.

**Required Cloud Function:**
```javascript
exports.castVote = functions.https.onCall(async (data, context) => {
    const { legislationId, voteType } = data;
    const uid = context.auth.uid;
    
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    
    // 1. Get user account details
    const userDoc = await db.collection('users').doc(uid).get();
    const user = userDoc.data();
    
    // 2. Validate account completeness
    if (!user.fullName || !user.country) {
        throw new functions.https.HttpsError('failed-precondition', 
            'Account details incomplete');
    }
    
    // 3. Get legislation
    const legDoc = await db.collection('feed').doc(legislationId).get();
    const legislation = legDoc.data();
    
    // 4. Validate jurisdiction (replicate logic from votingEligibility.js)
    const userCountry = user.country;
    const legCountries = extractCountries(legislation);
    const isEligible = isEligibleToVote(userCountry, legCountries);
    
    if (!isEligible) {
        throw new functions.https.HttpsError('failed-precondition',
            `User account (${userCountry}) is ineligible for this legislation`);
    }
    
    // 5. Record vote
    await recordVote(uid, legislationId, voteType);
    
    return { success: true };
});
```

## Account Details Settings

Users can edit their account details in:
- **Settings Modal** → **Account Tab**

Fields available:
- Full Name (required)
- Email (read-only, from Firebase Auth)
- Country (required dropdown)
- Address (optional)
- Phone (optional)

## Default Behavior

If a user hasn't filled in their account details:
- They **cannot vote** on any legislation
- Error message: *"Please complete your account details first"*
- Direct them to: *Settings → Account Tab*

If a user's country doesn't match legislation jurisdiction:
- They **cannot vote** on that legislation
- Example error: *"This legislation is for GB, UK. You can only vote on GB, UK legislation."*

## Future Enhancements

1. **Email Verification** - Verify email before allowing votes
2. **Address Verification** - Verify address matches claimed country
3. **Account Approval** - Manual review before voting rights granted
4. **Rate Limiting** - Limit votes per user per day
5. **IP Geolocation** - Additional check against claimed country vs IP location
6. **Reputation System** - Voting weight based on account age and verification status

## Testing

Test account details in browser console:

```javascript
// Load your user details
const userDetails = await VotingEligibility.getUserAccountDetails('your_uid');
console.log(userDetails);

// Test voting eligibility
const result = await VotingEligibility.checkCurrentUserVoting(['GB']);
console.log(result);

// Get eligible jurisdictions
const juris = await VotingEligibility.getUserEligibleJurisdictions('your_uid');
console.log(juris);
```

## Database Structure

```
firestore/
├── users/
│   └── {uid}/
│       ├── email: string
│       ├── fullName: string
│       ├── country: string (ISO code)
│       ├── address: string
│       ├── phone: string
│       ├── accountDetailsUpdated: timestamp
│       └── accountDetailsVerified: boolean
│
├── feed/
│   └── {legislationId}/
│       ├── title: string
│       ├── description: string
│       ├── countries: [string] (or country/territories/territory)
│       ├── stage: string
│       ├── isLegislation: boolean
│       └── ... other fields
│
└── votes/ (optional, for tracking votes)
    └── {legislationId}/
        └── {uid}: {
            voteType: "for" | "against" | "abstain",
            timestamp: timestamp
        }
```
