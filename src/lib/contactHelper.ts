/**
 * Safe Contact Developer email handler for Android WebView, PWA, and desktop browsers.
 * Seamlessly launches native email clients via standard mailto URI,
 * provides Gmail web fallback, and copies email to clipboard.
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

export function handleContactDeveloper(
  onSuccess?: () => void,
  onError?: (msg: string) => void
) {
  const mailtoUri = getMailtoUri();

  // 1. Copy email address to clipboard as a reliable backup
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(DEVELOPER_EMAIL).catch(() => {});
  }

  // 2. Direct window.location navigation triggers Android WebView's shouldOverrideUrlLoading
  // and native browser email client invocation without popup-blocker issues
  try {
    // Standard direct navigation for mailto
    window.location.href = mailtoUri;

    if (onSuccess) {
      onSuccess();
    }
  } catch (e) {
    console.error('Email launch error:', e);
    // Fallback using DOM anchor click
    try {
      const a = document.createElement('a');
      a.href = mailtoUri;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try {
          document.body.removeChild(a);
        } catch {}
      }, 500);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (onError) {
        onError('Please email imshubhamk9@gmail.com');
      }
    }
  }
}

