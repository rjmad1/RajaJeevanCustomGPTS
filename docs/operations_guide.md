# Operations Guide: Private AI Agents Portal

This guide outlines the day-to-day operational tasks, quotas monitoring, and logs diagnostics for the Private AI Agents Portal.

---

## 1. Firebase Free-Tier Quota Monitoring

The portal is designed to run entirely on the Firebase Free-Tier. It is crucial to monitor quota consumption in the Firebase Console:

| Service | Free Tier Limit | Action if exceeded |
| :--- | :--- | :--- |
| **Firestore Reads** | 50,000 / day | Queries cease; upgrade database budget limits. |
| **Firestore Writes** | 20,000 / day | CRUD operations disabled. |
| **Cloud Functions Calls**| 2,000,000 / month | Redeem code / admin functions disabled. |
| **Hosting Storage** | 10 GB | Cannot deploy new front-end updates. |
| **Hosting Bandwidth** | 360 MB / day | Portal site access returns 503 errors. |

---

## 2. Monitoring & Sentry Alerts

* **Sentry Errors Dashboard:** Configure Sentry by providing `VITE_SENTRY_DSN` in the front-end environment file. Check Sentry Console for javascript console errors or failed functions call payloads.
* **Firebase Performance Monitor:** Performance metrics (LCP, FID) are visible under **Analytics** > **Performance** in the Firebase console.
* **Cloud Functions Logs:** View logs in **Build** > **Functions** > **Logs** to inspect server-side execution and error tracebacks.

---

## 3. Routine Diagnostics Checklist

* **Check Audit Logs (Weekly):** Review the **Audit Logs** tab in the Admin Panel to monitor code generation and user status changes.
* **Inspect Suspended Users (Monthly):** Ensure suspended accounts are cleared or deactivated permanently.
* **Validate Backups (Monthly):** Run the local JSON backup task to ensure registry changes are backed up.
