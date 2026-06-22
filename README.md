# VFX Studio

**The creative AI studio that works for you — not for a platform.**

Flow locks you to Google's model. Higgsfield locks you to theirs. Seedance locks you behind a SaaS wall. 
**VFX Studio** connects your own API keys directly to the world's best generation models and routes each task to the right one automatically.

One prompt. Every model. Zero subscriptions. Your data stays yours.

👉 **[Open Live Studio](https://unrealumanga.github.io/vfx-studio/)**

---

## ⚡ The Sovereign Alternative

VFX Studio is the first decentralized, browser-only workspace designed for spatial designers, VFX artists, and AI prompt engineers who want absolute data sovereignty, flat rate pricing, and multi-model flexibility in one session.

### 🎭 Flow & Seedance vs. VFX Studio

| Flow / Higgsfield / Seedance | VFX Studio (The Conductor) |
| :--- | :--- |
| **Vendor Lock-In** — You use their model, their version, their cutoff. | **Total Sovereignty** — You decide when to use Imagen 3, Gemini 2.5/3.1, DALL·E 3, or Flux. |
| **Privacy Drain** — Your prompts and assets are stored to train their systems. | **Zero Retention** — Your inputs go Browser → Provider API directly. None of it is saved. |
| **Subscription Tax** — $20–$200/month flat fee, regardless of whether you generate. | **Zero Markup** — You pay only for what you render, directly to Google/Replicate at wholesale cost. |
| **Rigid Output** — Locked to one generation style per session. | **Orchestrated Output** — Mix models seamlessly: Gemini for stills, Veo for motion, Claude for prompts. |
| **Hostage Files** — Your project files live on their remote databases. | **Local Database** — Everything is stored in your local browser IndexedDB. You own 100% of your work. |

---

## 🔮 The Five Core Powers

### 1. The Conductor, Not a Player 🎼
Every other tool *is* a model. VFX Studio *orchestrates* them. It acts like a director picking the absolute best camera and lens for each shot—routing prompts dynamically to different providers based on task suitability.

### 2. ArchViz as a First-Class Discipline 🏛
No creative AI platform treats architectural visualization seriously. VFX Studio is custom-preset with specific **Gulf-context variables** (harsh midday sun, overcast detailing, biophilic timber, concrete brutalist, and terracotta/sandstone material focuses) built directly into a professional prompt-builder shell.

### 3. Local-First Memory 💾
Powered by local **IndexedDB** databases, your entire history—every render prompt, negative prompt, reference image, canvas mask, and exact generation seed—remains securely on your machine. No "expiring soon" cloud limits.

### 4. The Prompt is the Interface ✦
A single detailed prompt drives the entire engine. The **Prompt Assist** feature leverages Anthropic's Claude 3.5 Sonnet and GPT-4o to expand simple conceptual ideas into cinematically precise prompt instructions.

### 5. Client-Side Cryptography 🔒
Your API keys are completely sealed in your browser's local storage using native **AES-256-GCM** encryption with PBKDF2 salt derivation. Keys are held decrypted in temporary system memory only during active browser sessions.

---

## 🛠 Tech Stack

- **UI & Layout:** React 19, Tailwind CSS v4 (native `@theme` and dynamic CSS variables).
- **Core State Engine:** Zustand v5 (with localStorage persistence).
- **GPU Canvas Editor:** Fabric.js 7.x (brush tracking and responsive image scaling).
- **Decentralized History:** IndexedDB (via the lightweight `idb` library).
- **API Key Protection:** Browser Web Crypto API (AES-256-GCM encryption with PBKDF2 salt derivation).

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

## 🌐 SEO & Web Discovery

`vfx-studio` · `creative-tech` · `generative-ai` · `archviz` · `fabricjs` · `react-ai` · `google-imagen` · `veo2` · `dalle3` · `replicate-flux` · `prompt-engineering` · `aes-256-gcm` · `client-side-inference` · `web-vfx` · `unreal-engine` · `sovereign-ai` · `byok`

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
