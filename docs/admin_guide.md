# Administrator Guide: Private AI Agents Portal

This manual explains how to perform daily administrative operations through the portal GUI.

---

## 1. Accessing the Admin Console

1. Log in to your portal using your approved Admin Google Account.
2. In the top right corner of the navigation bar, click the **Admin Panel** button.
3. If this button is missing, verify that your account has the `admin` or `super_admin` role assigned.

---

## 2. Managing Portal Users

Go to the **User Management** tab:
* **Approving a Registration:** When a new user redeems an invitation code, they appear with status `pending_approval`. Click **Approve** to grant access.
* **Suspending a User:** To revoke access immediately, click **Suspend**. The suspended user will instantly be kicked out and redirected to an "Access Suspended" page.
* **Promoting/Demoting Admins (Super Admins only):** Super Admins can click **Make Admin** to grant admin permissions to other users, or **Demote** to return them to standard users.

---

## 3. Creating Invitation Codes

Go to the **Invite Codes** tab:
1. Enter the recipient name/email in the **Issued To** field.
2. Select code validity (1, 3, 7, or 30 days).
3. Click **Create Invite Code**.
4. Copy the generated code (e.g. `ABCDEFGH`) and share it with the recipient.

---

## 4. Managing Agents (CRUD)

To add or modify agents, go to the main catalog page:
1. Click the floating **+ (FAB)** button at the bottom-right corner of the page.
2. **Add Agent:** Fill in Name, URL, Description, select a Category, and click **Save Agent**.
3. **Edit Agent:** Click the small pencil icon on any agent link, update the values, and click **Save Agent**.
4. **Delete Agent:** Click the small trash icon on any agent link, and confirm deletion in the browser popup.

---

## 5. Backups & Portability

Click the floating **+ (FAB)** button to access backup utilities:
* **Export JSON:** Downloads a portable JSON array file of the current database.
* **Import JSON:** Select a backup JSON file to bulk-upload agents to your Firestore database.
* **Embed & Save:** Generates a self-contained single-file HTML copy of the database. Useful for offline caching or sharing directories directly.
