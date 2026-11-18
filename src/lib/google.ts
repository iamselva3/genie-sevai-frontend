/**
 * "Continue with Google" through Google Identity Services (token model, our own button).
 * The script is only fetched when the sign-in sheet opens, so it never slows down the pages.
 */
const CLIENT_ID = ((import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '').trim();
const SCRIPT = 'https://accounts.google.com/gsi/client';

export const googleReady = CLIENT_ID !== '';

interface TokenClient {
  requestAccessToken: () => void;
}
interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    prompt?: string;
    callback: (res: { access_token?: string; error?: string }) => void;
    error_callback?: (err: { type?: string }) => void;
  }) => TokenClient;
}
declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

/** Thrown when the customer closes the Google window; not an error worth showing. */
export class GoogleCancelled extends Error {}

const loaded = () => window.google?.accounts?.oauth2;

let loading: Promise<GoogleOAuth2> | null = null;
export function loadGoogle(): Promise<GoogleOAuth2> {
  const ready = loaded();
  if (ready) return Promise.resolve(ready);
  loading ??= new Promise<GoogleOAuth2>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => {
      const oauth = loaded();
      if (oauth) resolve(oauth);
      else reject(new Error('Google sign-in did not load. Please try again.'));
    };
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('Could not reach Google. Check your connection and try again.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

function requestToken(oauth: GoogleOAuth2) {
  return new Promise<string>((resolve, reject) => {
    oauth
      .initTokenClient({
        client_id: CLIENT_ID,
        scope: 'openid email profile',
        prompt: 'select_account',
        callback: (res) => {
          if (res.access_token) resolve(res.access_token);
          else if (res.error === 'access_denied') reject(new GoogleCancelled());
          else reject(new Error('Google sign-in failed. Please try again.'));
        },
        error_callback: (err) => {
          if (err?.type === 'popup_closed') reject(new GoogleCancelled());
          else if (err?.type === 'popup_failed_to_open') reject(new Error('Allow pop-ups for this site to sign in with Google.'));
          else reject(new Error('Google sign-in failed. Please try again.'));
        },
      })
      .requestAccessToken();
  });
}

/**
 * Opens Google's account chooser and resolves with an access token for the API.
 * Call it straight from a click: when the script is already loaded the window opens in the same tick,
 * so browsers don't treat it as an unwanted pop-up.
 */
export function googleAccessToken(): Promise<string> {
  if (!googleReady) return Promise.reject(new Error('Google sign-in is not set up for this site yet.'));
  const ready = loaded();
  return ready ? requestToken(ready) : loadGoogle().then(requestToken);
}
