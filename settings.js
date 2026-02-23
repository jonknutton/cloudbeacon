/**
 * Account Settings - Security, Verification, and Account Management
 */

console.log('settings.js loaded');

const AccountSettings = {
    /**
     * Open settings modal
     */
    async openSettingsModal() {
        console.log('openSettingsModal called');
        
        const modal = document.getElementById('settingsModal');
        if (!modal) {
            console.error('Settings modal not found');
            alert('Settings modal not found on the page');
            return;
        }
        
        // Check if auth is available
        if (typeof window.auth === 'undefined') {
            console.error('window.auth not available yet');
            alert('Please wait for the app to fully load');
            return;
        }
        
        const user = window.auth.currentUser;
        if (!user) {
            console.warn('No user signed in');
            alert('Please sign in first');
            return;
        }
        
        console.log('Opening settings modal for user:', user.email);
        modal.style.display = 'flex';
        
        // Add click handler to close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) {
                this.closeSettingsModal();
            }
        };
        
        // Load current user data
        try {
            const { db } = await import('./firebase.js');
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data() || {};
            
            // Update UI with current data
            document.getElementById('settingsEmail').textContent = user.email || 'No email';
            document.getElementById('settingsEmailVerified').textContent = user.emailVerified ? '✓ Verified' : '✗ Not Verified';
            document.getElementById('settingsEmailVerified').style.color = user.emailVerified ? '#10b981' : '#ef4444';
            
            // Show/hide verification button
            const verifyBtn = document.getElementById('sendVerificationEmailBtn');
            if (verifyBtn) {
                verifyBtn.style.display = user.emailVerified ? 'none' : 'inline-block';
            }
            
            // Load 2FA status
            const twoFAEnabled = userData.twoFactorEnabled || false;
            document.getElementById('twoFAStatus').textContent = twoFAEnabled ? 'Enabled' : 'Disabled';
            document.getElementById('twoFAStatus').style.color = twoFAEnabled ? '#10b981' : '#999';
            document.getElementById('disableTwoFABtn').style.display = twoFAEnabled ? 'inline-block' : 'none';
            document.getElementById('setupTwoFABtn').style.display = twoFAEnabled ? 'none' : 'inline-block';
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    },
    
    /**
     * Close settings modal
     */
    closeSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.style.display = 'none';
    },
    
    /**
     * Change password
     */
    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('Please fill in all password fields');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters');
            return;
        }
        
        try {
            const user = window.auth.currentUser;
            if (!user || !user.email) {
                alert('User not found');
                return;
            }
            
            // Re-authenticate user with current password
            const { signInWithEmailAndPassword, updatePassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const { auth } = await import('./firebase.js');
            
            // Re-authenticate
            await signInWithEmailAndPassword(auth, user.email, currentPassword);
            
            // Update password
            await updatePassword(user, newPassword);
            
            alert('Password changed successfully!');
            
            // Clear form
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } catch (error) {
            console.error('Error changing password:', error);
            if (error.code === 'auth/wrong-password') {
                alert('Current password is incorrect');
            } else if (error.code === 'auth/requires-recent-login') {
                alert('Please log in again before changing your password');
            } else {
                alert('Error changing password: ' + error.message);
            }
        }
    },
    
    /**
     * Send email verification
     */
    async sendVerificationEmail() {
        try {
            const user = auth.currentUser;
            if (!user) {
                alert('Please sign in first');
                return;
            }
            
            console.log('[Settings] Sending verification email to:', user.email);
            
            // Call custom email verification endpoint
            const response = await fetch('https://us-central1-cloud-beacon-55a40.cloudfunctions.net/sendEmailVerification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    username: user.displayName || user.email.split('@')[0]
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('[Settings] ✅ Verification email sent:', result);
            alert('✅ Verification email sent! Check your inbox and spam folder.');
        } catch (error) {
            console.error('[Settings] Error sending verification email:', error);
            alert('❌ Error sending verification email: ' + error.message);
        }
    },
    
    /**
     * Setup 2FA - Generate secret for TOTP
     */
    async setupTwoFA() {
        try {
            // For simplicity, we'll use Firebase's built-in phone authentication
            // But for a full solution, you'd use a TOTP library like speakeasy
            
            // For now, show a simple modal asking for phone number or authenticator app
            const setupChoice = prompt('Choose 2FA method:\n1. Authenticator App (TOTP)\n2. Phone Number (SMS)\n\nEnter 1 or 2:');
            
            if (setupChoice === '1') {
                await this.setupTOTP();
            } else if (setupChoice === '2') {
                await this.setupPhoneAuth();
            }
        } catch (error) {
            console.error('Error setting up 2FA:', error);
            alert('Error setting up 2FA: ' + error.message);
        }
    },
    
    /**
     * Setup TOTP-based 2FA
     */
    async setupTOTP() {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            // Generate a random secret (in production, use speakeasy or similar)
            const secret = this.generateRandomSecret(32);
            
            // Store pending 2FA setup in Firestore
            const { db } = await import('./firebase.js');
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Save temporary secret
            await setDoc(doc(db, 'users', user.uid, 'security', '2fa_pending'), {
                secret: secret,
                type: 'totp',
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minute window
            });
            
            // In production, you'd show QR code here using a library like qrcode.js
            // For now, show the secret and ask for confirmation code
            alert(`Your 2FA Secret: ${secret}\n\nIn a real app, you'd scan this with Google Authenticator or Authy.\n\nEnter your confirmation code when ready.`);
            
            const code = prompt('Enter 6-digit code from your authenticator app:');
            if (code && code.length === 6) {
                // In production, validate the TOTP code against the secret
                await this.confirmTwoFA(secret, 'totp');
            } else {
                alert('Setup cancelled');
                // Clean up
                const { deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                await deleteDoc(doc(db, 'users', user.uid, 'security', '2fa_pending'));
            }
        } catch (error) {
            console.error('Error setting up TOTP:', error);
            alert('Error: ' + error.message);
        }
    },
    
    /**
     * Setup phone-based 2FA
     */
    async setupPhoneAuth() {
        const phoneNumber = prompt('Enter your phone number (include country code, e.g., +1234567890):');
        if (!phoneNumber) return;
        
        try {
            // This would integrate with Firebase Phone Auth
            // Requires setting up reCAPTCHA and configuring Firebase
            alert('Phone authentication requires additional setup.\n\nFor now, use an Authenticator App instead.');
        } catch (error) {
            console.error('Error setting up phone auth:', error);
            alert('Error: ' + error.message);
        }
    },
    
    /**
     * Confirm and enable 2FA
     */
    async confirmTwoFA(secret, type) {
        try {
            const user = auth.currentUser;
            if (!user) return;
            
            const { db } = await import('./firebase.js');
            const { doc, setDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Enable 2FA in user profile
            await setDoc(doc(db, 'users', user.uid), {
                twoFactorEnabled: true,
                twoFactorType: type,
                twoFactorSecret: secret, // In production, encrypt this!
                twoFactorSetupDate: new Date()
            }, { merge: true });
            
            // Remove pending setup
            await deleteDoc(doc(db, 'users', user.uid, 'security', '2fa_pending'));
            
            alert('Two-Factor Authentication enabled successfully!');
            
            // Refresh settings display
            document.getElementById('twoFAStatus').textContent = 'Enabled';
            document.getElementById('twoFAStatus').style.color = '#10b981';
            document.getElementById('setupTwoFABtn').style.display = 'none';
            document.getElementById('disableTwoFABtn').style.display = 'inline-block';
        } catch (error) {
            console.error('Error confirming 2FA:', error);
            alert('Error: ' + error.message);
        }
    },
    
    /**
     * Disable 2FA
     */
    async disableTwoFA() {
        const confirm = window.confirm('Are you sure you want to disable Two-Factor Authentication?');
        if (!confirm) return;
        
        try {
            const user = auth.currentUser;
            if (!user) return;
            
            const { db } = await import('./firebase.js');
            const { doc, setDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Disable 2FA
            await setDoc(doc(db, 'users', user.uid), {
                twoFactorEnabled: false
            }, { merge: true });
            
            // Delete secret
            await deleteDoc(doc(db, 'users', user.uid, 'security', '2fa_setup'));
            
            alert('Two-Factor Authentication disabled');
            
            // Refresh settings display
            document.getElementById('twoFAStatus').textContent = 'Disabled';
            document.getElementById('twoFAStatus').style.color = '#999';
            document.getElementById('setupTwoFABtn').style.display = 'inline-block';
            document.getElementById('disableTwoFABtn').style.display = 'none';
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            alert('Error: ' + error.message);
        }
    },
    
    /**
     * Generate random secret for TOTP (simple version)
     */
    generateRandomSecret(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < length; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    },
    
    /**
     * Switch between settings tabs
     */
    switchSettingsTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.settings-tab-panel').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(`settings-${tabName}`);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }
        
        // Update tab button styling
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Load account details if switching to account tab
        if (tabName === 'account') {
            this.loadAccountDetails();
        }
    },

    /**
     * Load account details from Firestore
     */
    async loadAccountDetails() {
        try {
            const user = window.auth.currentUser;
            if (!user) return;
            
            const { db } = await import('./firebase.js');
            const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            const userData = userDoc.data() || {};
            
            // Display Firebase UID (read-only)
            document.getElementById('accountUserID').value = user.uid;
            
            // Display user's email (read-only)
            document.getElementById('accountEmail').value = user.email || '';
            
            // Populate editable fields
            document.getElementById('accountFullName').value = userData.fullName || '';
            document.getElementById('accountCountry').value = userData.country || '';
            document.getElementById('accountAddress').value = userData.address || '';
            document.getElementById('accountPhone').value = userData.phone || '';
        } catch (error) {
            console.error('Error loading account details:', error);
        }
    },

    /**
     * Toggle edit mode for account details
     */
    toggleEditAccountDetails() {
        const inputs = [
            document.getElementById('accountFullName'),
            document.getElementById('accountCountry'),
            document.getElementById('accountAddress'),
            document.getElementById('accountPhone')
        ];
        
        const editBtn = document.getElementById('editAccountDetailsBtn');
        const saveBtn = document.getElementById('saveAccountDetailsBtn');
        const cancelBtn = document.getElementById('cancelAccountDetailsBtn');
        
        // Check if currently in edit mode (Save button is visible)
        const isCurrentlyEditing = saveBtn.style.display !== 'none';
        
        // Toggle button visibility
        if (isCurrentlyEditing) {
            // Exit edit mode
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
            cancelBtn.style.display = 'none';
        } else {
            // Enter edit mode
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
            cancelBtn.style.display = 'inline-block';
        }
    },

    /**
     * Cancel editing account details
     */
    cancelEditAccountDetails() {
        this.toggleEditAccountDetails();
        this.loadAccountDetails(); // Reload from DB to discard changes
    },

    /**
     * Save account details to Firestore
     */
    async saveAccountDetails() {
        try {
            const user = window.auth.currentUser;
            if (!user) {
                alert('Please sign in first');
                return;
            }
            
            console.log('[Settings] Saving account details for user:', user.uid);
            
            // Get form values - all optional
            const fullName = document.getElementById('accountFullName').value.trim();
            const country = document.getElementById('accountCountry').value;
            const address = document.getElementById('accountAddress').value.trim();
            const phone = document.getElementById('accountPhone').value.trim();
            
            console.log('[Settings] Form values:', { fullName, country, address, phone });
            
            // Save to Firestore (all fields optional)
            const { db } = await import('./firebase.js');
            const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const updateData = {
                accountDetailsUpdated: new Date().toISOString()
            };
            
            // Include all fields (even empty ones) to ensure they're saved
            updateData.fullName = fullName;
            updateData.country = country;
            updateData.address = address;
            updateData.phone = phone;
            
            console.log('[Settings] Saving to Firestore:', updateData);
            
            await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
            
            console.log('[Settings] ✅ Successfully saved to Firestore');
            alert('✅ Account details saved successfully!');
            
            // Exit edit mode
            this.toggleEditAccountDetails();
            
            // Reload to confirm persistence
            setTimeout(() => {
                this.loadAccountDetails();
            }, 500);
        } catch (error) {
            console.error('[Settings] Error saving account details:', error);
            alert('❌ Error saving account details: ' + error.message);
        }
    }
};

// Expose to window
window.AccountSettings = AccountSettings;
console.log('AccountSettings exposed to window:', typeof window.AccountSettings);
