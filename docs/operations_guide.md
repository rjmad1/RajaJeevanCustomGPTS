# Operations Guide: Private AI Agents Portal

This guide outlines day-to-day operations, usage limits, and diagnostic procedures for the Private AI Agents Portal.

---

## 1. Hosting Quotas & Resource Monitoring

The web application is hosted as static assets on Vercel's Edge CDN. Keep track of Vercel usage limits in the Vercel console:

* **Edge Bandwidth:** Free tier includes 100 GB/month. Static assets are small (~300 KB), meaning this limit is highly sufficient.
* **Build Minutes:** Free tier includes 6,000 build minutes/month.
* **Domain Limits:** Native SSL certificates are auto-renewed by Vercel.

---

## 2. Browser Local Storage Limitations

Since all user configurations, custom agent overrides, and admin pass lists reside in the browser's `localStorage`:
* **Storage Limit:** Modern browsers allocate approximately **5 MB** of local storage per domain origin.
* **Database Consumption:** The default registry of 55 agents and 100+ audit log lines consumes under **100 KB** (less than 2% of the quota).
* **Optimization:** Keep audit logs below 500 lines by periodically revoking old passes to prevent local storage bloat.

---

## 3. Routine Operator Diagnostics

* **Weekly Audit Logs Review:** Go to the Admin Panel > Audit Logs tab. Ensure that access pass tokens are only generated for recognized guest emails.
* **Monthly JSON Backup:** Export a fresh copy of `custom_gpt_backup.json` from the catalog FAB menu and save it to external storage.
* **Pass Rotation Recommendation:** Revoke old or expired guest passes periodically to keep the administrative tracking list clean.
