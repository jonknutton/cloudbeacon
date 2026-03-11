# Email Security System Setup Guide

## Overview
The Cloud Beacon login security system now includes:
- **Attempt tracking**: Counts failed login attempts per email (session-based)
- **Security emails**: Sends emails at attempts 5, 21, and 34 (testing thresholds)
- **Unlock tokens**: Email includes a link that unlocks the account for 24 hours
- **Custom token login**: Users can click the email link to auto-login without password

---

## Step 1: Configure Email Credentials

### Option A: Using Gmail (Recommended for testing)

1. Create a Gmail account or use an existing one
2. Enable "Less Secure App Access":
   - Go to https://myaccount.google.com/security
   - Turn on "Less secure app access"
3. Get your app password:
   - Enable 2FA on your Google Account
   - Go to https://myaccount.google.com/apppasswords
   - Generate an app password for Firebase

### Option B: Using SendGrid (Production)
1. Sign up at https://sendgrid.com
2. Get your API key from SendGrid dashboard
3. Create an SMTP password

---

## Step 2: Set Cloud Function Environment Variables

Navigate to your Firebase Console and set these environment variables for your Cloud Functions:

```bash
# Firebase Console → Project Settings → Functions → Runtime environment variables

SMTP_HOST=smtp.gmail.com                    # or your email provider's SMTP host
SMTP_PORT=587                               # Usually 587 for TLS
SMTP_SECURE=false                           # false for TLS, true for SSL
SMTP_USER=your-email@gmail.com              # Your email address
SMTP_PASS=your-16-char-app-password         # Gmail app password OR SendGrid password
SMTP_FROM=security@cloudbeacon.app          # Email "from" address
APP_URL=https://cloudbeacon-e61f6.web.app  # Your app's URL (for unlock links)
```

**OR** set them via Firebase CLI before deploying:

```bash
firebase functions:config:set email.host="smtp.gmail.com" email.port="587" email.secure="false" email.user="your-email@gmail.com" email.pass="your-app-password" email.from="security@cloudbeacon.app" app.url="https://cloudbeacon-e61f6.web.app"
```

---

## Step 3: Deploy Cloud Functions

From the `functions/` directory:

```bash
cd functions
npm install
firebase deploy --only functions
```

This deploys:
- `sendAccountSecurityEmail` - Callable function that sends security emails with unlock links
- `unlockAccount` - HTTP endpoint that verifies unlock tokens and creates login sessions
- `cleanupExpiredTokens` - Scheduled function that cleans up expired tokens daily

---

## Step 4: Update Project ID in unlock-account.html

In `unlock-account.html`, update this line with your actual Firebase project ID:

```javascript
// Line 31 - BEFORE:
const response = await fetch(
    `https://us-central1-your-project-id.cloudfunctions.net/unlockAccount?token=${encodeURIComponent(token)}`
);

// AFTER (replace with your project ID):
const response = await fetch(
    `https://us-central1-cloudbeacon-e61f6.cloudfunctions.net/unlockAccount?token=${encodeURIComponent(token)}`
);
```

Your project ID is shown in Firebase Console → Project Settings at the top.

---

## Step 5: Verify Email Sending (Testing)

1. Open your app and navigate to login page
2. Try logging in with a wrong password 5 times
3. Check the browser console (F12 → Console tab)
4. Look for these logs:
   ```
   [Email] Calling sendAccountSecurityEmail Cloud Function for warning email to test@example.com
   [Email] ✅ warning email queued to test@example.com: {success: true, message: "Email sent to test@example.com"}
   ```
5. Check your email inbox for the security alert

---

## How the Email System Works

### When Email is Sent
- **Attempt 5**: Warning email - "Multiple login attempts detected"
- **Attempt 21**: Rate limit warning - "Aggressive rate limiting activated" (testing threshold)
- **Attempt 34**: Final warning - "CRITICAL - Account Under Attack" (testing threshold)

### Email Contents
Each email includes:
- Description of what happened
- Number of failed attempts
- The "heckle" message they would have seen
- **Unlock link**: `https://yourapp.com/unlock-account?token=XXXXX`

### Unlock Token Process
1. User receives email with unlock link
2. User clicks the link → `unlock-account.html` page loads
3. Page verifies the token is valid and not expired
4. If valid, creates a custom Firebase login token
5. User is automatically logged in and redirected to dashboard
6. Token is marked as "used" to prevent replay attacks
7. Expired tokens are cleaned up after 24 hours

---

## Firestore Collections Used

### `loginUnlockTokens`
Stores temporary unlock tokens:
```javascript
{
    "token_id": {
        email: "user@example.com",
        attemptCount: 5,
        createdAt: Timestamp,
        expiresAt: Timestamp,
        used: false,
        usedAt: Timestamp  // Only set if used: true
    }
}
```

---

## Troubleshooting

### Emails Not Sending
1. Check Cloud Functions logs:
   ```bash
   firebase functions:log
   ```
2. Verify environment variables are set:
   ```bash
   firebase functions:config:get
   ```
3. Check if nodemailer is installed:
   ```bash
   cd functions && npm install nodemailer
   ```

### Unlock Link Not Working
1. Verify `APP_URL` environment variable matches your app domain
2. Check `unlock-account.html` has the correct project ID
3. Check Firestore `loginUnlockTokens` collection exists
4. Check token hasn't expired (24 hour limit)

### Firebase Auth Rate Limiting
- Firebase rate limits after ~50 failed attempts per IP
- The email system helps users recover without brute force
- Rate limit expires automatically after ~24 hours
- Users can click the unlock email link to regain access immediately

---

## Testing Thresholds vs Production

**Current Testing Thresholds** (in `loginHeckles.js`):
```javascript
const loginAttemptConfig = {
    warningEmailAttempt: 5,              // Send warning at 5th attempt
    phase2Threshold: 21,                 // Switch to "desperate" heckles
    rateLimitEmailAttempt: 21,           // Send rate limit email
    finalWarningEmailAttempt: 34,        // Send final warning
};
```

**Production Thresholds** (when ready to deploy):
```javascript
const loginAttemptConfig = {
    warningEmailAttempt: 5,              // Same
    phase2Threshold: 144,                // Switch to "desperate" heckles
    rateLimitEmailAttempt: 144,          // Send rate limit email
    finalWarningEmailAttempt: 233,       // Send final warning
};
```

---

## Security Considerations

1. **Email credentials**: Use environment variables, never hardcode
2. **Unlock tokens**: 
   - 32 character random strings
   - Expire after 24 hours
   - Can only be used once
   - Cleaned up automatically
3. **Rate limiting**: 
   - Firebase handles brute force protection
   - Too many attempts → `auth/too-many-requests`
   - Users get unlock email to recover
4. **Session storage**: 
   - Login attempt counts reset on page refresh
   - Only tracks per-session, not persistent

---

## Testing the Full Flow

1. **New account lockout test**:
   - Create test account
   - Try password 6 times
   - Check inbox for warning email
   - Click unlock link
   - Verify you're logged in

2. **Rate limit email test**:
   - Wrong password 21 times
   - Check inbox for "Rate Limit Warning" email
   - Click unlock link

3. **Final warning test**:
   - Wrong password 34 times
   - Check inbox for "CRITICAL" email
   - Click unlock link

---

## Next Steps

1. [ ] Set up email credentials (Gmail or SendGrid)
2. [ ] Configure Cloud Functions environment variables
3. [ ] Deploy Cloud Functions: `firebase deploy --only functions`
4. [ ] Update project ID in `unlock-account.html`
5. [ ] Test the full unlock flow
6. [ ] Monitor email delivery (check Cloud Functions logs)
7. [ ] Deploy to production when ready
