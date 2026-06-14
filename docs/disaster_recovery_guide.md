# Disaster Recovery Guide: Private AI Agents Portal

This runbook covers critical recovery steps for administrator lockouts, registry data corruption, or Vercel deployment failures.

---

## 1. Administrator Lockout Recovery

If you are unable to access the administration portal using the email `rajajeevankumar@gmail.com`:
1. Log in to the [Vercel Console](https://vercel.com/).
2. Navigate to your project settings under **Settings** > **Environment Variables**.
3. Locate the `VITE_ADMIN_SECRET` variable.
4. Verify the value, or update it to a new secure passphrase if the previous one is lost.
5. If you update the secret variable, trigger a redeployment in Vercel to compile the new secret value into the client application.
6. Return to the portal login screen and enter:
   * **Email:** `rajajeevankumar@gmail.com`
   * **Access Pass:** The newly updated `VITE_ADMIN_SECRET` passphrase value.

---

## 2. Restoring Corrupted Local Storage Registry

If browser history or data is wiped, the custom added agents and settings are cleared:
1. Log in as Super Admin.
2. Click the floating **+ (FAB)** button in the bottom right corner of the catalog.
3. Under **Backups & Portability**, click **Import JSON**.
4. Select the latest `custom_gpt_backup.json` export to restore your registry changes.
5. The portal merges these custom items back into local storage.

---

## 3. Deployment Rollbacks (Vercel)

If a new code deployment breaks the client-side portal, roll back immediately using Vercel's console:
1. Open the Vercel Project Dashboard.
2. Navigate to the **Deployments** tab.
3. Find the last stable deployment in the history list.
4. Click the three horizontal dots next to the stable deployment and select **Promote to Production**.
5. Vercel will instantly point your domains to the working stable deployment at the edge without recompiling.
