# Deployment Guide: Private AI Agents Portal

This guide provides instructions to deploy the stateless Private AI Agents Portal onto Vercel.

---

## Prerequisites

1. **GitHub Account:** The project is integrated with Git version control.
2. **Node.js installed (v18 or higher):** Required to run local builds.
3. **Vercel Account:** Required to host the compiled static SPA assets.

---

## Step 1: Clone and Configure Local Environment

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/rjmad1/RajaJeevanCustomGPTS.git
   cd RajaJeevanCustomGPTS
   ```
2. Run the bootstrap script to install project-wide dependencies:
   ```bash
   npm run bootstrap
   ```
3. Create a local environment variables file inside `apps/web/.env`:
   ```bash
   # apps/web/.env
   VITE_ADMIN_SECRET=RajaJeevan_CustomGPT_Admin_2026_#9a2b!
   ```
   *(Ensure this file is not committed to git; it is blacklisted in `.gitignore`)*.

---

## Step 2: Test the Build Locally

Verify that the TypeScript compilation and Vite bundling run without errors:

```bash
npm run build
```

The compiled assets are stored under `apps/web/dist`.

---

## Step 3: Deploy to Vercel

1. Open the [Vercel Dashboard](https://vercel.com/) and click **Add New** > **Project**.
2. Select and import your GitHub repository: `rjmad1/RajaJeevanCustomGPTS`.
3. In the **Configure Project** pane, configure the following settings:
   * **Framework Preset:** Vite (or Other)
   * **Root Directory:** `./` (Keep root-level directory)
4. Expand the **Build and Development Settings** tab. Ensure they align with [vercel.json](file:///c:/Users/rajaj/Projects/RajaJeevan_CustomGPT_Home/vercel.json):
   * **Build Command:** `npm run build`
   * **Output Directory:** `apps/web/dist`
5. Expand the **Environment Variables** tab and add:
   * **Name:** `VITE_ADMIN_SECRET`
   * **Value:** `<your-secure-cryptographic-secret-key>`
6. Click **Deploy**. Vercel will build, compile, and publish your site to a secure `.vercel.app` domain.

---

## Step 4: Verify Routing & Clean URLs

The root-level `vercel.json` defines SPA redirection mappings to avoid HTTP 404 errors on browser page reloads:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "apps/web/dist",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
All routes are resolved on the client side via React Router.
