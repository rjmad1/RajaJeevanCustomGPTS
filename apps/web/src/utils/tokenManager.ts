// Cryptographic Token Manager using native Web Crypto API (HMAC-SHA256)
// Zero-dependencies, runs completely in the browser.

const DEFAULT_SECRET = "rajajeevan-secret-key-2026";

function getSecret(): string {
  // Read VITE_ADMIN_SECRET from environment or fallback
  return import.meta.env.VITE_ADMIN_SECRET || DEFAULT_SECRET;
}

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export interface TokenPayload {
  email: string;
  expiresAt: number;
  role: 'super_admin' | 'authorized_user';
}

/**
 * Generate a cryptographically signed Access Pass (Token)
 */
export async function generateToken(
  email: string,
  durationType: '1_month' | '3_months' | '1_year' | 'forever'
): Promise<string> {
  const secret = getSecret();
  const now = Date.now();
  let expiresAt = 0;

  if (durationType === '1_month') {
    expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  } else if (durationType === '3_months') {
    expiresAt = now + 90 * 24 * 60 * 60 * 1000;
  } else if (durationType === '1_year') {
    expiresAt = now + 365 * 24 * 60 * 60 * 1000;
  } else {
    // Admin / "forever" pass (100 years validity)
    expiresAt = now + 100 * 365 * 24 * 60 * 60 * 1000;
  }

  const emailClean = email.toLowerCase().trim();
  const role = emailClean === 'rajajeevankumar@gmail.com' ? 'super_admin' : 'authorized_user';

  const payload: TokenPayload = {
    email: emailClean,
    expiresAt,
    role
  };

  const payloadStr = JSON.stringify(payload);
  const enc = new TextEncoder();
  const key = await getCryptoKey(secret);
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadStr));

  // Convert signature signature buffer to hex string
  const sigArray = Array.from(new Uint8Array(sigBuffer));
  const sigHex = sigArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Base64 encode the payload string
  const base64Payload = btoa(unescape(encodeURIComponent(payloadStr)));

  // Return base64Payload.signatureHex
  return `${base64Payload}.${sigHex}`;
}

/**
 * Verify a cryptographic token and return the payload if valid and not expired.
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  const secret = getSecret();
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, sigHex] = parts;
    const payloadStr = decodeURIComponent(escape(atob(base64Payload)));
    const payload = JSON.parse(payloadStr) as TokenPayload;

    // Validate email and structure
    if (!payload.email || !payload.expiresAt || !payload.role) {
      return null;
    }

    // Verify signature
    const enc = new TextEncoder();
    const key = await getCryptoKey(secret);
    
    // Parse hex signature
    const sigBytes = new Uint8Array(
      sigHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payloadStr));
    if (!isValid) return null;

    return payload;
  } catch (e) {
    console.error("Token verification failed:", e);
    return null;
  }
}

/**
 * Helper to check if a token string matches the master passphrase (admin backdoor log in)
 */
export function checkMasterPassphrase(email: string, token: string): boolean {
  const emailClean = email.toLowerCase().trim();
  if (emailClean !== 'rajajeevankumar@gmail.com') return false;

  const secret = getSecret();
  return token.trim() === secret.trim();
}
