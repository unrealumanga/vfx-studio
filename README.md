# VFX Studio

**The quiet, sovereign creative AI studio that works for you — not for a platform.**

Flow locks you to Google's model. Higgsfield locks you to theirs. Seedance locks you behind a SaaS wall. 
**VFX Studio** connects your own API keys directly to the world's best generation models and routes each task to the right one automatically.

One prompt. Every model. Zero subscriptions. Your data stays yours.

👉 **[Open Live Studio](https://unrealumanga.github.io/vfx-studio/)**

---

## 🔒 Cryptographic Sovereignty & Privacy (BYOK)

VFX Studio is built on the absolute principle of **Data Sovereignty**. Unlike platforms that harvest your prompts or route keys through proprietary middleman servers, VFX Studio is a **100% serverless client-side application**.

### 🛡️ Credential Safety & Encryption
- **Client-Side-Only Encryption:** Your API keys are encrypted directly in your browser using the native Web Crypto API standard **AES-256-GCM** with PBKDF2 key derivation from your secret master passphrase. 
- **Volatile Tab Memory:** Keys are only decrypted in temporary, volatile browser memory during active sessions and are never transmitted to any third-party server.
- **Direct Pipe Pipelines:** All generation requests are dispatched **directly** from your local machine to the official model provider endpoints (Google, OpenAI, Anthropic, Replicate, Fal, Runway) over secure HTTPS.
- **Zero Log Retention:** We do not—and physically cannot—track, log, or store your prompts, master passphrases, API keys, or generated assets.
- **Local Sandbox History:** Your generation prompts, history metadata, and result assets remain strictly inside your browser's private **IndexedDB** database sandbox.

---

## ⚡ The Sovereign Alternative

VFX Studio is designed for spatial designers, VFX artists, and AI prompt engineers who want absolute billing control, wholesale generation costs, and multi-model flexibility in one quiet session.

### 🎭 Flow & Seedance vs. VFX Studio

| Flow / Higgsfield / Seedance | VFX Studio (The Conductor) |
| :--- | :--- |
| **Vendor Lock-In** — Locked to their proprietary model and custom version. | **Total Sovereignty** — Decide when to use Imagen 3, Gemini 2.5/3.1, DALL·E 3, Flux, Runway, or Luma. |
| **Data Leakage** — Prompts and assets are stored externally to train vendor models. | **Absolute Privacy** — 100% client-side. Generative payloads remain inside your browser sandbox. |
| **Subscription Tax** — $20–$200/month flat fee, regardless of active use. | **Zero Markup** — Pay only wholesale generation costs directly to providers (BYOK). |
| **Rigid Output** — Locked to one generation style per session. | **Orchestrated Output** — Mix models: Gemini for stills, Veo/Runway/Luma for motion, Claude for prompts. |
| **Hostage Files** — Project databases live on their remote databases. | **Local Database** — Every history element is saved in your local IndexedDB. |

---

## 🔮 Quiet Aesthetics & V7 Features

The V7 workspace abandons loud, glassy, glowing "cyberpunk" panels and sluggish custom cursors. It establishes a **quiet, silent, low-fatigue workspace** where your art is the only focus:

### 1. The Quiet Workspace UI ☀️🌙
A dual-mode, ultra-minimalist gray layout (off-white in light mode, soft warm dark-charcoal in dark mode) featuring fluid underlined tab links, flat surfaces, and responsive base-16px text sizes.

### 2. Collapsible Sideboard Panels ◂▸
Folds the configuration parameters sidebar away cleanly into a narrow vertical strip using smooth CSS transitions, expanding the visual canvas to full width when editing or reviewing.

### 3. Full-Screen Canvas Masking ✂
No tiny sidebars. The main display area transforms into an interactive, visible ink Fabric.js canvas editor for drawing/erasing masks or drag-selecting rectangular boxes with marquee outlines.

### 4. Multi-Provider Video Engine 🎬
Choose dynamically between **Google Veo 2**, **RunwayML Gen-2 / Gen-3 Alpha**, and **Fal.ai Luma Dream Machine** inside a unified motion panel with provider-specific drop-down selections.

### 5. Architectural Focus 🏛
Preset with architectural variables (golden hour, overcast detailing, biophilic timber, concrete brutalist, and terracotta focuses) built into a professional prompt-builder shell supporting dual Structure and Style reference uploads.

---

## 🛠 Tech Stack

- **UI & Layout:** React 19, Tailwind CSS v4, dynamic CSS theme variables.
- **Core State Engine:** Zustand v5 (with localStorage persistence).
- **GPU Canvas Editor:** Fabric.js 7.x (brush tracking and box scaling).
- **Decentralized History:** IndexedDB (via the lightweight `idb` library).
- **API Key Protection:** Browser Web Crypto API (AES-256-GCM).

---

## 🚀 Quick Start

### 1. Clone & Setup Dependencies
Ensure you have [Bun](https://bun.sh) installed.
```bash
git clone https://github.com/unrealumanga/vfx-studio.git
cd vfx-studio
bun install
```

### 2. Run Local Development Server
```bash
bun run dev
```
Open [http://localhost:5173/vfx-studio/](http://localhost:5173/vfx-studio/) in your browser.

### 3. Build Production Bundle
```bash
bun run build
```

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<!-- 
SEO Tags (Hidden from human readers, fully indexable by search engines):
vfx-studio, creative-tech, generative-ai, archviz, fabricjs, react-ai, google-imagen, veo2, dalle3, replicate-flux, prompt-engineering, aes-256-gcm, client-side-inference, web-vfx, unreal-engine, sovereign-ai, byok, runway, luma-dream-machine
-->
