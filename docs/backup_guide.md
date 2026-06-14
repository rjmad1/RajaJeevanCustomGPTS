# Backup Guide: Private AI Agents Portal

This guide provides instructions to run client-side registry backups and restore directory listings from JSON exports.

---

## 1. Local JSON Backup Procedure

Since the modernized directory operates without an external database, backups are executed as local JSON exports directly from the client interface:

### How to Run Backups
1. Log in to the portal as an administrator (`rajajeevankumar@gmail.com`).
2. On the catalog homepage, click the floating **+ (FAB)** button in the bottom right corner.
3. Click the **Export JSON** button.
4. The browser will download a file named `custom_gpt_backup.json`.
5. Save this file to your local computer or secure cloud storage.

---

## 2. Generating the Portable Standalone HTML Directory

To maintain offline access to the registry, you can download a self-contained HTML copy of the database:
1. Click the floating **+ (FAB)** button.
2. Click **Embed & Save Standalone File**.
3. The browser compiles the current active registry into a single HTML file: `custom_gpt_portable.html`.
4. This file contains CSS-styled grids and search functionality that runs completely offline (no server or credentials required).

---

## 3. Restoring the Registry from Backup

If your browser's local storage is cleared and you lose custom agent entries:
1. Log in to the portal as an administrator.
2. Click the floating **+ (FAB)** button.
3. Click the **Import JSON** button.
4. Choose the latest `custom_gpt_backup.json` file from your device.
5. The portal will parse the file, merge any missing custom agents into your local registry, and save the updated catalog in local storage.
