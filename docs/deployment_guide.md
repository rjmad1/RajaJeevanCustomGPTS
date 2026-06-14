# Deployment Guide: Private AI Agents Portal

This guide provides step-by-step instructions to deploy the Private AI Agents Portal onto a clean Firebase environment.

---

## Prerequisites

1. **Google Account:** Required to log in to Firebase.
2. **Node.js installed (v18 or higher):** Required to run build scripts locally.
3. **Firebase CLI:** Install globally using:
   ```bash
   npm install -g firebase-tools
   ```

---

## Step 1: Create a Firebase Project

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**, enter a project name (e.g. `my-ai-agents-portal`), and click **Continue**.
3. Enable Google Analytics when prompted (recommended).
4. Click **Create Project** and wait for it to complete.

---

## Step 2: Configure Authentication & Google Sign-In

1. In the Firebase Console, go to **Build** > **Authentication** and click **Get Started**.
2. Select **Sign-in method** tab.
3. Choose **Google** under **Additional providers**.
4. Enable the provider, enter your project support email, and click **Save**.

---

## Step 3: Initialize Cloud Firestore Database

1. In the Firebase Console, go to **Build** > **Firestore Database**.
2. Click **Create Database**.
3. Select **Start in test mode** (the deployment will overwrite rules with our secure `firestore.rules`).
4. Choose a Firestore location closest to your users and click **Enable**.

---

## Step 4: Configure Local Environment Variables

Create a `.env` file inside `/apps/web/` based on the configuration keys.
To get your web app configuration:
1. In the Firebase Console, click the **Gear Icon** > **Project Settings**.
2. Under **Your apps**, click the `</>` (Web App) icon.
3. Register the app (e.g., `ai-agents-web`), copy the `firebaseConfig` keys, and write them to `/apps/web/.env`:

```bash
# apps/web/.env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:12345:web:abcd
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# (Optional) Toggle to run against local Firebase Emulator (set to true only for testing)
VITE_USE_EMULATORS=false
```

---

## Step 5: Install and Compile Dependencies

Open your terminal in the project root directory and run:

```bash
# 1. Install packages
npm run bootstrap

# 2. Extract database seed from the original HTML file
npm run parse --workspace=scripts
```

---

## Step 6: Deploy to Firebase Hosting & Functions

> [!IMPORTANT]
> **Blaze Plan Requirement:** Ensure your Firebase project is upgraded to the **Blaze (Pay-as-you-go) Plan** to allow Cloud Functions to compile. The usage is subject to the free tier (100% free under low volumes).

1. Log in to Firebase CLI:
   ```bash
   firebase login
   ```
2. Select your active project:
   ```bash
   firebase use --add your-project-id
   ```
3. Run the deployment command:
   ```bash
   firebase deploy
   ```

---

## Step 7: Seed Default Database & Bootstrap Admin Account

Once deployed successfully, run the database seeder to populate the 55 agents and categories:

```bash
# Seed Firestore (Ensure you have run firebase login first)
npm run seed
```

This script will output a bootstrap code (e.g., `WELCOME2026`). Open your deployed URL, log in with Google, enter the code, and your account will automatically become the **Super Admin**!
