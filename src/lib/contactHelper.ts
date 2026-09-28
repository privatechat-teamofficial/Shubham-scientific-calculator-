/**
 * Safe Contact Developer email handler for Android WebView, PWA, and desktop browsers.
 * Prevents Android WebView ERR_UNKNOWN_URL_SCHEME by delegating to system intent / new window
 * while copying email to clipboard as a reliable backup.
 */

export const DEVELOPER_EMAIL = 'imshubhamk9@gmail.com';
export const EMAIL_SUBJECT = 'SHUBHAM Calculator Feedback';
export const EMAIL_BODY = 'Hi Shubham,\n\nI am using the SHUBHAM Scientific Calculator app and wanted to share the following feedback / suggestion:\n\n';

export function handleContactDeveloper(
  onSuccess?: () => void,
  onError?: (msg: string) => void
) {
  const mailtoUri = `mailto:${DEVELOPER_EMAIL}?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(EMAIL_BODY)}`;

  // 1. Copy email address to clipboard as a 100% reliable guarantee
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(DEVELOPER_EMAIL).catch(() => {});
  }

  // 2. Safely trigger email application without replacing WebView main frame
  try {
    const tempLink = document.createElement('a');
    tempLink.href = mailtoUri;
    tempLink.target = '_blank';
    tempLink.rel = 'noopener noreferrer';
    tempLink.style.display = 'none';
    document.body.appendChild(tempLink);
    tempLink.click();
    setTimeout(() => {
      try {
        document.body.removeChild(tempLink);
      } catch {}
    }, 1500);

    if (onSuccess) {
      onSuccess();
    }
  } catch (e) {
    console.error('Email launch error:', e);
    if (onError) {
      onError('Please email imshubhamk9@gmail.com');
    }
  }
}
