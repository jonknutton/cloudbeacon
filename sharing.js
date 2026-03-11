/**
 * Enhanced Social Media Sharing Module
 * Provides rich sharing functionality for posts and projects
 * Currently optimized for BlueSky, with support for Twitter/X, WhatsApp, etc.
 */

const EnhancedSharing = {
  /**
   * Share a post to social media
   * Concatenates: Username + " " + post link + ":" + post text + Cloud Beacon link
   * Call with: EnhancedSharing.sharePost(postElement, { authorName, content, projectId, media })
   */
  sharePost: function(authorName, content, projectId, mediaJson) {
    // Get current project/post URL
    const postUrl = `${window.location.origin}/project.html?id=${projectId}`;
    const cloudBeaconUrl = window.location.origin;

    // Parse media if it comes as a string
    let media = {};
    if (typeof mediaJson === 'string') {
      try {
        media = JSON.parse(mediaJson);
      } catch (e) {
        media = {};
      }
    } else if (mediaJson) {
      media = mediaJson;
    }

    // Build share text: Username + " " + post link + ":" + post text + Cloud Beacon URL
    const contentPreview = content ? content.substring(0, 280) : '(No content)';
    const shareText = `${authorName} ${postUrl}:\n\n${contentPreview}\n\n${cloudBeaconUrl}`;

    // For BlueSky, we can include the image if it exists
    const imageUrl = media?.image || null;

    // Show share menu with enhanced content
    this.openEnhancedShareMenu(
      event?.target,
      shareText,
      postUrl,
      imageUrl,
      'post'
    );
  },

  /**
   * Share a project to social media
   * Templates vary by category:
   * - Law/Bill: "Bill " + bill id + ": " + project header + Description + "Vote here:" + link
   * - Other: "Project: " + project header + description + "Vote here:" + link
   * Enforces BlueSky character limit (300 chars) by truncating description if needed
   */
  shareProject: function(projectId, projectTitle, projectDescription, headerPictureUrl, category = '') {
    // Build the project link
    const projectUrl = `${window.location.origin}/project.html?id=${projectId}`;
    const charLimit = 297; // BlueSky limit (300 - 3 for buffer)

    let shareText;
    
    if (category && category.toLowerCase() === 'law') {
      // Bill template: Bill {id}: {title}\n\n{description}\n\nVote here: {url}
      const billPrefix = `Bill ${projectId}: ${projectTitle}`;
      const voteLine = `Vote here: ${projectUrl}`;
      const descPreview = projectDescription || '(No description)';
      
      // Calculate available space for description
      let fullText = `${billPrefix}\n\n${descPreview}\n\n${voteLine}`;
      
      if (fullText.length > charLimit) {
        // Truncate description to fit character limit
        const fixedLength = billPrefix.length + voteLine.length + 4; // +4 for double newlines
        const descAvailable = charLimit - fixedLength - 3; // -3 for "..."
        const truncatedDesc = descPreview.substring(0, Math.max(0, descAvailable)) + '...';
        shareText = `${billPrefix}\n\n${truncatedDesc}\n\n${voteLine}`;
      } else {
        shareText = fullText;
      }
    } else {
      // Project template: Project: {title}\n\n{description}\n\nVote here: {url}
      const projectPrefix = `Project: ${projectTitle}`;
      const voteLine = `Vote here: ${projectUrl}`;
      const descPreview = projectDescription || '(No description)';
      
      // Calculate available space for description
      let fullText = `${projectPrefix}\n\n${descPreview}\n\n${voteLine}`;
      
      if (fullText.length > charLimit) {
        // Truncate description to fit character limit
        const fixedLength = projectPrefix.length + voteLine.length + 4; // +4 for double newlines
        const descAvailable = charLimit - fixedLength - 3; // -3 for "..."
        const truncatedDesc = descPreview.substring(0, Math.max(0, descAvailable)) + '...';
        shareText = `${projectPrefix}\n\n${truncatedDesc}\n\n${voteLine}`;
      } else {
        shareText = fullText;
      }
    }

    // Show share menu with enhanced content
    this.openEnhancedShareMenu(
      event?.target,
      shareText,
      projectUrl,
      headerPictureUrl,
      'project'
    );
  },

  /**
   * Open enhanced share menu for BlueSky and other platforms
   */
  openEnhancedShareMenu: function(triggerEl, shareText, url, imageUrl, type = 'post') {
    const popover = this.getSharePopover();

    const fullUrl = url.startsWith('http') ? url : window.location.origin + '/' + url;
    const encodedUrl = encodeURIComponent(fullUrl);
    const encodedText = encodeURIComponent(shareText);

    // Build the menu with BlueSky-optimized content
    const nativeRow = navigator.share
      ? `<button class="share-option" onclick="EnhancedSharing.nativeShare('${shareText.replace(/'/g, "\\'")}', '${fullUrl.replace(/'/g, "\\'")}'${imageUrl ? `, '${imageUrl.replace(/'/g, "\\'")}'` : ''})">📱 Share via...</button>`
      : '';

    popover.innerHTML = `
        <div class="share-popover-inner">
            <div class="share-popover-title">Share ${type === 'post' ? 'Post' : 'Project'}</div>
            ${nativeRow}
            <button class="share-option" onclick="EnhancedSharing.shareToBluesky('${encodedText}', '${encodedUrl}'${imageUrl ? `, '${imageUrl.replace(/'/g, "\\'")}'` : ''})">🦋 Bluesky</button>
            <button class="share-option" onclick="EnhancedSharing.shareToTwitter('${encodedText}', '${encodedUrl}')">𝕏 Twitter / X</button>
            <button class="share-option" onclick="EnhancedSharing.shareToWhatsApp('${encodedText}', '${encodedUrl}')">💬 WhatsApp</button>
            <button class="share-option" onclick="EnhancedSharing.copyShareLink('${fullUrl.replace(/'/g, "\\'")}'," this)">🔗 Copy link</button>
        </div>
    `;

    const rect = triggerEl?.getBoundingClientRect() || { bottom: 0, left: 0 };
    popover.style.display = 'block';
    popover.style.position = 'absolute';
    popover.style.top = (rect.bottom + window.scrollY + 6) + 'px';
    popover.style.left = Math.min(rect.left + window.scrollX, window.innerWidth - 200) + 'px';
    popover.style.zIndex = '2000';
  },

  /**
   * Get or create the share popover element
   */
  getSharePopover: function() {
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
  },

  /**
   * Share to BlueSky with image support
   */
  shareToBluesky: function(encodedText, encodedUrl, imageUrl) {
    let blueskyText = decodeURIComponent(encodedText);
    
    // Add image reference if available and it's from the same domain
    if (imageUrl && imageUrl.includes(window.location.origin)) {
      blueskyText += `\n\n[Image: ${imageUrl}]`;
    }

    const textToShare = encodeURIComponent(blueskyText);
    window.open(`https://bsky.app/intent/compose?text=${textToShare}`, '_blank');
    document.getElementById('sharePopover').style.display = 'none';
  },

  /**
   * Share to Twitter/X with formatting
   */
  shareToTwitter: function(encodedText, encodedUrl) {
    const twitterText = encodeURIComponent(decodeURIComponent(encodedText));
    window.open(`https://twitter.com/intent/tweet?text=${twitterText}`, '_blank');
    document.getElementById('sharePopover').style.display = 'none';
  },

  /**
   * Share to WhatsApp with formatting
   */
  shareToWhatsApp: function(encodedText, encodedUrl) {
    const waText = encodeURIComponent(decodeURIComponent(encodedText));
    window.open(`https://wa.me/?text=${waText}`, '_blank');
    document.getElementById('sharePopover').style.display = 'none';
  },

  /**
   * Copy share link to clipboard
   */
  copyShareLink: async function(url, btn) {
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = '🔗 Copy link'; }, 2000);
    } catch {
      prompt('Copy this link:', url);
    }
  },

  /**
   * Native share API (for mobile phones)
   */
  nativeShare: async function(text, url, imageUrl) {
    try {
      const shareData = { 
        text: text,
        url: url
      };
      if (imageUrl && navigator.share) {
        // Try to fetch the image as a blob for sharing
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], 'share-image.jpg', { type: blob.type });
          shareData.files = [file];
        } catch (e) {
          // Image fetch failed, continue without it
          console.warn('Could not fetch image for sharing:', e);
        }
      }
      await navigator.share(shareData);
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.warn('Share failed:', e);
      }
    }
    document.getElementById('sharePopover').style.display = 'none';
  }
};

// Expose to window
window.EnhancedSharing = EnhancedSharing;
