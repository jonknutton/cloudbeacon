const functions = require("firebase-functions");
const https = require("https");
const nodemailer = require("nodemailer");
const admin = require("firebase-admin");

// Load environment variables from .env file
require('dotenv').config();

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Configure email service
// Uses environment variables (set via Firebase Console or using firebase deploy with .env file)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true" || false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Generate a secure random token
function generateUnlockToken() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Cloud Function: Agree to Truce
// Called when user clicks the agree link in the truce email
// Writes to Firestore so the login page can detect agreement
exports.agreeTruce = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }

    if (req.method !== "GET") {
        res.status(400).json({ error: "GET method required" });
        return;
    }

    try {
        const email = req.query.email;
        
        if (!email) {
            res.status(400).json({ error: 'email query parameter required' });
            return;
        }
        
        console.log(`[Truce] Recording agreement for: ${email}`);
        
        // Write to Firestore to signal the login page
        await db.collection('truceAgreements').doc(email).set({
            agreed: true,
            agreedAt: admin.firestore.FieldValue.serverTimestamp(),
            email: email
        });
        
        console.log(`[Truce] Successfully recorded agreement for ${email}`);
        
        // Return a simple confirmation page
        res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Truce Accepted • Cloud Beacon</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            margin: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            max-width: 600px;
        }
        h1 { color: #333; margin-top: 0; }
        p { color: #666; line-height: 1.6; }
        .message { font-size: 18px; margin: 20px 0; }
        .code { font-family: monospace; color: #667eea; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🕊️ Truce Accepted</h1>
        <p class="message">Your agreement has been recorded.</p>
        <p>Your original login page will automatically restore itself. You can close this window.</p>
        <p style="font-size: 12px; color: #999;">Email: <span class="code">${email}</span></p>
    </div>
</body>
</html>
        `);
    } catch (error) {
        console.error('[Truce] Error recording agreement:', error);
        res.status(500).json({ error: error.message });
    }
});

// Cloud Function: Email service
exports.sendSecurityEmail = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }

    if (req.method !== "POST") {
        res.status(400).json({ error: "POST method required" });
        return;
    }

    try {
        const { email, subject, body, attemptCount } = req.body;
        
        if (!email || !subject || !body) {
            res.status(400).json({ error: 'email, subject, and body are required' });
            return;
        }
        
        console.log(`[Email] Sending ${subject.substring(0, 30)}... to ${email}`);
        
        // Generate unlock token
        const unlockToken = generateUnlockToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Store unlock token in Firestore
        await db.collection('loginUnlockTokens').doc(unlockToken).set({
            email: email,
            attemptCount: attemptCount,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: expiresAt,
            used: false
        });
        
        // Create unlock link
        const unlockLink = `${process.env.APP_URL || "http://localhost:5500"}/unlock-account?token=${unlockToken}`;
        
        // Add unlock link to email body
        const fullBody = body + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔓 Unlock Your Account

If you need to access your account immediately, click below:
${unlockLink}

This link expires in 24 hours.
`;
        
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || "security@cloudbeacon.app",
            to: email,
            subject: subject,
            text: fullBody,
            html: fullBody.replace(/\n/g, '<br>')
        };
        
        // Log mail options (without password)
        console.log('[Email] Mail options:', {
            from: mailOptions.from,
            to: mailOptions.to,
            subject: mailOptions.subject,
            hasText: !!mailOptions.text,
            hasHtml: !!mailOptions.html
        });
        
        // Send email
        console.log('[Email] Attempting to send via Nodemailer transporter...');
        const sendResult = await transporter.sendMail(mailOptions);
        console.log(`[Email] ✅ Email sent successfully to ${email}:`, sendResult);
        
        res.json({ 
            success: true, 
            message: `Email sent to ${email}`,
            token: unlockToken,
            sendResult: sendResult
        });
    } catch (error) {
        console.error('[Email] ❌ Error sending email:', error.message);
        console.error('[Email] Error details:', error);
        res.status(500).json({ 
            error: 'Failed to send email: ' + error.message,
            details: error.toString()
        });
    }
});

// Cloud Function: Send email verification (for new account signups)
// HTTP endpoint for sending verification emails
exports.sendEmailVerification = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }

    if (req.method !== "POST") {
        res.status(400).json({ error: "POST method required" });
        return;
    }

    try {
        const { email, username } = req.body;
        
        if (!email) {
            res.status(400).json({ error: 'email is required' });
            return;
        }
        
        console.log(`[Verification] Sending verification email to ${email}`);
        
        // Generate verification token
        const verificationToken = generateUnlockToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        
        // Store verification token in Firestore
        await db.collection('emailVerificationTokens').doc(verificationToken).set({
            email: email,
            username: username || email.split('@')[0],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: expiresAt,
            used: false
        });
        
        // Create verification link
        const verificationLink = `${process.env.APP_URL || "http://localhost:5500"}/index.html?token=${verificationToken}`;
        
        const subject = '📧 Verify Your Cloud Beacon Account';
        const body = `
Hello ${username || 'there'}!

Welcome to Cloud Beacon! 🎉

To complete your account setup and unlock all features, please verify your email address by clicking the link below:

${verificationLink}

This link expires in 24 hours.

If you did not create this account, please ignore this email.

Best regards,
Cloud Beacon Team
        `;
        
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || "security@cloudbeacon.app",
            to: email,
            subject: subject,
            text: body,
            html: body.replace(/\n/g, '<br>')
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        console.log(`[Verification] ✅ Email sent to ${email}`);
        
        res.json({ 
            success: true, 
            message: `Verification email sent to ${email}`,
            token: verificationToken
        });
    } catch (error) {
        console.error('[Verification] Error sending email:', error);
        res.status(500).json({ 
            error: 'Failed to send verification email: ' + error.message 
        });
    }
});

// Cloud Function: Verify email token (handles email verification links)
exports.verifyEmail = functions.https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    
    const token = req.query.token;
    
    if (!token) {
        res.status(400).json({ error: "Token is required" });
        return;
    }
    
    try {
        // Verify token exists and hasn't expired
        const doc = await db.collection('emailVerificationTokens').doc(token).get();
        
        if (!doc.exists) {
            res.status(404).json({ error: "Token not found or expired" });
            return;
        }
        
        const tokenData = doc.data();
        
        // Check if expired
        if (new Date() > tokenData.expiresAt.toDate()) {
            res.status(403).json({ error: "Token has expired" });
            return;
        }
        
        // Check if already used
        if (tokenData.used) {
            res.status(403).json({ error: "Token has already been used" });
            return;
        }
        
        // Mark token as used
        await db.collection('emailVerificationTokens').doc(token).update({
            used: true,
            usedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Update user's email verification status in Firestore
        const usersSnapshot = await db.collection('users').where('email', '==', tokenData.email).get();
        if (!usersSnapshot.empty) {
            usersSnapshot.docs[0].ref.update({
                emailVerified: true,
                emailVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Email verified! You can now use all of Cloud Beacon.',
            email: tokenData.email
        });
    } catch (error) {
        console.error('[Verification] Error:', error);
        res.status(500).json({ error: "Failed to verify email: " + error.message });
    }
});
// Cloud Function: Handle emailed login attempts (triggered by mail collection)
// Allow unauthenticated access since it's called during login (before auth)
exports.sendAccountSecurityEmail = functions.https.onCall(
    { enforceAppCheck: false },
    (data, context) => {
    // Note: when called via HTTP POST, 'data' contains the request body automatically unwrapped
    const { email, subject, body, attemptCount } = data;
    
    if (!email || !subject || !body) {
        throw new functions.https.HttpsError('invalid-argument', 'email, subject, and body are required');
    }
    
    // Generate unlock token
    const unlockToken = generateUnlockToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Store unlock token in Firestore
    return db.collection('loginUnlockTokens').doc(unlockToken).set({
        email: email,
        attemptCount: attemptCount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt,
        used: false
    }).then(() => {
        // Create unlock link
        const unlockLink = `${process.env.APP_URL || "http://localhost:3000"}/unlock-account?token=${unlockToken}`;
        
        // Add unlock link to email body
        const fullBody = body + `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔓 Unlock Your Account

If you need to access your account immediately, click below:
${unlockLink}

This link expires in 24 hours.
`;
        
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || "security@cloudbeacon.app",
            to: email,
            subject: subject,
            text: fullBody,
            html: fullBody.replace(/\n/g, '<br>')
        };
        
        // Send email
        return transporter.sendMail(mailOptions);
    }).then((response) => {
        console.log(`[Email] Sent to ${email}: ${subject}`);
        return { success: true, message: `Email sent to ${email}` };
    }).catch((error) => {
        console.error('[Email] Error sending email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send email: ' + error.message);
    });
});

// HTTP Function: Verify unlock token and create session
exports.unlockAccount = functions.https.onRequest((req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    
    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }
    
    const token = req.query.token;
    
    if (!token) {
        res.status(400).send({ error: "Token is required" });
        return;
    }
    
    // Verify token exists and hasn't expired
    db.collection('loginUnlockTokens').doc(token).get().then((doc) => {
        if (!doc.exists) {
            res.status(404).send({ error: "Token not found or expired" });
            return;
        }
        
        const tokenData = doc.data();
        
        // Check if expired
        if (new Date() > tokenData.expiresAt.toDate()) {
            res.status(403).send({ error: "Token has expired" });
            return;
        }
        
        // Check if already used
        if (tokenData.used) {
            res.status(403).send({ error: "Token has already been used" });
            return;
        }
        
        // Mark token as used
        db.collection('loginUnlockTokens').doc(token).update({
            used: true,
            usedAt: admin.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            // Create a custom login token for the user
            return admin.auth().getUserByEmail(tokenData.email);
        }).then((userRecord) => {
            return admin.auth().createCustomToken(userRecord.uid);
        }).then((customToken) => {
            // Clear the sessionStorage login attempt counter for this email
            res.status(200).send({
                success: true,
                message: "Account unlocked! You can now log in.",
                email: tokenData.email,
                customToken: customToken
            });
        }).catch((error) => {
            console.error('[Unlock] Error:', error);
            res.status(500).send({ error: "Failed to unlock account: " + error.message });
        });
    }).catch((error) => {
        console.error('[Unlock] DB Error:', error);
        res.status(500).send({ error: "Server error" });
    });
});

// Cloud Function: Clean up expired unlock tokens (run daily)
// NOTE: Scheduled functions require the "schedule" import from firebase-functions
// For now, this is commented out. To use, run: firebase functions:config:set schedules.enabled=true
// exports.cleanupExpiredTokens = functions.pubsub.schedule('every 24 hours').onRun((context) => {
//     const now = admin.firestore.Timestamp.now();
//     return db.collection('loginUnlockTokens')
//         .where('expiresAt', '<', now)
//         .get()
//         .then((snapshot) => {
//             const batch = db.batch();
//             snapshot.docs.forEach((doc) => {
//                 batch.delete(doc.ref);
//             });
//             return batch.commit();
//         })
//         .then(() => {
//             console.log('[Cleanup] Expired unlock tokens removed');
//         })
//         .catch((error) => {
//             console.error('[Cleanup] Error:', error);
//         });
// });

exports.parliamentProxy = functions.https.onRequest((req, res) => {
    // Allow requests from any origin (CORS)
    res.set("Access-Control-Allow-Origin", "*");

    const url = "https://bills-api.parliament.uk/Rss/AllBills";

    https.get(url, (response) => {
        let data = "";
        response.on("data", (chunk) => { data += chunk; });
        response.on("end", () => {
            res.set("Content-Type", "application/xml");
            res.send(data);
        });
    }).on("error", (err) => {
        res.status(500).send("Proxy error: " + err.message);
    });
});

// Callable function to fetch bill details from Parliament API
exports.getBillDetails = functions.https.onCall((data, context) => {
    const billId = data.billId;
    
    if (!billId) {
        throw new functions.https.HttpsError('invalid-argument', 'billId is required');
    }
    
    return new Promise((resolve, reject) => {
        const url = `https://bills-api.parliament.uk/api/v1/Bills/${billId}`;
        
        https.get(url, (response) => {
            let body = '';
            
            response.on('data', (chunk) => {
                body += chunk;
            });
            
            response.on('end', () => {
                try {
                    if (response.statusCode === 200) {
                        const billData = JSON.parse(body);
                        resolve(billData);
                    } else {
                        reject(new Error(`API returned ${response.statusCode}`));
                    }
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', (err) => {
            reject(new Error(`Network error: ${err.message}`));
        });
    });
});

// Cloud Function: Send Notification Emails
exports.sendNotificationEmail = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }

    if (req.method !== "POST") {
        res.status(400).json({ error: "POST method required" });
        return;
    }

    try {
        const { recipientEmail, recipientName, senderName, emailType, data } = req.body;
        
        if (!recipientEmail || !emailType) {
            res.status(400).json({ error: 'recipientEmail and emailType are required' });
            return;
        }
        
        console.log(`[Notification Email] Sending ${emailType} email to ${recipientEmail}`);
        
        let subject = '';
        let htmlBody = '';
        
        if (emailType === 'follower') {
            subject = `${senderName} started following you on Cloud Beacon`;
            htmlBody = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>👥 New Follower</h2>
                    <p>Hi ${recipientName},</p>
                    <p><strong>${senderName}</strong> just started following you on Cloud Beacon!</p>
                    <p>Check out their profile to see what they're working on.</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        You can disable follower notification emails in your <a href="${process.env.APP_URL || "http://localhost:5500"}/index.html#notifications-settings" style="color: #0066cc;">notification preferences</a>.
                    </p>
                </div>
            `;
        } else if (emailType === 'message') {
            subject = `New message from ${senderName} on Cloud Beacon`;
            htmlBody = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>💌 New Message</h2>
                    <p>Hi ${recipientName},</p>
                    <p><strong>${senderName}</strong> sent you a new message on Cloud Beacon!</p>
                    <p>Log in to view your messages and reply.</p>
                    <p style="margin-top: 30px; color: #666; font-size: 12px;">
                        You can disable message notification emails in your <a href="${process.env.APP_URL || "http://localhost:5500"}/index.html#notifications-settings" style="color: #0066cc;">notification preferences</a>.
                    </p>
                </div>
            `;
        } else {
            res.status(400).json({ error: 'Invalid emailType' });
            return;
        }
        
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || "notifications@cloudbeacon.app",
            to: recipientEmail,
            subject: subject,
            html: htmlBody
        };
        
        // Send email
        await transporter.sendMail(mailOptions);
        console.log(`[Notification Email] ✅ Email sent to ${recipientEmail}`);
        
        res.json({ 
            success: true, 
            message: `Notification email sent to ${recipientEmail}` 
        });
    } catch (error) {
        console.error('[Notification Email] Error:', error);
        res.status(500).json({ 
            error: 'Failed to send email',
            message: error.message 
        });
    }
});

// Cloud Function: Send Bug Report Email
// Called when user submits a bug report from the app
exports.sendBugReportEmail = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }

    if (req.method !== "POST") {
        res.status(400).json({ error: "POST method required" });
        return;
    }

    try {
        const { reportId, description, username, userId, timestamp, userAgent, url, platform, language } = req.body;

        if (!description || !username) {
            res.status(400).json({ error: "Missing required fields: description, username" });
            return;
        }
        
        // Debug logging
        console.log(`[Bug Report Email] Credentials check:`);
        console.log(`  SMTP_USER = ${process.env.SMTP_USER}`);
        console.log(`  SMTP_HOST = ${process.env.SMTP_HOST}`);
        console.log(`  SMTP_PORT = ${process.env.SMTP_PORT}`);

        // Prepare email body
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6;">
                <h2 style="color: #ef4444;">🐛 New Bug Report</h2>
                
                <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 16px 0;">
                    <p><strong>Report ID:</strong> ${reportId}</p>
                    <p><strong>From:</strong> ${username} (ID: ${userId})</p>
                    <p><strong>Timestamp:</strong> ${timestamp}</p>
                </div>

                <h3 style="color: #333;">Bug Description:</h3>
                <div style="background: #fafafa; padding: 12px; border-left: 3px solid #ef4444; border-radius: 3px;">
                    <p>${description.replace(/\n/g, '<br>')}</p>
                </div>

                <h3 style="color: #333;">Technical Details:</h3>
                <ul style="color: #666; font-size: 13px;">
                    <li><strong>URL:</strong> ${url}</li>
                    <li><strong>User Agent:</strong> ${userAgent}</li>
                    <li><strong>Platform:</strong> ${platform}</li>
                    <li><strong>Language:</strong> ${language}</li>
                </ul>

                <p style="margin-top: 30px; color: #999; font-size: 12px;">
                    This bug report was automatically submitted from Cloud Beacon.
                </p>
            </div>
        `;

        // Send email to bug report address
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER || "notifications@cloudbeacon.app",
            to: "Cloud.Beacon.mail@gmail.com",
            subject: `[BUG REPORT] from ${username}`,
            html: htmlBody
        };

        await transporter.sendMail(mailOptions);
        console.log(`[Bug Report Email] ✅ Bug report ${reportId} email sent`);

        res.json({
            success: true,
            message: `Bug report ${reportId} received and email sent`
        });
    } catch (error) {
        console.error('[Bug Report Email] Error:', error);
        res.status(500).json({
            error: 'Failed to send bug report email',
            message: error.message
        });
    }
});

// ═════════════════════════════════════════════════════════════════════════════════
// Cloud Function: Calculate Community Signals
// Analyzes feed data for trends, coalitions, and silence spots
// Scheduled to run daily at UTC midnight
// ═════════════════════════════════════════════════════════════════════════════════

const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'it', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'we', 'they', 'him', 'her', 'us', 'them'
]);

function extractNounPhrases(text) {
    if (!text) return [];
    // Simple pattern: Named entities + common civic topic keywords
    const patterns = [
        /(?:climate|housing|transport|education|health|safety|community|support|policy|action|planning|development|reform|change|initiative|program|service|system|governance|technology|environment|social|public|infrastructure|regulation|rights|justice|equality|wellbeing|care|protection|investment)\s+(?:\w+\s+)*\w+/gi,
        /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:project|initiative|program|policy)\b/g
    ];
    
    let phrases = [];
    for (let pattern of patterns) {
        const matches = text.match(pattern) || [];
        phrases = phrases.concat(matches);
    }
    
    return [...new Set(phrases.map(p => p.toLowerCase().trim()))];
}

function calculateTrends(feedItems, timeWindow = 7) {
    const now = new Date();
    const windowStart = new Date(now - timeWindow * 24 * 60 * 60 * 1000);
    const previousWindowStart = new Date(now - (timeWindow * 2) * 24 * 60 * 60 * 1000);
    
    const currentItems = feedItems.filter(item => {
        const date = item.createdAt instanceof admin.firestore.Timestamp ? item.createdAt.toDate() : item.createdAt;
        return date >= windowStart;
    });
    
    const previousItems = feedItems.filter(item => {
        const date = item.createdAt instanceof admin.firestore.Timestamp ? item.createdAt.toDate() : item.createdAt;
        return date >= previousWindowStart && date < windowStart;
    });
    
    const topicMentions = {};
    const topicUsers = {};
    const topicCategories = {};
    
    for (let item of currentItems) {
        const text = (item.description || item.title || '') + ' ' + (item.categoryAnswer || '');
        const phrases = extractNounPhrases(text);
        
        for (let phrase of phrases) {
            topicMentions[phrase] = (topicMentions[phrase] || 0) + 1;
            topicUsers[phrase] = topicUsers[phrase] || new Set();
            topicUsers[phrase].add(item.authorId);
            topicCategories[phrase] = topicCategories[phrase] || new Set();
            if (item.category) topicCategories[phrase].add(item.category);
        }
    }
    
    const previousMentions = {};
    for (let item of previousItems) {
        const text = (item.description || item.title || '') + ' ' + (item.categoryAnswer || '');
        const phrases = extractNounPhrases(text);
        for (let phrase of phrases) {
            previousMentions[phrase] = (previousMentions[phrase] || 0) + 1;
        }
    }
    
    const trends = Object.entries(topicMentions)
        .filter(([topic, count]) => count >= 3)
        .map(([topic, count]) => {
            const prev = previousMentions[topic] || 1;
            const changePercent = Math.round(((count - prev) / prev) * 100);
            const uniqueUsers = topicUsers[topic]?.size || 0;
            const categories = Array.from(topicCategories[topic] || []);
            const confidence = Math.min(0.95, Math.max(0.3, (count / 50) * (uniqueUsers / 25)));
            
            return {
                topic,
                count,
                changePercent,
                uniqueUsers,
                categories,
                confidence: Math.round(confidence * 100) / 100,
                evidence: `${count} posts/projects, ${categories.length} categories, ${uniqueUsers} unique voices`
            };
        })
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 10);
    
    return trends;
}

function detectCoalitions(feedItems, timeWindow = 7) {
    const now = new Date();
    const windowStart = new Date(now - timeWindow * 24 * 60 * 60 * 1000);
    
    const currentItems = feedItems.filter(item => {
        const date = item.createdAt instanceof admin.firestore.Timestamp ? item.createdAt.toDate() : item.createdAt;
        return date >= windowStart;
    });
    
    const topicToUsers = {};
    
    for (let item of currentItems) {
        const text = (item.description || item.title || '') + ' ' + (item.categoryAnswer || '');
        const phrases = extractNounPhrases(text);
        
        for (let phrase of phrases) {
            topicToUsers[phrase] = topicToUsers[phrase] || new Set();
            topicToUsers[phrase].add(item.authorId);
        }
    }
    
    const coalitions = [];
    const topicList = Object.keys(topicToUsers);
    
    for (let i = 0; i < topicList.length; i++) {
        for (let j = i + 1; j < topicList.length; j++) {
            const topicA = topicList[i];
            const topicB = topicList[j];
            const usersA = topicToUsers[topicA];
            const usersB = topicToUsers[topicB];
            
            const intersection = new Set([...usersA].filter(u => usersB.has(u)));
            const union = new Set([...usersA, ...usersB]);
            const jaccard = intersection.size / union.size;
            
            if (jaccard > 0.25) {
                coalitions.push({
                    topics: [topicA, topicB],
                    strength: Math.round(jaccard * 100) / 100,
                    userOverlap: intersection.size,
                    reasoning: `${intersection.size} users engaged with both topics suggest these issues are linked in community thinking.`
                });
            }
        }
    }
    
    return coalitions.sort((a, b) => b.strength - a.strength).slice(0, 5);
}

function detectSilenceSpots(trends) {
    const silenceSpots = [];
    const legislationTopics = ['AI', 'Artificial Intelligence', 'technology regulation', 'data protection', 'digital rights', 'automation'];
    const trendTopics = trends.map(t => t.topic.toLowerCase());
    
    for (let topic of legislationTopics) {
        if (!trendTopics.some(t => t.includes(topic.toLowerCase()))) {
            silenceSpots.push({
                potentialTopic: topic,
                reasoning: `Parliament discussing "${topic}" but minimal citizen mobilization. May indicate knowledge gap or uncertainty about impact.`,
                recommendation: 'Consider creating explainer project or Parliament context guide.'
            });
        }
    }
    
    const avgEngagement = trends.reduce((sum, t) => sum + t.count, 0) / Math.max(1, trends.length);
    const lowCategories = ['Law'];
    for (let cat of lowCategories) {
        const catTrends = trends.filter(t => t.categories.includes(cat));
        if (catTrends.length === 0 || catTrends.reduce((sum, t) => sum + t.count, 0) < avgEngagement * 0.3) {
            silenceSpots.push({
                potentialTopic: `${cat} Category Engagement`,
                reasoning: `"${cat}" projects showing lower activity than other categories. May reflect community confidence gaps or unclear benefit.`,
                recommendation: 'Host discussion or highlight existing projects in this category.'
            });
        }
    }
    
    return silenceSpots.slice(0, 3);
}

// Main calculation function
async function calculateSignals() {
    try {
        console.log('[Signals] Starting calculation...');
        
        const now = new Date();
        const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
        
        const feedSnapshot = await db.collection('feed')
            .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(thirtyDaysAgo))
            .get();
        
        const feedItems = feedSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
        
        console.log(`[Signals] Fetched ${feedItems.length} feed items`);
        
        const trends = calculateTrends(feedItems, 7);
        const coalitions = detectCoalitions(feedItems, 7);
        const silenceSpots = detectSilenceSpots(trends);
        
        console.log(`[Signals] Found ${trends.length} trends, ${coalitions.length} coalitions, ${silenceSpots.length} silence spots`);
        
        await db.collection('signals').doc('weekly_trends').set({
            trends,
            coalitions,
            silenceSpots,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            version: '1.0'
        });
        
        console.log('[Signals] ✅ Calculation complete');
    } catch (error) {
        console.error('[Signals] ❌ Error:', error);
    }
}

// Scheduled function: Run calculations daily
// Uncomment when deploying to production with scheduled functions enabled
// exports.calculateSignalsDaily = functions.pubsub.schedule('0 0 * * *').timeZone('UTC').onRun(calculateSignals);

// HTTP endpoint for manual triggering (for testing)
exports.calculateSignalsManual = functions.https.onRequest((req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    
    // Simple auth: check for a secret header
    const secret = req.headers['x-signals-secret'];
    if (secret !== process.env.SIGNALS_CALCULATION_SECRET) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
    }
    
    calculateSignals().then(() => {
        res.json({ success: true, message: 'Signals calculation triggered' });
    }).catch(error => {
        res.status(500).json({ error: error.message });
    });
});

// ═════════════════════════════════════════════════════════════════════════════════
// Cloud Function: Claude Assessment Loop
// Analyzes posts/projects with Claude API for policy areas, subtypes, moderation
// Returns token usage for cost estimation
// ═════════════════════════════════════════════════════════════════════════════════

const POLICY_AREAS = [
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

const CONTENT_SUBTYPES = {
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

const EMOTIONS = [
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

const SENTIMENT_TONES = [
    "Positive",
    "Negative",
    "Neutral",
    "Mixed",
    "Sarcastic",
    "Humorous",
    "Serious",
    "Urgent"
];

const SFW_RATINGS = [
    "Appropriate",
    "Mild Language",
    "Suggestive",
    "Explicit",
    "Violent/Disturbing"
];

function buildAssessmentPrompt(entries) {
    const policyList = POLICY_AREAS.join(", ");
    const subtypesByCategory = Object.entries(CONTENT_SUBTYPES)
        .map(([cat, subs]) => `${cat}: ${subs.join(", ")}`)
        .join("\n");
    
    const emotionList = EMOTIONS.join(", ");
    const toneList = SENTIMENT_TONES.join(", ");
    const sfwList = SFW_RATINGS.join(", ");

    return `Process the following entries and return a JSON array of assessments.

APPROVED CONTENT TYPES:
Tech, Civil, Community, Law, Behavioral

APPROVED SUBTYPES BY CATEGORY:
${subtypesByCategory}

APPROVED POLICY AREAS (13 UK areas):
${policyList}

APPROVED EMOTIONS (select multiple with intensity 0-1):
${emotionList}

APPROVED SENTIMENT TONES (pick one):
${toneList}

APPROVED SFW RATINGS (pick one):
${sfwList}

ENTRIES TO ASSESS:
${JSON.stringify(entries, null, 2)}

For each entry, return:
{
  "entry_id": "...",
  "entry_type": "post|project|legislation|bid",
  "classification": {
    "primary_type": "Tech|Civil|Community|Law|Behavioral",
    "primary_subtype": "specific subtype from approved list",
    "primary_confidence": 0.92,
    "additional_types": [
      {"type": "...", "subtype": "...", "confidence": 0.68},
      ...
    ]
  },
  "policy_areas": [
    {"area": "Housing & Planning", "confidence": 0.85},
    ...
  ],
  "topics": [
    {"topic": "housing affordability", "relevance": 0.95},
    {"topic": "rental market", "relevance": 0.87},
    ...
  ],
  "sentiment": {
    "overall": "Positive|Negative|Neutral|Mixed|Sarcastic|Humorous|Serious|Urgent",
    "tone_confidence": 0.88,
    "emotions": [
      {"emotion": "Frustration", "intensity": 0.85},
      {"emotion": "Advocacy", "intensity": 0.72},
      {"emotion": "Hope", "intensity": 0.55},
      ...
    ]
  },
  "content_safety": {
    "sfw_rating": "Appropriate|Mild Language|Suggestive|Explicit|Violent/Disturbing",
    "explicit_content": false,
    "safety_flags": [],
    "confidence": 0.95
  },
  "engagement_signals": {
    "is_call_to_action": true|false,
    "is_question": true|false,
    "is_joke_or_meme": true|false,
    "is_personal_story": true|false,
    "is_resource_share": true|false,
    "is_announcement": true|false
  },
  "moderation": {
    "status": "clean|flagged|rejected",
    "flags": [],
    "reasoning": "...",
    "confidence": 0.92
  },
  "commands": [
    {"action": "setClassification", "primary_type": "...", "primary_subtype": "...", "primary_confidence": 0.92},
    {"action": "setPolicyAreas", "policy_areas": [{"area": "...", "confidence": ...}, ...]},
    {"action": "setTopics", "topics": [{"topic": "...", "relevance": ...}, ...]},
    {"action": "setSentiment", "overall_sentiment": "...", "tone": "...", "confidence": 0.88},
    {"action": "addEmotion", "emotion": "Frustration", "intensity": 0.85},
    {"action": "setContentSafety", "sfw_rating": "Appropriate", "confidence": 0.95},
    {"action": "setEngagementSignals", "signals": ["is_call_to_action"]},
    {"action": "setModerationStatus", "status": "clean"}
  ]
}

CLASSIFICATION RULES:
- Posts can be primarily Behavioral OR map to Tech/Civil/Community/Law
- Projects should always map to a domain type, but can also include Behavioral
- If a post discusses policy but uses casual tone, use BOTH
- Memes and jokes are valid Behavioral classifications
- policy_areas apply when content relates to governance/legislation

SENTIMENT RULES:
- People experience multiple emotions; select the most relevant 3-5
- A frustrated housing post: overall=Negative, emotions=[Frustration:0.9, Advocacy:0.7, Hope:0.3]

MODERATION RULES:
- Flag only genuinely problematic content
- Context matters: "f*** the housing crisis" is advocacy, not profanity
- Disagreement is not abuse; personal attacks are

Return ONLY the JSON array, no other text.`;
}

// Test endpoint for single post assessment
exports.assessEntry = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }
    
    if (req.method !== 'POST') {
        res.status(400).json({ error: 'POST required' });
        return;
    }

    try {
        // Check API key
        if (!process.env.ANTHROPIC_API_KEY) {
            console.error('[Assessment] ANTHROPIC_API_KEY not set');
            return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
        }

        const { document_id, collection_name } = req.body;
        
        if (!document_id || !collection_name) {
            return res.status(400).json({ 
                error: 'document_id and collection_name required in body'
            });
        }

        console.log(`[Assessment] Fetching ${collection_name}/${document_id}...`);

        // Fetch document from Firestore
        const docRef = db.collection(collection_name).doc(document_id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({ error: 'Document not found' });
        }

        const docData = docSnap.data();

        // Prepare entry for assessment
        const entry = {
            id: document_id,
            type: docData.type || (docData.description ? 'post' : 'project'),
            title: docData.title || '',
            text: docData.description || '',
            category: docData.category || 'Unknown',
            created_at: docData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };

        console.log(`[Assessment] Prepared entry:`, entry);

        // Build prompt
        const prompt = buildAssessmentPrompt([entry]);
        console.log(`[Assessment] Built prompt, length: ${prompt.length} chars`);

        // Build request to Claude API
        const options = {
            hostname: 'api.anthropic.com',
            port: 443,
            path: '/v1/messages',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        };

        const requestBody = JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2048,
            system: 'You are a content assessment system for Cloud Beacon. Analyze each entry and return structured metadata as specified. Return ONLY valid JSON, no markdown or explanations.',
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        console.log(`[Assessment] Calling Claude API...`);

        return new Promise((resolve) => {
            const apiRequest = https.request(options, (apiRes) => {
                let responseData = '';
                let statusCode = apiRes.statusCode;

                console.log(`[Assessment] Claude responded with status ${statusCode}`);

                apiRes.on('data', (chunk) => {
                    responseData += chunk;
                });

                apiRes.on('end', () => {
                    try {
                        if (statusCode !== 200) {
                            console.error(`[Assessment] Claude API error (${statusCode}):`, responseData);
                            res.status(statusCode).json({ 
                                error: `Claude API error: ${statusCode}`,
                                details: responseData
                            });
                            resolve();
                            return;
                        }

                        const apiResponse = JSON.parse(responseData);

                        if (!apiResponse.content || !apiResponse.content[0]) {
                            console.error('[Assessment] Invalid API response structure:', apiResponse);
                            return res.status(500).json({ 
                                error: 'Invalid API response',
                                received: apiResponse
                            });
                        }

                        const assessmentText = apiResponse.content[0].text;
                        
                        console.log(`[Assessment] Claude response received`);
                        console.log(`[Assessment] Response length: ${assessmentText.length} chars`);
                        console.log(`[Assessment] Input tokens: ${apiResponse.usage.input_tokens}`);
                        console.log(`[Assessment] Output tokens: ${apiResponse.usage.output_tokens}`);

                        // Parse assessment JSON
                        let assessments;
                        try {
                            assessments = JSON.parse(assessmentText);
                        } catch (parseErr) {
                            console.error('[Assessment] Failed to parse Claude response as JSON:');
                            console.error('Response text:', assessmentText.substring(0, 500));
                            return res.status(500).json({ 
                                error: 'Claude response was not valid JSON',
                                received: assessmentText.substring(0, 500)
                            });
                        }

                        const assessment = Array.isArray(assessments) ? assessments[0] : assessments;

                        res.json({
                            success: true,
                            entry_id: document_id,
                            assessment,
                            tokens: {
                                input: apiResponse.usage.input_tokens,
                                output: apiResponse.usage.output_tokens,
                                total: apiResponse.usage.input_tokens + apiResponse.usage.output_tokens
                            },
                            cost_estimate: {
                                input_cost_usd: (apiResponse.usage.input_tokens / 1000000) * 3,
                                output_cost_usd: (apiResponse.usage.output_tokens / 1000000) * 15,
                                total_cost_usd: ((apiResponse.usage.input_tokens / 1000000) * 3) + ((apiResponse.usage.output_tokens / 1000000) * 15)
                            }
                        });

                        resolve();
                    } catch (error) {
                        console.error('[Assessment] Error in response handler:', error);
                        res.status(500).json({ 
                            error: 'Response processing failed',
                            message: error.message
                        });
                        resolve();
                    }
                });
            });

            apiRequest.on('error', (error) => {
                console.error('[Assessment] API request error:', error);
                res.status(500).json({ 
                    error: 'Claude API request failed',
                    message: error.message
                });
                resolve();
            });

            // Log request before sending
            console.log(`[Assessment] Sending ${requestBody.length} bytes to Claude API`);
            
            apiRequest.write(requestBody);
            apiRequest.end();
        });

    } catch (error) {
        console.error('[Assessment] Outer catch error:', error);
        res.status(500).json({ 
            error: 'Assessment failed',
            message: error.message,
            stack: error.stack
        });
    }
});