# 🚀 Quick Setup - Configure Email Environment Variables

Your Cloud Functions are **deployed and ready**! ✅

Now configure the email credentials. Choose the approach that works best for you:

---

## Option 1: Firebase Console (Easiest - Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **cloudbeacon-e61f6**
3. Go to **Functions** (left sidebar)
4. Click on the **`sendAccountSecurityEmail`** function
5. Click the **"Runtime settings"** tab
6. Scroll down to **"Runtime environment variables"**
7. Add these variables (click "Add variable" for each):

   | Name | Value |
   |------|-------|
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_SECURE` | `false` |
   | `SMTP_USER` | your-email@gmail.com |
   | `SMTP_PASS` | your-16-char-app-password |
   | `SMTP_FROM` | security@cloudbeacon.app |
   | `APP_URL` | https://cloudbeacon-e61f6.web.app |

8. Click **"Deploy"**
9. Wait for redeployment to complete (shows green checkmark)

---

## Option 2: Using Gmail (Free & Easy)

### Get Gmail App Password:

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Turn on **2-Step Verification** (if not already enabled)
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select: **Mail** → **Other (custom name)**
5. Type: **Firebase Cloud Functions**
6. Click **Generate**
7. Copy the 16-character password
8. Use that as your `SMTP_PASS` value in Firebase Console

---

## Option 3: Using SendGrid (Production)

1. Sign up at [SendGrid](https://sendgrid.com) (free tier available)
2. Go to **API Keys** section
3. Create a new API key
4. Use these settings in Firebase Console:
   - `SMTP_HOST` = `smtp.sendgrid.net`
   - `SMTP_PORT` = `587`
   - `SMTP_SECURE` = `false`
   - `SMTP_USER` = `apikey`
   - `SMTP_PASS` = your-sendgrid-api-key
   - `SMTP_FROM` = your-sendgrid-verified-sender@domain.com

---

## Option 4: Using Gmail with SMTP

If you prefer Gmail's SMTP (not recommended - less secure):
1. Go to [Gmail Security Settings](https://myaccount.google.com/security)
2. Turn on "Less secure app access"
3. Use your Gmail password as `SMTP_PASS`

---

## Test the Setup

Once variables are configured:

1. Open the Cloud Beacon app: https://cloudbeacon-e61f6.web.app
2. Go to **Login** page
3. Try wrong password **5 times**
4. Check your browser console (F12 → Console)
5. Look for logs like:
   ```
   [Email] Calling sendAccountSecurityEmail Cloud Function for warning email...
   [Email] ✅ warning email queued to your-email@example.com
   ```
6. Check your email inbox for the security alert
7. Click the unlock link in the email
8. You should be automatically logged in!

---

## If Emails Don't Send

Check the Cloud Functions logs:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Go to **Functions**  
3. Click **Logs** tab
4. Look for error messages
5. Common issues:
   - **Missing environment variables**: Verify all 7 variables are set
   - **Wrong password**: Check your Gmail app password or SendGrid API key
   - **SMTP_PASS blank**: Make sure you copied the full password

---

## Next Steps After Email Setup

✅ Emails configured
- [ ] Update project ID in [unlock-account.html](unlock-account.html#L28) 
  - Change `your-project-id` to `cloudbeacon-e61f6`

📧 Test full email flow
- [ ] Wrong password 5 times → get warning email
- [ ] Click unlock link → auto-logged in
- [ ] Check Cloud Functions logs for any errors

🔒 Production setup
- [ ] Change thresholds in loginHeckles.js (5→5, 21→144, 34→233)
- [ ] Set up daily backup of unlock tokens (optional)
- [ ] Monitor email sending costs

---

## Questions?

- Cloud Functions: https://firebase.google.com/docs/functions
- Nodemailer: https://nodemailer.com/
- Email deliverability: https://firebase.google.com/docs/functions/sending-emails
