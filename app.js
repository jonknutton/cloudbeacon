import { register, login, loginAsGuest, logout, watchAuthState } from './auth.js';
import { createPost, getPosts, voteOnPost, addComment, getComments, deletePost, editPost } from './posts.js';
import { createProject, voteOnProject } from './projects.js';
import { syncLegislation, inspectBill, listAllBills, resetSyncCooldown } from './Legislation.js';
import { importFirstBill, importAllBills } from './importBills.js';
import { db, auth } from './firebase.js';
import './follows.js';
import { collection, getDocs, deleteDoc, doc, query, where, addDoc, serverTimestamp, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Expose auth globally for settings.js access
window.auth = auth;

// Expose import functions to global scope for console use
window.importFirstBill = importFirstBill;
window.importAllBills = importAllBills;

// ═══════════════════════════════════════════════════════════════════════════
// PASSWORD VISIBILITY TOGGLE
// ═══════════════════════════════════════════════════════════════════════════
function togglePasswordVisibility(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const toggle = document.getElementById(fieldId + 'Toggle');
    
    if (!passwordField || !toggle) return;
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggle.textContent = '🙈'; // Closed eye when showing
    } else {
        passwordField.type = 'password';
        toggle.textContent = '👁️'; // Open eye when hiding
    }
}

// Expose to global scope for HTML onclick handlers
window.togglePasswordVisibility = togglePasswordVisibility;

// ═══════════════════════════════════════════════════════════════════════════
// COLOR UTILITY: Adjust brightness
// ═══════════════════════════════════════════════════════════════════════════
function adjustBrightness(hexColor, percent) {
    // Convert hex to RGB
    let hex = hexColor.replace('#', '');
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    
    // Adjust brightness
    r = Math.round(r * (1 + percent / 100));
    g = Math.round(g * (1 + percent / 100));
    b = Math.round(b * (1 + percent / 100));
    
    // Clamp values
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPER: Set Login Attempt Counter Manually
// ═══════════════════════════════════════════════════════════════════════════
function setLoginAttemptCount(email, attemptCount) {
    try {
        const storageKey = `loginAttempts_${email}`;
        sessionStorage.setItem(storageKey, attemptCount.toString());
        console.log(`✅ [Testing] Set login attempts for "${email}" to ${attemptCount}`);
        console.log(`   Storage key: ${storageKey}`);
        console.log(`   Current value in sessionStorage: ${sessionStorage.getItem(storageKey)}`);
        return attemptCount;
    } catch (error) {
        console.error(`❌ [Testing] Error setting attempt count:`, error);
        return null;
    }
}

window.setLoginAttemptCount = setLoginAttemptCount;

// Quick aliases for common test scenarios
window.testAttempt8 = (email = 'test@test.com') => setLoginAttemptCount(email, 8);
window.testAttempt13 = (email = 'test@test.com') => setLoginAttemptCount(email, 13);
window.testAttempt22 = (email = 'test@test.com') => setLoginAttemptCount(email, 22);
window.testAttempt23 = (email = 'test@test.com') => setLoginAttemptCount(email, 23);
window.testAttempt34 = (email = 'test@test.com') => setLoginAttemptCount(email, 34);
window.testAttempt35 = (email = 'test@test.com') => setLoginAttemptCount(email, 35);

// ═══════════════════════════════════════════════════════════════════════════
// TINY LOGIN BUTTON (Attempt 8 - Easter Egg)
// ═══════════════════════════════════════════════════════════════════════════
function makeTinyLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    // Guard: only apply once, never again
    if (loginBtn.hasAttribute('data-tiny-applied')) {
        console.log('[TinyButton] Tiny button already applied, skipping');
        return;
    }
    
    // Mark that we've applied the tiny transformation
    loginBtn.setAttribute('data-tiny-applied', 'true');
    
    console.log('[TinyButton] Making login button tiny at attempt 8');
    
    // Store original styles
    const originalWidth = loginBtn.style.width;
    const originalHeight = loginBtn.style.height;
    const originalFontSize = loginBtn.style.fontSize;
    const originalPadding = loginBtn.style.padding;
    
    // Make it tiny and annoying to click - a little circular target
    loginBtn.style.width = '13px';
    loginBtn.style.height = '13px';
    loginBtn.style.fontSize = '8px';
    loginBtn.style.padding = '0px';
    loginBtn.style.borderRadius = '50%';
    loginBtn.style.position = 'relative';
    loginBtn.innerHTML = '🎯';
    
    // Add a one-time click handler to restore it (intercept first click, don't submit)
    const restoreButton = function(e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        console.log('[TinyButton] Clicked, restoring normal size (not submitting yet)');
        
        // Restore button to standard size and text
        loginBtn.style.width = originalWidth;
        loginBtn.style.height = originalHeight;
        loginBtn.style.fontSize = originalFontSize;
        loginBtn.style.padding = originalPadding;
        loginBtn.style.borderRadius = '';
        loginBtn.innerHTML = 'Login';
        
        // Remove this handler so next click submits normally (attempt 9)
        loginBtn.removeEventListener('click', restoreButton, true);
        console.log('[TinyButton] Button restored to normal. Next click will submit as attempt 9.');
    };
    
    // Use capture phase to intercept before the onclick handler
    loginBtn.addEventListener('click', restoreButton, true);
}

window.makeTinyLoginButton = makeTinyLoginButton;

// ═══════════════════════════════════════════════════════════════════════════
// MOVING LOGIN BUTTON (Attempts 14-20 - Evasive behavior)
// ═══════════════════════════════════════════════════════════════════════════
function moveLoginButton(attemptNumber) {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    // Only move for attempts 14-20
    if (attemptNumber < 14 || attemptNumber > 20) return;
    
    console.log(`[MovingButton] Moving login button to random location at attempt ${attemptNumber}`);
    
    // Generate random position
    const randomX = Math.floor(Math.random() * (window.innerWidth - 100)) + 50;
    const randomY = Math.floor(Math.random() * (window.innerHeight - 100)) + 50;
    
    // Apply absolute positioning
    loginBtn.style.position = 'fixed';
    loginBtn.style.left = randomX + 'px';
    loginBtn.style.top = randomY + 'px';
    loginBtn.style.zIndex = '100';
    
    console.log(`[MovingButton] Button moved to x:${randomX}, y:${randomY}`);
}

window.moveLoginButton = moveLoginButton;

// ═══════════════════════════════════════════════════════════════════════════
// BLUESKY REDIRECT (Attempt 21 - Give up and touch grass)
// ═══════════════════════════════════════════════════════════════════════════
function openBlueSkyTab() {
    console.log('[BlueSky] Opening Bluesky tab at attempt 21');
    window.open('https://bsky.app', '_blank');
}

window.openBlueSkyTab = openBlueSkyTab;

// ═══════════════════════════════════════════════════════════════════════════
// TRUCE & IP EXPOSURE (Attempt 34+)
// ═══════════════════════════════════════════════════════════════════════════
function removeLoginButtonAttempt34() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    console.log('[Truce] Removing login button at attempt 34');
    loginBtn.style.display = 'none';
    window.buttonRemoved = true;
}

function getSpoofsIPAndComputerID() {
    // Generate a realistic-looking spoofed IP and computer ID
    const ip = `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
    
    // Generate a fake computer ID (looks like a Windows machine GUID)
    const hex = () => Math.floor(Math.random() * 16).toString(16);
    const computerID = `${Array(8).fill().map(hex).join('')}-${Array(4).fill().map(hex).join('')}-${Array(4).fill().map(hex).join('')}-${Array(4).fill().map(hex).join('')}-${Array(12).fill().map(hex).join('')}`.toUpperCase();
    
    return { ip, computerID };
}

function greyOutLoginButton() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    console.log('[IPExposure] Greying out login button for 3 seconds');
    
    // Store whether button was in transparent state
    const wasTransparent = loginBtn.style.opacity === '0';
    const originalMouseenter = loginBtn.onmouseenter;
    const originalMouseleave = loginBtn.onmouseleave;
    
    // Make visible but greyed out for 3 seconds
    loginBtn.style.opacity = '0.4';
    loginBtn.style.pointerEvents = 'none';
    loginBtn.style.cursor = 'not-allowed';
    loginBtn.onmouseenter = null;
    loginBtn.onmouseleave = null;
    
    // Restore after 3 seconds
    setTimeout(() => {
        if (wasTransparent) {
            // Return to transparent state with hover reveal
            loginBtn.style.opacity = '0';
            loginBtn.style.pointerEvents = 'auto';
            loginBtn.onmouseenter = originalMouseenter;
            loginBtn.onmouseleave = originalMouseleave;
        } else {
            // Return to normal visible state
            loginBtn.style.opacity = '1';
            loginBtn.style.pointerEvents = 'auto';
        }
        loginBtn.style.cursor = 'pointer';
        console.log('[IPExposure] Login button re-enabled');
    }, 3000);
}

function resetLoginPageStyles() {
    console.log('[Truce] Resetting all login page styles to original');
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.style.cssText = ''; // Clear all inline styles
        loginBtn.style.display = 'block';
        loginBtn.onmouseenter = null;
        loginBtn.onmouseleave = null;
        window.buttonRemoved = false;
    }
    
    // Remove jibberish font if applied
    document.body.classList.remove('jibberish');
    
    // Close human verification modal if open
    const modal = document.getElementById('humanVerificationModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

window.removeLoginButtonAttempt34 = removeLoginButtonAttempt34;
window.resetLoginPageStyles = resetLoginPageStyles;
window.greyOutLoginButton = greyOutLoginButton;
window.getSpoofsIPAndComputerID = getSpoofsIPAndComputerID;

// ═══════════════════════════════════════════════════════════════════════════
// INVISIBLE BUTTON (Attempts 23-24)
// ═══════════════════════════════════════════════════════════════════════════
function makeButtonInvisible() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    console.log('[InvisibleButton] Making button transparent at attempt 23');
    
    // Store original position if not already stored
    if (!window.buttonOriginalPosition) {
        window.buttonOriginalPosition = {
            position: loginBtn.style.position || 'static',
            left: loginBtn.style.left || 'auto',
            top: loginBtn.style.top || 'auto',
            zIndex: loginBtn.style.zIndex || 'auto'
        };
    }
    
    // Make transparent but keep clickable
    loginBtn.style.opacity = '0';
    loginBtn.style.pointerEvents = 'auto';
    loginBtn.style.transition = 'opacity 0.2s';
    
    // Show on hover
    loginBtn.onmouseenter = () => {
        loginBtn.style.opacity = '1';
    };
    loginBtn.onmouseleave = () => {
        loginBtn.style.opacity = '0';
    };
}

function restoreButtonVisible() {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    console.log('[InvisibleButton] Restoring button at original position with hover reveal at attempt 24');
    
    // Restore to original position
    if (window.buttonOriginalPosition) {
        loginBtn.style.position = window.buttonOriginalPosition.position;
        loginBtn.style.left = window.buttonOriginalPosition.left;
        loginBtn.style.top = window.buttonOriginalPosition.top;
        loginBtn.style.zIndex = window.buttonOriginalPosition.zIndex;
    }
    
    // Keep transparent but clickable
    loginBtn.style.opacity = '0';
    loginBtn.style.pointerEvents = 'auto';
    loginBtn.style.transition = 'opacity 0.2s';
    
    // Show on hover
    loginBtn.onmouseenter = () => {
        loginBtn.style.opacity = '1';
    };
    loginBtn.onmouseleave = () => {
        loginBtn.style.opacity = '0';
    };
}

function moveLoginButtonRandom(attemptNumber) {
    const loginBtn = document.getElementById('loginBtn');
    if (!loginBtn) return;
    
    // Only move for attempts 25-33
    if (attemptNumber < 25 || attemptNumber > 33) return;
    
    console.log(`[MovingButton] Moving transparent button to random location at attempt ${attemptNumber}`);
    
    // Generate random position
    const randomX = Math.floor(Math.random() * (window.innerWidth - 100)) + 50;
    const randomY = Math.floor(Math.random() * (window.innerHeight - 100)) + 50;
    
    // Apply absolute positioning, keep transparent but clickable
    loginBtn.style.position = 'fixed';
    loginBtn.style.left = randomX + 'px';
    loginBtn.style.top = randomY + 'px';
    loginBtn.style.zIndex = '100';
    loginBtn.style.opacity = '0';
    loginBtn.style.pointerEvents = 'auto';
    loginBtn.style.transition = 'opacity 0.2s';
    
    // Show on hover
    loginBtn.onmouseenter = () => {
        loginBtn.style.opacity = '1';
    };
    loginBtn.onmouseleave = () => {
        loginBtn.style.opacity = '0';
    };
    
    console.log(`[MovingButton] Button moved to x:${randomX}, y:${randomY}`);
}

window.makeButtonInvisible = makeButtonInvisible;
window.restoreButtonVisible = restoreButtonVisible;
window.moveLoginButtonRandom = moveLoginButtonRandom;

// ═══════════════════════════════════════════════════════════════════════════
// IMPOSSIBLE HUMAN VERIFICATION (Attempt 22 - Rigged CAPTCHA)
// ═══════════════════════════════════════════════════════════════════════════
function initializeHumanVerification() {
    console.log('[HumanVerification] Starting impossible CAPTCHA at attempt 22');
    const modal = document.getElementById('humanVerificationModal');
    if (!modal) return;
    
    modal.style.display = 'block';
    initializeGame1();
}

function initializeGame1() {
    // Create a 5x5 grid of tiles - some with asterisks
    const tileGrid = document.getElementById('tileGrid');
    tileGrid.innerHTML = '';
    
    for (let i = 0; i < 25; i++) {
        const tile = document.createElement('div');
        const hasAsterisk = Math.random() > 0.6; // ~40% have asterisks
        tile.dataset.hasAsterisk = hasAsterisk ? 'true' : 'false';
        tile.style.cssText = 'padding:20px; background:#f0f0f0; border:2px solid #ddd; cursor:pointer; text-align:center; font-weight:bold; font-size:18px; user-select:none;';
        tile.textContent = hasAsterisk ? '*' : Math.floor(Math.random() * 10);
        tile.onclick = function() {
            tile.style.background = tile.style.background === '#4CAF50' ? '#f0f0f0' : '#4CAF50';
        };
        tileGrid.appendChild(tile);
    }
}

function submitGame1() {
    console.log('[HumanVerification] Submitting Game 1 - showing failure, moving to Game 2');
    alert('Verification failed. Please try again.');
    document.getElementById('game1Container').style.display = 'none';
    document.getElementById('game2Container').style.display = 'block';
    initializeGame2();
}

function initializeGame2() {
    // Draw identical images on both canvases - differences are impossible to find
    const canvas1 = document.getElementById('diffCanvas1');
    const canvas2 = document.getElementById('diffCanvas2');
    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    
    // Draw the same image on both
    const drawImage = (ctx) => {
        // Background
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, 200, 150);
        
        // Draw some shapes
        ctx.fillStyle = '#3498db';
        ctx.fillRect(20, 20, 60, 40);
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(140, 50, 25, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(30, 80, 80, 40);
        ctx.fillStyle = '#27ae60';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.arc(140 + i * 15, 100, 8, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    
    drawImage(ctx1);
    drawImage(ctx2);
    
    // Track clicks but never allow finding the "differences"
    let clickCount = 0;
    canvas1.onclick = () => {
        clickCount++;
        document.getElementById('diffCount').textContent = Math.min(clickCount, 4); // Max out at 4
    };
}

function submitGame2() {
    console.log('[HumanVerification] Submitting Game 2 - showing failure, moving to Game 3');
    alert('Verification failed. Please try again.');
    document.getElementById('game2Container').style.display = 'none';
    document.getElementById('game3Container').style.display = 'block';
    initializeGame3();
}

function submitGame3() {
    console.log('[HumanVerification] Submitting Game 3 - all tests failed, modal closes');
    // Final failure - close modal with defeat message
    alert('Verification failed. Please try again.');
    closeHumanVerificationModal();
}

function initializeGame3() {
    // Sliding puzzle that never solves correctly
    const puzzleBoard = document.getElementById('puzzleBoard');
    puzzleBoard.innerHTML = '';
    puzzleBoard.style.cssText = 'display:grid; grid-template-columns:repeat(3, 80px); gap:5px;';
    
    // Create tiles 1-8 and position 0 is empty
    const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 is the empty space
    
    // Shuffle tiles (but keep 0 at random position)
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    console.log('[HumanVerification] Puzzle tiles:', tiles);
    
    // Store puzzle state globally for move validation
    window.puzzleState = tiles.slice();
    window.emptyIndex = tiles.indexOf(0);
    
    tiles.forEach((num, idx) => {
        const tile = document.createElement('div');
        tile.dataset.index = idx;
        tile.dataset.number = num;
        
        if (num === 0) {
            // Empty space - invisible
            tile.style.cssText = 'width:80px; height:80px; background:transparent; cursor:default; border-radius:5px; font-size:0;';
            tile.textContent = '';
        } else {
            // Numbered tile
            tile.style.cssText = 'width:80px; height:80px; background:#2196F3; color:white; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:24px; cursor:pointer; border-radius:5px; transition: transform 0.1s;';
            tile.textContent = num;
            tile.onclick = () => movePuzzleTile(idx);
        }
        
        puzzleBoard.appendChild(tile);
    });
}

function movePuzzleTile(clickedIndex) {
    const emptyIndex = window.emptyIndex;
    const puzzleState = window.puzzleState;
    
    // Check if clicked tile is adjacent to empty space
    const row = Math.floor(emptyIndex / 3);
    const col = emptyIndex % 3;
    const clickedRow = Math.floor(clickedIndex / 3);
    const clickedCol = clickedIndex % 3;
    
    const isAdjacent = 
        (Math.abs(row - clickedRow) === 1 && col === clickedCol) ||
        (Math.abs(col - clickedCol) === 1 && row === clickedRow);
    
    if (isAdjacent) {
        // Swap tiles
        [puzzleState[emptyIndex], puzzleState[clickedIndex]] = [puzzleState[clickedIndex], puzzleState[emptyIndex]];
        window.emptyIndex = clickedIndex;
        
        // Re-render puzzle
        const tiles = document.querySelectorAll('#puzzleBoard div');
        tiles.forEach((tile, idx) => {
            const num = puzzleState[idx];
            tile.dataset.number = num;
            if (num === 0) {
                tile.style.background = 'transparent';
                tile.textContent = '';
                tile.onclick = null;
            } else {
                tile.style.background = '#2196F3';
                tile.textContent = num;
                tile.onclick = () => movePuzzleTile(idx);
            }
        });
    }
}

function closeHumanVerificationModal() {
    document.getElementById('humanVerificationModal').style.display = 'none';
    document.getElementById('game1Container').style.display = 'block';
    document.getElementById('game2Container').style.display = 'none';
    document.getElementById('game3Container').style.display = 'none';
    // Apply jibberish font to landing page
    document.body.classList.add('jibberish');
}

function progressToGame3() {
    document.getElementById('game2Container').style.display = 'none';
    document.getElementById('game3Container').style.display = 'block';
    initializeGame3();
}

window.initializeHumanVerification = initializeHumanVerification;
window.closeHumanVerificationModal = closeHumanVerificationModal;
window.progressToGame3 = progressToGame3;
window.submitGame1 = submitGame1;
window.submitGame2 = submitGame2;
window.submitGame3 = submitGame3;
window.initializeGame1 = initializeGame1;
window.initializeGame2 = initializeGame2;
window.initializeGame3 = initializeGame3;
window.togglePasswordVisibility = togglePasswordVisibility;
window.makeTinyLoginButton = makeTinyLoginButton;
window.moveLoginButton = moveLoginButton;
window.openBlueSkyTab = openBlueSkyTab;

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION TOKEN HANDLER
// Automatically processes email verification tokens from email links
// ═══════════════════════════════════════════════════════════════════════════
async function handleEmailVerificationToken() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const emailVerified = params.get('emailVerified');
    
    // Check if this is an email verification request
    if (token && !emailVerified) {
        console.log('[EmailVerification] Processing token:', token);
        
        // Show a simple verification modal
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000;';
        overlay.innerHTML = `
            <div style="background:white; padding:40px; border-radius:10px; text-align:center; max-width:400px;">
                <div style="font-size:48px; margin-bottom:20px;">⏳</div>
                <h2 style="margin:20px 0; color:#333;">Verifying Your Email</h2>
                <p style="color:#666;">Please wait while we verify your email address...</p>
                <div style="margin:20px 0; height:4px; background:#eee; border-radius:2px; overflow:hidden;">
                    <div style="height:100%; width:50%; background:#667eea; animation:none;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        
        try {
            const response = await fetch(
                `https://us-central1-cloud-beacon-55a40.cloudfunctions.net/verifyEmail?token=${encodeURIComponent(token)}`,
                { method: 'GET' }
            );
            
            const data = await response.json();
            console.log('[EmailVerification] Response:', data);
            
            if (response.ok && data.success) {
                // Success!
                overlay.innerHTML = `
                    <div style="background:white; padding:40px; border-radius:10px; text-align:center; max-width:400px;">
                        <div style="font-size:60px; margin-bottom:20px; color:#4caf50;">✓</div>
                        <h2 style="margin:20px 0; color:#333;">Email Verified!</h2>
                        <p style="color:#666; margin-bottom:20px;">Your email has been successfully verified.<br><strong>${data.email}</strong></p>
                        <p style="color:#999; font-size:14px;">Redirecting to login in 3 seconds...</p>
                    </div>
                `;
                
                // Clean URL and redirect to login
                setTimeout(() => {
                    window.history.replaceState({}, document.title, '/index.html');
                    location.reload();
                }, 3000);
            } else {
                // Error
                throw new Error(data.message || 'Verification failed');
            }
        } catch (error) {
            console.error('[EmailVerification] Error:', error);
            overlay.innerHTML = `
                <div style="background:white; padding:40px; border-radius:10px; text-align:center; max-width:400px;">
                    <div style="font-size:60px; margin-bottom:20px; color:#f44336;">✗</div>
                    <h2 style="margin:20px 0; color:#333;">Verification Failed</h2>
                    <p style="color:#666; margin-bottom:20px;">${error.message}</p>
                    <p style="color:#999; font-size:14px;">The link may have expired (24 hours).</p>
                    <button onclick="location.href='/index.html'" style="margin-top:20px; padding:10px 20px; background:#667eea; color:white; border:none; border-radius:5px; cursor:pointer;">Back to Login</button>
                </div>
            `;
        }
    }
}

// Run email verification check on page load
handleEmailVerificationToken();

// ═══════════════════════════════════════════════════════════════════════════
// SESSION-BASED LOGIN ATTEMPT TRACKING
// Clears attempt counters on page refresh/navigation
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Clear session-based login attempt counters when user navigates away
 * This ensures the counter resets to zero when the user comes back
 */
function setupSessionReset() {
    // Clear all login attempt counters on page unload
    window.addEventListener('beforeunload', function() {
        // Get all sessionStorage keys that are login attempts
        const keys = Object.keys(sessionStorage);
        keys.forEach(key => {
            if (key.startsWith('loginAttempts_')) {
                sessionStorage.removeItem(key);
            }
        });
    });
    
    // Also clear on page visibility change (tab switch, etc)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // User switched tabs - clear counters when they come back
            // (captured by beforeunload when they actually navigate away)
        }
    });
}

// Initialize session reset on page load
setupSessionReset();

// Verify loginHeckles config is loaded
console.log('=== LOGIN SYSTEM DIAGNOSTICS ===');
console.log('Config loaded:', !!window.loginAttemptConfig);
if (window.loginAttemptConfig) {
    console.log('Config values:', window.loginAttemptConfig);
    console.log('Phase 1 heckles available:', !!window.loginHecklesPhase1, 'count:', window.loginHecklesPhase1?.length);
    console.log('Phase 2 heckles available:', !!window.loginHecklesPhase2, 'count:', window.loginHecklesPhase2?.length);
    console.log('Email templates available:', !!window.emailTemplates);
} else {
    console.error('❌ loginHeckles.js not loaded! Make sure it is in index.html before app.js');
}
console.log('===================================');

// Reseed legislation bills from Parliament RSS feed
async function ensureLegislationBills() {
    try {
        const snap = await getDocs(
            query(collection(db, 'feed'), where('isLegislation', '==', true))
        );
        
        if (snap.size === 0) {
            console.log('[App] No legislation bills found—fetching from Parliament RSS...');
            
            try {
                // Fetch the real Parliament RSS feed
                const rssUrl = 'https://bills.parliament.uk/rss/allbills.rss';
                const response = await fetch(rssUrl);
                const text = await response.text();
                
                // Parse RSS with namespace handling
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');
                const items = xmlDoc.querySelectorAll('item');
                
                console.log(`[App] Found ${items.length} bills in RSS feed`);
                
                let added = 0;
                items.forEach(item => {
                    const title = item.querySelector('title')?.textContent || '';
                    const description = item.querySelector('description')?.textContent || '';
                    const link = item.querySelector('link')?.textContent || '';
                    const guid = item.querySelector('guid')?.textContent || '';
                    
                    // Extract stage from p4:stage attribute
                    let stage = item.getAttribute('p4:stage') || 'In Progress';
                    stage = stage.charAt(0).toUpperCase() + stage.slice(1); // Capitalize
                    
                    // Extract primary category (first category element that isn't "Commons" or "Lords")
                    let category = 'Government Bill';
                    const categoryElements = item.querySelectorAll('category');
                    categoryElements.forEach(cat => {
                        const catText = cat.textContent;
                        if (catText.includes('Government Bill')) {
                            category = 'Government Bill';
                        } else if (catText.includes("Private Member's Bill") || catText.includes("Private Members' Bill")) {
                            category = "Private Member's Bill";
                        } else if (catText.includes('Private Bill')) {
                            category = 'Private Bill';
                        } else if (catText.includes('Hybrid Bill')) {
                            category = 'Hybrid Bill';
                        }
                    });
                    
                    // Extract bill ID from guid (format: https://bills.parliament.uk/bills/3879)
                    const billIdMatch = guid.match(/bills\/(\d+)/);
                    const billId = billIdMatch ? billIdMatch[1] : Math.random().toString().slice(2);
                    
                    if (title && description && added < 10) {
                        addDoc(collection(db, 'feed'), {
                            type: 'legislation',
                            category: category,
                            title: title,
                            description: description,
                            parliamentBillId: billId,
                            authorId: 'parliament',
                            authorName: 'UK Parliament',
                            parliamentUrl: link || '',
                            isLegislation: true,
                            createdAt: serverTimestamp(),
                            votes: 0,
                            stage: stage,
                            publications: [],
                            amendments: [],
                            divisions: [],
                            sponsors: [],
                            stagesHistory: []
                        });
                        console.log(`[App] Added bill: "${title}" (${category}, ${stage})`);
                        added++;
                    }
                });
                console.log(`[App] Added ${added} bills from RSS feed`);
            } catch (rssErr) {
                console.warn('[App] RSS fetch failed, using fallback descriptions:', rssErr.message);
                
                // Fallback seed bills if RSS fails
                const seedBills = [
                    { 
                        title: "Tobacco and Vapes Bill", 
                        category: "Government Bill",
                        stage: "Report stage",
                        description: "A Bill to make provision about the supply of tobacco, vapes and other products, including provision prohibiting the sale of tobacco to people born on or after 1 January 2009 and provision about the licensing of retail sales and the registration of retailers; to enable product and information requirements to be imposed in connection with tobacco, vapes and other products; to control the advertising and promotion of tobacco, vapes and other products; and to make provision about smoke-free places, vape-free places and heated tobacco-free places."
                    },
                    { 
                        title: "Crime and Policing Bill", 
                        category: "Government Bill",
                        stage: "Report stage",
                        description: "A Bill to make provision about anti-social behaviour, offensive weapons, offences against people (including sexual offences), property offences, the criminal exploitation of persons, sex offenders, stalking and public order; to make provision about powers of the police, the border force and other similar persons; to make provision about confiscation; to make provision about the police; to make provision about terrorism and national security, and about international agreements relating to crime; to make provision about the criminal liability of bodies; and for connected purposes."
                    },
                    { 
                        title: "Children's Wellbeing and Schools Bill", 
                        category: "Government Bill",
                        stage: "Consideration of Lords amendments",
                        description: "A Bill to make provision about the safeguarding and welfare of children; about support for children in care or leaving care; about regulation of care workers; about regulation of establishments and agencies under Part 2 of the Care Standards Act 2000; about employment of children; about breakfast club provision and school uniform; about attendance of children at school; about regulation of independent educational institutions; about inspections of schools and colleges; about teacher misconduct; about Academies and teachers at Academies; repealing section 128 of the Education Act 2002; about school places and admissions; about establishing new schools; and for connected purposes."
                    },
                    { 
                        title: "Terminally Ill Adults (End of Life) Bill", 
                        category: "Private Member's Bill",
                        stage: "Committee stage",
                        description: "A Bill to allow adults who are terminally ill, subject to safeguards and protections, to request and be provided with assistance to end their own life; and for connected purposes."
                    },
                    { 
                        title: "Planning and Infrastructure Act 2025", 
                        category: "Government Bill",
                        stage: "Royal Assent",
                        description: "A Bill to make provision about infrastructure; to make provision about town and country planning; to make provision for a scheme, administered by Natural England, for a nature restoration levy payable by developers; to make provision about development corporations; to make provision about the compulsory purchase of land; to make provision about environmental outcomes reports; and for connected purposes."
                    },
                    { 
                        title: "Northern Ireland Troubles Bill", 
                        category: "Government Bill",
                        stage: "Committee of the whole House",
                        description: "A Bill to make new provision to address the legacy of the Northern Ireland Troubles."
                    },
                    { 
                        title: "English Devolution and Community Empowerment Bill", 
                        category: "Government Bill",
                        stage: "Committee stage",
                        description: "A Bill to make provision about combined authorities, combined county authorities, the Greater London Authority, local councils, police and crime commissioners and fire and rescue authorities, local audit and terms in business tenancies about rent."
                    },
                    { 
                        title: "Railways Bill", 
                        category: "Government Bill",
                        stage: "Report stage",
                        description: "A Bill to make provision about railways and railway services; and for connected purposes."
                    },
                    { 
                        title: "Pension Schemes Bill", 
                        category: "Government Bill",
                        stage: "Committee stage",
                        description: "A Bill to make provision about pension schemes; and for connected purposes."
                    },
                    { 
                        title: "Representation of the People Bill", 
                        category: "Government Bill",
                        stage: "2nd reading",
                        description: "A Bill to make provision extending the right to vote to 16 and 17 year olds; to make provision about the registration of voters; to make provision about the administration and conduct of elections, referendums and recall petitions; to make provision about election agents' addresses; to make provision about political expenditure and political donations; to make provision about information to be included in electronic campaigning material; to make provision about offences and civil sanctions in connection with elections, referendums and recall petitions and with donations and expenditure for political purposes; to make provision about the disclosure of information by the Electoral Commission; to make provision about the disqualification of offenders for holding elective offices, and their sentencing, where offences are aggravated by hostility towards persons involved in elections, referendums or recall petitions or holders of such offices; and for connected purposes."
                    }
                ];
                
                for (const bill of seedBills) {
                    await addDoc(collection(db, 'feed'), {
                        type: 'legislation',
                        category: bill.category,
                        title: bill.title,
                        description: bill.description,
                        parliamentBillId: Math.random().toString().slice(2),
                        authorId: 'parliament',
                        authorName: 'UK Parliament',
                        isLegislation: true,
                        createdAt: serverTimestamp(),
                        votes: 0,
                        stage: bill.stage,
                        publications: [],
                        amendments: [],
                        divisions: [],
                        sponsors: [],
                        stagesHistory: []
                    });
                }
                console.log('[App] Created fallback legislation bills from real Parliament data');
            }
        } else {
            console.log(`[App] Found ${snap.size} legislation bills`);
        }
    } catch (err) {
        console.error('[App] Failed to check/reseed bills:', err);
    }
}

// Cleanup function to remove old seeded legislation bills
async function cleanOldLegislation() {
    console.log('[Clean] Starting to remove old legislation bills...');
    
    try {
        const q = query(collection(db, 'feed'), where('isLegislation', '==', true));
        const snapshot = await getDocs(q);
        
        let deleted = 0;
        for (const docRef of snapshot.docs) {
            await deleteDoc(doc(db, 'feed', docRef.id));
            deleted++;
            console.log(`[Clean] Deleted: ${docRef.data().title}`);
        }
        
        console.log(`[Clean] Removed ${deleted} old legislation bills`);
        return deleted;
    } catch (error) {
        console.error('[Clean] Error:', error);
        throw error;
    }
}

let activeFilter = 'all';

// ═══════════════════════════════════════════════════════════════════════════
// TRUCE AGREEMENT HANDLER - Firestore Polling
// Periodically checks Firestore for truce agreements
// ═══════════════════════════════════════════════════════════════════════════
let trucePollingInterval = null;

function startTrucePolling(email) {
    // Only start if not already polling
    if (trucePollingInterval) {
        console.log('[Truce] Already polling for this email');
        return;
    }
    
    console.log('[Truce] Starting Firestore polling for:', email);
    
    trucePollingInterval = setInterval(async () => {
        try {
            // Check if truce agreement exists for this email
            const truceRef = doc(db, 'truceAgreements', email);
            const truceSnap = await getDoc(truceRef);
            
            if (truceSnap.exists() && truceSnap.data().agreed === true) {
                console.log('[Truce] Agreement detected in Firestore!');
                
                // Get attempt count from sessionStorage
                const storageKey = `loginAttempts_${email}`;
                const attemptCount = sessionStorage.getItem(storageKey);
                
                // Reset UI without page refresh
                resetLoginPageStylesAndPreserveCount(email, attemptCount);
                
                // Stop polling
                clearInterval(trucePollingInterval);
                trucePollingInterval = null;
                
                // Clean up Firestore
                try {
                    await deleteDoc(truceRef);
                    console.log('[Truce] Cleaned up Firestore agreement record');
                } catch (cleanupError) {
                    console.log('[Truce] Could not clean up Firestore (non-critical):', cleanupError);
                }
            }
        } catch (error) {
            console.log('[Truce] Polling error (non-critical):', error.message);
            // Continue polling anyway
        }
    }, 1500); // Poll every 1.5 seconds
}

function stopTrucePolling() {
    if (trucePollingInterval) {
        clearInterval(trucePollingInterval);
        trucePollingInterval = null;
        console.log('[Truce] Stopped Firestore polling');
    }
}

function resetLoginPageStylesAndPreserveCount(email, attemptCount) {
    console.log('[Truce] Resetting login page styles but preserving counter at', attemptCount);
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.style.cssText = ''; // Clear all inline styles
        loginBtn.style.display = 'block';
        loginBtn.onmouseenter = null;
        loginBtn.onmouseleave = null;
        window.buttonRemoved = false;
    }
    
    // Remove jibberish font if applied
    document.body.classList.remove('jibberish');
    
    // Close human verification modal if open
    const modal = document.getElementById('humanVerificationModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Display the counter if attempt count exists
    if (attemptCount) {
        const counterDiv = document.getElementById('loginAttemptCounter');
        if (counterDiv) {
            counterDiv.style.display = 'block';
            counterDiv.textContent = `🔴 Attempt ${attemptCount} (You've made ${attemptCount} failed login attempts)`;
        }
    }
    
    // Stop polling since we've detected the truce
    stopTrucePolling();
}

watchAuthState(async function(user) {
    if (user) {
        await user.reload();

        document.getElementById('landing').style.display = 'none';
        document.getElementById('auth').style.display = 'none';
        document.getElementById('userPanel').style.display = 'block';
        document.getElementById('feed').style.display = 'block';
        document.getElementById('username').textContent = user.displayName || user.email || 'Guest';

        document.getElementById('floatingMenu').style.display = 'block';
        document.getElementById('floatingPostBtn').style.display = 'flex';
        
        // Update menu button with user avatar and username
        const menuBtnAvatar = document.getElementById('menuBtnAvatar');
        const menuBtnUsername = document.getElementById('menuBtnUsername');
        if (menuBtnAvatar) {
            const displayName = user.displayName || user.email || 'User';
            menuBtnAvatar.textContent = displayName ? displayName[0].toUpperCase() : 'U';
            
            try {
                // Load user profile from Firestore to get photoURL
                const { db } = await import('./firebase.js');
                const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    if (userData.photoURL) {
                        menuBtnAvatar.style.backgroundImage = `url('${userData.photoURL}')`;
                        menuBtnAvatar.style.backgroundSize = 'cover';
                        menuBtnAvatar.style.backgroundPosition = 'center';
                        menuBtnAvatar.textContent = '';
                    }
                }
            } catch (err) {
                console.error('Error loading user profile for avatar:', err);
            }
            
            // Fallback to Firebase auth photoURL if available
            if (user.photoURL && !menuBtnAvatar.style.backgroundImage) {
                menuBtnAvatar.style.backgroundImage = `url('${user.photoURL}')`;
                menuBtnAvatar.style.backgroundSize = 'cover';
                menuBtnAvatar.style.backgroundPosition = 'center';
                menuBtnAvatar.textContent = '';
            }
        }
        if (menuBtnUsername) {
            menuBtnUsername.textContent = user.displayName || user.email || 'User';
            menuBtnUsername.style.display = 'inline-block';
        }

        if (user.isAnonymous) {
            document.body.classList.add('jibberish');
        } else {
            document.body.classList.remove('jibberish');
        }

        window.currentUserId = user.uid;
        
        // Load user color settings
        ColorPalette.setUserId(user.uid);
        
        // Signal that palette is ready
        if (typeof LoadingManager !== 'undefined') {
            LoadingManager.setPaletteReady();
        }
        
        // Initialize messaging system
        if (typeof MessagingUI !== 'undefined') {
            MessagingUI.init();
        }
        
        // Initialize notifications system
        if (typeof NotificationsUI !== 'undefined') {
            NotificationsUI.init(user.uid);
        }
        
        try {
            await syncLegislation();
        } catch (err) {
            console.warn('[App] Legislation sync may have failed:', err);
        }
        
        // Ensure legislation bills exist (reseed if needed)
        await ensureLegislationBills();
        
        // Load and display feed
        await loadPosts();
    } else {
        document.getElementById('landing').style.display = 'block';
        document.getElementById('auth').style.display = 'none';
        document.getElementById('userPanel').style.display = 'none';
        document.getElementById('feed').style.display = 'none';
        document.getElementById('floatingMenu').style.display = 'none';
        document.getElementById('floatingPostBtn').style.display = 'none';
        document.body.classList.remove('jibberish');
        window.currentUserId = null;
        
        // Clear user color settings
        ColorPalette.clearUserId();
    }
});

function timeAgo(date) {
    if (!date) return '';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

/**
 * Track login attempts in sessionStorage (session-only, resets on page refresh)
 * Sessions store key: 'loginAttempts_{email}'
 * @param {string} email - Email address attempting login
 * @param {string} heckle - The heckle message shown to user
 * @returns {number} Current attempt count for this session
 */
function trackLoginAttempt(email, heckle) {
    // Use sessionStorage to track attempts (resets on page refresh)
    const storageKey = `loginAttempts_${email}`;
    let currentCount = 1;
    
    try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
            currentCount = parseInt(stored, 10) + 1;
        }
        
        // Store the updated count
        sessionStorage.setItem(storageKey, currentCount.toString());
    } catch (error) {
        console.warn('Could not access sessionStorage:', error);
        // Fallback if sessionStorage is unavailable
    }
    
    // Check if we need to send warning emails
    const config = window.loginAttemptConfig || { 
        warningEmailAttempt: 5, 
        phase2Threshold: 21,
        rateLimitEmailAttempt: 21,
        finalWarningEmailAttempt: 34 
    };
    
    if (currentCount === config.warningEmailAttempt) {
        // Send first warning email
        sendLoginWarningEmail(email, currentCount, heckle, 'warning');
    } else if (currentCount === config.rateLimitEmailAttempt) {
        // Send rate limit warning email
        sendLoginWarningEmail(email, currentCount, heckle, 'rateLimit');
    } else if (currentCount === config.finalWarningEmailAttempt) {
        // Send final warning email with attachment
        sendLoginWarningEmail(email, currentCount, heckle, 'finalWarning');
    }
    
    return currentCount;
}

/**
 * Send security warning email on suspicious login attempts
 * Calls the sendAccountSecurityEmail Cloud Function
 * @param {string} email - Email to send to
 * @param {number} attemptCount - Number of attempts
 * @param {string} heckle - Heckle to include
 * @param {string} emailType - 'warning', 'rateLimit', or 'finalWarning'
 */
async function sendLoginWarningEmail(email, attemptCount, heckle, emailType) {
    try {
        const templates = window.emailTemplates;
        if (!templates) {
            console.error('[Email] Email templates not loaded');
            return;
        }
        
        const emailConfig = templates[emailType];
        if (!emailConfig) {
            console.error(`[Email] Email config not found for type: ${emailType}`);
            return;
        }
        
        const subject = emailConfig.subject;
        let body = emailConfig.getBody(email, attemptCount, heckle);
        
        // If final warning, include attachment content
        if (emailType === 'finalWarning' && templates.finalWarningAttachment) {
            if (typeof templates.finalWarningAttachment === 'function') {
                body += '\n\n' + templates.finalWarningAttachment(attemptCount);
            } else {
                body += '\n\n' + templates.finalWarningAttachment;
            }
        }
        
        console.log(`[Email] Calling sendAccountSecurityEmail Cloud Function for ${emailType} email to ${email}`);
        
        try {
            // Call the Cloud Function HTTP endpoint directly (no auth required)
            const functionUrl = 'https://us-central1-cloud-beacon-55a40.cloudfunctions.net/sendSecurityEmail';
            
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    subject: subject,
                    body: body,
                    attemptCount: attemptCount
                })
            });
            
            if (!response.ok) {
                console.error(`[Email] HTTP Error ${response.status}:`, response.statusText);
                const errorText = await response.text();
                console.error('[Email] Error details:', errorText);
                return;
            }
            
            const result = await response.json();
            console.log(`[Email] ✅ ${emailType} email queued to ${email}:`, result);
        } catch (functionError) {
            console.error('[Email] Cloud Function call failed:', functionError);
            console.warn('[Email] Note: Make sure Cloud Functions are deployed. Deploy with: cd functions && firebase deploy --only functions');
        }
    } catch (error) {
        console.error(`[Email] Error sending ${emailType} email:`, error);
    }
}

/**
 * DEPRECATED: sendEmailViaCloudFunction - replaced by sendAccountSecurityEmail callable function
 */
// No longer used - see sendLoginWarningEmail() for current implementation

/**
 * Display attempt counter on the login form
 * Shows counter after 5 failed attempts
 */
function displayAttemptCounter(email, attemptCount) {
    const counterDiv = document.getElementById('loginAttemptCounter');
    if (!counterDiv) return;
    
    if (attemptCount >= 5) {
        counterDiv.style.display = 'block';
        counterDiv.textContent = `⚠️ Failed attempts: ${attemptCount}`;
    } else {
        counterDiv.style.display = 'none';
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous error
    errorDiv.textContent = '';
    errorDiv.style.fontFamily = 'inherit';
    
    // Log that we're checking config on first login attempt
    if (!window.loginAttemptConfig) {
        console.error('❌ loginAttemptConfig not loaded! Check loginHeckles.js is included.');
    } else {
        console.log('[Login] Config loaded:', window.loginAttemptConfig);
    }
    
    // Get current attempt count
    const storageKey = `loginAttempts_${email}`;
    let currentCount = 0;
    try {
        const stored = sessionStorage.getItem(storageKey);
        if (stored) {
            currentCount = parseInt(stored, 10);
        }
    } catch (e) {
        // Ignore storage errors
    }
    
    const config = window.loginAttemptConfig || {
        phase2Threshold: 21,
        warningEmailAttempt: 5,
        rateLimitEmailAttempt: 21,
        finalWarningEmailAttempt: 34
    };
    
    // Track if we incremented in bypass mode to avoid double-incrementing
    let bypassModeIncremented = false;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // FIREBASE RATE LIMIT BYPASS
    // After 3 failed attempts, skip Firebase auth to prevent account lockout
    // Just track locally and show heckles. Still send emails at thresholds.
    // ═══════════════════════════════════════════════════════════════════════════
    if (currentCount >= 3) {
        console.log(`[Login] BYPASS MODE: Attempt ${currentCount + 1} (Firebase disabled after 3 attempts)`);
        
        // Increment attempt counter
        currentCount++;
        bypassModeIncremented = true;
        try {
            sessionStorage.setItem(storageKey, currentCount.toString());
        } catch (e) {
            // Ignore storage errors
        }
        
        // Get the scripted/grouped heckle for this specific attempt
        const randomHeckle = window.getHeckleForAttempt ? 
            window.getHeckleForAttempt(currentCount) : 
            'Wrong password, try again!';
        
        // Check if this attempt triggers the password suggestion button (attempt 13)
        const triggerPasswordSuggestion = (currentCount === config.passwordSuggestionAttempt);
        
        // Display the heckle
        errorDiv.textContent = '❌ ' + randomHeckle;
        
        // Check if we should send an email
        try {
            if (currentCount === config.warningEmailAttempt) {
                console.log(`[Login] 🚨 SENDING WARNING EMAIL at attempt ${currentCount}`);
                await sendLoginWarningEmail(email, currentCount, randomHeckle, 'warning');
            } else if (currentCount === config.rateLimitEmailAttempt) {
                console.log(`[Login] ⚠️ SENDING RATE LIMIT EMAIL at attempt ${currentCount}`);
                await sendLoginWarningEmail(email, currentCount, randomHeckle, 'rateLimit');
            } else if (currentCount === config.finalWarningEmailAttempt) {
                console.log(`[Login] 🛑 SENDING FINAL WARNING EMAIL at attempt ${currentCount}`);
                await sendLoginWarningEmail(email, currentCount, randomHeckle, 'finalWarning');
            }
        } catch (emailError) {
            console.error('[Login] Email sending error:', emailError);
        }
        
        displayAttemptCounter(email, currentCount);
        
        // Handle special events based on attempt number
        if (currentCount === 8) {
            makeTinyLoginButton();
        }
        
        // Move button for attempts 14-20
        if (currentCount >= 14 && currentCount <= 20) {
            moveLoginButton(currentCount);
        }
        
        // Handle password suggestion button at attempt 13
        if (triggerPasswordSuggestion) {
            showPasswordSuggestionButton(email);
        }
        
        // Open Bluesky tab at attempt 21
        if (currentCount === 21) {
            openBlueSkyTab();
        }
        
        // Start impossible human verification at attempt 22
        if (currentCount === 22) {
            setTimeout(initializeHumanVerification, 500);
        }
        
        // Make button invisible at attempt 23
        if (currentCount === 23) {
            makeButtonInvisible();
        }
        
        // Restore button to original position (but keep invisible) at attempt 24
        if (currentCount === 24) {
            restoreButtonVisible();
        }
        
        // Move invisible button to random locations for attempts 25-33
        if (currentCount >= 25 && currentCount <= 33) {
            moveLoginButtonRandom(currentCount);
        }
        
        // Remove button and send truce email at attempt 34
        if (currentCount === 34) {
            removeLoginButtonAttempt34();
            // Start polling for truce agreement
            startTrucePolling(email);
            // Send truce email
            try {
                console.log(`[Login] 📧 SENDING TRUCE EMAIL at attempt ${currentCount}`);
                await sendLoginWarningEmail(email, currentCount, randomHeckle, 'truce');
            } catch (emailError) {
                console.error('[Login] Truce email error:', emailError);
            }
        }
        
        // Display IP and Computer ID at attempts 35+
        if (currentCount >= 35) {
            const { ip, computerID } = getSpoofsIPAndComputerID();
            const ipMessage = `🖥️ IP ADDRESS: ${ip}<br><br>🔑 COMPUTER ID: ${computerID}`;
            errorDiv.innerHTML = '❌ ' + randomHeckle.replace(/\n/g, '<br>') + '<br><br><div style="font-size:18px; font-weight:bold; color:#ff0000; line-height:1.6;">' + ipMessage + '</div>';
            greyOutLoginButton();
        }
        
        // Don't return - try Firebase anyway in case password is correct or lock expired
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NORMAL FIREBASE AUTH (All attempts - bypass mode just shows heckles first)
    // ═══════════════════════════════════════════════════════════════════════════
    try {
        await login(email, password);
        
        // Successful login - clear the attempt counter
        try {
            sessionStorage.removeItem(`loginAttempts_${email}`);
            document.getElementById('loginAttemptCounter').style.display = 'none';
        } catch (e) {
            // Ignore errors clearing counter
        }
    } catch (error) {
        console.error('Login error:', error);
        
        // For login errors, we'll track and show heckles
        if (error.code === 'auth/wrong-password' || 
            error.code === 'auth/invalid-credential' ||
            error.message?.includes('wrong-password') ||
            error.message?.includes('invalid-credential') ||
            error.code === 'auth/too-many-requests') {
            
            // Get the current count - only increment if not already incremented in bypass mode
            let attemptCount;
            if (bypassModeIncremented) {
                // Already incremented in bypass mode, just use current value
                try {
                    const stored = sessionStorage.getItem(storageKey);
                    attemptCount = stored ? parseInt(stored, 10) : 1;
                } catch (e) {
                    attemptCount = 1;
                }
                console.log(`[Login] Using bypass-mode count: ${attemptCount}`);
            } else {
                // Normal increment for first 3 attempts
                attemptCount = 1;
                try {
                    const stored = sessionStorage.getItem(storageKey);
                    if (stored) {
                        attemptCount = parseInt(stored, 10) + 1;
                    }
                } catch (e) {
                    // Ignore storage errors
                }
                
                // Save the incremented counter
                try {
                    sessionStorage.setItem(storageKey, attemptCount.toString());
                } catch (e) {
                    // Ignore storage errors
                }
            }
            
            // Get the appropriate heckle using the new Marvin system
            const randomHeckle = window.getHeckleForAttempt ? 
                window.getHeckleForAttempt(attemptCount) : 
                'Wrong password, try again!';
            
            // Check if we should send an email based on the current count
            console.log(`[Login] Attempt ${attemptCount} for ${email} - config thresholds:`, config.warningEmailAttempt, config.rateLimitEmailAttempt, config.finalWarningEmailAttempt);
            try {
                if (attemptCount === config.warningEmailAttempt) {
                    console.log(`[Login] 🚨 SENDING WARNING EMAIL at attempt ${attemptCount}`);
                    await sendLoginWarningEmail(email, attemptCount, randomHeckle, 'warning');
                } else if (attemptCount === config.rateLimitEmailAttempt) {
                    console.log(`[Login] ⚠️ SENDING RATE LIMIT EMAIL at attempt ${attemptCount}`);
                    await sendLoginWarningEmail(email, attemptCount, randomHeckle, 'rateLimit');
                } else if (attemptCount === config.finalWarningEmailAttempt) {
                    console.log(`[Login] 🛑 SENDING FINAL WARNING EMAIL at attempt ${attemptCount}`);
                    await sendLoginWarningEmail(email, attemptCount, randomHeckle, 'finalWarning');
                } else {
                    console.log(`[Login] No email trigger at attempt ${attemptCount}`);
                }
            } catch (emailError) {
                console.error('[Login] Email sending error:', emailError);
            }
            
            // Display the heckle
            errorDiv.textContent = '❌ ' + randomHeckle;
            
            // Handle special events based on attempt number
            if (attemptCount === 8) {
                makeTinyLoginButton();
            }
            
            // Move button for attempts 14-20
            if (attemptCount >= 14 && attemptCount <= 20) {
                moveLoginButton(attemptCount);
            }
            
            // Open Bluesky tab at attempt 21
            if (attemptCount === 21) {
                openBlueSkyTab();
            }
            
            // Start impossible human verification at attempt 22
            if (attemptCount === 22) {
                setTimeout(initializeHumanVerification, 500);
            }
            
            // Make button invisible at attempt 23
            if (attemptCount === 23) {
                makeButtonInvisible();
            }
            
            // Restore button to original position (but keep invisible) at attempt 24
            if (attemptCount === 24) {
                restoreButtonVisible();
            }
            
            // Move invisible button to random locations for attempts 25-33
            if (attemptCount >= 25 && attemptCount <= 33) {
                moveLoginButtonRandom(attemptCount);
            }
            
            // Remove button and send truce email at attempt 34
            if (attemptCount === 34) {
                removeLoginButtonAttempt34();
                // Start polling for truce agreement
                startTrucePolling(email);
                // Send truce email
                try {
                    console.log(`[Login] 📧 SENDING TRUCE EMAIL at attempt ${attemptCount}`);
                    await sendLoginWarningEmail(email, attemptCount, randomHeckle, 'truce');
                } catch (emailError) {
                    console.error('[Login] Truce email error:', emailError);
                }
            }
            
            // Display IP and Computer ID at attempts 35+
            if (attemptCount >= 35) {
                const { ip, computerID } = getSpoofsIPAndComputerID();
                const ipMessage = `🖥️ IP ADDRESS: ${ip}<br><br>🔑 COMPUTER ID: ${computerID}`;
                errorDiv.innerHTML = '❌ ' + randomHeckle.replace(/\n/g, '<br>') + '<br><br><div style="font-size:18px; font-weight:bold; color:#ff0000; line-height:1.6;">' + ipMessage + '</div>';
                greyOutLoginButton();
            }
            
            // Display attempt counter after 5 attempts
            displayAttemptCounter(email, attemptCount);
        } else if (error.code === 'auth/user-not-found') {
            errorDiv.textContent = '❌ Email not found. Try registering instead!';
        } else if (error.code === 'auth/invalid-email') {
            errorDiv.textContent = '❌ Invalid email format.';
        } else if (error.message?.includes('Email verification required')) {
            errorDiv.textContent = '❌ Check your email to verify your account first!';
        } else {
            // Other Firebase errors
            errorDiv.textContent = '❌ Login failed. Please try again.';
        }
    }
}

function showPasswordSuggestionButton(email) {
    const loginBtn = document.getElementById('loginBtn');
    const passwordField = document.getElementById('loginPassword');
    const errorDiv = document.getElementById('loginError');
    
    if (!loginBtn) {
        console.error('[PasswordSuggestion] Login button not found');
        return;
    }
    
    console.log('[PasswordSuggestion] Showing password suggestion button at attempt 13');
    
    // Replace the login button with a password suggestion button
    const suggestBtn = document.createElement('button');
    suggestBtn.id = 'suggestPasswordBtn';
    suggestBtn.type = 'button';
    suggestBtn.innerHTML = '💡 Suggest a Password';
    suggestBtn.style.cssText = loginBtn.style.cssText; // Copy button styling
    
    suggestBtn.onclick = async function(e) {
        e.preventDefault();
        console.log('[PasswordSuggestion] User clicked suggest button');
        
        // Show generating animation
        suggestBtn.innerHTML = '⏳ Generating...';
        suggestBtn.disabled = true;
        
        // Get a random dummy password from the Marvin system
        const dummyPasswords = window.dummyPasswords || [
            'correct-horse-battery-staple',
            'hunter2',
            'password123',
            'letmein',
            'admin',
            'qwerty',
            'dragon',
            '123456'
        ];
        
        // Simulate thinking about it for 1-2 seconds (Marvin would be reluctant)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        
        // Pick a random dummy password
        const suggested = dummyPasswords[Math.floor(Math.random() * dummyPasswords.length)];
        console.log('[PasswordSuggestion] Suggested password:', suggested);
        
        // Insert it into the password field
        if (passwordField) {
            passwordField.value = suggested;
        }
        
        // Update the error message with Marvin's response
        const heckle = window.getHeckleForAttempt ? 
            window.getHeckleForAttempt(13) : 
            'I suppose you\'ll want me to just... suggest something for you?';
        errorDiv.textContent = '💭 ' + heckle;
        
        // Restore the login button
        suggestBtn.remove();
        loginBtn.style.display = 'inline-block';
        console.log('[PasswordSuggestion] Button restored, password suggested');
    };
    
    // Hide the login button and show the suggestion button instead
    loginBtn.style.display = 'none';
    loginBtn.parentNode.insertBefore(suggestBtn, loginBtn.nextSibling);
    console.log('[PasswordSuggestion] Password suggestion button shown, login button hidden');
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const errorDiv = document.getElementById('registerError');
    
    // Clear previous error
    errorDiv.textContent = '';
    
    // Simple validation
    if (!username || !email || !password) {
        errorDiv.textContent = '❌ Please fill in all fields';
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = '❌ Password must be at least 6 characters';
        return;
    }
    
    try {
        await register(email, password, username);
        console.log('[Registration] ✅ Account created:', email);
        errorDiv.style.color = '#22c55e';
        errorDiv.textContent = '✅ Account created! Check your email to verify your address.';
        
        // Clear form
        document.getElementById('regUsername').value = '';
        document.getElementById('regEmail').value = '';
        document.getElementById('regPassword').value = '';
        
        // Switch back to login after 3 seconds
        setTimeout(() => {
            showLogin();
            errorDiv.textContent = '';
            errorDiv.style.color = '#ef4444';
        }, 3000);
    } catch (error) {
        console.error('[Registration] Error:', error);
        errorDiv.style.color = '#ef4444';
        
        if (error.code === 'auth/email-already-in-use') {
            errorDiv.textContent = '❌ Email already registered. Try logging in!';
        } else if (error.code === 'auth/invalid-email') {
            errorDiv.textContent = '❌ Invalid email format';
        } else if (error.code === 'auth/weak-password') {
            errorDiv.textContent = '❌ Password is too weak';
        } else {
            errorDiv.textContent = '❌ ' + (error.message || 'Registration failed');
        }
    }
}

async function handleGuest() {
    await loginAsGuest();
}

async function handleLogout() {
    await logout();
}

// Store temporary image data
let tempPostImageData = null;

function handlePostImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Read and compress image
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Compress image using canvas
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Resize if larger than 800px wide
            if (width > 800) {
                height = Math.round(height * (800 / width));
                width = 800;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with reduced quality
            tempPostImageData = canvas.toDataURL('image/jpeg', 0.7);
            document.getElementById('postImageName').textContent = file.name;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function clearPostForm() {
    document.getElementById('postContent').value = '';
    document.getElementById('postVideoEmbed').value = '';
    document.getElementById('postImage').value = '';
    document.getElementById('postImageName').textContent = '';
    tempPostImageData = null;
}

async function handlePost() {
    const content = document.getElementById('postContent').value;
    if (!content && !tempPostImageData) return alert('Please add content or an image');
    
    const videoEmbed = document.getElementById('postVideoEmbed').value || null;
    
    try {
        await createPost(content, tempPostImageData, videoEmbed);
        clearPostForm();
        closeModal();
        await loadPosts();
    } catch (error) {
        alert('Error posting: ' + (error.message || error));
    }
}

const filterLabels = {
    all: 'All', following: 'Following', posts: 'Posts', projects: 'Projects',
    legislation: 'All Bills', government: 'Government Bills',
    private: "Private Members'", lords: 'Lords Bills'
};

function setFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll('.filter-panel-item, .filter-sub-item').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    document.getElementById('filterLabel').textContent = filterLabels[filter] || filter;
    document.getElementById('filterPanel').classList.remove('open');
    document.getElementById('filterChevron').textContent = '▾';
    loadPosts();
}

function toggleFilterPanel(e) {
    e.stopPropagation();
    const panel = document.getElementById('filterPanel');
    const chevron = document.getElementById('filterChevron');
    const isOpen = panel.classList.toggle('open');
    chevron.textContent = isOpen ? '▴' : '▾';
    if (!isOpen) document.getElementById('projectsSubPanel')?.classList.remove('open');
}

function toggleFilterSub(e) {
    e.stopPropagation();
    const sub = document.getElementById('projectsSubPanel');
    const chevronEl = e.currentTarget.querySelector('.sub-chevron');
    const isOpen = sub.classList.toggle('open');
    if (chevronEl) chevronEl.textContent = isOpen ? '▾' : '▸';
}

// Close filter panel and floating menu on outside click
document.addEventListener('click', function(e) {
    const filterWrap = document.getElementById('filterDropdownWrap');
    if (filterWrap && !filterWrap.contains(e.target)) {
        document.getElementById('filterPanel')?.classList.remove('open');
        const chevron = document.getElementById('filterChevron');
        if (chevron) chevron.textContent = '▾';
        document.getElementById('projectsSubPanel')?.classList.remove('open');
    }
    const floatingMenu = document.getElementById('floatingMenu');
    if (floatingMenu && !floatingMenu.contains(e.target)) {
        const menuList = document.getElementById('menuList');
        if (menuList) menuList.style.display = 'none';
    }
});

window.setFilter = setFilter;
window.toggleFilterPanel = toggleFilterPanel;
window.toggleFilterSub = toggleFilterSub;

// Helper function to generate follow button for feed posts
function getFollowButtonHtml(authorId, authorName) {
    // Don't show follow button for:
    // 1. Parliament/system accounts
    // 2. Current user's own posts
    // 3. Anonymous/unknown users
    if (!authorId || authorId === 'parliament' || authorId === window.currentUserId || !authorName || authorName === 'Guest') {
        return '';
    }
    
    return `<button class="follow-btn" onclick="window.handleFeedFollow('${authorId}', this)" style="margin-left:8px; padding:4px 8px; background:#3b82f6; color:white; border:none; border-radius:4px; cursor:pointer; font-size:12px;">Follow</button>`;
}

// Cache for author data to avoid repeated fetches
const authorCache = {};

async function getAuthorInfo(authorId) {
    // Return cached data if available
    if (authorCache[authorId]) {
        return authorCache[authorId];
    }
    
    try {
        const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const userRef = doc(db, 'users', authorId);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            authorCache[authorId] = {
                username: data.username || 'User',
                photoURL: data.photoURL || null
            };
            return authorCache[authorId];
        }
    } catch (error) {
        console.error('Error fetching author info:', error);
    }
    
    // Fallback
    authorCache[authorId] = {
        username: 'User',
        photoURL: null
    };
    return authorCache[authorId];
}

async function preloadAuthorInfo(items) {
    const authorIds = [...new Set(items.map(item => item.authorId).filter(id => id && id !== 'parliament'))];
    await Promise.all(authorIds.map(id => getAuthorInfo(id)));
}

async function loadPosts() {
    try {
        const { getFeed } = await import('./projects.js');
        let items = await getFeed();
        
        console.log('[App] Feed loaded, items count:', items.length);
        if (items.length === 0) {
            console.warn('[App] Feed is empty - no posts to display');
        }

        // Apply filter
        if (activeFilter !== 'all') {
            if (activeFilter === 'following') {
                // Get current user's following list
                if (!window.currentUserId) {
                    console.log('[App] Not logged in - cannot filter by following');
                    items = [];
                } else {
                    const { default: FollowSystem } = await import('./follows.js');
                    const followingUsers = await FollowSystem.getFollowing(window.currentUserId);
                    
                    // Extract user IDs - try multiple property names
                    const followingIds = new Set();
                    followingUsers.forEach(u => {
                        // Try different property names where the ID might be stored
                        const userId = u.uid || u.id || u.userId || Object.keys(u)[0];
                        if (userId) followingIds.add(userId);
                    });
                    
                    console.log('[App] Following IDs:', Array.from(followingIds));
                    console.log('[App] Sample post authorIds:', items.slice(0, 5).map(i => i.authorId));
                    
                    // Filter to show only posts from followed users
                    items = items.filter(item => followingIds.has(item.authorId));
                    console.log('[App] Filtered to following:', items.length, 'posts from', followingIds.size, 'followed users');
                }
            } else {
                items = items.filter(function(item) {
                    if (activeFilter === 'posts') return item.type === 'post' || item.type === 'project-update';
                    if (activeFilter === 'projects') return item.type === 'project' || item.type === 'legislation' || item.type === 'repost';
                    if (activeFilter === 'legislation') return item.type === 'legislation';
                    if (activeFilter === 'government') return item.type === 'legislation' && item.category === 'Government Bill';
                    if (activeFilter === 'private') return item.type === 'legislation' && item.category === "Private Member's Bill";
                    if (activeFilter === 'lords') return item.type === 'legislation' && item.category === 'Lords Bill';
                    return true;
                });
            }
        }
        
        // Filter out archived projects/legislation (unless manually searched for)
        items = items.filter(item => !item.archived);
        
        // Preload author info for all authors in the feed
        await preloadAuthorInfo(items);

        const container = document.getElementById('posts');
        if (!container) {
            console.error('[App] Posts container not found');
            return;
        }
        
        container.innerHTML = items.map(function(item) {
        const createdAtDate = item.createdAt ? new Date(item.createdAt.seconds * 1000) : null;
        const date = createdAtDate ? timeAgo(createdAtDate) : 'Just now';
        
        // Use cached author info instead of stored authorName
        const authorInfo = authorCache[item.authorId] || { username: item.authorName || 'Guest', photoURL: null };
        const displayName = authorInfo.username;
        const authorAvatar = authorInfo.photoURL;
        const initials = (displayName.split(' ').map(s=>s[0]).join('').slice(0,2)).toUpperCase();
        const avatarHtml = authorAvatar 
            ? `<div class="avatar" style="background-image:url('${authorAvatar}'); background-size:cover;"></div>`
            : `<div class="avatar">${initials}</div>`;

        if (item.type === 'legislation') {
            const legCategoryColors = {
                "Government Bill": "#0ca678",
                "Private Member's Bill": "#3b82f6",
                "Lords Bill": "#a855f7"
            };
            const tabColor = legCategoryColors[item.category] || "#0ca678";
            const author = displayName || 'UK Parliament';
            return `
                <div class="post">
                    <div class="post-header">
                        ${avatarHtml}
                        <div class="post-meta">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div class="author"><a href="profile.html?uid=${item.authorId || ''}">${author}</a>${getFollowButtonHtml(item.authorId, displayName)}</div>
                            </div>
                            <div class="time">${date}</div>
                        </div>
                    </div>
                    <div class="project-tag-container" style="background:${tabColor};">
                        <a href="project.html?id=${item.id}&type=legislation" style="color:#fff; text-decoration:none;">
                            <div class="project-tag-badge" style="background:${tabColor};">🏛️ ${item.category || 'Bill'}</div>
                            <div class="project-tag-title" style="background:${adjustBrightness(tabColor, 20)};">${item.title}</div>
                        </a>
                    </div>
                    <p style="margin:6px 0;color:#555;">${item.description || ''}</p>
                    <div class="post-actions">
                        <div class="votes">
                            <button onclick="handleVote('${item.id}', 'up', 'post')">▲</button>
                            <span>${item.votes || 0}</span>
                            <button onclick="handleVote('${item.id}', 'down', 'post')">▼</button>
                        </div>
                        <button class="post-action-btn" onclick="toggleComments('${item.id}')">💬</button>
                        <button class="post-action-btn share-trigger" onclick="EnhancedSharing.shareProject('${item.parliamentBillId}', '${item.title.replace(/'/g,"\\'")}'  , '${(item.description||'').replace(/'/g,"\\'")}'  , null, 'Law'); return false;">🔗</button>
                        ${window.currentUserId && item.authorId === window.currentUserId ? `<div class="post-owner-actions"><button class="post-action-btn" onclick="handleEditPost('${item.id}')">✎</button><button class="post-action-btn" onclick="handleDeletePost('${item.id}')">🗑</button></div>` : ''}
                    </div>
                </div>
            `;
        } else if (item.type === 'project') {
            const projCategoryColors = {
                Tech: "#6366f1", Civil: "#f59f00", Community: "#ec4899", Law: "#0ca678",
                // legacy support for old category names
                Physical: "#f59f00", Inventive: "#6366f1"
            };
            const catIcons = { Tech: "💻", Civil: "🏗️", Community: "🤝", Law: "⚖️", Physical: "🏗️", Inventive: "💡" };
            const tabColor = projCategoryColors[item.category] || "#5c7cfa";
            const icon = catIcons[item.category] || "📁";
            const author = displayName || 'Guest';
            const headerImage = item.headerPictureUrl ? `<img src="${item.headerPictureUrl}" style="max-width:100%; height:auto; max-height:400px; border-radius:6px; margin:6px 0; display:block;">` : '';
            
            // Determine if this is a proposal or regular project
            const isProposal = item.isProposal === true;
            const badgeColor = isProposal ? "#60a5fa" : tabColor;
            const badgeText = isProposal ? "📋 Proposal" : `${icon} ${item.category || 'Project'}`;
            
            // Handle media embeds (video, image, link)
            let mediaHtml = '';
            const media = item.media || {};
            if (media.image) mediaHtml += `<img src="${media.image}" style="max-width:100%; border-radius:4px; margin:8px 0; max-height:600px;">`;
            if (media.youtube) mediaHtml += `<iframe width="100%" height="420" style="margin:8px 0; border-radius:4px;" src="https://www.youtube.com/embed/${media.youtube}" frameborder="0" allowfullscreen></iframe>`;
            if (media.video) mediaHtml += `<video width="100%" controls style="border-radius:4px; margin:8px 0; max-height:600px;"><source src="${media.video}"></video>`;
            if (media.link) {
                const isValidUrl = /^https?:\/\//.test(media.link);
                const displayUrl = media.link.replace(/^https?:\/\//, '').substring(0, 60);
                mediaHtml += isValidUrl
                    ? `<div style="margin:8px 0;"><a href="${media.link}" target="_blank" style="color:#3b82f6; text-decoration:none; font-size:13px;">🔗 ${displayUrl}</a></div>`
                    : `<div style="margin:8px 0; color:#3b82f6; font-size:13px;">🔗 ${media.link}</div>`;
            }
            
            return `
                <div class="post">
                    <div class="post-header">
                        ${avatarHtml}
                        <div class="post-meta">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div class="author"><a href="profile.html?uid=${item.authorId}">${author}</a>${getFollowButtonHtml(item.authorId, displayName)}</div>
                            </div>
                            <div class="time">${date}</div>
                        </div>
                    </div>
                    <div class="project-tag-container" style="background:${badgeColor};">
                        <a href="project.html?id=${item.projectId}" style="color:#fff; text-decoration:none;">
                            <div class="project-tag-badge" style="background:${badgeColor};">${badgeText}</div>
                            <div class="project-tag-title" style="background:${adjustBrightness(badgeColor, 20)};">${item.title}</div>
                        </a>
                    </div>
                    ${headerImage}
                    ${mediaHtml}
                    <p style="margin:6px 0;color:#555;">${item.description || ''}</p>
                    <div class="post-actions">
                        <div class="votes">
                            <button onclick="handleVote('${item.id}', 'up', 'project', '${item.projectId}')">▲</button>
                            <span>${item.votes || 0}</span>
                            <button onclick="handleVote('${item.id}', 'down', 'project', '${item.projectId}')">▼</button>
                        </div>
                        <button class="post-action-btn" onclick="toggleComments('${item.id}')">💬</button>
                        <button class="post-action-btn share-trigger" onclick="EnhancedSharing.shareProject('${item.id}', '${item.title.replace(/'/g,"\\'")}'  , '${(item.description||'').replace(/'/g,"\\'")}'  , '${item.headerPictureUrl||''}', '${item.category}'); return false;">🔗</button>
                        <button class="post-action-btn" onclick="(async()=>{await handleRepost('${item.id}');})()">🔁</button>
                        ${window.currentUserId && item.authorId === window.currentUserId ? `<div class="post-owner-actions"><button class="post-action-btn" onclick="handleEditPost('${item.id}')">✎</button><button class="post-action-btn" onclick="handleDeletePost('${item.id}')">🗑</button></div>` : ''}
                    </div>
                </div>
            `;
        } else if (item.type === 'project-update') {
            let mediaHtml = '';
            const media = item.media || {};
            if (media.image) mediaHtml += `<img src="${media.image}" style="max-width:100%; border-radius:4px; margin:8px 0; max-height:600px;">`;
            if (media.youtube) {
                const youtubeId = media.youtube.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
                if (youtubeId) mediaHtml += `<iframe width="100%" height="420" style="margin:8px 0; border-radius:4px;" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>`;
            }
            if (media.video) mediaHtml += `<video width="100%" controls style="border-radius:4px; margin:8px 0; max-height:600px;"><source src="${media.video}"></video>`;
            if (media.link) {
                const isValidUrl = /^https?:\/\//.test(media.link);
                const displayUrl = media.link.replace(/^https?:\/\//, '').substring(0, 60);
                mediaHtml += isValidUrl
                    ? `<div style="margin:8px 0;"><a href="${media.link}" target="_blank" style="color:#3b82f6; text-decoration:none; font-size:13px;">🔗 ${displayUrl}</a></div>`
                    : `<div style="margin:8px 0; color:#3b82f6; font-size:13px;">🔗 ${media.link}</div>`;
            }
            return `
                <div class="post">
                    <div class="post-header">
                        ${avatarHtml}
                        <div class="post-meta">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div class="author"><a href="profile.html?uid=${item.authorId}">${displayName}</a>${getFollowButtonHtml(item.authorId, displayName)}</div>
                            </div>
                            <div class="time">${date}</div>
                        </div>
                    </div>
                    <div style="padding:8px; background:#e0e7ff; border-radius:4px; margin-bottom:8px; font-size:12px; color:#1e40af; font-weight:600;">
                        📌 <a href="project.html?id=${item.projectId}" style="color:#1e40af; text-decoration:none;">${item.projectName}</a>
                    </div>
                    <h3 style="margin:0 0 8px; font-size:15px;">${item.title}</h3>
                    <p style="margin:0 0 8px; font-size:14px; line-height:1.5;">${item.content}</p>
                    ${mediaHtml}
                    <div class="post-actions">
                        <div class="votes">
                            <button onclick="handleVote('${item.id}', 'up', 'post')">▲</button>
                            <span>${item.votes || 0}</span>
                            <button onclick="handleVote('${item.id}', 'down', 'post')">▼</button>
                        </div>
                        <button class="post-action-btn" onclick="toggleComments('${item.id}')">💬</button>
                        <button class="post-action-btn share-trigger" onclick="EnhancedSharing.sharePost('${displayName.replace(/'/g,"\\'")}', '${item.content.substring(0,200).replace(/'/g,"\\'")}', '${item.projectId}', '${JSON.stringify(item.media||{})}'); return false;">🔗</button>
                        <button class="post-action-btn" onclick="(async()=>{await handleRepost('${item.id}');})()">🔁</button>
                        ${window.currentUserId && item.authorId === window.currentUserId ? `<div class="post-owner-actions"><button class="post-action-btn" onclick="handleEditPost('${item.id}')">✎</button><button class="post-action-btn" onclick="handleDeletePost('${item.id}')">🗑</button></div>` : ''}
                    </div>
                    <div id="comments-${item.id}" style="display:none;">
                        <div id="commentList-${item.id}"></div>
                        <input type="text" id="commentInput-${item.id}" placeholder="Write a comment...">
                        <button onclick="handleComment('${item.id}')">Submit</button>
                    </div>
                </div>
            `;
        } else if (item.type === 'chat') {
            const author = displayName || 'Guest';
            return `
                <div class="post">
                    <div class="post-header">
                        ${avatarHtml}
                        <div class="post-meta">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div class="author"><a href="profile.html?uid=${item.authorId}">${author}</a>${getFollowButtonHtml(item.authorId, displayName)}</div>
                            </div>
                            <div class="time">${date}</div>
                        </div>
                    </div>
                    <div style="padding:8px; background:#f3e8ff; border-radius:4px; margin:6px 0; font-size:12px; color:#6b21a8; font-weight:600;">
                        💬 <a href="project.html?id=${item.projectId}" style="color:#6b21a8; text-decoration:none;">${item.projectName}</a>
                    </div>
                    <p style="margin:0 0 8px; font-size:14px; line-height:1.5;">${item.content}</p>
                    <div class="post-actions">
                        <div class="votes">
                            <button onclick="handleVote('${item.id}', 'up', 'post')">▲</button>
                            <span>${item.votes || 0}</span>
                            <button onclick="handleVote('${item.id}', 'down', 'post')">▼</button>
                        </div>
                        <button class="post-action-btn" onclick="toggleComments('${item.id}')">💬</button>
                        <button class="post-action-btn share-trigger" onclick="EnhancedSharing.sharePost('${displayName.replace(/'/g,"\\'")}', '${item.content.replace(/'/g,"\\'")}', '${item.projectId}', '${JSON.stringify(item.media||{})}'); return false;">🔗</button>
                        ${window.currentUserId && item.authorId === window.currentUserId ? `<div class="post-owner-actions"><button class="post-action-btn" onclick="handleEditPost('${item.id}')">✎</button><button class="post-action-btn" onclick="handleDeletePost('${item.id}')">🗑</button></div>` : ''}
                    </div>
                    <div id="comments-${item.id}" style="display:none;">
                        <div id="commentList-${item.id}"></div>
                        <input type="text" id="commentInput-${item.id}" placeholder="Write a comment...">
                        <button onclick="handleComment('${item.id}')">Submit</button>
                    </div>
                </div>
            `;
        } else if (item.type === 'repost') {
            const projCategoryColors = {
                Tech: "#6366f1", Civil: "#f59f00", Community: "#ec4899", Law: "#0ca678",
                Physical: "#f59f00", Inventive: "#6366f1"
            };
            const catIcons = { Tech: "💻", Civil: "🏗️", Community: "🤝", Law: "⚖️", Physical: "🏗️", Inventive: "💡" };
            const tabColor = projCategoryColors[item.category] || "#5c7cfa";
            const icon = catIcons[item.category] || "📁";
            const author = displayName || 'Guest';
            const headerImage = item.headerPictureUrl ? `<img src="${item.headerPictureUrl}" style="max-width:100%; height:auto; max-height:400px; border-radius:6px; margin:6px 0; display:block;">` : '';
            const originalAuthor = item.originalAuthorName || 'Guest';
            return `
                <div class="post">
                    <div class="post-header">
                        ${avatarHtml}
                        <div class="post-meta">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div class="author"><a href="profile.html?uid=${item.authorId}">${author}</a>${getFollowButtonHtml(item.authorId, displayName)}</div>
                            </div>
                            <div class="time">${date}</div>
                        </div>
                    </div>
                    <div style="padding:8px; background:#9ca3af; border-radius:4px; margin:6px 0; font-size:12px; color:#fff; font-weight:600;">
                        🔁 <a href="profile.html?uid=${item.originalAuthorId}" style="color:#fff; text-decoration:none;">${originalAuthor}</a>'s project
                    </div>
                    <div class="project-tag-container" style="background:${tabColor};">
                        <a href="project.html?id=${item.projectId}" style="color:#fff; text-decoration:none;">
                            <div class="project-tag-badge" style="background:${tabColor};">${icon} ${item.category || 'Project'}</div>
                            <div class="project-tag-title" style="background:${adjustBrightness(tabColor, 20)};">${item.title}</div>
                        </a>
                    </div>
                    ${headerImage}
                    <p style="margin:6px 0;color:#555;">${item.solution || ''}</p>
                    <div class="post-actions">
                        <div class="votes">
                            <button onclick="handleVote('${item.id}', 'up', 'post')">▲</button>
                            <span>${item.votes || 0}</span>
                            <button onclick="handleVote('${item.id}', 'down', 'post')">▼</button>
                        </div>
                        <button class="post-action-btn" onclick="toggleComments('${item.id}')">💬</button>
                        <button class="post-action-btn share-trigger" onclick="EnhancedSharing.shareProject('${item.projectId}', '${item.title.replace(/'/g,"\\'")}'  , '${(item.solution||'').replace(/'/g,"\\'")}'  , '${item.headerPictureUrl||''}', '${item.category}'); return false;">🔗</button>
                        ${window.currentUserId && item.authorId === window.currentUserId ? `<div class="post-owner-actions"><button class="post-action-btn" onclick="handleDeletePost('${item.id}')">🗑</button></div>` : ''}
                    </div>
                    <div id="comments-${item.id}" style="display:none;">
                        <div id="commentList-${item.id}"></div>
                        <input type="text" id="commentInput-${item.id}" placeholder="Write a comment...">
                        <button onclick="handleComment('${item.id}')">Submit</button>
                    </div>
                </div>
            `;
        } else {
            // Generic post
            let mediaHtml = '';
            const media = item.media || {};
            if (media.image) mediaHtml += `<img src="${media.image}" style="max-width:100%; border-radius:4px; margin:8px 0; max-height:600px;">`;
            if (media.youtube) {
                // YouTube can be a URL or just an ID
                const youtubeId = media.youtube.includes('youtube.com') || media.youtube.includes('youtu.be')
                    ? media.youtube.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
                    : media.youtube;
                if (youtubeId) mediaHtml += `<iframe width="100%" height="420" style="margin:8px 0; border-radius:4px;" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>`;
            }
            if (media.link) {
                const isValidUrl = /^https?:\/\//.test(media.link);
                const displayUrl = media.link.replace(/^https?:\/\//, '').substring(0, 60);
                mediaHtml += isValidUrl
                    ? `<div style="margin:8px 0;"><a href="${media.link}" target="_blank" style="color:#3b82f6; text-decoration:none; font-size:13px;">🔗 ${displayUrl}</a></div>`
                    : `<div style="margin:8px 0; color:#3b82f6; font-size:13px;">🔗 ${media.link}</div>`;
            }
            
            return `
                <div class="post">
                    <div class="post-header">
                        ${avatarHtml}
                        <div class="post-meta">
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div class="author"><a href="profile.html?uid=${item.authorId}">${displayName}</a>${getFollowButtonHtml(item.authorId, displayName)}</div>
                            </div>
                            <div class="time">${date}</div>
                        </div>
                    </div>
                    <p style="margin:6px 0;">${item.content}</p>
                    ${mediaHtml}
                    <div class="post-actions">
                        <div class="votes">
                            <button onclick="handleVote('${item.id}', 'up', 'post')">▲</button>
                            <span>${item.votes || 0}</span>
                            <button onclick="handleVote('${item.id}', 'down', 'post')">▼</button>
                        </div>
                        <button class="post-action-btn" onclick="toggleComments('${item.id}')">💬</button>
                        <button class="post-action-btn share-trigger" onclick="EnhancedSharing.sharePost('${displayName.replace(/'/g,"\\'")}', '${item.content.replace(/'/g,"\\'")}', '', '${JSON.stringify(item.media||{})}'); return false;">🔗</button>
                        <button class="post-action-btn" onclick="(async()=>{await handleRepost('${item.id}');})()">🔁</button>
                        ${window.currentUserId && item.authorId === window.currentUserId ? `<div class="post-owner-actions"><button class="post-action-btn" onclick="handleEditPost('${item.id}')">✎</button><button class="post-action-btn" onclick="handleDeletePost('${item.id}')">🗑</button></div>` : ''}
                    </div>
                    <div id="comments-${item.id}" style="display:none;">
                        <div id="commentList-${item.id}"></div>
                        <input type="text" id="commentInput-${item.id}" placeholder="Write a comment...">
                        <button onclick="handleComment('${item.id}')">Submit</button>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Signal content is ready
    if (typeof LoadingManager !== 'undefined') {
        LoadingManager.setContentReady();
    }
    
    // Re-apply search filter if one is active
    if (typeof window.reapplySearchFilter === 'function') {
        window.reapplySearchFilter();
    }
    } catch (error) {
        console.error('[App] Error loading posts:', error);
        const container = document.getElementById('posts');
        if (container) {
            container.innerHTML = '<div style="padding:20px; text-align:center; color:#999;">Error loading feed. Please refresh the page.</div>';
        }
    }
}

async function handleVote(feedId, voteType, itemType, projectId) {
    if (itemType === 'project') {
        await voteOnProject(projectId, feedId, voteType);
    } else {
        await voteOnPost(feedId, voteType);
    }
    loadPosts();
}

window.handleVote = handleVote;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleGuest = handleGuest;
window.handleLogout = handleLogout;
window.handlePost = handlePost;

// Floating menu controls
function toggleFloatingMenu() {
    const list = document.getElementById('menuList');
    if (!list) return;
    list.style.display = list.style.display === 'block' ? 'none' : 'block';
}

function openProfile() {
    if (window.currentUserId) {
        window.location.href = `profile.html?uid=${window.currentUserId}`;
    } else {
        showLogin();
    }
}

window.toggleFloatingMenu = toggleFloatingMenu;
window.openProfile = openProfile;

window.showRegister = function() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}
window.showLogin = function() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
}
window.showAuthForms = function() {
    document.getElementById('landing').style.display = 'none';
    document.getElementById('auth').style.display = 'block';
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}
window.showLanding = function() {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('landing').style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════════════════
// BUG REPORT FEATURE
// ═══════════════════════════════════════════════════════════════════════════
function openBugReportModal() {
    const modal = document.getElementById('bugReportModal');
    const textarea = document.getElementById('bugDescription');
    const status = document.getElementById('bugReportStatus');
    
    if (modal) {
        modal.style.display = 'block';
        if (textarea) textarea.value = '';
        if (status) status.style.display = 'none';
    }
}

function closeBugReportModal() {
    const modal = document.getElementById('bugReportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function submitBugReport() {
    const textarea = document.getElementById('bugDescription');
    const status = document.getElementById('bugReportStatus');
    const submitBtn = event.target;
    
    if (!textarea || !textarea.value.trim()) {
        if (status) {
            status.textContent = 'Please describe the bug.';
            status.style.color = '#ef4444';
            status.style.display = 'block';
        }
        return;
    }
    
    try {
        submitBtn.disabled = true;
        if (status) {
            status.textContent = 'Sending report...';
            status.style.color = '#666';
            status.style.display = 'block';
        }
        
        // Get user info
        const username = window.currentUsername || 'Anonymous';
        const userId = window.currentUserId || 'unknown';
        
        // Collect metadata
        const bugData = {
            description: textarea.value.trim(),
            username: username,
            userId: userId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            platform: navigator.platform,
            language: navigator.language
        };
        
        // Send to Firestore
        const bugsRef = collection(db, 'bugReports');
        const docRef = await addDoc(bugsRef, {
            ...bugData,
            serverTimestamp: serverTimestamp(),
            status: 'open'
        });
        
        console.log('[BugReport] Submitted to Firestore:', docRef.id);
        
        // Send to email via Cloud Function
        try {
            const response = await fetch('https://us-central1-cloud-beacon-55a40.cloudfunctions.net/sendBugReportEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reportId: docRef.id,
                    ...bugData
                })
            });
            
            if (response.ok) {
                console.log('[BugReport] Email sent successfully');
            } else {
                console.warn('[BugReport] Email send returned status:', response.status);
            }
        } catch (emailErr) {
            console.warn('[BugReport] Could not send email notification:', emailErr);
            // Continue anyway, the report is in Firestore
        }
        
        // Show success
        if (status) {
            status.textContent = '✅ Thank you! Report submitted.';
            status.style.color = '#2b8a3e';
            status.style.display = 'block';
        }
        
        // Close modal after 2 seconds
        setTimeout(() => {
            closeBugReportModal();
        }, 2000);
        
    } catch (error) {
        console.error('[BugReport] Error:', error);
        if (status) {
            status.textContent = '❌ Error submitting report. Please try again.';
            status.style.color = '#ef4444';
            status.style.display = 'block';
        }
    } finally {
        submitBtn.disabled = false;
    }
}

window.openBugReportModal = openBugReportModal;
window.closeBugReportModal = closeBugReportModal;
window.submitBugReport = submitBugReport;

// ---- Share popover ----
function getSharePopover() {
    let el = document.getElementById('sharePopover');
    if (!el) {
        el = document.createElement('div');
        el.id = 'sharePopover';
        document.body.appendChild(el);
        document.addEventListener('click', function(e) {
            if (!el.contains(e.target) && !e.target.closest('.share-trigger')) {
                el.style.display = 'none';
            }
        });
    }
    return el;
}

function openShareMenu(triggerEl, title, url, description) {
    const popover = getSharePopover();
    const fullUrl = url.startsWith('http') ? url : window.location.origin + '/' + url;
    const encodedUrl = encodeURIComponent(fullUrl);
    // Build share text: "Title — Description\nURL" if description provided, else just title
    const shareText = description
        ? encodeURIComponent(title + ' — ' + description.substring(0, 200))
        : encodeURIComponent(title);
    const nativeRow = navigator.share
        ? `<button class="share-option" onclick="nativeShare(${JSON.stringify(title)}, ${JSON.stringify(fullUrl)}, ${JSON.stringify(description || '')})">📱 Share via...</button>`
        : '';
    popover.innerHTML = `
        <div class="share-popover-inner">
            <div class="share-popover-title">Share</div>
            ${nativeRow}
            <button class="share-option" onclick="shareToTwitter('${shareText}', '${encodedUrl}')">𝕏 Twitter / X</button>
            <button class="share-option" onclick="shareToWhatsApp('${shareText}', '${encodedUrl}')">💬 WhatsApp</button>
            <button class="share-option" onclick="shareToBluesky('${shareText}', '${encodedUrl}')">🦋 Bluesky</button>
            <button class="share-option" onclick="copyShareLink(${JSON.stringify(fullUrl)}, this)">🔗 Copy link</button>
        </div>
    `;
    const rect = triggerEl.getBoundingClientRect();
    popover.style.display = 'block';
    popover.style.position = 'absolute';
    popover.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    popover.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 200) + 'px';
    popover.style.zIndex = '2000';
}

function shareToTwitter(shareText, encodedUrl) {
    window.open('https://twitter.com/intent/tweet?text=' + shareText + '%0A' + encodedUrl, '_blank');
    document.getElementById('sharePopover').style.display = 'none';
}
function shareToWhatsApp(shareText, encodedUrl) {
    window.open('https://wa.me/?text=' + shareText + '%0A' + encodedUrl, '_blank');
    document.getElementById('sharePopover').style.display = 'none';
}
function shareToBluesky(shareText, encodedUrl) {
    window.open('https://bsky.app/intent/compose?text=' + shareText + '%0A' + encodedUrl, '_blank');
    document.getElementById('sharePopover').style.display = 'none';
}
async function copyShareLink(url, btn) {
    try {
        await navigator.clipboard.writeText(url);
        btn.textContent = '✓ Copied!';
        setTimeout(() => { btn.textContent = '🔗 Copy link'; }, 2000);
    } catch {
        prompt('Copy this link:', url);
    }
}
async function nativeShare(title, url, description) {
    try { await navigator.share({ title, text: description || title, url }); } catch {}
    document.getElementById('sharePopover').style.display = 'none';
}

window.openShareMenu = openShareMenu;
window.shareToTwitter = shareToTwitter;
window.shareToWhatsApp = shareToWhatsApp;
window.shareToBluesky = shareToBluesky;
window.copyShareLink = copyShareLink;
window.nativeShare = nativeShare;

async function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    const isHidden = section.style.display === 'none';
    if (isHidden) {
        section.style.display = 'block';
        const comments = await getComments(postId);
        const list = document.getElementById(`commentList-${postId}`);
        list.innerHTML = comments.length ? comments.map(function(comment) {
            const date = comment.createdAt ? new Date(comment.createdAt.seconds * 1000).toLocaleString() : 'Just now';
            return `
                <div class="comment">
                    <p>${comment.content}</p>
                    <div class="comment-footer">
                        <small><a href="profile.html?uid=${comment.authorId}">${comment.authorName}</a> · ${date}</small>
                        <button class="comment-share-btn share-trigger" onclick="openShareMenu(this, 'Cloud Beacon', window.location.href)">🔗</button>
                    </div>
                </div>
            `;
        }).join('') : '<p>No comments yet</p>';
    } else {
        section.style.display = 'none';
    }
}

async function handleComment(postId) {
    const input = document.getElementById(`commentInput-${postId}`);
    if (!input.value) return;
    await addComment(postId, input.value);
    input.value = '';
    const section = document.getElementById(`comments-${postId}`);
    section.style.display = 'none';
    await toggleComments(postId);
}

function openModal() {
    document.getElementById('modal').style.display = 'flex';
}

// Close modal when clicking outside of it
document.addEventListener('click', function(event) {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    if (modal && modal.style.display !== 'none' && 
        event.target === modal && !modalContent.contains(event.target)) {
        closeModal();
    }
});

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    clearPostForm();
    document.getElementById('projectTitle').value = '';
    document.getElementById('projectCategory').value = '';
    document.getElementById('categoryQuestion').style.display = 'none';
    document.getElementById('categoryAnswer').value = '';
    document.getElementById('projectPublic').checked = true;
    showPostForm();
}

function showPostForm() {
    document.getElementById('postForm').style.display = 'flex';
    document.getElementById('projectForm').style.display = 'none';
    document.getElementById('postToggleBtn').classList.add('active');
    document.getElementById('projectToggleBtn').classList.remove('active');
}

function showProjectForm() {
    document.getElementById('postForm').style.display = 'none';
    document.getElementById('projectForm').style.display = 'flex';
    document.getElementById('postToggleBtn').classList.remove('active');
    document.getElementById('projectToggleBtn').classList.add('active');
}

let tempProjectHeaderImage = null;

function handleProjectImageSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const nameEl = document.getElementById('projectImageName');
    if (nameEl) nameEl.textContent = `✓ ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        tempProjectHeaderImage = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function handleDeletePost(postId) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
        await deletePost(postId);
        await loadPosts();
    } catch (err) {
        alert('Error deleting post: ' + (err.message || err));
    }
}

async function handleEditPost(postId) {
    const newContent = prompt('Edit post content:');
    if (newContent === null) return; // cancelled
    if (!newContent.trim()) return alert('Post cannot be empty');
    try {
        await editPost(postId, newContent.trim());
        await loadPosts();
    } catch (err) {
        alert('Error editing post: ' + (err.message || err));
    }
}

async function handleRepost(postId) {
    try {
        const { getFeed } = await import('./projects.js');
        const items = await getFeed();
        const orig = items.find(i => i.id === postId);
        if (!orig) return alert('Original post not found');
        await createPost(`Repost: ${orig.content}`, null, null, orig.authorId);
        await loadPosts();
    } catch (err) {
        console.error('Repost error', err);
        alert('Error reposting: ' + (err.message || err));
    }
}

// Handle follow button click on feed posts
async function handleFeedFollow(targetUserId, buttonElement) {
    try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            alert('Please sign in to follow users');
            return;
        }

        if (currentUser.uid === targetUserId) {
            alert('You cannot follow your own profile');
            return;
        }

        if (!window.FollowSystem) {
            alert('Follow system not loaded');
            return;
        }

        buttonElement.disabled = true;

        // Toggle follow state
        const isNowFollowing = await window.FollowSystem.toggleFollow(currentUser.uid, targetUserId);
        
        // Update button appearance
        buttonElement.textContent = isNowFollowing ? 'Following' : 'Follow';
        buttonElement.style.background = isNowFollowing ? '#666' : '#3b82f6';
        
        buttonElement.disabled = false;
    } catch (error) {
        console.error('Error toggling follow:', error);
        alert('Error updating follow status');
        buttonElement.disabled = false;
    }
}

window.handleDeletePost = handleDeletePost;
window.handleEditPost = handleEditPost;
window.handleRepost = handleRepost;
window.handleFeedFollow = handleFeedFollow;

async function handleProject() {
    const title = document.getElementById('projectTitle').value.trim();
    const category = document.getElementById('projectCategory').value;
    const overview = document.getElementById('projectOverview').value.trim();
    const isPublic = document.getElementById('projectPublic').checked;
    const isProposal = document.getElementById('projectProposal').checked;

    if (!title || !category) return;

    const projectId = await createProject(title, category, overview, isPublic, tempProjectHeaderImage, isProposal);
    tempProjectHeaderImage = null;
    document.getElementById('projectHeaderImage').value = '';
    document.getElementById('projectImageName').textContent = '';
    document.getElementById('projectProposal').checked = false;
    closeModal();
    window.location.href = `project.html?id=${projectId}`;
}

window.toggleComments = toggleComments;
window.handleComment = handleComment;
window.openModal = openModal;
window.closeModal = closeModal;
window.showPostForm = showPostForm;
window.showProjectForm = showProjectForm;
window.handlePost = handlePost;
window.handlePostImageSelect = handlePostImageSelect;
window.handleProjectImageSelect = handleProjectImageSelect;
window.clearPostForm = clearPostForm;
window.handleProject = handleProject;
window.cleanOldLegislation = cleanOldLegislation;
window.syncLegislation = syncLegislation;
window.inspectBill = inspectBill;
window.listAllBills = listAllBills;
window.resetSyncCooldown = resetSyncCooldown;

console.log('[App] Ready - cleanOldLegislation, syncLegislation, inspectBill, and listAllBills available on window');