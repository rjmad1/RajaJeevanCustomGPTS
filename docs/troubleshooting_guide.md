# Troubleshooting Guide: Private AI Agents Portal

This guide provides troubleshooting steps to resolve common issues encountered by users and administrators.

---

## 1. Access Pass Verification Fails

### Symptom: Guest logs in and receives "Invalid or corrupted access pass" or "This access pass has expired".

* **Spelling and Case Mismatch:** Cryptographic verification is case-sensitive for the email. Verify the user entered their email exactly as it was typed during pass generation (no leading or trailing spaces).
* **Truncated Token:** Cryptographic token strings are long and contain a dot (`.`). Make sure the user copied the entire token string.
* **Expired Token:** Check the token payload expiration date. If the token is expired, generate a new access pass in the Admin portal.
* **Secret Key Mismatch:** If the backend secret key `VITE_ADMIN_SECRET` was recently changed on Vercel, all previously generated guest tokens are invalidated and must be regenerated.

---

## 2. Administrator Login Fails

### Symptom: Entering `rajajeevankumar@gmail.com` and the master passphrase returns login errors.

* **Environment Variable Mismatch:** Verify that your input matches the exact value of the `VITE_ADMIN_SECRET` variable in the Vercel Project Settings.
* **Build Sync Delay:** If you recently updated `VITE_ADMIN_SECRET` in the Vercel settings, ensure the build pipeline finished. The secret is baked into the application bundle at build time.

---

## 3. Local Development Issues

### Symptom: React application compiles but login page returns cryptographic verification failures.

* **Missing `.env` configuration:** Verify that `apps/web/.env` exists and contains the variable `VITE_ADMIN_SECRET` matching the passphrase you are typing.
* **Process restart required:** If you modified the `.env` file, you must stop (`Ctrl + C`) and restart the development server (`npm run dev`) for Vite to read the new environment variable.

---

## 4. Vercel Page Refresh Returns 404

### Symptom: Reloading `/admin` or `/login` paths in the web browser displays Vercel 404 errors.

* **Verify `vercel.json` location:** Ensure that [vercel.json](file:///c:/Users/rajaj/Projects/RajaJeevan_CustomGPT_Home/vercel.json) is located in the root directory of the repository (not inside `/apps/web`). This configuration ensures that all route requests are redirected to `index.html` for React Router compilation.
