# Private AI Agents Portal

A modernized, secure, zero-database, serverless React application directory of CustomGPTs and AI Agents. This application modernizes the original single-file HTML directory into a responsive, secure, dark-theme-supported catalog using modern typography (Inter/Outfit), clean styling, and client-side cryptographic access passes.

---

## 🚀 Key Features

1. **Clean Directory Columns:** Organizes CustomGPTs in a 4-column layout (`Plan`, `Do`, `Check`, `Act`).
2. **Stateless Cryptographic Authentication:** Eliminates external identity providers (Google OAuth) and servers. Guests log in using a signed cryptographically-secure token issued by the administrator.
3. **Database-Free Storage:** Leverages client-side browser `localStorage` for personal favorites, custom agent additions, overrides, and audit logs.
4. **Offline Backups & Standalone Export:** Administrators can export the registry as JSON or generate a fully functional, self-contained single-file HTML offline version for offline usage.
5. **Zero-Lag CSS Tooltips:** Hovering over links instantly reveals descriptions without lagging.

---

## 🛠️ Technology Stack

* **Core Framework:** React 18 (TypeScript) + Vite
* **Styling:** Tailwind CSS + Vanilla CSS (Glassmorphism & animations)
* **Crypto Engine:** Web Crypto API (`HMAC-SHA256`)
* **Hosting Platform:** Vercel (Client-side routing enabled)

---

## 📁 Repository Structure

```text
├── apps/
│   └── web/              # Vite React Single-Page Application (SPA)
│       ├── src/
│       │   ├── components/  # Shared components (Navbar, etc.)
│       │   ├── context/     # AuthContext state manager
│       │   ├── data/        # Seed agents directory JSON (default-agents.json)
│       │   ├── pages/       # Dashboard, Login, and Admin portals
│       │   ├── types/       # TypeScript type declarations
│       │   └── utils/       # Cryptographic token manager
│       ├── tailwind.config.js
│       └── tsconfig.json
├── docs/                 # Systems guides, operations manual, and walkthroughs
├── vercel.json           # Root-level Vercel redirection rules
└── package.json          # Monorepo workspaces configuration
```

---

## 🔑 Cryptographic Security Model

To eliminate backend databases, the portal uses browser-native cryptography:
* **Admin Login:** The administrator logs in using their email `rajajeevankumar@gmail.com` and the master passphrase (configured as `VITE_ADMIN_SECRET`).
* **Guest Passes:** The admin can generate an access pass for any guest email. The generator constructs a JSON payload containing the email, expiration timestamp, and role, hashes it with HMAC-SHA256 using `VITE_ADMIN_SECRET`, and returns `Base64Payload.SignatureHex`.
* **Verification:** When a guest logs in, the portal verifies the token signature against `VITE_ADMIN_SECRET`. If the signature is authentic and the expiry is in the future, access is granted.

---

## 💻 Local Development Setup

### 1. Prerequisites
* Node.js v18 or higher.

### 2. Bootstrap Dependencies
From the repository root, install all node modules:
```bash
npm run bootstrap
```

### 3. Environment Variable Configuration
Create a `.env` file under `/apps/web/` containing:
```bash
# Admin secret for cryptographic token signing/verification
VITE_ADMIN_SECRET=RajaJeevan_CustomGPT_Admin_2026_#9a2b!
```

### 4. Start Development Server
Run the local dev server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 5. Build for Production
Verify compilation and bundle size:
```bash
npm run build
```
The compiled output is output to `/apps/web/dist`.

---

## 🚀 Deployment

The project is configured for **Vercel** with zero-configuration deployments:
1. Link your GitHub repository `https://github.com/rjmad1/RajaJeevanCustomGPTS` to Vercel.
2. In the Vercel Project Settings, add the Environment Variable:
   * **Key:** `VITE_ADMIN_SECRET`
   * **Value:** `<your-secure-secret-key>`
3. Build Settings are automatically fetched from [vercel.json](file:///c:/Users/rajaj/Projects/RajaJeevan_CustomGPT_Home/vercel.json):
   * **Build Command:** `npm run build`
   * **Output Directory:** `apps/web/dist`
