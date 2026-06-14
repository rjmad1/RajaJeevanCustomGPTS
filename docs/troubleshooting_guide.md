# Troubleshooting Guide: Private AI Agents Portal

This guide helps resolve common operational and deployment issues.

---

## 1. Google Sign-In Fails

### Symptom: Click "Continue with Google" returns an error popup or blocks loading.
* **Check OAuth Redirect URIs:** Go to [Google Cloud Console API Credentials](https://console.cloud.google.com/apis/credentials). Verify that Authorized Redirect URIs match your Firebase Hosting domain:
  `https://your-project-id.firebaseapp.com/__/auth/handler`
* **Unconfigured Auth Provider:** Ensure the Google sign-in provider is enabled in your Firebase Console under **Build** > **Authentication** > **Sign-in method**.

---

## 2. Invitation Code Errors

### Symptom: User enters code, clicks Redeem, and gets "Invalid invitation code" or "Expired".
* **Case and Spaces:** The portal automatically capitalizes and trims whitespace, but verify that the exact 8-character string matches.
* **Expired Code:** Check the expiration timestamp of the code in the Firestore `access_codes` collection. Regenerate a new code if expired.
* **Double Redemption:** Check if the code doc has `used: true`. If a code has already been redeemed, a new code must be generated for the user.

---

## 3. Firebase Blaze Billing Plan Issues

### Symptom: `firebase deploy` fails when building Cloud Functions with billing errors.
* **Upgrade Firebase Plan:** Cloud Functions require the **Blaze (Pay-as-you-go) Plan** to compile and run. Upgrade via the bottom-left button in the Firebase Console. You will only pay if your usage exceeds the generous monthly free tier (2 million invocations).

---

## 4. Emulator Connectivity Issues

### Symptom: Local React development server cannot connect to database or functions emulator.
* **Verify `VITE_USE_EMULATORS` configuration:** Check your `/apps/web/.env` file. If running against the live Firebase backend, ensure `VITE_USE_EMULATORS=false` or remove the key. If testing locally, ensure the emulator suite is actively running in another terminal window:
  ```bash
  firebase emulators:start
  ```
* **Local Hosts Binding:** The emulators are bound to `127.0.0.1`. If using macOS/Windows WSL, ensure localhost redirects match.
