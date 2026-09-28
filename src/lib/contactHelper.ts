/**
 * Safe Contact Developer email handler for Android WebView, PWA, and desktop browsers.
 * - Attempts to redirect to the native Gmail/mail app if available.
 * - Falls back to Gmail Web if the app is not available.
 * - Prevents net::ERR_UNKNOWN_URL_SCHEME errors in Android WebView.
 * - Keeps email address private from display UI.
 */

export const DEVELOPER_EMAIL = 'imshubhamk9@gmail.com';
export const EMAIL_SUBJECT = 'SHUBHAM Calculator Feedback';
export const EMAIL_BODY = 'Hi Shubham,\n\nI am using the SHUBHAM Scientific Calculator app and wanted to share the following feedback / suggestion:\n\n';

export function getMailtoUri(): string {
  return `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`;
}

export function getGmailWebUri(): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${DEVELOPER_EMAIL}&su=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`;
}

/**
 * Attempts to open Gmail app first; falls back to Gmail Web if not available.
 */
export function openDeveloperEmail(
  onStatusChange?: (status: 'idle' | 'opening' | 'opened') => void
): void {
  const subject = encodeURIComponent(EMAIL_SUBJECT);
  const body = encodeURIComponent(EMAIL_BODY);

  const gmailAppScheme = `googlegmail:///co?to=${DEVELOPER_EMAIL}&subject=${subject}&body=${body}`;
  const mailtoScheme = `mailto:${DEVELOPER_EMAIL}?subject=${subject}&body=${body}`;
  const gmailWebUrl = getGmailWebUri();

  if (onStatusChange) onStatusChange('opening');

  let appLaunched = false;

  const handleVisibilityChange = () => {
    if (document.hidden || document.visibilityState === 'hidden') {
      appLaunched = true;
    }
  };

  const handleBlur = () => {
    appLaunched = true;
  };

  window.addEventListener('visibilitychange', handleVisibilityChange, { once: true });
  window.addEventListener('blur', handleBlur, { once: true });

  // Use invisible iframes so the WebView will not navigate away or show net::ERR_UNKNOWN_URL_SCHEME
  const iframeApp = document.createElement('iframe');
  iframeApp.style.display = 'none';
  iframeApp.style.width = '0px';
  iframeApp.style.height = '0px';
  iframeApp.src = gmailAppScheme;
  document.body.appendChild(iframeApp);

  const iframeMail = document.createElement('iframe');
  iframeMail.style.display = 'none';
  iframeMail.style.width = '0px';
  iframeMail.style.height = '0px';
  iframeMail.src = mailtoScheme;
  document.body.appendChild(iframeMail);

  // If the native app hasn't taken over within 1000ms, open Gmail Web
  setTimeout(() => {
    try {
      if (iframeApp.parentNode) iframeApp.parentNode.removeChild(iframeApp);
      if (iframeMail.parentNode) iframeMail.parentNode.removeChild(iframeMail);
    } catch {}

    window.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleBlur);

    if (!appLaunched && !document.hidden && document.visibilityState === 'visible') {
      // Try opening Gmail Web in a new window/tab
      const newWin = window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
      // If popup was blocked or inside restricted WebView, navigate safely using HTTPS URL
      if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
        window.location.assign(gmailWebUrl);
      }
    }

    if (onStatusChange) {
      onStatusChange('opened');
      setTimeout(() => onStatusChange('idle'), 2000);
    }
  }, 1000);
}
