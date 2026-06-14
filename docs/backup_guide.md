# Backup Guide: Private AI Agents Portal

This guide provides instructions to run daily database exports and restore data from JSON backups.

---

## 1. Local JSON Backup Runs

The portal repository includes a Node script `scripts/backup-db.ts` to trigger a local Firestore export. It pulls categories, agents, users, access codes, and logs directly as JSON data dumps.

### How to Run Backups Locally

1. Authenticate with your Firebase project:
   ```bash
   firebase login
   ```
2. Navigate to the project root and execute the backup script:
   ```bash
   npm run build --workspace=scripts
   node scripts/dist/backup-db.js
   ```
3. The backups are created under:
   `/backups/YYYY-MM-DD/`

---

## 2. Setting Up Automated Backups

To automate backups locally on your machine, configure a daily scheduler:

### On Windows (Task Scheduler)
1. Open Task Scheduler and click **Create Basic Task**.
2. Name it `AI Agents Backup` and set the Trigger to **Daily**.
3. Under Action, select **Start a Program**.
4. Set Program/Script to `cmd.exe` and Add Arguments to:
   ```text
   /c "cd /d c:\Users\rajaj\Projects\RajaJeevan_CustomGPT_Home && node scripts/dist/backup-db.js"
   ```

### On macOS/Linux (Cron Job)
Add a cron task by running `crontab -e`:
```text
0 2 * * * cd /path/to/RajaJeevan_CustomGPT_Home && node scripts/dist/backup-db.js >> backup.log 2>&1
```

---

## 3. Retention Recommendation

* Keep the last **30 days** of backup folders under `/backups/`.
* Periodically compress older backups to save local storage.
