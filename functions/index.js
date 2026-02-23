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