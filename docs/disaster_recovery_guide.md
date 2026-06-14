# Disaster Recovery Guide: Private AI Agents Portal

This runbook covers critical recovery steps during system failures, admin lockouts, or database corruptions.

---

## 1. Administrator Lockout Recovery

If the only Super Admin account is suspended or demoted, run the bootstrap script from the terminal to restore admin permissions:

1. Log in to Firebase CLI:
   ```bash
   firebase login
   ```
2. Run the seeding tool (re-creates `WELCOME2026` bootstrap code):
   ```bash
   npm run seed
   ```
3. Redeem the code via the portal to restore super admin credentials.

*Alternative (Direct Firestore edit):*
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Build** > **Firestore Database**.
3. Open the `users` collection, select your user document ID, and change the parameters:
   * `role`: `super_admin`
   * `status`: `approved`

---

## 2. Restoring Corrupt/Lost Database

If Firestore collections are deleted, choose one of these restoration paths:

### Path A: Restoring via Deployed Web Portal (Admin GUI)
1. Log in as Admin.
2. Click the floating **+ (FAB)** button.
3. Select **Import JSON**.
4. Select the latest backup JSON (e.g. `custom_gpt_backup.json` downloaded during a routine export) to restore the registry.

### Path B: Restoring via Local Backup JSON Files
If you have local backups created by the node backup script under `/backups/YYYY-MM-DD/`:
1. Check the local backup folder.
2. Run the restoration node script (see Backup & Restore documentation).

---

## 3. Firebase Deployment Rollbacks

If a bad deployment breaks the production web portal, roll back immediately:

1. Open the Firebase Console.
2. Go to **Build** > **Hosting**.
3. In the **Release History** tab, locate the previous working release.
4. Click the three dots and select **Rollback**. The portal is instantly rolled back at the CDN edge without running another compile pipeline.
