/**
 * Subscription Utility Functions
 * 
 * CRITICAL RULES:
 * 1. English is ALWAYS free.
 * 2. Hindi and Malayalam REQUIRE Pro subscription.
 * 3. Pro status must NEVER be stored as a boolean.
 * 4. Pro access is computed dynamically from: language + planExpiry.
 * 5. Children MUST NOT inherit Pro access in their own objects.
 */

/**
 * Computes access to speech therapy features dynamically.
 * Combines language rules with child-based Pro subscription status.
 * 
 * @param {string} languageCode - e.g., 'en-US', 'hi-IN', 'ml-IN'
 * @param {Object} child - The currently selected child object
 * @returns {boolean} - True if access is granted
 */
export function getSpeechAccess(languageCode, child) {
  // 1. English is ALWAYS free (Hard Rule)
  if (!languageCode || languageCode.startsWith('en')) {
    return true;
  }
  
  // 2. Hindi and Malayalam require active child subscription (Hard Rule)
  // Requires: child registration + valid paid subscription
  if (child && child.subscriptionExpiry) {
    const now = new Date();
    const expiryDate = new Date(child.subscriptionExpiry);
    
    // Explicitly block if expired
    if (now > expiryDate) {
      return false;
    }
    
    return !isNaN(expiryDate.getTime()) && now < expiryDate;
  }
  
  // No child or no subscriptionExpiry means no access for premium languages
  return false;
}

/**
 * Strips all forbidden subscription-related boolean flags and legacy keys.
 * ONLY allows planExpiry to persist on PARENT objects.
 * 
 * @param {Object} obj - The object to sanitize
 * @param {boolean} isChild - If true, even planExpiry is removed
 * @returns {Object} - The sanitized object
 */
export function sanitizeUserObject(obj, isChild = false) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const forbiddenKeys = [
    'isPro', 'hasPro', 'subscriptionActive', 'isSubscribed', 
    'plan', 'expiryDate', 'subscriptionStatus', 'pro'
  ];

  const sanitized = { ...obj };
  
  forbiddenKeys.forEach(key => {
    delete sanitized[key];
  });

  // Children must NEVER have planExpiry
  if (isChild) {
    delete sanitized.planExpiry;
  }

  // Handle 'role: pro' specifically - downgrade to 'parent' if it was 'pro'
  if (sanitized.role === 'pro') {
    sanitized.role = 'parent';
  }

  return sanitized;
}

/**
 * Validates and cleans up expired subscriptions from localStorage.
 * MUST be called on app boot to enforce time-based expiry.
 * 
 * Also cleans up "ghost" sessions (guest profiles without active subscriptions).
 */
export function cleanupExpiredSubscription() {
  try {
    // 1. Clean up top-level forbidden localStorage keys
    const forbiddenTopLevel = [
      'isPro', 'hasPro', 'subscriptionActive', 'isSubscribed', 
      'plan', 'expiryDate', 'subscriptionStatus'
    ];
    forbiddenTopLevel.forEach(key => localStorage.removeItem(key));

    // 2. Clean up nested objects
    const storageKeys = ['speech_user', 'user'];
    const childKeys = ['selectedChild', 'speech_child'];
    
    // Process parent objects
    storageKeys.forEach(storageKey => {
      const rawData = localStorage.getItem(storageKey);
      if (!rawData) return;

      let data;
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        localStorage.removeItem(storageKey);
        return;
      }

      let needsUpdate = false;
      let shouldRemoveProfile = false;

      // Clean up planExpiry if expired
      if (data.planExpiry) {
        const expiryDate = new Date(data.planExpiry);
        const isExpired = isNaN(expiryDate.getTime()) || new Date() >= expiryDate;

        if (isExpired) {
          console.warn(`⚠️ Speech Therapy Pro subscription in ${storageKey} expired.`);
          delete data.planExpiry;
          needsUpdate = true;
          
          // If it was a guest speech user and plan expired, we might want to clear the profile
          if (storageKey === 'speech_user' && !localStorage.getItem('token')) {
            shouldRemoveProfile = true;
          }
        }
      } else if (storageKey === 'speech_user' && !localStorage.getItem('token')) {
        // If it's a guest profile with NO planExpiry, it shouldn't exist as a session
        // This prevents "PRO" badge ghosting if data was corrupted
        shouldRemoveProfile = true;
      }

      if (shouldRemoveProfile) {
        localStorage.removeItem(storageKey);
        localStorage.removeItem('speechParentId');
        console.log(`🧹 Cleared ghost guest session: ${storageKey}`);
        return;
      }

      // Sanitize the object (isChild = false)
      const sanitized = sanitizeUserObject(data, false);
      if (JSON.stringify(data) !== JSON.stringify(sanitized)) {
        needsUpdate = true;
        data = sanitized;
      }

      if (needsUpdate) {
        localStorage.setItem(storageKey, JSON.stringify(data));
        console.log(`✅ Subscription state in ${storageKey} cleaned up.`);
      }
    });

    // Process child objects (must NEVER have Pro access/planExpiry)
    childKeys.forEach(childKey => {
      const rawData = localStorage.getItem(childKey);
      if (!rawData) return;

      let data;
      try {
        data = JSON.parse(rawData);
      } catch (e) {
        localStorage.removeItem(childKey);
        return;
      }

      // Sanitize the object (isChild = true)
      const sanitized = sanitizeUserObject(data, true);
      if (JSON.stringify(data) !== JSON.stringify(sanitized)) {
        localStorage.setItem(childKey, JSON.stringify(sanitized));
        console.log(`✅ Child object in ${childKey} sanitized (removed any inherited Pro status).`);
      }
    });
  } catch (e) {
    console.error('Error cleaning up subscription:', e);
  }
}
